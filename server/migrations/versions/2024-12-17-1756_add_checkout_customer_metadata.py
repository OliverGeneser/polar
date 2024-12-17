"""Add Checkout.customer_metadata

Revision ID: cb9906114207
Revises: a3e70f4c4e1e
Create Date: 2024-12-17 17:56:12.495724

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# Polar Custom Imports

# revision identifiers, used by Alembic.
revision = "cb9906114207"
down_revision = "a3e70f4c4e1e"
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "checkouts",
        sa.Column(
            "customer_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )

    op.execute(
        "UPDATE checkouts SET customer_metadata = '{}' WHERE customer_metadata IS NULL"
    )

    op.alter_column("checkouts", "customer_metadata", nullable=False)

    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("checkouts", "customer_metadata")
    # ### end Alembic commands ###
