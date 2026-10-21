import asyncio
import base64
import json
import uuid
from dataclasses import replace
from io import BytesIO
from types import SimpleNamespace
from PIL import Image
import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import engine, get_db
from app.main import app
from app.models import CardComposition, GenerationJob
from app.schemas import Brief, CulturePlan, CopyPlan, VisualPlan, AnimationPlan, Review, GeneratedCard, GenerationRequest
from app.services.agnes import AgnesClient, ProviderError, save_image
from app.services.orchestrator import build_card
import app.services.agnes as agnes
import app.main as main

@pytest.fixture
def client():
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection,join_transaction_mode='create_savepoint')
    app.dependency_overrides[get_db] = lambda: session
    client = TestClient(app,raise_server_exceptions=False)
    yield client
    client.close()
    app.dependency_overrides.clear()
    session.close()
    transaction.rollback()
    connection.close()

def request(**changes):
    return {'request_id':str(uuid.uuid4()),'country_code':'CN','locale':'zh-CN','recipient':'朋友','sender':'我',
        'prompt':'A birthday card with flowers, no red','custom_message':'原文不改变。',**changes}

def png():
    data = BytesIO()
    Image.new('RGB',(256,512),'#f2ead8').save(data,format='PNG')
    return data.getvalue()

def card(identifier):
    return GeneratedCard(id=identifier,country_code='CN',locale='zh-CN',occasion='birthday',recipient='朋友',sender='我',
        custom_message='生日快乐',title='心意',image_url='/api/assets/'+identifier+'.png',
        visual={'paper':'#fff7e6','ink':'#302d29','accent':'#a2112b','alignment':'center'},created_at='2026-10-20T01:00:00Z')

def test_jobs_are_idempotent_and_expose_only_public_progress(client):
    payload = request()
    first = client.post('/api/generations',json=payload)
    assert first.status_code == 202
    result = first.json()
    assert result['status'] == 'queued' and result['card'] is None
    assert client.post('/api/generations',json=payload).json()['id'] == result['id']
    assert client.post('/api/generations',json={**payload,'recipient':'改名'}).status_code == 409
    assert client.get('/api/generations/'+result['id']).json() == result
    assert 'input_json' not in result and 'artifacts' not in result
    assert payload['prompt'] not in first.text

@pytest.mark.parametrize('change',[{'locale':'ja-JP'},{'recipient':''},{'sender':' '},{'prompt':''},{'prompt':'x'*2001},
    {'custom_message':'x'*501},{'request_id':'../../escape'},{'card_style_id':'CN_001'}])
def test_invalid_generation_input(client,change):
    assert client.post('/api/generations',json=request(**change)).status_code == 422

def test_no_retrieval_routes_or_vector_extension(client):
    assert client.get('/api/card-styles').status_code == 404
    assert client.post('/api/cards/compose',json={}).status_code == 405
    db = app.dependency_overrides[get_db]()
    assert db.scalar(text("SELECT count(*) FROM pg_extension WHERE extname='vector'")) == 0
    assert db.scalar(text("SELECT count(*) FROM information_schema.tables WHERE table_name IN ('card_styles','card_style_embeddings','culture_profiles')")) == 0

def test_saved_cards_pagination_and_delete(client,tmp_path,monkeypatch):
    monkeypatch.setattr(main,'settings',replace(main.settings,assets_dir=str(tmp_path)))
    db = app.dependency_overrides[get_db]()
    identifiers = ['test_card_identifier_first_123','test_card_identifier_second_12']
    before = client.get('/api/cards').json()['total']
    for identifier in identifiers:
        value = card(identifier)
        db.add(CardComposition(id=identifier,country_code='CN',locale='zh-CN',occasion='birthday',user_prompt='private',
            custom_message=value.custom_message,composition_json=value.model_dump()))
    db.commit()
    assert client.get('/api/cards?page=1&page_size=1').json()['total'] == before + 2
    assert len(client.get('/api/cards?page=1&page_size=1').json()['items']) == 1
    (tmp_path / (identifiers[0]+'.png')).write_bytes(png())
    assert client.get('/api/assets/'+identifiers[0]+'.png').headers['content-type'] == 'image/png'
    assert client.delete('/api/cards/'+identifiers[0]).status_code == 204
    assert not (tmp_path/(identifiers[0]+'.png')).exists()
    assert client.get('/api/cards/'+identifiers[0]).status_code == 404
    assert client.get('/api/assets/'+identifiers[0]+'.png').status_code == 404
    assert client.get('/api/cards/'+identifiers[1]).status_code == 200
    assert 'user_prompt' not in client.get('/api/cards/'+identifiers[1]).json()
    assert client.get('/api/cards?page=0').status_code == 422
    assert client.get('/api/cards?page_size=51').status_code == 422

def test_bulk_delete_removes_only_selected_cards_jobs_and_images(client,tmp_path,monkeypatch):
    monkeypatch.setattr(main,'settings',replace(main.settings,assets_dir=str(tmp_path)))
    db = app.dependency_overrides[get_db]()
    identifiers = ['bulk_selected_card_first_12345','bulk_selected_card_second_1234','bulk_unselected_card_safe_1234']
    before = client.get('/api/cards').json()['total']
    for identifier in identifiers:
        value = card(identifier)
        db.add(CardComposition(id=identifier,country_code='CN',locale='zh-CN',occasion='birthday',user_prompt='test only',
            custom_message=value.custom_message,composition_json=value.model_dump()))
        (tmp_path/(identifier+'.png')).write_bytes(png())
    db.flush()
    job_id = 'bulk_selected_generation_1234'
    db.add(GenerationJob(id=job_id,request_id=str(uuid.uuid4()),fingerprint='test',status='complete',
        input_json={},events=[],artifacts={},result_id=identifiers[0]))
    db.commit()
    assert client.post('/api/cards/bulk-delete',json={'ids':identifiers[:2]}).status_code == 204
    for identifier in identifiers[:2]:
        assert client.get('/api/cards/'+identifier).status_code == 404
        assert not (tmp_path/(identifier+'.png')).exists()
    assert client.get('/api/generations/'+job_id).status_code == 404
    assert client.get('/api/cards/'+identifiers[2]).status_code == 200
    assert (tmp_path/(identifiers[2]+'.png')).exists()
    assert client.get('/api/cards').json()['total'] == before+1
    assert client.post('/api/cards/bulk-delete',json={'ids':identifiers[:2]}).status_code == 204

@pytest.mark.parametrize('identifiers',[
    [], ['../../escape'], ['valid_card_identifier_12345','bad'],
    ['valid_card_identifier_12345']*101, ['valid_card_identifier_12345']*2,
])
def test_bulk_delete_rejects_invalid_selection_before_changes(client,identifiers):
    before = client.get('/api/cards').json()['total']
    assert client.post('/api/cards/bulk-delete',json={'ids':identifiers}).status_code == 422
    assert client.get('/api/cards').json()['total'] == before

def test_provider_contract_auth_and_images(monkeypatch):
    monkeypatch.setattr(agnes,'settings',replace(agnes.settings,agnes_api_key='test-only-placeholder'))
    seen = []
    def handler(req):
        seen.append(json.loads(req.content))
        assert req.headers['authorization'] == 'Bearer test-only-placeholder'
        return httpx.Response(200,json={'data':[{'b64_json':base64.b64encode(png()).decode()}]})
    result = asyncio.run(AgnesClient(httpx.MockTransport(handler)).image('test prompt'))
    assert result == png()
    assert seen[0]['model'] == 'agnes-image-2.5-flash'
    assert seen[0]['size'] == '1K' and seen[0]['ratio'] == '9:16'
    assert seen[0]['return_base64'] is True and 'response_format' not in seen[0]

@pytest.mark.parametrize('status,code',[(401,'agnes_auth_error'),(403,'agnes_auth_error'),(429,'agnes_rate_limited'),(500,'agnes_request_failed')])
def test_provider_errors_never_fall_back(monkeypatch,status,code):
    monkeypatch.setattr(agnes,'settings',replace(agnes.settings,agnes_api_key='test-only-placeholder'))
    with pytest.raises(ProviderError,match=code):
        asyncio.run(AgnesClient(httpx.MockTransport(lambda req:httpx.Response(status,json={'error':'private upstream detail'}))).image('test'))

def test_image_validation_rejects_arbitrary_bytes(tmp_path,monkeypatch):
    monkeypatch.setattr(agnes,'settings',replace(agnes.settings,assets_dir=str(tmp_path)))
    with pytest.raises(ProviderError,match='agnes_invalid_image'): save_image(b'<svg onload="alert(1)"></svg>','safe_identifier_123456')
    assert list(tmp_path.iterdir()) == []

class AgentFixture:
    def __init__(self,reject=False): self.roles=[]; self.reject=reject; self.image_calls=0; self.review_inputs=[]; self.role_inputs=[]
    async def agent(self,role,instruction,inputs,schema):
        self.roles.append(role)
        self.role_inputs.append((role, inputs))
        if role == 'reviewer': self.review_inputs.append(inputs)
        await asyncio.sleep(0)
        values = {
            Brief:dict(occasion='birthday',theme='flowers',style='watercolor',requirements=['flowers'],avoid=['red']),
            CulturePlan:dict(motifs=['botanical'],avoid=['national flags'],guidance='Gentle floral birthday, no unrelated festival.'),
            CopyPlan:dict(title='给你的心意',greeting='This is deliberately different from the user original'),
            VisualPlan:dict(image_prompt='Watercolor floral birthday illustration, no red, with quiet lower area and no text.',paper='#fff7e6',ink='#302d29',accent='#a2112b',alignment='center'),
            AnimationPlan:dict(effect='petals',colors=['#DED4B1'],particle_count=8,duration_seconds=12,opacity=0.3,particle_size=9,wind=0.2,region='artwork',image_motion='none'),
            Review:dict(approved=not self.reject,issues=['remove red'] if self.reject else []),
        }
        return schema.model_validate(values[schema])
    async def image(self,prompt):
        self.image_calls += 1
        assert 'red' in prompt and 'national flags' in prompt and '9:16' in prompt
        return png()

def test_orchestration_preserves_locked_fields_and_saves_verified_image(tmp_path,monkeypatch):
    monkeypatch.setattr(agnes,'settings',replace(agnes.settings,assets_dir=str(tmp_path)))
    fake = AgentFixture()
    events=[]
    result,artifacts = asyncio.run(build_card(GenerationRequest(**request()),'generated_identifier_1234567',lambda *event:events.append(event),fake))
    assert result.custom_message == '原文不改变。' and result.country_code == 'CN' and result.locale == 'zh-CN'
    assert result.recipient == '朋友' and result.sender == '我'
    assert fake.image_calls == 1 and (tmp_path/'generated_identifier_1234567.png').is_file()
    assert {'planner','culture','copy','designer','motion','reviewer'}.issubset(set(fake.roles))
    assert result.animation.effect == 'petals'
    assert artifacts['animation'] == result.animation.model_dump()
    assert fake.review_inputs[0]['animation'] == artifacts['animation']
    assert ('artist','complete') in events and artifacts['review']['approved'] is True
    assert fake.roles == ['planner','culture','copy','designer','motion','reviewer']
    assert dict(fake.role_inputs)['copy']['culture'] == artifacts['culture']
    assert_serial_events(events)

def assert_serial_events(events):
    active = None
    for role, status in events:
        if status == 'running':
            assert active is None, f'{role} started while {active} was still running'
            active = role
        else:
            assert active == role
            active = None

def test_failed_review_is_bounded_and_does_not_generate_image():
    fake = AgentFixture(reject=True)
    events = []
    with pytest.raises(ProviderError,match='agent_review_failed'):
        asyncio.run(build_card(GenerationRequest(**request()),'generated_identifier_1234567',lambda *event:events.append(event),fake))
    assert fake.roles.count('reviewer') == 2 and fake.image_calls == 0
    assert fake.roles.count('motion') == 2
    assert fake.roles == ['planner','culture','copy','designer','motion','reviewer','copy','designer','motion','reviewer']
    assert_serial_events(events)
    assert fake.role_inputs[7][1]['copy']['greeting'] == '原文不改变。'

def test_failed_culture_step_does_not_start_later_agents():
    class FailedCulture(AgentFixture):
        async def agent(self, role, instruction, inputs, schema):
            if role == 'culture': raise ProviderError('agnes_timeout')
            return await super().agent(role, instruction, inputs, schema)
    fake = FailedCulture()
    with pytest.raises(ProviderError, match='agnes_timeout'):
        asyncio.run(build_card(GenerationRequest(**request()),'generated_identifier_1234567',lambda *event:None,fake))
    assert fake.roles == ['planner'] and fake.image_calls == 0

@pytest.mark.parametrize('changes',[
    {'colors':['url(https://example.com/a)']}, {'effect':'arbitrary_script'}, {'particle_count':1000},
    {'duration_seconds':0.1}, {'opacity':1}, {'wind':100}, {'particle_size':100},
    {'region':'text'}, {'image_motion':'eval'}, {'effect':'none','particle_count':8},
])
def test_animation_bounds_reject_uncontrolled_output(changes):
    from pydantic import ValidationError
    plan = dict(effect='stars',colors=['#D4B16D'],particle_count=8,duration_seconds=12,
        opacity=0.3,particle_size=9,wind=0,region='artwork',image_motion='none')
    with pytest.raises(ValidationError): AnimationPlan.model_validate({**plan,**changes})

def test_saved_animation_survives_api_read_and_old_cards_remain_compatible(client):
    db = app.dependency_overrides[get_db]()
    value = card('test_animation_persisted_12345')
    value.animation = AnimationPlan(effect='none',colors=['#FFFFFF'],particle_count=0,
        duration_seconds=12,opacity=0.2,particle_size=8,wind=0,region='artwork',image_motion='none')
    db.add(CardComposition(id=value.id,country_code='CN',locale='zh-CN',occasion='birthday',user_prompt='no motion',
        custom_message=value.custom_message,composition_json=value.model_dump()))
    db.commit()
    response = client.get('/api/cards/'+value.id).json()
    assert response['animation'] == value.animation.model_dump()
    assert GeneratedCard.model_validate({k:v for k,v in value.model_dump().items() if k != 'animation'}).animation is None
