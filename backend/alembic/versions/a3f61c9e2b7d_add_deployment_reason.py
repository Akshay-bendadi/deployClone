"""add deployment reason

Revision ID: a3f61c9e2b7d
Revises: d72cf15b13ba
Create Date: 2026-08-08 21:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f61c9e2b7d'
down_revision: Union[str, None] = 'd72cf15b13ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('deployments', sa.Column('reason', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column('deployments', 'reason')
