"""rebuild init

Revision ID: 20260416_0001_rebuild_init
Revises:
Create Date: 2026-04-16 00:01:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260416_0001_rebuild_init"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "images",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("ext", sa.String(length=16), nullable=False),
        sa.Column("mime_type", sa.String(length=64), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=False),
        sa.Column("thumbnail_path", sa.String(length=512), nullable=True),
        sa.Column(
            "processing_state",
            sa.String(length=32),
            nullable=False,
            server_default="processing",
        ),
        sa.Column(
            "embedding_state",
            sa.String(length=32),
            nullable=False,
            server_default="not_requested",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_images_sha256", "images", ["sha256"], unique=True)

    op.create_table(
        "tags",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("normalized_key", sa.String(length=256), nullable=False),
        sa.Column(
            "source", sa.String(length=32), nullable=False, server_default="manual"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_tags_category", "tags", ["category"], unique=False)
    op.create_index("ix_tags_normalized_key", "tags", ["normalized_key"], unique=True)

    op.create_table(
        "image_tags",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("image_id", sa.String(), nullable=False),
        sa.Column("tag_id", sa.String(), nullable=False),
        sa.Column(
            "source", sa.String(length=32), nullable=False, server_default="manual"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["image_id"], ["images.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("image_id", "tag_id", name="uq_image_tags_image_tag"),
    )
    op.create_index("ix_image_tags_image_id", "image_tags", ["image_id"], unique=False)
    op.create_index("ix_image_tags_tag_id", "image_tags", ["tag_id"], unique=False)

    op.create_table(
        "processing_tasks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("task_type", sa.String(length=64), nullable=False),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="pending"
        ),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("lease_owner", sa.String(length=128), nullable=True),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_text", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_processing_tasks_task_type", "processing_tasks", ["task_type"], unique=False
    )
    op.create_index(
        "ix_processing_tasks_status", "processing_tasks", ["status"], unique=False
    )

    op.create_table(
        "duplicate_candidates",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("image_a_id", sa.String(), nullable=False),
        sa.Column("image_b_id", sa.String(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="pending"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["image_a_id"], ["images.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["image_b_id"], ["images.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "image_a_id", "image_b_id", name="uq_duplicate_candidates_image_pair"
        ),
    )
    op.create_index(
        "ix_duplicate_candidates_image_a_id",
        "duplicate_candidates",
        ["image_a_id"],
        unique=False,
    )
    op.create_index(
        "ix_duplicate_candidates_image_b_id",
        "duplicate_candidates",
        ["image_b_id"],
        unique=False,
    )
    op.create_index(
        "ix_duplicate_candidates_status",
        "duplicate_candidates",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_duplicate_candidates_status", table_name="duplicate_candidates")
    op.drop_index(
        "ix_duplicate_candidates_image_b_id", table_name="duplicate_candidates"
    )
    op.drop_index(
        "ix_duplicate_candidates_image_a_id", table_name="duplicate_candidates"
    )
    op.drop_table("duplicate_candidates")

    op.drop_index("ix_processing_tasks_status", table_name="processing_tasks")
    op.drop_index("ix_processing_tasks_task_type", table_name="processing_tasks")
    op.drop_table("processing_tasks")

    op.drop_index("ix_image_tags_tag_id", table_name="image_tags")
    op.drop_index("ix_image_tags_image_id", table_name="image_tags")
    op.drop_table("image_tags")

    op.drop_index("ix_tags_normalized_key", table_name="tags")
    op.drop_index("ix_tags_category", table_name="tags")
    op.drop_table("tags")

    op.drop_index("ix_images_sha256", table_name="images")
    op.drop_table("images")
