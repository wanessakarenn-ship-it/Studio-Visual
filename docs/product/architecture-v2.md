# Studio Visual — Arquitetura estratégica v2
Status: especificação de evolução; não representa funcionalidades entregues.
## Produto
Seis áreas: Design Studio (Canvas, Templates, Blocks, Assets, Brand); Content Studio (Blog/CMS, calendário e revisões); Search Intelligence (SEO/GEO); Publish & Connectors (domínios, SSL, hosting, conectores); Leads & Conversion; Analytics. Copilot transversal. Preservar pacotes existentes.
## Dados
organizations, users, organization_members (unique organization_id/user_id; owner/admin/editor/viewer), workspaces, websites. content_items (type landing_page/blog_post, organization_id, website_id, slug, status, author, SEO fields, canonical, structured metadata, current/published revision pointers); content_revisions com payload versionado específico por tipo. Unique website_id/slug normalizado; FK compostas por tenant. redirects com prevenção de ciclos. authors, categories, tags, editorial_calendar, content_sources, editorial_reviews; keywords, topic_clusters, seo_audits, internal_links; brand_entities, knowledge_facts (proveniência, fonte, data, status de verificação); geo_audits, ai_visibility_checks (provider/model/query/date/locale, evidência e limitações); ai_usage_logs (tenant, usuário, modelo, tokens, custo estimado e moeda, request id, timestamp), ai_jobs, ai_policies. forms, form_submissions, leads, webhook_deliveries; domains, deployments, integrations; plans, subscriptions, usage_limits, audit_logs, consents, retention_policies.
## Governança
RLS default deny em tabelas tenant-scoped, app role sem bypass, contexto tenant derivado de membership validada, transações com contexto local, testes negativos entre tenants, FK compostas. Identidade global e catálogos públicos têm políticas específicas. Storage prefixo organization_id NÃO é fronteira de segurança por si só; autorizar acesso no backend e emitir URLs assinadas de escopo/tempo mínimos. Secret Manager para credenciais e referências opacas no banco, IAM mínimo, rotação, nenhuma chave no cliente/log. OAuth tokens por tenant/integration com estratégia de envelope encryption alternativa quando escala justificar. Dados sintéticos, nenhum material corporativo proprietário.
Um projeto GCP para módulos do mesmo ambiente. Separar produção e não produção antes de dados reais, billing e IAM separados quando possível. Não provisionar serviços pagos ou publicar sem autorização. Domínios: verificação de propriedade, TLS gerenciado, roteamento host validado, prevenção de takeover, rollback de release imutável, cache/CDN e metas CWV.
IA: quotas por tenant, rate limiting, orçamento, logs de metadados minimizados, custos estimados reconciliados; aprovação humana para publicação e fontes, nenhum ranking garantido. 
## Scores
SEO 100: intenção 20, título/metadados 15, estrutura 15, links 10, imagens 10, indexabilidade 15, qualidade editorial 15. GEO 100: autoria/transparência 20, fatos verificáveis e proveniência 25, respostas diretas quando úteis 20, entidades/contexto 15, consistência e atualização 10, estrutura semântica 10. Itens N/A excluídos do denominador, evidência por critério e versão de rubric. Não são scores oficiais nem preditores de ranking/citação. FAQ e estatísticas somente quando úteis e verificáveis; separar visibilidade observada da qualidade editorial.
## Roadmap
Gate 02: corrigir browser acceptance, ZIP, paridade, acessibilidade, desempenho, usuários reais.
03A: identidade, organizações, RLS, persistência, API, storage, auditoria, custos IA.
03B: publicação preview/estática, domínios/SSL verificados, versões e rollback, formulário básico/webhook assinado e antiabuso, consentimento.
04: CMS/blog, revisão/autoria, calendário, publicação e sitemap/redirects.
05: Search Intelligence SEO e dados GSC; 06: GEO e Copilot com fontes/limites; 07: analytics e leads avançados/conectores; 08: escala, billing e comercialização.
Não iniciar provisionamento produtivo antes dos gates. Arquitetura aditiva sem migrações destrutivas.
## Estado em 26/11/2026
CI #58 aprovado no commit 7ac4eecc568cf1f0f6d03771362abe9373173b1d. Browser acceptance #3 falhou; não homologado. Esta revisão não implementa backend ou módulos novos.
