"""add month to papers

Revision ID: 4d240a2dac2e
Revises: 9d6109045cab
Create Date: 2026-04-22 12:29:10.243708

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d240a2dac2e'
down_revision: Union[str, None] = '9d6109045cab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('papers', schema=None) as batch_op:
        batch_op.add_column(sa.Column('month', sa.Integer(), nullable=True))

def downgrade() -> None:
    with op.batch_alter_table('papers', schema=None) as batch_op:
        batch_op.drop_column('month')
