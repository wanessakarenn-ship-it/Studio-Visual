# Plataforma SaaS integrada — arquitetura alvo

Status: visão arquitetural e plano de implementação; não representa funcionalidades homologadas.

## Contratos e limites
Monorepo React/TypeScript, schema Zod e renderer compartilhado. Backend FastAPI/PostgreSQL. Todo recurso persistido pertence a um tenant; autorização server-side e RLS com testes negativos. Versões publicadas imutáveis, separadas de rascunhos. Sem dependência do editor em páginas publicadas. Sem provisionamento ou deploy sem aprovação.

## Módulos
| Módulo | Escopo | Aceite mínimo |
|---|---|---|
| Studio visual | páginas, componentes, responsividade, histórico, assets | 500 nós: abertura <=1000ms, edição e undo P95 <=100ms; paridade e acessibilidade |
| Content Studio | coleções, campos tipados, artigos, revisão, versões | CRUD isolado, preview e publicação de versão |
| SEO/GEO | metadados, canonical, sitemap, robots, dados estruturados, auditoria de conteúdo | HTML indexável e validação técnica; sem promessa de ranking ou citações por IA |
| Publicação | build versionado, artefatos, rollback, ambientes | publicação idempotente, rollback testado, logs |
| Domínios | verificação DNS, associação exclusiva, TLS | comprovação de propriedade, isolamento e renovação |
| Formulários | schema, validação server-side, consentimento, antiabuso | submissão idempotente, limites e testes de abuso |
| Leads | captura, deduplicação, origem/UTM, exportação, retenção | isolamento, trilha de auditoria e exclusão |
| Analytics | eventos, funil, agregações, consentimento | métricas reproduzíveis, sem PII desnecessária |
| Copilot | sugestões de conteúdo, SEO e layout com diff | aprovação humana antes de aplicar; sem acesso entre tenants; limites e auditoria |

## Sequência de implementação
1. Fundação: corrigir regressões, CI/Chromium/backend no mesmo HEAD, revisão e homologação humana.
2. SaaS core: identidade, memberships, projetos, autorização, persistência, assets e auditoria.
3. Content Studio e SEO/GEO: contratos de conteúdo, editor, versões, metadados e exportação.
4. Publicação e domínios: worker idempotente, armazenamento de artefatos, DNS/TLS e rollback.
5. Formulários e leads: ingestão, consentimento, atribuição, deduplicação e exportação.
6. Analytics: eventos first-party, agregações, dashboards e retenção.
7. Copilot: sugestões estruturadas, validação Zod, diff, aprovação e quotas.
8. Homologação integrada: testes de isolamento, carga, segurança, recuperação e documentação.

## Infraestrutura alvo (Google Cloud)
Cloud Run para API e workers; Cloud SQL PostgreSQL; Cloud Storage para assets e artefatos; Artifact Registry para imagens; Secret Manager; Cloud Logging/Monitoring. Seleção final de serviços de DNS/TLS e filas após validação de requisitos e custos. GitHub Actions com identidade federada, sem chaves permanentes. Ambientes separados e migrações controladas.

## Definição de pronto
Cada módulo exige código, migrações quando aplicáveis, testes unitários/integrados/E2E, documentação, evidência de execução e critérios de segurança. Não declarar implementação concluída com base neste documento. Não reduzir metas para obter CI verde. Não realizar merge, deploy ou provisionamento pago sem autorização específica.
