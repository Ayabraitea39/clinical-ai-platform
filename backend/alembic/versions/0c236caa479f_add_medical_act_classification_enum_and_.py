"""add medical act classification enum and related tables

Revision ID: 0c236caa479f
Revises: c4482423d694
Create Date: 2026-08-02 16:04:01.965348

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0c236caa479f'
down_revision: Union[str, Sequence[str], None] = 'c4482423d694'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


act_classification_enum = postgresql.ENUM(
    'medicine', 'test', 'imaging', 'other',
    name='actclassification'
)


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('insurance_coverage',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('provider', sa.String(length=255), nullable=True),
    sa.Column('policy_number', sa.String(length=100), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('medical_act_prices',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('medical_act_id', sa.Integer(), nullable=False),
    sa.Column('doctor_id', sa.Integer(), nullable=True),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ),
    sa.ForeignKeyConstraint(['medical_act_id'], ['medical_acts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('billing_lines',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('visit_id', sa.Integer(), nullable=False),
    sa.Column('medical_act_id', sa.Integer(), nullable=False),
    sa.Column('diagnosis_text', sa.Text(), nullable=True),
    sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['medical_act_id'], ['medical_acts.id'], ),
    sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('orders',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('visit_id', sa.Integer(), nullable=False),
    sa.Column('medical_act_id', sa.Integer(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['medical_act_id'], ['medical_acts.id'], ),
    sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('prescriptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('visit_id', sa.Integer(), nullable=False),
    sa.Column('medical_act_id', sa.Integer(), nullable=False),
    sa.Column('dose', sa.String(length=100), nullable=True),
    sa.Column('frequency', sa.String(length=100), nullable=True),
    sa.Column('route', sa.String(length=100), nullable=True),
    sa.Column('duration', sa.String(length=100), nullable=True),
    sa.ForeignKeyConstraint(['medical_act_id'], ['medical_acts.id'], ),
    sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # --- FIX: explicitly create the Postgres enum type before using it ---
    act_classification_enum.create(op.get_bind(), checkfirst=True)

    # --- FIX: cast existing VARCHAR values into the new enum type ---
    op.alter_column(
        'medical_acts', 'classification',
        existing_type=sa.VARCHAR(length=50),
        type_=act_classification_enum,
        postgresql_using='classification::actclassification',
        existing_nullable=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'medical_acts', 'classification',
        existing_type=act_classification_enum,
        type_=sa.VARCHAR(length=50),
        postgresql_using='classification::text',
        existing_nullable=False,
    )

    # --- FIX: drop the enum type on downgrade too, or a re-upgrade later fails ---
    act_classification_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_table('prescriptions')
    op.drop_table('orders')
    op.drop_table('billing_lines')
    op.drop_table('medical_act_prices')
    op.drop_table('insurance_coverage')
    # ### end Alembic commands ###