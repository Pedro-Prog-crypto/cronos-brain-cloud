# API v1

JSON UTF-8. Autenticação: `Authorization: Bearer <token>`, exceto saúde e criação de sessão. Erros: `{ "error": { "code": "...", "requestId": "..." } }`. 401 sessão ausente/inválida/expirada; 403 função insuficiente; 404 recurso ausente; 413 corpo excede 32 KiB; 415 tipo de mídia; 422 schema; 429 limite (com Retry-After); 503 modelo indisponível. Resultados privados usam no-store.

| Método | Caminho | Corpo / resultado |
|---|---|---|
| GET | /v1/health | Nome, status e relógio UTC; sem diagnóstico privado |
| POST | /v1/auth/sessions | `{deviceId,credential}` → `{accessToken,expiresIn:900,tokenType}` |
| POST | /v1/chat | `{message,conversationId?,remember?:false}` → texto, componentes, fontes, memórias usadas, provider, agentId, status |
| POST | /v1/memory | `{kind,content,source,confidence?,metadata}` → memória persistida/deduplicada |
| GET | /v1/memory/search | `?q=...&kind=...`, até 30 resultados |
| DELETE | /v1/memory/{id} | Apaga memória e arestas associadas |
| POST | /v1/knowledge/nodes | `{label,category}` → nó real |
| POST | /v1/knowledge/edges | `{sourceId,targetId,relation,memoryId}`; todas as referências devem pertencer ao usuário |
| GET | /v1/knowledge/graph | Nós e arestas; limite explícito de 500/1000 |
| POST | /v1/tasks | `{title}` → id; registro de tarefa, sem execução automática |
| GET | /v1/tasks e /v1/tasks/{id} | Registros de tarefas |
| POST | /v1/goals | `{title}` → id |
| GET | /v1/goals e /v1/goals/{id} | Registros de metas |
| POST | /v1/events | `{title,dueAt,notify?:false}` → id |
| GET | /v1/events e /v1/events/{id} | Registros de eventos |
| PATCH | /v1/tasks/{id}, /v1/goals/{id}, /v1/events/{id} | `{status:"completed" ou "cancelled"}` |
| GET | /v1/reminders | Lembretes internos gerados pelo scheduler |
| GET | /v1/agents | Catálogo e últimas 50 execuções do usuário |
| GET | /v1/providers/status | Configuração pública de provedores, sem secrets |
| GET | /v1/devices | Lista de dispositivos sem hashes/segredos |
| DELETE | /v1/devices/{id} | Revoga dispositivo e sessões |
| GET | /v1/data/export | Exportação dos dados de domínio; owner obrigatório |
| DELETE | /v1/data | `{confirm:"DELETE MY DATA"}`; remove usuário e seus dados |

Todos os métodos de escrita exigem owner. UUIDs identificam os recursos. Datas de entrada exigem timezone explícito ISO 8601 e são normalizadas para UTC nos eventos.

Metadados das memórias:

- episódica (`episodic`): `{occurredAt,context}`;
- semântica (`semantic`): `{topics:[...]}`;
- temporal (`temporal`): `{dueAt,status?}`;
- procedural (`procedural`): `{steps:[...],execution:"manual"}`;
- relacional (`relational`): `{from,to,relation}`.

Busca de memória usa FTS5 com palavras/prefixos e ignora acentos. Múltiplas palavras na busca devem estar presentes; a recuperação automática no chat classifica correspondências por relevância. Pontuação não é interpretada como operador de busca. Consultas vazias listam registros recentes; consultas apenas com pontuação retornam lista vazia. A migração 0003 reconstrói o índice dos dados existentes e instala triggers para mantê-lo atualizado. Busca vetorial está disponível pelas ferramentas de embedding quando configuradas. A deduplicação considera usuário, tipo, conteúdo normalizado e metadados, preservando a primeira origem.

O chat retorna JSON por padrão. `Accept: text/event-stream` envia eventos `progress`, `result` e `error`; a inferência é bufferizada, sem transmissão token a token. `complex: true` permite análise paralela, crítica e síntese. O chat emite componentes de texto; a ferramenta visual emite componentes de gráfico. O cliente demonstrativo em `client/brain.ts` mantém integração futura separada do Desktop. As 58 operações estão documentadas em `openapi.json`, gerado por `scripts/openapi.ts` com schemas de entrada. Algumas respostas administrativas permitem campos adicionais; o contrato de chat e backup possui schema específico.


## Operações adicionadas na v0.2

| Método | Caminho | Contrato |
|---|---|---|
| POST | /v1/auth/logout | Encerra a sessão atual; permitido também para reader |
| PUT | /v1/memory/{id} | `{expectedVersion,memory}`; conflito retorna 409; snapshot anterior preservado |
| GET | /v1/memory/{id}/versions | Histórico da memória do usuário |
| POST | /v1/memory/review | `{ids,mode:"consolidate" ou "audit"}`; requer modelo, retorna proposta sem alterar dados |
| GET | /v1/knowledge/graph/search | `?q=...`; até 100 assuntos |
| DELETE | /v1/knowledge/nodes/{id} ou /edges/{id} | Correção manual do grafo |
| POST | /v1/events/plan | `{title,expression,notify?}`; cria meta/evento/três tarefas de preparação |
| PATCH | /v1/events/{id} | Também aceita `dueAt`, `title`, `recurrenceDays` e `notify`; próxima ocorrência nasce na conclusão |
| POST | /v1/time/resolve | `{expression}`; dias/semanas/amanhã; precisão de dia |
| POST | /v1/reminders/{id}/ack | Marca lembrete visto |
| POST | /v1/scheduler/run | Verifica eventos do usuário atual; não envia notificações externas |
| POST | /v1/agents/{id}/run | `{message}`; especialista textual usa modelo; parte dos locais executa função diretamente; capacidade ausente retorna 503 |
| GET | /v1/tools | Catálogo de ferramentas |
| POST | /v1/tools/execute | União tipada descrita abaixo |
| GET | /v1/documents | Lista de documentos do usuário, sem corpo |
| DELETE | /v1/documents/{id} | Remove documento |
| POST | /v1/devices | `{name,role}`; owner cria credencial exibida uma vez |
| GET / PUT | /v1/settings | Perfil, autonomia, silêncio, retenção e backup |
| GET | /v1/diagnostics | Contagens, volume de memória, falhas, uso próprio e backups; owner |
| GET | /v1/backup/export | Envelope v2 com dados, perfil e checksum SHA-256 |
| POST | /v1/backup/restore | `{confirm:"RESTORE INTO EMPTY ACCOUNT",backup}`; conta vazia, até 2 MB |

`/v1/data/export` também retorna envelope v2. Backups não incluem credenciais, sessões ou configuração secreta de provedor. Restauração exige reativação explícita de proatividade, retenção e backup externo. A migração 0002 é necessária para estes contratos.

Ferramentas:

- `document.analyze`: `{tool,name,text,summarize?:false}`; até 24 mil caracteres. Contagem/armazenamento locais; resumo exige modelo.
- `visual.chart`: `{tool,title,points:[{label,value}]}`; 1–40 valores finitos. Retorna componente `chart` com os dados originais.
- `image.inspect`: `{tool,base64}`; PNG pequeno, até 30 mil caracteres base64. Retorna metadados; não interpreta cena.
- `web.search`: `{tool,query}`; apenas Wikipedia, exige `WEB_ENABLED=true`, rede autorizada e validação externa. Não verifica notícias.

Em chamadas SSE, erros após o início do stream vêm no evento `error` dentro de uma resposta HTTP 200. O cliente deve interpretar o evento, não considerar o status inicial uma conclusão bem-sucedida.


## Contratos da v0.3.0

Mídia, PDF, notícias, busca de imagens e embeddings usam `/v1/tools/execute`; entradas e limites detalhados em [CAPACIDADES.md](CAPACIDADES.md). O corpo de ferramentas/agentes aceita até 2 MB; demais operações mantêm 32 KiB.

- `GET /v1/capabilities`: configuração e disponibilidade dos conectores, sem segredos.
- `POST /v1/providers/probe`, `{id}`: uma inferência real no provedor escolhido; usa quota configurada. O status registra sucesso/falha e hash da configuração testada.
- `PUT /v1/devices/{id}/permissions`, `{actions}`: permissões explícitas para dispositivo próprio.
- `POST /v1/commands`, `{deviceId,action,payload,confirm:true}`: enfileira ação autorizada, sem alegar execução.
- `GET /v1/commands`: fila do próprio dispositivo autenticado.
- `POST /v1/commands/{id}/result`, `{status,result}`: dispositivo registra resultado, com rechecagem de permissão e expiração.
- `GET/PUT /v1/notifications/subscription`: webhook do usuário; escrita `{url,enabled}` depende de allowlist e segredo HMAC no Worker.

Agent run também aceita `toolInput`, `memory` ou `command` conforme o especialista. IDs 07–20 despacham somente ferramentas explicitamente permitidas. ID25 enfileira comando autorizado; ID33 grava memória validada; ID38 executa orquestração.
