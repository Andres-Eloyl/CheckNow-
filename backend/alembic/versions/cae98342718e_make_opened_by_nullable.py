"""make_opened_by_nullable

Revision ID: cae98342718e
Revises: 4e3f8332769f
Create Date: 2026-03-20 19:55:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = 'cae98342718e'
down_revision: Union[str, None] = '4e3f8332769f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('table_sessions', 'opened_by',
                    existing_type=sa.UUID(),
                    nullable=True)


def downgrade() -> None:
    op.alter_column('table_sessions', 'opened_by',
                    existing_type=sa.UUID(),
                    nullable=False)
