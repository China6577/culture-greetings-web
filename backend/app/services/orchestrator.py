import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from app.config import settings
from app.db import SessionLocal
from app.models import CardComposition, GenerationJob
from app.schemas import Brief, CulturePlan, CopyPlan, VisualPlan, AnimationPlan, Review, GenerationRequest, GeneratedCard
from app.services.agnes import AgnesClient, ProviderError, save_image

COUNTRIES = {'CN':'China','JP':'Japan','US':'United States','GB':'United Kingdom','FR':'France','GLOBAL':'Globally inclusive, not tied to any nation'}
LANGUAGES = {'zh-CN':'Simplified Chinese','ja-JP':'Japanese','en-US':'American English','en-GB':'British English','fr-FR':'French'}

MOTION_INSTRUCTIONS = (
    'Design a restrained continuous web animation for this specific card, matching the user brief, '
    'occasion, culture guidance, artwork composition and palette. Choose petals for floral/romantic scenes, '
    'stars for night skies and dreams, confetti for playful celebrations, fireworks for explicitly festive '
    'scenes, glow for quiet warmth, or none if effects are unwanted. These are rendering primitives; '
    'personalize their colors, density, size, opacity, wind and rhythm rather than choosing by country alone. '
    'Explicit user requests and exclusions take priority over these suggestions. '
    'When user_animation_feedback is present, refine previous_animation to address that feedback '
    'while preserving the original exclusions and text readability. '
    'If all animation is forbidden, use effect none, particle_count 0 and image_motion none. '
    'Keep text stationary and readable. Use artwork region for the upper illustration only, or edges for '
    'the narrow left/right margins. Prefer 6-14 subtle particles; fireworks/glow need only 4-6. '
    'Effects must be clearly perceptible on a 370px-wide card: for stars prefer particle_size 10-14, '
    'opacity 0.4-0.55 and duration_seconds 6-10 unless the user explicitly requests a fainter or slower effect. '
    'duration_seconds is the continuous cycle length, not a video length. Use 1-3 six-digit hex colors. '
    'Never return executable code, URLs, HTML or CSS.'
)


def record(job_id, agent, status):
    with SessionLocal() as db:
        job = db.get(GenerationJob, job_id)
        if job:
            job.events = [*job.events, {'agent':agent,'status':status,'at':datetime.now(timezone.utc).isoformat()}]
            db.commit()

async def build_card(request: GenerationRequest, card_id: str, emit, client=None):
    client = client or AgnesClient()
    locked = {'country':COUNTRIES[request.country_code], 'locale':request.locale,
        'language':LANGUAGES[request.locale], 'description':request.prompt,
        'recipient':request.recipient,'sender':request.sender,'exact_user_greeting':request.custom_message}
    async def agent(name, instructions, context, schema):
        emit(name,'running')
        result = await client.agent(name, instructions, context, schema)
        emit(name,'complete')
        return result
    brief = await agent('planner',
        'Extract the occasion, holiday if explicitly requested, style, desired visual details, and negative constraints. '
        'Respect negations. Do not replace an ordinary birthday with a national festival. Requirements must preserve user priorities.',locked,Brief)
    context = {**locked,'brief':brief.model_dump()}
    culture = await agent('culture','Plan culturally appropriate imagery for this occasion and the locked country, without stereotypes. '
        'Honor user requests and exclusions; avoid unrelated religious or festival symbols.',context,CulturePlan)
    copy = await agent('copy','Write a short original greeting and title in the locked language, informed by the completed cultural plan. '
        'If exact_user_greeting is nonempty, copy it character-for-character as greeting. '
        'Never invent names. Keep the title under 40 characters and greeting concise.',
        {**context,'culture':culture.model_dump()},CopyPlan)
    if request.custom_message: copy.greeting = request.custom_message
    design_context = {**context,'culture':culture.model_dump(),'copy':copy.model_dump()}
    visual = await agent('designer','Design a refined portrait greeting-card illustration. Return an English image prompt '
        'honoring every positive and negative visual requirement and cultural guidance. Describe subject, style, palette, composition, '
        'lighting. No printed letters, names, glyphs, typography, watermarks or logos: the application overlays exact text. '
        'Main artwork occupies the upper 55%; reserve the lower 45% as calm negative space for text. '
        'Choose compatible six-digit hex paper/ink/accent colors with strong text contrast.',design_context,VisualPlan)
    animation = await agent('motion',MOTION_INSTRUCTIONS,
        {**design_context,'visual':visual.model_dump()},AnimationPlan)
    review = await agent('reviewer','Audit the proposed artwork prompt, copy and animation against all locked requirements, exclusions, '
        'country/occasion compatibility, language and exact_user_greeting preservation. Approve if aligned. '
        'Do not reject the exact user greeting merely because its language differs; user-authored text is preserved. '
        'Check motion also respects excluded effects and any request for no animation. '
        'Return concrete actionable issues only when necessary.',
        {**design_context,'visual':visual.model_dump(),'animation':animation.model_dump()},Review)
    if not review.approved:
        copy = await agent('copy','Revise the greeting/title in the locked language according to review. Preserve a nonempty '
            'exact_user_greeting character-for-character.',{**design_context,'review':review.model_dump()},CopyPlan)
        if request.custom_message: copy.greeting = request.custom_message
        design_context['copy'] = copy.model_dump()
        visual = await agent('designer','Revise the English artwork prompt according to review and the revised copy. No text or logos in image. '
            'Upper 55% artwork, lower 45% calm negative space. Keep valid six-digit hex colors.',
            {**design_context,'visual':visual.model_dump(),'review':review.model_dump()},VisualPlan)
        animation = await agent('motion',MOTION_INSTRUCTIONS + ' Revise the previous plan to address review issues.',
            {**design_context,'visual':visual.model_dump(),'animation':animation.model_dump(),'review':review.model_dump()},AnimationPlan)
        review = await agent('reviewer','Approve only if the revision follows the locked user constraints and culture guidance. '
            'Check animation exclusions as well. Preserve user-supplied words and names. Return concrete issues if still inconsistent.',
            {**design_context,'visual':visual.model_dump(),'animation':animation.model_dump()},Review)
        if not review.approved: raise ProviderError('agent_review_failed')
    # Coordinator applies hard constraints after all agent decisions, never allowing a role to override them.
    image_prompt = (visual.image_prompt + '\nHARD CONSTRAINTS: Portrait 9:16 greeting-card art. Absolutely no text, '
        'letters, numbers, symbols resembling writing, logos or watermark. Upper 55 percent main composition, '
        'lower 45 percent low-detail negative space. Locked culture: ' + COUNTRIES[request.country_code] +
        '. Required details: ' + json.dumps(brief.requirements,ensure_ascii=False) +
        '. Exclude: ' + json.dumps([*brief.avoid,*culture.avoid],ensure_ascii=False))
    emit('artist','running')
    image = await client.image(image_prompt)
    emit('artist','complete')
    emit('delivery','running')
    await asyncio.to_thread(save_image,image,card_id)
    card = GeneratedCard(id=card_id,country_code=request.country_code,locale=request.locale,occasion=brief.occasion,
        recipient=request.recipient,sender=request.sender,custom_message=request.custom_message or copy.greeting,
        title=copy.title,image_url=f'/api/assets/{card_id}.png',
        visual={'paper':visual.paper,'ink':visual.ink,'accent':visual.accent,'alignment':visual.alignment},
        animation=animation,
        created_at=datetime.now(timezone.utc).isoformat())
    artifacts = {'brief':brief.model_dump(),'culture':culture.model_dump(),'copy':copy.model_dump(),
        'visual':visual.model_dump(),'animation':animation.model_dump(),'review':review.model_dump()}
    return card, artifacts

async def run_job(job_id):
    with SessionLocal() as db:
        job = db.get(GenerationJob,job_id)
        if not job or job.status != 'queued': return
        job.status = 'running'
        request = GenerationRequest.model_validate(job.input_json)
        db.commit()
    try:
        async with asyncio.timeout(settings.generation_timeout):
            card, artifacts = await build_card(request,job_id,lambda agent,status: record(job_id,agent,status))
        with SessionLocal() as db:
            job = db.get(GenerationJob,job_id)
            db.add(CardComposition(id=card.id,idempotency_key=request.request_id,request_fingerprint=job.fingerprint,
                country_code=card.country_code,locale=card.locale,occasion=card.occasion,user_prompt=request.prompt,
                custom_message=card.custom_message,composition_json=card.model_dump()))
            db.flush()
            job.result_id = card.id
            job.artifacts = artifacts
            job.status = 'complete'
            job.events = [*job.events,{'agent':'delivery','status':'complete','at':datetime.now(timezone.utc).isoformat()}]
            db.commit()
    except BaseException as error:
        code = error.code if isinstance(error,ProviderError) else 'generation_timeout' if isinstance(error,TimeoutError) else 'generation_interrupted' if isinstance(error,asyncio.CancelledError) else 'generation_failed'
        with SessionLocal() as db:
            job = db.get(GenerationJob,job_id)
            if job:
                job.status = 'failed'
                job.error_code = code
                db.commit()
        (Path(settings.assets_dir) / (job_id + '.png')).unlink(missing_ok=True)
        if isinstance(error,asyncio.CancelledError): raise

async def worker():
    # One durable queue worker prevents double billing on concurrent submissions.
    with SessionLocal() as db:
        for job in db.query(GenerationJob).filter(GenerationJob.status == 'running'):
            job.status = 'failed'
            job.error_code = 'generation_interrupted'
        db.commit()
    while True:
        with SessionLocal() as db:
            job = db.query(GenerationJob).filter(GenerationJob.status == 'queued').order_by(GenerationJob.created_at).first()
            identifier = job.id if job else None
        if identifier: await run_job(identifier)
        else: await asyncio.sleep(1)
