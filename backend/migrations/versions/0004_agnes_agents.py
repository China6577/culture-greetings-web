"""Replace retrieval with durable multi-agent generation; old cards cleared by user request."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = '0004_agnes_agents'
down_revision = '0003_country_templates'

def upgrade():
    # The user explicitly requested removal of every previous card.
    op.execute('DELETE FROM card_compositions')
    for fk in sa.inspect(op.get_bind()).get_foreign_keys('card_compositions'):
        if fk['referred_table'] == 'card_styles': op.drop_constraint(fk['name'],'card_compositions',type_='foreignkey')
    op.drop_column('card_compositions','card_style_id')
    op.alter_column('card_compositions','occasion',type_=sa.String(100))
    op.drop_table('card_style_embeddings')
    op.drop_table('culture_profiles')
    op.drop_table('card_styles')
    op.execute('DROP EXTENSION IF EXISTS vector')
    op.create_table('generation_jobs',
        sa.Column('id',sa.String(64),primary_key=True),
        sa.Column('request_id',sa.String(64),nullable=False,unique=True),
        sa.Column('fingerprint',sa.String(64),nullable=False),
        sa.Column('status',sa.String(20),nullable=False),
        sa.Column('input_json',postgresql.JSONB(),nullable=False),
        sa.Column('events',postgresql.JSONB(),nullable=False),
        sa.Column('artifacts',postgresql.JSONB(),nullable=False),
        sa.Column('error_code',sa.String(80)),
        sa.Column('result_id',sa.String(64),sa.ForeignKey('card_compositions.id',ondelete='SET NULL')),
        sa.Column('created_at',sa.DateTime(timezone=True),nullable=False,server_default=sa.func.now()),
        sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False,server_default=sa.func.now()))
    op.create_index('ix_generation_jobs_status','generation_jobs',['status'])
    op.create_index('ix_card_compositions_created_id','card_compositions',['created_at','id'])

def downgrade():
    raise RuntimeError('Use a versioned backup to restore Phase 2; deleted cards cannot be reconstructed.')
