from alembic import op
revision = "0001_foundation"
down_revision = None
branch_labels = None
depends_on = None
def upgrade():
    op.execute("""
    CREATE TABLE organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL);
    CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject text NOT NULL UNIQUE);
    CREATE TABLE organization_members (organization_id uuid REFERENCES organizations(id), user_id uuid REFERENCES users(id), role text NOT NULL CHECK(role IN ('owner','admin','editor','viewer')), PRIMARY KEY(organization_id,user_id));
    CREATE TABLE content_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id), title varchar(200) NOT NULL, slug varchar(150) NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,id), UNIQUE(organization_id,slug));
    CREATE TABLE content_revisions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, content_id uuid NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(organization_id,content_id) REFERENCES content_items(organization_id,id));
    ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
    CREATE POLICY membership_self ON organization_members FOR SELECT USING (user_id = nullif(current_setting('app.user_id',true),'')::uuid AND organization_id = nullif(current_setting('app.organization_id',true),'')::uuid);
    ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE content_items FORCE ROW LEVEL SECURITY;
    ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE content_revisions FORCE ROW LEVEL SECURITY;
    """)
    for table in ("content_items","content_revisions"):
        tenant = "organization_id = nullif(current_setting('app.organization_id',true),'')::uuid"
        member = f"EXISTS (SELECT 1 FROM organization_members m WHERE m.organization_id = {table}.organization_id AND m.user_id = nullif(current_setting('app.user_id',true),'')::uuid)"
        writer = member[:-1] + " AND m.role IN ('owner','admin','editor'))"
        op.execute(f"CREATE POLICY tenant_read ON {table} FOR SELECT USING ({tenant} AND {member})")
        op.execute(f"CREATE POLICY tenant_insert ON {table} FOR INSERT WITH CHECK ({tenant} AND {writer})")
def downgrade():
    for table in ("content_revisions","content_items","organization_members","users","organizations"):
        op.execute(f"DROP TABLE {table}")
