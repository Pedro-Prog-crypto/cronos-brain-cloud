# Interface CRONOS — 0.4.0

O painel em `/admin` foi reconstruído seguindo as doze telas da imagem fornecida pelo usuário. Mantém a identidade azul/ciano/violeta, fundo espacial, navegação lateral, numeração, painéis, diagramas e divisão dos conteúdos. Ícones e cérebro são SVG; a galáxia é desenhada em Canvas. São reconstruções das ilustrações: sem os arquivos gráficos originais, não se alega identidade pixel a pixel.

| Página | Implementação e captura |
| --- | --- |
| 01 Centro de comando | [Fluxo de orquestração, estado da API e atividade real](screenshots/overview.png) |
| 02 Atlas de memórias | [Galáxia, nós reais selecionáveis, zoom, arraste e memórias relacionadas](screenshots/graph.png) |
| 03 Especialistas | [40 especialistas, categorias, busca, detalhe, histórico e execução](screenshots/agents.png) |
| 04 Modelos e ferramentas | [Gateway, provedores, políticas e catálogo de ferramentas](screenshots/models.png) |
| 05 Tempo e autonomia | [Linha do tempo, calendário, compromissos, metas e preferências](screenshots/events.png) |
| 06 Núcleo e proteção | [Cérebro ilustrado, dispositivos, revogação, backup e exclusão](screenshots/settings.png) |
| 07 Pesquisa e notícias | [Pesquisa, notícias, imagens, fontes, resumo e exportação](screenshots/research.png) |
| 08 Estúdio multimodal | [Arquivos, imagem, áudio, voz, composição, gráficos e referências](screenshots/tools.png) |
| 09 Memória e continuidade | [Cinco tipos, editor, versões, revisão e prévia do atlas](screenshots/memory.png) |
| 10 Diagnóstico e limites | [Serviços, sondagens reais, requisições da sessão, latência e falhas](screenshots/diagnostics.png) |
| 11 Personalidade e aprendizado | [Preferências persistentes e exemplo com modelo conectado](screenshots/personality.png) |
| 12 Integração corpo–cérebro | [Dispositivos, permissões, comandos e saída estruturada](screenshots/integration.png) |

As capturas usam uma conta isolada de testes. Não há atividades fictícias no produto. A arte da galáxia e o cérebro são decorativos; os assuntos selecionáveis vêm das memórias reais. O painel adicional de conversa mantém o acesso ao chat.

## Funções e limites

- A navegação Ferramentas abre o catálogo; Autonomia abre suas preferências; Dispositivos abre a integração. São seções das páginas correspondentes.
- O estilo é guardado como memória semântica versionada e orienta a apresentação do chat e dos especialistas textuais. Não representa treinamento de pesos. Exclusão dessa memória restaura os padrões.
- A composição usa Markdown; exportação gera arquivo `.md`. O histórico de requisições mostra apenas método, caminho sem query, status e tempo desta sessão. Credenciais e corpos não são registrados nesse histórico.
- Upload, prévia e composição ficam na memória do navegador. O envio ocorre ao executar a ferramenta; a prévia de imagem usa Blob local revogado no logout. Não há persistência em localStorage de sessão ou composição.
- Artigos acadêmicos, monitoramento contínuo e alertas de pesquisa permanecem desabilitados. Não há clonagem de voz, identificação de falantes, transcrição automática em tempo real, aprovação automática de notícias ou integração automática com o desktop.
- Limites de arquivos, provedores e necessidade de credenciais continuam documentados em [CAPACIDADES.md](CAPACIDADES.md). O painel não ativa serviços externos nem configura segredos.

## Validação

`npm run check`: 44 testes. `CHROMIUM_PATH=/usr/bin/chromium npm run test:ui`: todas as páginas em desktop e celular, sem exceções JavaScript ou overflow horizontal, com operações de memória, PDF, especialista local e personalidade. Em [mobile.png](screenshots/mobile.png), a navegação lateral é convertida para faixa horizontal para preservar legibilidade.

O cérebro permanece em repositório separado. Nenhum arquivo de `/workspace/Cronos` foi alterado.
