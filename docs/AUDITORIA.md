# Auditoria de desenvolvimento v0.2.1

## Resultado observado

- `npm run typecheck`: aprovado.
- `npm test`: 34 testes aprovados, zero falhas.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:ui`: aprovado, sem exceções JavaScript; desktop 1440 px e celular 390 px.
- Migrações 0001/0002/0003 aplicadas com sucesso no D1 local do Wrangler.
- `git -C /workspace/Cronos status --porcelain`: vazio. O corpo não foi modificado.

Os resultados de modelo nos testes são fixtures HTTP identificadas como tal. O sistema implantável não contém respostas de modelo simuladas. R2 nos testes é o emulador Miniflare, não armazenamento externo real. Capturas em `screenshots/` são artefatos de validação do painel com registros de teste isolados.

## Matriz dos vinte requisitos de teste

| Requisito | Evidência |
|---|---|
| Comunicação autenticada / sessão inválida | Requests HTTP reais no runtime local; sessão inválida, expirada e revogada rejeitadas |
| Persistência de conversas | Chat via HTTP interceptado grava quatro mensagens em D1 |
| Recuperação de memória / reinicialização | Runtime destruído e recriado sobre armazenamento persistido |
| Nós e relações | Relações automáticas e manuais com proveniência; exclusão em cascata |
| Deduplicação | Repetição de entrada retorna mesmo registro |
| Agentes e modelos | Seleção textual; fluxo complexo registra análise, crítica e síntese; quatro gerações com quota |
| Fallback / limite API | Primeiro provedor 429; fallback e cooldown persistente; limite diário |
| Datas relativas / eventos próximos | Três semanas, rejeição de expressão incerta, janela de três dias |
| Não repetição de lembretes | Scheduler repetido gera uma ocorrência; confirmação, conclusão e silêncio |
| Proteção de segredos | Exportação/painel não incluem credenciais; funções e isolamento verificados |
| Falha controlada de ferramenta | PNG inválido e pesquisa desativada produzem erro explícito e registro |
| Exportação e recuperação | Checksum; corrupção rejeitada; referência externa rejeitada; restauração em outra conta remapeia IDs e versões |
| Revogação | Acesso deixa de funcionar imediatamente |
| Resposta visual estruturada | Gráfico retorna dados reais fornecidos; navegador renderiza barras |

Testes adicionais: versão otimista de memória, preferências de fuso, recorrência, proatividade de dados reais, importação sem escrita parcial, R2 diário idempotente, exclusão de backups registrados, SSE com erro honesto, painel e layout responsivo.

## Pendências de validação

Inferência real, planos e limites gratuitos atuais, publicação HTTPS permanente, R2 remoto, Cron Trigger remoto, notificações externas, desempenho sob carga, notícias e multimodalidade semântica. Esses itens não foram validados por ausência de serviços/credenciais ou por implementação ainda pendente. Consulte STATUS.md.

## Reproduzir

`npm ci && npm run check`; depois `npx playwright install chromium` quando necessário e `npm run test:ui`. Se usar Chromium do sistema, definir `CHROMIUM_PATH`. Os bancos usados pelos testes são isolados da conta de desenvolvimento. Nenhuma chave de API é necessária para a suíte local.

## Medição local

A medição atual usa 500 memórias e 30 buscas autenticadas. Resultados em `benchmark.json`; reproduzir com `node scripts/benchmark.mjs` após build. Miniflare local não representa latência de produção ou de inferência.

Regressões da v0.2.1: amanhã com acento, datas ambíguas, palavras sem acentos e prefixos, migração de dados existentes, manutenção do índice em edições/exclusões, isolamento da busca, cancelamento de lembretes e avanço sobre 205 eventos sem duplicação.
