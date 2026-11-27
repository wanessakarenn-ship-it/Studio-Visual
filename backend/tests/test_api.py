from fastapi.testclient import TestClient
from app.main import app
from uuid import uuid4
client=TestClient(app)
def test_health():
    assert client.get("/health").json()["database_checked"] is False
def test_fail_closed(monkeypatch):
    monkeypatch.delenv("ENABLE_TEST_AUTH",raising=False)
    response=client.get(f"/organizations/{uuid4()}/articles",headers={"X-Local-User":str(uuid4())})
    assert response.status_code==401
