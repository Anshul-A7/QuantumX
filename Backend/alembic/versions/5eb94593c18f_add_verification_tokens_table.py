"""add verification tokens table

Revision ID: 5eb94593c18f
Revises: 3a7363ac29d8
Create Date: 2026-08-30 21:36:16.124930

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5eb94593c18f"
down_revision: Union[str, Sequence[str], None] = "3a7363ac29d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create verification_tokens table."""

    op.create_table(
        "verification_tokens",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "token",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "token_type",
            sa.String(length=30),
            nullable=False,
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("token"),
    )

    op.create_index(
        "ix_verification_tokens_id",
        "verification_tokens",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_verification_tokens_user_id",
        "verification_tokens",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        "ix_verification_tokens_token",
        "verification_tokens",
        ["token"],
        unique=True,
    )

    op.create_index(
        "ix_verification_tokens_token_type",
        "verification_tokens",
        ["token_type"],
        unique=False,
    )


def downgrade() -> None:
    """Drop verification_tokens table."""

    op.drop_index(
        "ix_verification_tokens_token_type",
        table_name="verification_tokens",
    )

    op.drop_index(
        "ix_verification_tokens_token",
        table_name="verification_tokens",
    )

    op.drop_index(
        "ix_verification_tokens_user_id",
        table_name="verification_tokens",
    )

    op.drop_index(
        "ix_verification_tokens_id",
        table_name="verification_tokens",
    )

    op.drop_table("verification_tokens")