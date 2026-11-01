# CRONOS BRAIN CLOUD

Backend e painel privado independentes do Cronos Desktop. Identidade da IA: **CRONOS**. Código em `/workspace/cronos-brain-cloud`; o repositório `/workspace/Cronos` permanece separado. Especificação original: [ESPECIFICACAO.md](docs/ESPECIFICACAO.md).

Versão **0.4.3**: API Workers/D1 protegida, painel responsivo, cinco tipos de memória com histórico, grafo interativo, agenda, PDF, conectores de voz/imagens/vídeo, pesquisa, memória vetorial, backup verificável com restauração e orquestração de especialistas. **44 testes automatizados e teste de navegador passaram.**

Nenhum modelo externo está conectado neste ambiente. O sistema devolve indisponibilidade explícita quando precisa de inferência. Os 40 especialistas possuem caminho de execução, mas isso não significa 40 IAs validadas com modelo real. Veja o [estado de cada fase](docs/STATUS.md), incluindo funcionalidades ainda pendentes de implementação ou validação externa.

## Abrir com dois cliques

1. Instale [Node.js 24 ou superior](https://nodejs.org/) no computador.
2. [Baixe o ZIP do repositório](https://github.com/Pedro-Prog-crypto/cronos-brain-cloud/archive/refs/heads/main.zip) e extraia os arquivos.
3. No Windows, abra `INICIAR-CRONOS.cmd` com dois cliques. No macOS, abra `INICIAR-CRONOS.command` (ou rode `sh INICIAR-CRONOS.command` no Terminal).

Na primeira abertura, o iniciador instala dependências, prepara o banco e cria um dispositivo local. Depois abre `http://127.0.0.1:8787/admin` no navegador. No Windows, também abre no Bloco de Notas o arquivo `.wrangler/device.local.json`: copie `deviceId` e `credential` para os dois campos de login. Guarde esse arquivo em privado. Mantenha a janela do iniciador aberta enquanto usa o painel; para parar, feche a janela ou pressione Ctrl+C.

O painel funciona localmente sem Cloudflare. Conversa com IA e mídia remota exigem provedores configurados; memória, grafo, calendário e PDF local podem ser testados de imediato. Em celular, a instalação local não abre uma URL pública: consulte as capturas em [INTERFACE.md](docs/INTERFACE.md) até haver publicação na nuvem.

## Abrir localmente

Requer Node.js 24+ e npm. Baixe e extraia o ZIP do repositório, ou clone-o com Git. Abra um terminal na pasta que contém `package.json`. Cada tarefa em nuvem já é isolada; use o checkout existente, sem criar worktrees.

```sh
cd cronos-brain-cloud
npm ci
npm run db:migrate
npm run device:create
npx wrangler d1 execute DB --local --file .wrangler/device.local.sql
npm run dev
```

Abra `http://127.0.0.1:8787/admin` **na máquina que executa o servidor**. Em ambiente remoto, use o encaminhamento de porta oferecido pela sua plataforma. O servidor não foi publicado na Internet.

O dispositivo local deste ambiente já foi criado. Em uma instalação existente, pule `device:create` e o segundo comando de provisionamento. O gerador nunca sobrescreve uma credencial existente. O arquivo `.wrangler/device.local.json` contém o ID e a credencial para o formulário de login; mantenha-o privado. Sessões duram 15 minutos. Novos dispositivos e revogação ficam em Configurações do painel.

## Verificar

```sh
npm run check
# Se necessário, instale o navegador de teste: npx playwright install chromium
npm run test:ui
# Neste ambiente há Chromium do sistema:
CHROMIUM_PATH=/usr/bin/chromium npm run test:ui
```

Os testes de interface usam banco temporário isolado. Capturas de validação ficam em `docs/screenshots/`; elas usam registros de teste explícitos, sem simular provedor de IA conectado. Testes de inferência interceptam HTTP somente no harness de testes; nunca na aplicação.

## Recursos disponíveis

- Sessões opacas, funções owner/reader, revogação e limites por usuário.
- Memórias episódica, semântica, temporal, procedural e relacional; busca textual por termos, deduplicação, edição com controle de versão e exclusão.
- Grafo derivado de temas/relações declarados, com proveniência, zoom, arraste, busca, seleção e lista acessível.
- Metas, tarefas, compromissos, planos de preparação, recorrência por conclusão, lembretes internos, silêncio configurável e opt-in.
- Documento TXT/Markdown, gráfico de dados fornecidos e inspeção de metadados PNG; resumo por IA exige modelo.
- Backup JSON com SHA-256, restauração transacional em conta vazia, IDs remapeados; adaptador de backup R2 opt-in testado em emulador.
- Gateway Cloudflare Workers AI/Groq/OpenRouter/compatível, timeout, até dois fallbacks, quota diária e Retry-After.
- Conversas simples usam um especialista; complexas podem executar duas análises em paralelo, crítica e síntese. Cache privado curto e SSE de progresso/resultado.
- Painel de diagnóstico, dispositivos, autonomia, dados, especialistas e ferramentas.

## Próxima configuração externa

O ambiente não tem credenciais nem autorização de rede para Cloudflare ou provedores de IA. Todos começam desativados. Não há conta paga, faturamento ou publicação habilitados. O procedimento está em [PUBLICACAO.md](docs/PUBLICACAO.md): segredos apenas no armazenamento seguro, catálogo/plano atual verificado antes de escolher modelo e orçamento inicial zero.

## Documentação

- [Resultado por fase e limites](docs/STATUS.md)
- [Arquitetura](docs/ARQUITETURA.md) e [segurança](docs/SEGURANCA.md)
- [API](docs/API.md) e [OpenAPI](docs/openapi.json)
- [Cliente de integração independente](client/brain.ts)
- [Auditoria e evidências](docs/AUDITORIA.md)

## Atualizar uma instalação existente

```sh
git pull --ff-only
npm ci
npm run db:migrate
npm run check
npm run dev
```

A versão 0.4.3 inclui migrações até 0006 (busca, vetores, ações autorizadas e verificações de conexão). Não recrie o dispositivo nem apague `.wrangler` ao atualizar. [Histórico de mudanças](docs/CHANGELOG.md).

[Configurar mídia, pesquisa, vetores e notificações](docs/CAPACIDADES.md). Novos conectores permanecem desativados até a configuração e verificação do plano gratuito. O painel permite enviar arquivos explicitamente; vídeo envia somente quadros selecionados localmente.

## Interface

A versão 0.4.3 reúne as 12 telas do painel enviado pelo usuário, com tema espacial azul/violeta, atlas interativo, estúdio e preferências de personalidade persistentes. Consulte [INTERFACE.md](docs/INTERFACE.md) e as [capturas das telas](docs/screenshots/).

Se o iniciador antigo parou em `C:\Program Files\nodejs\node.exe scripts/device-create.mjs`, atualize `scripts/start-local.mjs` pelo ZIP mais recente. Preserve a pasta `.wrangler` da instalação existente, que contém os dados e a credencial local.
