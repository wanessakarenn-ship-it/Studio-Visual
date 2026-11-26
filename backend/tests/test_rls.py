import os
from uuid import uuid4
from sqlalchemy import create_engine,text
from fastapi.testclient import TestClient
from app.main import app
def test_tenant_isolation(monkeypatch):
    admin=create_engine(os.environ["MIGRATION_DATABASE_URL"])
    a,b,u,v=map(str,[uuid4(),uuid4(),uuid4(),uuid4()])
    with admin.begin() as c:
        for org in (a,b):
            c.execute(text("insert into organizations(id,name) values (:id,'synthetic')"),{"id":org})
        for user in (u,v):
            c.execute(text("insert into users(id,subject) values (:id,:subject)"),{"id":user,"subject":user})
        for org,user,role in ((a,u,"editor"),(b,v,"viewer")):
            c.execute(text("insert into organization_members values (:org,:usr,:role)"),{"org":org,"usr":user,"role":role})
    monkeypatch.setenv("APP_ENV","local-test")
    monkeypatch.setenv("ENABLE_TEST_AUTH","1")
    client=TestClient(app)
    h={"X-Local-User":u}
    data={"title":"Synthetic article","slug":"synthetic-article","body":"Example","author":"Test"}
    assert client.post(f"/organizations/{a}/articles",headers=h,json=data).status_code==201
    assert len(client.get(f"/organizations/{a}/articles",headers=h).json())==1
    assert client.get(f"/organizations/{b}/articles",headers=h).status_code==403
    assert client.post(f"/organizations/{b}/articles",headers={"X-Local-User":v},json=data).status_code==403
    with create_engine(os.environ["DATABASE_URL"]).begin() as c:
        assert c.execute(text("select count(*) from content_items")).scalar_one()==0
        c.execute(text("select set_config('app.user_id',:u,true)"),{"u":u})
        c.execute(text("select set_config('app.organization_id',:o,true)"),{"o":b})
        assert c.execute(text("select count(*) from content_items")).scalar_one()==0
