import os
from uuid import UUID
from fastapi import FastAPI, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

app = FastAPI(title="Studio Visual API", version="0.1.0")
def database():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise HTTPException(503, "Database unavailable")
    return create_engine(url, pool_pre_ping=True)

def principal(x_local_user: UUID | None = Header(default=None)):
    # Explicitly isolated development adapter; never enabled by default.
    if os.environ.get("APP_ENV") != "local-test" or os.environ.get("ENABLE_TEST_AUTH") != "1":
        raise HTTPException(401, "Identity provider not configured")
    if not x_local_user:
        raise HTTPException(401, "Authentication required")
    return x_local_user

def tenant_session(organization_id: UUID, user=Depends(principal)):
    engine = database()
    try:
        with Session(engine) as session, session.begin():
            session.execute(text("select set_config('app.user_id', :id, true)"), {"id": str(user)})
            session.execute(text("select set_config('app.organization_id', :id, true)"), {"id": str(organization_id)})
            role = session.execute(text("select role from organization_members where organization_id=:org and user_id=:usr"), {"org": organization_id, "usr": user}).scalar_one_or_none()
            if role is None:
                raise HTTPException(403, "Organization access denied")
            yield session, role
    finally:
        engine.dispose()

class ArticleInput(BaseModel):
    title: str = Field(min_length=1,max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",max_length=150)
    body: str = Field(max_length=200000)
    author: str = Field(max_length=200)

@app.get("/health")
def health():
    return {"status":"ok","service":"studio-visual","database_checked":False}

@app.get("/organizations/{organization_id}/articles")
def articles(organization_id: UUID, context=Depends(tenant_session)):
    session, _ = context
    rows = session.execute(text("select id,title,slug,status from content_items where organization_id=:org order by created_at desc limit 200"), {"org":organization_id}).mappings()
    return [dict(row) for row in rows]

@app.post("/organizations/{organization_id}/articles",status_code=201)
def create_article(organization_id: UUID, article: ArticleInput, context=Depends(tenant_session)):
    session, role = context
    if role not in ("owner","admin","editor"):
        raise HTTPException(403,"Write access denied")
    from sqlalchemy.exc import IntegrityError
    import json
    try:
        with session.begin_nested():
            item = session.execute(text("insert into content_items (organization_id,title,slug) values (:org,:title,:slug) returning id"),{"org":organization_id,"title":article.title,"slug":article.slug}).scalar_one()
            revision = session.execute(text("insert into content_revisions (organization_id,content_id,payload) values (:org,:item,cast(:payload as jsonb)) returning id"),{"org":organization_id,"item":item,"payload":json.dumps(article.model_dump())}).scalar_one()
        return {"id":item,"revision_id":revision}
    except IntegrityError as exc:
        raise HTTPException(409,"Content conflict") from exc

@app.get("/organizations/{organization_id}/articles/{article_id}")
def get_article(organization_id: UUID, article_id: UUID, context=Depends(tenant_session)):
    session, _ = context
    row = session.execute(text("""
        select i.id,i.title,i.slug,i.status,r.id as revision_id,r.payload
        from content_items i
        left join lateral (
            select id,payload from content_revisions
            where organization_id=i.organization_id and content_id=i.id
            order by created_at desc,id desc limit 1
        ) r on true
        where i.organization_id=:org and i.id=:item
    """), {"org":organization_id,"item":article_id}).mappings().one_or_none()
    if row is None:
        raise HTTPException(404,"Article not found")
    return dict(row)

@app.get("/organizations/{organization_id}/articles/{article_id}/revisions")
def article_revisions(organization_id: UUID, article_id: UUID, context=Depends(tenant_session)):
    session, _ = context
    params = {"org":organization_id,"item":article_id}
    if session.execute(text("select id from content_items where organization_id=:org and id=:item"),params).scalar_one_or_none() is None:
        raise HTTPException(404,"Article not found")
    rows = session.execute(text("select id,payload,created_at from content_revisions where organization_id=:org and content_id=:item order by created_at desc,id desc limit 200"),params).mappings()
    return [dict(row) for row in rows]
