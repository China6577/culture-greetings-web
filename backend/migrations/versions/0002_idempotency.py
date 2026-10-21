"""Prevent retry/double-click requests from creating duplicate cards."""
from alembic import op
import sqlalchemy as sa
revision='0002_idempotency'
down_revision='0001_phase2'

def upgrade():
    op.add_column('card_compositions',sa.Column('idempotency_key',sa.String(64),nullable=True))
    op.add_column('card_compositions',sa.Column('request_fingerprint',sa.String(64),nullable=False,server_default=''))
    op.create_unique_constraint('uq_card_compositions_idempotency_key','card_compositions',['idempotency_key'])

def downgrade():
    op.drop_constraint('uq_card_compositions_idempotency_key','card_compositions',type_='unique')
    op.drop_column('card_compositions','request_fingerprint')
    op.drop_column('card_compositions','idempotency_key')
