from typing import Literal, Annotated
from pydantic import BaseModel, Field, ConfigDict, model_validator

COUNTRY_LOCALES = {'CN':'zh-CN','JP':'ja-JP','US':'en-US','GB':'en-GB','FR':'fr-FR','GLOBAL':'en-US'}
Country = Literal['CN','JP','US','GB','FR','GLOBAL']
Locale = Literal['zh-CN','ja-JP','en-US','en-GB','fr-FR']

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

class GenerationRequest(StrictModel):
    request_id: str = Field(pattern=r'^[A-Za-z0-9_-]{20,64}$')
    country_code: Country
    locale: Locale
    prompt: str = Field(min_length=1, max_length=2000)
    recipient: str = Field(min_length=1, max_length=60)
    sender: str = Field(min_length=1, max_length=60)
    custom_message: str = Field(default='', max_length=500)

    @model_validator(mode='after')
    def lock_language(self):
        if self.locale != COUNTRY_LOCALES[self.country_code]:
            raise ValueError('Locale must match the selected country')
        return self

class Brief(StrictModel):
    occasion: str = Field(min_length=1,max_length=100)
    theme: str = Field(min_length=1,max_length=300)
    style: str = Field(min_length=1,max_length=200)
    requirements: list[str] = Field(max_length=15)
    avoid: list[str] = Field(max_length=15)

class CulturePlan(StrictModel):
    motifs: list[str] = Field(min_length=1,max_length=8)
    avoid: list[str] = Field(max_length=12)
    guidance: str = Field(min_length=1,max_length=1500)

class CopyPlan(StrictModel):
    title: str = Field(min_length=1,max_length=80)
    greeting: str = Field(min_length=1,max_length=500)

class VisualPlan(StrictModel):
    image_prompt: str = Field(min_length=20,max_length=5000)
    paper: str = Field(pattern=r'^#[0-9a-fA-F]{6}$')
    ink: str = Field(pattern=r'^#[0-9a-fA-F]{6}$')
    accent: str = Field(pattern=r'^#[0-9a-fA-F]{6}$')
    alignment: Literal['left','center']

class Review(StrictModel):
    approved: bool
    issues: list[str] = Field(max_length=10)

class AnimationPlan(StrictModel):
    effect: Literal['petals','stars','confetti','fireworks','glow','none']
    colors: list[str] = Field(min_length=1,max_length=3)
    particle_count: int = Field(ge=0,le=24)
    duration_seconds: float = Field(ge=6,le=20)
    opacity: float = Field(ge=0.12,le=0.55)
    particle_size: float = Field(ge=4,le=16)
    wind: float = Field(ge=-1,le=1)
    region: Literal['artwork','edges']
    image_motion: Literal['none','drift','breathe']

    @model_validator(mode='after')
    def validate_animation(self):
        import re
        if any(not re.fullmatch(r'#[0-9a-fA-F]{6}', color) for color in self.colors):
            raise ValueError('Animation colors must be hex colors')
        if self.effect == 'none' and self.particle_count != 0:
            raise ValueError('No effect must have no particles')
        if self.effect != 'none' and self.particle_count < 4:
            raise ValueError('Visible effects require at least four particles')
        return self

class AgentEvent(StrictModel):
    agent: str
    status: Literal['running','complete']
    at: str

class GeneratedCard(StrictModel):
    id: str = Field(pattern=r'^[A-Za-z0-9_-]{20,64}$')
    version: Literal[3] = 3
    country_code: Country
    locale: Locale
    occasion: str
    recipient: str
    sender: str
    custom_message: str
    title: str
    mode: Literal['static','h5'] = 'static'
    image_url: str
    image_model: Literal['agnes-image-2.5-flash'] = 'agnes-image-2.5-flash'
    text_model: Literal['agnes-2.5-flash'] = 'agnes-2.5-flash'
    visual: dict[str,str]
    animation: AnimationPlan | None = None
    created_at: str

class CompositionList(StrictModel):
    items: list[GeneratedCard]
    total: int
    page: int
    page_size: int

class BatchDeleteRequest(StrictModel):
    ids: list[Annotated[str, Field(pattern=r'^[A-Za-z0-9_-]{20,64}$')]] = Field(min_length=1,max_length=100)

    @model_validator(mode='after')
    def unique_ids(self):
        if len(set(self.ids)) != len(self.ids):
            raise ValueError('Card identifiers must be unique')
        return self

class JobView(StrictModel):
    id: str
    status: Literal['queued','running','complete','failed']
    events: list[AgentEvent]
    error_code: str | None = None
    card: GeneratedCard | None = None
