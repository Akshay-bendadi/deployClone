"""add project build_command and start_command

Revision ID: d72cf15b13ba
Revises: 76fd3808012c
Create Date: 2026-08-08 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd72cf15b13ba'
down_revision: Union[str, None] = '76fd3808012c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('build_command', sa.String(length=1000), nullable=True))
    op.add_column('projects', sa.Column('start_command', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'start_command')
    op.drop_column('projects', 'build_command')
