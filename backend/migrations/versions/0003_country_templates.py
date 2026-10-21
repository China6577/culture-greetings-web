"""Independent country catalogs; legacy style rows remain for saved-card foreign keys."""
from alembic import op
import sqlalchemy as sa
revision='0003_country_templates'
down_revision='0002_idempotency'

def upgrade():
    op.add_column('card_styles',sa.Column('country_code',sa.String(10),nullable=True))
    op.create_index('ix_card_styles_country_code','card_styles',['country_code'])

def downgrade():
    op.drop_index('ix_card_styles_country_code',table_name='card_styles')
    op.drop_column('card_styles','country_code')
