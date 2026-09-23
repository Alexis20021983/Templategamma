from alembic import op
import sqlalchemy as sa
revision = "001_initial"
down_revision = None
def upgrade():
    op.create_table("cases", sa.Column("id", sa.Integer, primary_key=True), sa.Column("title", sa.String(200), nullable=False), sa.Column("description", sa.Text), sa.Column("status", sa.String(40)), sa.Column("owner", sa.String(120)), sa.Column("requirement", sa.Text), sa.Column("objective", sa.Text), sa.Column("preconditions", sa.Text), sa.Column("test_data", sa.Text), sa.Column("tester", sa.String(120)), sa.Column("reviewer", sa.String(120)), sa.Column("created_at", sa.DateTime), sa.Column("updated_at", sa.DateTime))
    op.create_table("steps", sa.Column("id", sa.Integer, primary_key=True), sa.Column("case_id", sa.Integer, sa.ForeignKey("cases.id", ondelete="CASCADE")), sa.Column("title", sa.String(200), nullable=False), sa.Column("expected_result", sa.Text), sa.Column("actual_result", sa.Text), sa.Column("status", sa.String(40)), sa.Column("position", sa.Integer))
    op.create_table("evidences", sa.Column("id", sa.Integer, primary_key=True), sa.Column("step_id", sa.Integer, sa.ForeignKey("steps.id", ondelete="CASCADE")), sa.Column("name", sa.String(200), nullable=False), sa.Column("url", sa.String(1000)), sa.Column("notes", sa.Text), sa.Column("file_name", sa.String(255)), sa.Column("content_type", sa.String(120)), sa.Column("file_size", sa.Integer), sa.Column("file_path", sa.String(500)))
def downgrade():
    op.drop_table("evidences"); op.drop_table("steps"); op.drop_table("cases")
