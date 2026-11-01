# Resultado por fase — versão 0.3.0

A versão 0.3.0 acrescenta os módulos que faltavam de mídia, pesquisa, vetores, notificações e controle autorizado de dispositivos. **O sistema completo ainda não foi validado em produção.** Não há credenciais de nuvem ou modelos neste ambiente. Código implementado e teste com transporte simulado não equivalem a um serviço externo operacional.

| Fase | Implementado e verificado localmente | Limites e configuração pendente |
|---|---|---|
| 1 — Fundação | Workers, D1, autenticação, dispositivos, permissões, painel e OpenAPI | Cloudflare/Access/MFA e domínio de produção |
| 2 — Primeiro cérebro | Conversa persistente, orquestração e sondagem de conexão que registra resultado real | Conectar e testar modelo real com plano gratuito confirmado |
| 3 — Provedores | Adaptadores de texto, gateway multimodal, orçamento diário, fallback, timeout, Retry-After, cache privado | Validar compatibilidade de cada endpoint/modelo; seleção por histórico de qualidade/latência ainda não implementada |
| 4 — Memória | Cinco tipos, FTS5, histórico, backup/restauração, embeddings e busca de cosseno persistida; chat combina vetorial/lexical quando disponível | Embeddings reais; Vectorize/particionamento ainda não implementados; vetores são reindexados após restaurar backup |
| 5 — Grafo | Proveniência, geração a partir de temas declarados, correção por API, visualização interativa | Extração livre de entidades/relacionamentos por IA e layout avançado ainda não implementados |
| 6 — Especialistas | Os 40 têm despacho para modelo, ferramentas, memória, agenda, política ou dispositivo; ferramentas permitidas verificadas | Qualidade e disponibilidade cognitiva exigem testes reais; catálogo mantém estado parcial, sem alegar 40 IAs operacionais |
| 7 — Autonomia | Agenda, metas, silêncio, recorrência, opt-in, Cron declarado a cada 15 min, fila de webhook assinado com tentativas limitadas | Publicar Cron; configurar receptor autorizado; extração automática de compromissos em chat e replanejamento ainda pendentes |
| 8 — Multimodal | PDF real; conectores de visão, geração, transcrição, voz, áudio por transcrição, vídeo por quadros; feeds RSS/Atom e Commons | Serviços externos não validados; sem OCR, captura contínua, análise acústica ou cobertura integral de vídeo; notícias preservam datas/fontes, mas não têm veracidade garantida |
| 9 — Integração | Cliente de API e executor por callbacks com permissões, fila, expiração e resultados | Desktop continua separado por instrução do usuário; aplicativo receptor precisa instalar os callbacks |
| 10 — Auditoria | 43 testes locais passando; navegador desktop/celular; PDF extraído; build de publicação em dry-run | Auditoria independente, carga e testes reais de inferência, pesquisa, entrega externa e recuperação remota |

## Validação

`npm run check`: TypeScript/build e 43 testes aprovados. Inferência, mídia remota e notificações são testadas com fixtures de transporte isoladas; extração de PDF, banco, indexação e cálculos são reais. Não existe provedor simulado no código de produção.

`npm run test:ui`: painel e extração de PDF real aprovados em navegador; layout validado em desktop/celular. `wrangler deploy --dry-run`: build válido, cerca de 777 KiB comprimidos na versão validada. Não houve publicação. Migrações até 0006 aplicadas no banco local.

## Bloqueio externo atual

Não existem `CLOUDFLARE_API_TOKEN`, `GROQ_API_KEY`, `CAPABILITY_API_KEY` ou configuração de provedor neste ambiente. Foi salvo um rascunho com requisitos de Cloudflare/Groq e destinos `api.cloudflare.com`/`api.groq.com`. A revisão, preenchimento seguro, salvamento e publicação do ambiente ainda são necessários. Esse rascunho não criou contas, chaves ou serviços.

As capacidades multimodais exigem um serviço compatível escolhido e verificado pelo operador. Gratuidade não foi presumida. Não é possível concluir a validação real de todas as funções somente acrescentando arquivos ao repositório.

Configuração e limites: [CAPACIDADES.md](CAPACIDADES.md) e [PUBLICACAO.md](PUBLICACAO.md).
