"""Add or revise reviewed motion plans on explicitly named cards, without redrawing them."""
import argparse
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.db import SessionLocal
from app.models import CardComposition, GenerationJob
from app.schemas import AnimationPlan, Review
from app.services.agnes import AgnesClient, ProviderError
from app.services.orchestrator import COUNTRIES, LANGUAGES, MOTION_INSTRUCTIONS


async def upgrade(card_id, feedback=None):
    with SessionLocal() as db:
        row = db.get(CardComposition, card_id)
        if not row or (row.composition_json.get('animation') is not None and not feedback):
            print(card_id, 'skipped')
            return
        card = dict(row.composition_json)
        job = db.scalar(select(GenerationJob).where(GenerationJob.result_id == card_id))
        context = {
            'country': COUNTRIES[row.country_code], 'locale': row.locale,
            'language': LANGUAGES[row.locale], 'description': row.user_prompt,
            'recipient': card['recipient'], 'sender': card['sender'],
            'exact_user_greeting': row.custom_message,
            **(job.artifacts if job else {}),
            'visual': {**(job.artifacts.get('visual', {}) if job else {}), **card['visual']},
            'previous_animation': card.get('animation'),
            'user_animation_feedback': feedback,
        }
    client = AgnesClient()
    review_feedback = None
    for _ in range(2):
        plan = await client.agent('motion', MOTION_INSTRUCTIONS,
            {**context, **({'review': review_feedback} if review_feedback else {})}, AnimationPlan)
        review = await client.agent('reviewer',
            'Audit only this new animation plan against the locked user description, exclusions, '
            'occasion, culture and latest user_animation_feedback. Approve if aligned. Do not invent requirements or demand a new image. '
            'A request to keep the whole card still requires no particles and no image movement.',
            {**context, 'animation': plan.model_dump()}, Review)
        if review.approved:
            break
        review_feedback = review.model_dump()
    else:
        raise ProviderError('agent_review_failed')
    with SessionLocal() as db:
        row = db.get(CardComposition, card_id)
        if not row or (row.composition_json.get('animation') is not None and not feedback):
            print(card_id, 'skipped')
            return
        row.composition_json = {**row.composition_json, 'animation': plan.model_dump()}
        job = db.scalar(select(GenerationJob).where(GenerationJob.result_id == card_id))
        if job:
            job.artifacts = {**job.artifacts, 'animation': plan.model_dump(),
                'animation_upgrade_review': review.model_dump(),
                'animation_upgraded_at': datetime.now(timezone.utc).isoformat()}
        db.commit()
    print(card_id, 'updated', plan.effect)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('card_ids', nargs='+')
    parser.add_argument('--feedback', help='Revise these cards using explicit motion feedback; preserves their artwork.')
    args = parser.parse_args()
    for identifier in args.card_ids:
        try:
            await upgrade(identifier, args.feedback)
        except ProviderError as error:
            print(identifier, 'failed', error.code)


if __name__ == '__main__':
    asyncio.run(main())
