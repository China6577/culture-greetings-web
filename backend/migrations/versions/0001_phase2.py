"""Historical Phase 2 bootstrap; removed by the Agnes migration."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '0001_phase2'
down_revision = None

def upgrade():
    # Historical bootstrap tables are removed by the Agnes migration.
    op.create_table('card_styles',
        sa.Column('id', sa.String(20), primary_key=True),
        sa.Column('slug', sa.String(80), nullable=False, unique=True),
        sa.Column('name', sa.String(100), nullable=False),
        *[sa.Column(name, postgresql.JSONB(), nullable=False) for name in ['description','occasions','style_tags','keywords','layout_config','visual_config','animation_config','country_rules']],
        sa.Column('preview_asset',sa.String(200),nullable=False),
        sa.Column('enabled',sa.Boolean(),nullable=False,server_default=sa.true()),
        sa.Column('version',sa.Integer(),nullable=False,server_default='1'),
        sa.Column('created_at',sa.DateTime(timezone=True),nullable=False,server_default=sa.func.now()),
        sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False,server_default=sa.func.now()))
    op.create_table('card_style_embeddings',
        sa.Column('id',sa.Integer(),primary_key=True),
        sa.Column('card_style_id',sa.String(20),sa.ForeignKey('card_styles.id',ondelete='CASCADE'),nullable=False),
        sa.Column('locale',sa.String(12),nullable=False),
        sa.Column('embedding',sa.Text(),nullable=False),
        sa.Column('embedding_model',sa.String(150),nullable=False),
        sa.Column('embedding_version',sa.String(150),nullable=False),
        sa.Column('content_hash',sa.String(64),nullable=False),
        sa.Column('indexed_at',sa.DateTime(timezone=True),nullable=False,server_default=sa.func.now()),
        sa.UniqueConstraint('card_style_id','locale','embedding_model','embedding_version'))
    op.create_index('ix_card_style_embeddings_card_style_id','card_style_embeddings',['card_style_id'])
    op.create_table('culture_profiles',
        sa.Column('id',sa.Integer(),primary_key=True),
        sa.Column('country_code',sa.String(10),nullable=False,unique=True),
        sa.Column('locale',sa.String(12),nullable=False),
        *[sa.Column(name,postgresql.JSONB(),nullable=False) for name in ['visual_rules','allowed_elements','greeting_config','animation_preferences']])
    op.create_table('card_compositions',
        sa.Column('id',sa.String(64),primary_key=True),
        sa.Column('card_style_id',sa.String(20),sa.ForeignKey('card_styles.id'),nullable=False),
        sa.Column('country_code',sa.String(10),nullable=False),
        sa.Column('locale',sa.String(12),nullable=False),
        sa.Column('occasion',sa.String(30),nullable=False),
        sa.Column('user_prompt',sa.String(2000),nullable=False),
        sa.Column('custom_message',sa.String(500),nullable=False),
        sa.Column('composition_json',postgresql.JSONB(),nullable=False),
        sa.Column('created_at',sa.DateTime(timezone=True),nullable=False,server_default=sa.func.now()))

def downgrade():
    op.drop_table('card_compositions')
    op.drop_table('culture_profiles')
    op.drop_table('card_style_embeddings')
    op.drop_table('card_styles')
