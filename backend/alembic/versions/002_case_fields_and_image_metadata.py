from alembic import op
import sqlalchemy as sa

revision = "002_case_fields_images"
down_revision = "001_initial"

def upgrade():
    for name, typ in (
        ("requirement", sa.Text()), ("objective", sa.Text()), ("preconditions", sa.Text()),
        ("test_data", sa.Text()), ("tester", sa.String(120)), ("reviewer", sa.String(120)),
    ):
        op.add_column("cases", sa.Column(name, typ, nullable=True))
    for name, typ in (
        ("file_name", sa.String(255)), ("content_type", sa.String(120)),
        ("file_size", sa.Integer()), ("file_path", sa.String(500)),
    ):
        op.add_column("evidences", sa.Column(name, typ, nullable=True))

def downgrade():
    for name in ("file_path", "file_size", "content_type", "file_name"):
        op.drop_column("evidences", name)
    for name in ("reviewer", "tester", "test_data", "preconditions", "objective", "requirement"):
        op.drop_column("cases", name)
