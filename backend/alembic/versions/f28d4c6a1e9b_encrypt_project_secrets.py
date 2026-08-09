"""encrypt project github_token and env_vars at rest

Revision ID: f28d4c6a1e9b
Revises: a3f61c9e2b7d
Create Date: 2026-08-09 00:30:00.000000

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from cryptography.fernet import Fernet

from app.config import get_settings


# revision identifiers, used by Alembic.
revision: str = 'f28d4c6a1e9b'
down_revision: Union[str, None] = 'a3f61c9e2b7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    fernet = Fernet(get_settings().field_encryption_key.encode())

    # New encrypted TEXT columns alongside the old plaintext ones, so we can encrypt
    # existing data in place before dropping the originals.
    op.add_column('projects', sa.Column('github_token_enc', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('env_vars_enc', sa.Text(), nullable=True))

    rows = conn.execute(sa.text('SELECT id, github_token, env_vars FROM projects')).fetchall()
    for row in rows:
        github_token_enc = fernet.encrypt(row.github_token.encode()).decode() if row.github_token else None
        env_vars_enc = fernet.encrypt(json.dumps(row.env_vars).encode()).decode()
        conn.execute(
            sa.text('UPDATE projects SET github_token_enc = :gt, env_vars_enc = :ev WHERE id = :id'),
            {'gt': github_token_enc, 'ev': env_vars_enc, 'id': row.id},
        )

    op.drop_column('projects', 'github_token')
    op.drop_column('projects', 'env_vars')
    op.alter_column('projects', 'github_token_enc', new_column_name='github_token')
    op.alter_column('projects', 'env_vars_enc', new_column_name='env_vars', nullable=False)


def downgrade() -> None:
    conn = op.get_bind()
    fernet = Fernet(get_settings().field_encryption_key.encode())

    op.add_column('projects', sa.Column('github_token_dec', sa.String(length=255), nullable=True))
    op.add_column('projects', sa.Column('env_vars_dec', JSONB(), nullable=True))

    rows = conn.execute(sa.text('SELECT id, github_token, env_vars FROM projects')).fetchall()
    for row in rows:
        github_token_dec = fernet.decrypt(row.github_token.encode()).decode() if row.github_token else None
        env_vars_dec = json.loads(fernet.decrypt(row.env_vars.encode()).decode())
        conn.execute(
            sa.text('UPDATE projects SET github_token_dec = :gt, env_vars_dec = :ev WHERE id = :id'),
            {'gt': github_token_dec, 'ev': json.dumps(env_vars_dec), 'id': row.id},
        )

    op.drop_column('projects', 'github_token')
    op.drop_column('projects', 'env_vars')
    op.alter_column('projects', 'github_token_dec', new_column_name='github_token')
    op.alter_column('projects', 'env_vars_dec', new_column_name='env_vars', nullable=False)
