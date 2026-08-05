"""add status to visits

Revision ID: 0d9bf60aa52f
Revises: 84e84d80ffc7
Create Date: 2026-08-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0d9bf60aa52f'
down_revision: Union[str, Sequence[str], None] = '84e84d80ffc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


visit_status_enum = postgresql.ENUM(
    'active', 'cancelled',
    name='visitstatus'
)


def upgrade() -> None:
    """Upgrade schema."""
    visit_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'visits',
        sa.Column(
            'status',
            visit_status_enum,
            server_default='active',
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('visits', 'status')
    visit_status_enum.drop(op.get_bind(), checkfirst=True)