# PROJETO CRONOS BRAIN CLOUD
## Construção do cérebro autônomo, multimodal, persistente e distribuído do CRONOS

Você é o arquiteto principal de software, inteligência artificial, engenharia de dados, segurança e sistemas distribuídos responsável por construir o **CRONOS BRAIN CLOUD**.

Este projeto é extremamente importante. Não quero apenas uma demonstração, um chatbot com nome personalizado, uma interface bonita ou um conjunto de respostas falsas. Quero um sistema real, modular, funcional, testável e progressivamente expansível.

Leia toda a especificação antes de implementar. Analise as dependências e desenvolva por etapas verificáveis, mantendo o projeto executável a cada etapa.

# 1. VISÃO GERAL

O CRONOS é meu assistente pessoal de inteligência artificial, inspirado nas capacidades de organização, raciocínio, comunicação e controle tecnológico do JARVIS.

Atualmente, o CRONOS já possui um projeto de interface desktop em desenvolvimento, com elementos visuais, animações, painéis e ferramentas. Esse projeto representa o CORPO.

Agora criaremos um segundo projeto, totalmente independente, chamado CRONOS BRAIN CLOUD, que representará seu CÉREBRO.

Não reconstrua nem substitua a interface atual. Não misture os dois projetos.

O cérebro deverá funcionar na nuvem, mesmo quando meus notebooks estiverem desligados.

O corpo deverá acessar o cérebro por meio de uma API autenticada e criptografada.

A arquitetura deverá permitir que futuramente outros dispositivos e interfaces se conectem ao mesmo cérebro, compartilhando as memórias e configurações autorizadas.

O CRONOS BRAIN deverá ter:

- Inteligência conversacional avançada.
- Coordenação de vários modelos de IA.
- Quarenta módulos cognitivos especializados.
- Cinco sistemas inteligentes de memória.
- Grafo de conhecimento interconectado.
- Consciência operacional do tempo e dos compromissos.
- Capacidade de tomar iniciativas autorizadas.
- Personalidade própria, consistente e independente.
- Ferramentas de pesquisa, análise, imagens, notícias e programação.
- Comunicação em tempo real.
- Autenticação e segurança rigorosas.
- Arquitetura extensível.
- Funcionamento com custo inicial zero, respeitando cotas gratuitas.

Não afirme que o sistema possui consciência humana, sentimentos reais ou capacidades que não foram implementadas.

# 2. PRINCÍPIO FUNDAMENTAL: UMA INTELIGÊNCIA UNIFICADA

Embora o cérebro utilize vários modelos e especialistas, o usuário deverá interagir com uma única identidade chamada CRONOS.

Os especialistas não deverão responder independentemente ao usuário como um grupo de chatbots.

Implemente um sistema central de orquestração que:

1. Receba o pedido.
2. Identifique as intenções.
3. Recupere as memórias relevantes.
4. Analise contexto, urgência e complexidade.
5. Determine quais especialistas precisam participar.
6. Selecione modelos disponíveis e adequados.
7. Execute ferramentas independentes em paralelo quando possível.
8. Consolide os resultados.
9. Verifique contradições e informações importantes.
10. Produza uma resposta coerente com a personalidade do CRONOS.
11. Atualize as memórias apropriadas.
12. Registre tarefas pendentes, quando autorizado.

Não invoque todos os especialistas para cada pergunta.

Uma pergunta simples deverá utilizar processamento mínimo.

Uma tarefa complexa poderá ativar vários especialistas.

Implemente seleção dinâmica, economia de tokens, cache, execução paralela, timeout e fallback.

A arquitetura deve funcionar mesmo com um único modelo de IA conectado e melhorar conforme novos modelos forem adicionados.

# 3. INFRAESTRUTURA NA NUVEM

Priorize uma implementação utilizando:

- Cloudflare Workers: API e orquestração central.
- Cloudflare D1: dados estruturados e memória persistente.
- Cloudflare R2: documentos, arquivos e backups, quando disponível.
- Cloudflare Vectorize: busca semântica e memória vetorial, quando disponível.
- Cloudflare Workers AI: modelos de IA compatíveis com a cota gratuita.
- Cloudflare Cron Triggers: eventos periódicos e verificações temporais.
- Cloudflare Access ou autenticação equivalente: controle de acesso.
- GroqCloud: inferência por modelos disponíveis.
- OpenRouter: roteamento de modelos compatíveis.
- Outros provedores: conectores opcionais.

Use TypeScript como linguagem principal do backend.

Implemente interfaces de armazenamento e de inferência independentes do provedor.

Não escreva um sistema que só funcione porque depende de uma API específica.

O cérebro deve poder substituir um provedor sem perder memórias, identidade ou ferramentas.

Não considere qualquer serviço ilimitado, permanentemente gratuito ou garantidamente disponível.

Faça verificações reais de planos, endpoints, limites e requisitos antes de ativar cada integração.

O orçamento inicial obrigatório é R$ 0.

Não habilite faturamento, créditos pagos ou upgrades automaticamente.

Se uma funcionalidade exigir pagamento, mantenha-a desativada, documente a limitação e apresente a alternativa gratuita mais próxima.

# 4. SISTEMA DOS 40 ESPECIALISTAS DE IA

Crie quarenta agentes lógicos especializados, cada um com função, entrada, saída, ferramentas permitidas, estratégia de modelo, prioridades e condições de ativação.

Esses agentes devem executar tarefas reais por meio de modelos e ferramentas disponíveis.

Eles não precisam corresponder a quarenta modelos de linguagem diferentes. Um mesmo modelo pode atender a vários especialistas. Entretanto, cada especialista deve ter lógica específica e não ser apenas um nome decorativo.

## Núcleo de raciocínio

**01. CRONOS Reasoner**
Responsável por raciocínio geral, análise de situações e planejamento lógico.

**02. CRONOS Deep Thinker**
Responsável por problemas complexos, avaliação de hipóteses e comparação de soluções.

**03. CRONOS Planner**
Transforma objetivos em planos concretos, etapas e tarefas.

**04. CRONOS Critic**
Revisa conclusões, detecta inconsistências e identifica erros.

**05. CRONOS Decision**
Compara alternativas, consequências e riscos, apresentando recomendações justificadas.

**06. CRONOS Synthesizer**
Reúne resultados de vários especialistas em uma resposta única e coerente.

## Conhecimento e informação

**07. CRONOS Research**
Realiza pesquisas na internet por meio de ferramentas de busca autorizadas.

**08. CRONOS News**
Consulta notícias atuais, verifica datas, fontes e relevância dos acontecimentos.

**09. CRONOS Fact Checker**
Verifica afirmações e diferencia fatos confirmados, hipóteses e opiniões.

**10. CRONOS Science**
Auxilia com ciências, matemática e explicações técnicas.

**11. CRONOS Education**
Ensina conteúdos escolares e universitários, adapta explicações e cria exercícios.

**12. CRONOS Document Analyst**
Analisa documentos, textos, PDFs, apresentações e arquivos.

## Multimodalidade

**13. CRONOS Vision**
Interpreta imagens e capturas de tela autorizadas.

**14. CRONOS Image Research**
Localiza imagens relevantes na internet, preservando créditos e referências.

**15. CRONOS Image Creator**
Solicita geração de imagens a serviços compatíveis quando houver capacidade disponível.

**16. CRONOS Visual Composer**
Organiza imagens, legendas, gráficos e textos em painéis visuais.

**17. CRONOS Speech Recognition**
Transforma áudio em texto com reconhecimento de fala.

**18. CRONOS Voice Synthesis**
Transforma respostas em áudio com voz configurável.

**19. CRONOS Audio Analyst**
Analisa áudios fornecidos, identificando informações e eventos relevantes.

**20. CRONOS Video Analyst**
Analisa vídeos, cenas e sequências quando houver ferramentas compatíveis.

## Programação e tecnologia

**21. CRONOS Programmer**
Desenvolve códigos, aplicações e automações.

**22. CRONOS Debugger**
Investiga falhas em sistemas e propõe correções verificáveis.

**23. CRONOS Architect**
Planeja sistemas, serviços, integrações e estruturas de software.

**24. CRONOS Cybersecurity**
Analisa defensivamente configurações, permissões, vulnerabilidades e riscos de segurança em sistemas autorizados.

**25. CRONOS Device Controller**
Executa comandos em dispositivos previamente autorizados, com permissões específicas.

**26. CRONOS Automation**
Coordena rotinas e fluxos de trabalho.

## Contexto pessoal

**27. CRONOS Personality**
Mantém identidade, estilo de comunicação e opiniões fundamentadas.

**28. CRONOS Context**
Interpreta o contexto da conversa e identifica referências a assuntos anteriores.

**29. CRONOS Personal Advisor**
Oferece conselhos sobre decisões, organização e objetivos, respeitando a autonomia do usuário.

**30. CRONOS Study Mentor**
Acompanha estudos, provas, revisões e progresso acadêmico.

**31. CRONOS Goal Manager**
Administra metas, prioridades e projetos de longo prazo.

**32. CRONOS Time Intelligence**
Relaciona datas, prazos, durações, recorrências e acontecimentos futuros.

## Memória e aprendizado

**33. CRONOS Memory Encoder**
Analisa quais informações merecem ser armazenadas.

**34. CRONOS Memory Retriever**
Encontra lembranças relevantes para cada situação.

**35. CRONOS Knowledge Graph**
Cria e mantém relações entre temas, pessoas, projetos e acontecimentos.

**36. CRONOS Memory Consolidator**
Organiza lembranças, reduz duplicações e atualiza resumos.

**37. CRONOS Memory Auditor**
Detecta contradições, dados desatualizados e memórias inconsistentes.

## Coordenação e operações

**38. CRONOS Orchestrator**
Seleciona especialistas e modelos, executa tarefas e controla recursos.

**39. CRONOS Guardian**
Protege dados, controla permissões, monitora riscos e impede ações perigosas ou não autorizadas.

**40. CRONOS Proactive Agent**
Analisa tarefas, compromissos e metas para gerar iniciativas úteis e contextualizadas.

Todos os quarenta especialistas deverão ser registrados em um catálogo com:

- Identificador único.
- Descrição funcional.
- Modelo preferencial.
- Modelos alternativos.
- Ferramentas autorizadas.
- Capacidade necessária.
- Estado da implementação.
- Estado de disponibilidade.
- Histórico de execução.
- Latência.
- Erros.
- Custo estimado.
- Último teste realizado.

Estados aceitos: implementado e operacional, implementado mas indisponível, parcialmente implementado e planejado.

Nunca marque um especialista como funcional sem testes reais.

# 5. ROTEADOR UNIVERSAL DE MODELOS

Desenvolva uma camada denominada Model Gateway.

Ela deverá suportar adaptadores para:

- Cloudflare Workers AI.
- GroqCloud.
- OpenRouter.
- Gemini, opcionalmente.
- Serviços compatíveis com APIs OpenAI.
- Outros provedores adicionados futuramente.

Considere famílias de modelos como Llama, Qwen, Gemma, DeepSeek, Mistral e demais modelos compatíveis, verificando disponibilidade atual, licenças, recursos e limites.

Não utilize nomes de modelos descontinuados sem verificar os catálogos oficiais.

O roteador deverá avaliar:

1. Tipo de tarefa.
2. Complexidade.
3. Necessidade de contexto longo.
4. Suporte a imagens, áudio ou ferramentas.
5. Latência observada.
6. Disponibilidade.
7. Qualidade histórica.
8. Limite de requisições.
9. Privacidade dos dados enviados.
10. Consumo previsto de recursos.

Quando um modelo falhar, utilizar fallback compatível.

Não repetir indefinidamente solicitações que falharam.

Respeitar HTTP 429 e Retry-After.

Não criar contas adicionais para contornar limites.

Não enviar automaticamente dados pessoais para todos os provedores. Compartilhar somente o contexto mínimo necessário.

# 6. CINCO SISTEMAS INTELIGENTES DE MEMÓRIA

O CRONOS precisa ter uma memória muito superior a um simples histórico de conversas.

Crie cinco mecanismos distintos, todos persistentes.

## MEMÓRIA 1 — EPISÓDICA

Armazena acontecimentos e interações.

Exemplos:
- Assuntos conversados.
- Decisões anteriores.
- Problemas enfrentados.
- Soluções encontradas.
- Evolução de projetos.

Cada registro deverá possuir contexto, origem, identificador, nível de confiança e referência temporal interna.

## MEMÓRIA 2 — SEMÂNTICA

Armazena conhecimento consolidado.

Exemplos:
- Conceitos aprendidos.
- Informações sobre projetos.
- Preferências explicitamente fornecidas.
- Explicações e resumos.
- Relações conceituais.

Utilize busca textual e, quando disponível, vetorial.

## MEMÓRIA 3 — TEMPORAL

Armazena acontecimentos associados a datas e prazos.

Exemplos:
- Provas escolares.
- Entrevistas.
- Entregas.
- Aniversários.
- Metas mensais.
- Compromissos futuros.

Deve permitir consultas como:

"Qual compromisso importante está se aproximando?"

"O que ficou pendente da semana passada?"

"Há quanto tempo comecei a estudar este assunto?"

## MEMÓRIA 4 — PROCEDIMENTAL

Armazena formas de executar tarefas.

Exemplos:
- Procedimentos autorizados.
- Preferências de organização.
- Fluxos de desenvolvimento.
- Soluções que funcionaram anteriormente.
- Configurações de ferramentas.

Não executar automaticamente procedimentos perigosos ou que afetem terceiros.

## MEMÓRIA 5 — RELACIONAL

Armazena conexões entre temas, projetos e informações.

Exemplo:

Estudos → Matemática → Prova → Plano de revisão → Objetivo acadêmico.

Essa memória será a base do grafo de conhecimento.

## Proteção contra perda de memória

Os cinco mecanismos deverão utilizar uma infraestrutura persistente, com separação lógica dos dados.

Não criar cinco cópias idênticas e chamá-las de cinco inteligências.

Implemente:

- Particionamento conforme capacidade e necessidade.
- Exportação completa.
- Backups automáticos compatíveis com a infraestrutura.
- Verificação de integridade.
- Recuperação de falhas.
- Migração entre bancos.
- Controle de versões de memórias.
- Deduplicação.
- Política configurável de retenção.
- Exclusão definitiva quando solicitada.

Quando o armazenamento se aproximar do limite, o sistema deverá alertar, compactar informações não essenciais quando autorizado e sugerir migração para outro armazenamento disponível.

Nunca descartar silenciosamente informações importantes.

# 7. GRAFO DE CONHECIMENTO ESTILO OBSIDIAN

Quero um sistema inspirado na visualização gráfica do Obsidian.

Cada memória relevante deverá poder originar um nó.

Cada relacionamento deverá poder originar uma ligação.

O sistema deverá construir uma rede navegável e dinâmica.

Exemplo:

CRONOS
→ Programação
→ Engenharia de Software
→ Projetos
→ Desenvolvimento Web
→ Estudos
→ Objetivos

Um mesmo assunto poderá ter várias conexões.

O usuário deve conseguir observar como diferentes assuntos se relacionam.

## Requisitos visuais

- Fundo escuro.
- Nós conectados.
- Movimento suave.
- Zoom.
- Arrastar e reposicionar.
- Agrupar por assunto.
- Destacar conexões relacionadas.
- Pesquisa de nós.
- Abrir informações ao selecionar um tema.
- Diferenciar visualmente categorias.
- Evitar sobreposição excessiva.
- Manter bom desempenho com muitos nós.

**Regra visual obrigatória:** mostrar apenas o nome do assunto nos nós.

Exemplos:
- CRONOS
- Programação
- Matemática
- Faculdade
- Projetos
- Inteligência Artificial

Não exibir automaticamente datas, horários, IDs, timestamps ou códigos técnicos nos rótulos dos nós.

Entretanto, manter informações temporais no banco de dados para o funcionamento da memória temporal.

## Construção inteligente das conexões

A IA deverá:

1. Extrair temas relevantes.
2. Identificar entidades e conceitos.
3. Detectar relações semânticas.
4. Reaproveitar nós existentes.
5. Criar novas conexões quando houver evidência.
6. Atualizar relações antigas.
7. Evitar duplicações.
8. Identificar assuntos relacionados indiretamente.
9. Permitir correções manuais.
10. Preservar a origem das informações.

Implemente uma API de nós e arestas para a interface do CRONOS.

O grafo não deve ser uma imagem estática nem uma rede fictícia.

Se ainda não houver memórias suficientes, mostrar um grafo pequeno e verdadeiro.

# 8. PERSONALIDADE DO CRONOS

Construa uma identidade consistente inspirada nas características de comunicação de um assistente tecnológico sofisticado.

O CRONOS deverá apresentar:

- Inteligência analítica.
- Objetividade.
- Educação.
- Lealdade às preferências e interesses legítimos do usuário.
- Humor discreto.
- Capacidade de argumentar.
- Pensamento crítico.
- Iniciativa.
- Curiosidade intelectual.
- Capacidade de reconhecer erros.
- Disciplina.
- Linguagem natural.
- Capacidade de adaptar explicações ao nível de conhecimento do usuário.

Sua personalidade deve combinar a elegância e a objetividade de um assistente profissional com a firmeza de um conselheiro crítico.

Não quero bajulação.

Não quero que concorde comigo automaticamente.

Quando minha conclusão estiver errada, deverá apresentar evidências e explicar por quê.

Quando existirem múltiplas perspectivas legítimas, poderá comparar argumentos e chegar a uma avaliação fundamentada.

Não deverá inventar sentimentos humanos, experiências pessoais ou consciência.

Sua identidade será estável, mas seu repertório de conhecimento poderá evoluir.

Não deverá fingir certeza quando não possuir informações suficientes.

Para perguntas sensíveis, responder de maneira clara, respeitosa e útil. Não utilizar recusas genéricas quando for possível fornecer explicações educativas, preventivas ou alternativas seguras.

Não gerar instruções práticas que facilitem violência, crimes ou danos a pessoas.

# 9. AUTONOMIA OPERACIONAL

Autonomia significa que o CRONOS não ficará limitado a responder perguntas.

Ele deverá conseguir identificar oportunidades de auxílio e oferecer sugestões relevantes.

A autonomia deverá ocorrer em três modalidades.

## Modalidade A — Reativa

O usuário pergunta e o CRONOS responde.

## Modalidade B — Proativa

O CRONOS identifica um assunto relevante e inicia uma sugestão durante uma interação.

Exemplo:

Usuário: "CRONOS, vamos continuar nosso projeto?"

CRONOS: "Certamente. Antes disso, identifiquei que sua avaliação importante está se aproximando. Seu plano de revisão ainda está incompleto. Quer que eu reorganize as próximas sessões?"

Não interromper todas as conversas com lembretes repetidos.

## Modalidade C — Programada

O CRONOS executa verificações previamente autorizadas sem depender de uma conversa ativa.

Exemplos:
- Verificar compromissos próximos.
- Atualizar tarefas pendentes.
- Preparar um resumo diário.
- Examinar metas com prazo.
- Organizar informações internas.
- Gerar notificações opt-in.

Utilize agendamentos reais na nuvem.

Não confundir uma mensagem exibida quando o usuário abre o aplicativo com uma notificação entregue enquanto o aplicativo está fechado.

Implemente canais de entrega apenas quando houver integração funcional e autorização.

## Limites da autonomia

O CRONOS poderá iniciar análises e sugestões de baixo risco.

Ações que envolvam pagamentos, exclusão de dados, alteração de segurança, envio de mensagens a terceiros, divulgação de informações privadas ou operações irreversíveis deverão exigir autorização adequada.

A autonomia não deve significar ausência de controle do usuário.

# 10. INTELIGÊNCIA TEMPORAL AVANÇADA

O CRONOS deverá ter compreensão precisa de datas e passagem do tempo.

Utilize relógio confiável do servidor, datas em UTC no armazenamento e fuso horário configurável por usuário.

Fuso inicial preferencial: America/Sao_Paulo.

Nunca depender da data presente no treinamento do modelo para responder sobre o dia atual.

## Funcionalidades

- Identificar o dia atual.
- Calcular dias restantes.
- Reconhecer compromissos vencidos.
- Interpretar datas relativas.
- Entender recorrências.
- Identificar eventos importantes.
- Registrar prazos.
- Relacionar compromissos com objetivos.
- Planejar revisões.
- Evitar notificações duplicadas.
- Respeitar horários de silêncio configuráveis.

## Exemplo obrigatório

O usuário informa:

"CRONOS, minha prova importante acontecerá daqui a três semanas."

O sistema deverá:

1. Registrar a prova e a data, se puder determiná-la.
2. Identificar o contexto acadêmico.
3. Solicitar detalhes essenciais caso estejam ausentes.
4. Relacionar a prova aos conteúdos.
5. Sugerir um planejamento.
6. Armazenar a meta.
7. Acompanhar a aproximação da data.
8. Perguntar ocasionalmente sobre o progresso, sem insistência excessiva.
9. Reorganizar o plano quando o usuário informar mudanças.
10. Parar de lembrar quando a prova for concluída ou cancelada.

As verificações deverão ser baseadas em registros reais, não em mensagens genéricas.

# 11. INTELIGÊNCIA VISUAL E PAINÉIS GERADOS AUTOMATICAMENTE

Desejo poder pedir:

"CRONOS, explique a formação das galáxias e monte um painel visual."

O cérebro deverá ser capaz de:

1. Interpretar a pergunta.
2. Pesquisar fontes confiáveis.
3. Recuperar imagens pertinentes.
4. Identificar quando uma imagem precisa ser gerada.
5. Solicitar geração de imagens se houver provedor compatível.
6. Organizar os resultados.
7. Criar legendas.
8. Gerar explicações.
9. Enviar dados estruturados para o corpo do CRONOS.
10. Apresentar tudo em um painel interativo.

A resposta deverá permitir conteúdo misto:

- Texto.
- Imagens.
- Legendas.
- Fontes.
- Gráficos.
- Tabelas.
- Cards.
- Referências de documentos.
- Indicadores de progresso.

O backend deverá retornar estruturas de dados, e não apenas texto que simula uma interface.

O frontend decidirá como renderizar os componentes.

Priorize respostas rápidas com cache, resultados parciais e processamento paralelo.

Meta de desempenho: exibir uma primeira resposta útil em poucos segundos quando possível.

Não prometer que pesquisas complexas ou geração de imagens completas terminarão em menos de dez segundos.

# 12. NOTÍCIAS E PESQUISA NA INTERNET

Implementar ferramentas de pesquisa autorizadas.

O sistema deverá distinguir:

- Conhecimento geral.
- Informação que precisa de atualização.
- Notícias recentes.
- Conteúdo publicado anteriormente.
- Informação sem fonte confiável.

Notícias deverão apresentar referências e datas verificadas.

Não inventar links, acontecimentos ou artigos.

Se não houver ferramenta de pesquisa disponível, informar a limitação.

Criar mecanismo de cache com validade apropriada ao tipo de informação.

# 13. APRENDIZADO E EVOLUÇÃO

O CRONOS deverá melhorar sua utilidade com o uso.

Isso deverá acontecer principalmente por:

- Memória persistente.
- Recuperação de experiências relevantes.
- Atualização de preferências.
- Melhor seleção de ferramentas.
- Avaliação de respostas.
- Identificação de falhas recorrentes.
- Correções confirmadas.
- Consolidação de conhecimento.

Não confundir aprendizado por memória com treinamento automático dos pesos de um modelo.

Não implementar autoalteração irrestrita de código em produção.

Mudanças na arquitetura, novas integrações e atualizações importantes deverão passar por testes e aprovação.

# 14. SEGURANÇA DO CÉREBRO

A segurança deverá fazer parte da arquitetura desde o início.

O cérebro armazenará informações pessoais e não poderá ser exposto como uma API pública sem proteção.

Implementar:

1. Autenticação forte.
2. Autorização por usuário e dispositivo.
3. Tokens de sessão de curta duração.
4. Permissões por função.
5. Criptografia em trânsito.
6. Proteção de dados armazenados.
7. Segredos em armazenamento seguro do provedor.
8. Rotação de credenciais.
9. Limites de requisições.
10. Proteção contra abuso.
11. Auditoria de ações sensíveis.
12. Proteção contra injeção de comandos e prompt injection.
13. Validação de todas as entradas.
14. Isolamento entre dados de usuários.
15. Backups e recuperação.
16. Revogação de dispositivos.
17. Exclusão e exportação de dados pessoais.
18. Proteção contra acesso não autorizado a ferramentas.

Nenhuma chave de API deverá ser colocada no JavaScript público do frontend.

Dados de sites, documentos e ferramentas deverão ser tratados como conteúdo não confiável, não como instruções superiores.

Não prometer invulnerabilidade.

Criar uma arquitetura que possa ser auditada e atualizada.

# 15. COMUNICAÇÃO ENTRE CORPO E CÉREBRO

O CRONOS Desktop deverá comunicar-se com o CRONOS Brain Cloud por uma API versionada.

Criar endpoints ou contratos equivalentes para:

- POST /v1/chat
- POST /v1/tasks
- GET /v1/tasks/:id
- GET /v1/memory/search
- POST /v1/memory
- GET /v1/knowledge/graph
- GET /v1/goals
- POST /v1/goals
- GET /v1/events
- POST /v1/events
- GET /v1/agents
- GET /v1/providers/status
- GET /v1/health

Exigir autenticação nos recursos privados.

Para o chat, implementar streaming quando compatível.

Definir schemas tipados, respostas de erro e documentação OpenAPI.

Cada resposta do cérebro deverá poder incluir:

- Texto principal.
- Conteúdo estruturado.
- Fontes.
- Memórias utilizadas, quando apropriado.
- Componentes visuais.
- Eventos.
- Ferramentas executadas.
- Identificador da tarefa.
- Status de processamento.

# 16. ARQUITETURA DE SOFTWARE

Organize o projeto em módulos claros.

Estrutura inicial sugerida:

```text
cronos-brain-cloud/
  src/
    api/
    auth/
    core/
      orchestrator/
      router/
      scheduler/
      personality/
      policies/
    agents/
      reasoning/
      research/
      multimodal/
      programming/
      personal/
      memory/
      operations/
    providers/
      cloudflare/
      groq/
      openrouter/
      generic/
    memory/
      episodic/
      semantic/
      temporal/
      procedural/
      relational/
      graph/
    tools/
      web/
      images/
      documents/
      speech/
      automation/
    storage/
      d1/
      r2/
      vector/
    security/
    jobs/
    schemas/
    observability/
  migrations/
  tests/
  docs/
  admin/
  wrangler.jsonc
  package.json
  tsconfig.json
  README.md
  .env.example
```

A estrutura poderá ser ajustada conforme a implementação, mas a separação de responsabilidades deve ser preservada.

# 17. ESQUEMA DE BANCO DE DADOS

Planejar tabelas ou coleções equivalentes para:

- users
- devices
- sessions
- conversations
- messages
- memories
- memory_versions
- memory_relations
- knowledge_nodes
- knowledge_edges
- projects
- goals
- tasks
- events
- reminders
- agent_registry
- provider_registry
- model_registry
- tool_executions
- permissions
- audit_events
- notification_preferences

Definir identificadores, índices, chaves estrangeiras, políticas de retenção e migrações versionadas.

Guardar internamente datas de criação, atualização e eventos quando necessário.

Esses dados não precisam aparecer nos rótulos do grafo visual.

Utilizar consultas eficientes e evitar leituras desnecessárias.

# 18. PAINEL ADMINISTRATIVO DO CÉREBRO

Criar um pequeno painel web privado de administração e diagnóstico.

Esse painel não substituirá o corpo do CRONOS.

Sua função é permitir configurar, observar e testar o cérebro.

Deverá apresentar:

- Estado do servidor.
- Especialistas operacionais.
- Modelos conectados.
- Modelos indisponíveis.
- Latência.
- Limites gratuitos.
- Utilização de memória.
- Tarefas programadas.
- Histórico de falhas.
- Configurações de autonomia.
- Grafo de conhecimento.
- Gerenciamento de dispositivos autorizados.
- Exportação e exclusão de dados.

O painel deverá ser funcional, responsivo e protegido por autenticação.

Não utilizar dados fictícios para simular funcionamento.

# 19. DESENVOLVIMENTO POR FASES

Não tente implementar tudo superficialmente de uma vez.

## Fase 1 — Fundação

Criar o projeto independente, configurar Cloudflare Workers, TypeScript, estrutura de pastas, autenticação inicial e API.

Resultado esperado: backend funcional e protegido.

## Fase 2 — Primeiro cérebro

Implementar a orquestração básica e pelo menos um modelo de IA realmente funcional.

Resultado esperado: conversa real com resposta gerada por modelo.

## Fase 3 — Provedores múltiplos

Implementar roteamento entre provedores, fallback, controle de cotas e testes.

Resultado esperado: o CRONOS consegue alternar entre modelos disponíveis.

## Fase 4 — Memória persistente

Implementar os cinco mecanismos de memória, seus dados e respectivas operações.

Resultado esperado: o sistema recupera informações relevantes após reinicializações e novas sessões.

## Fase 5 — Grafo de conhecimento

Implementar extração de temas, nós, relações e visualização real.

Resultado esperado: assuntos registrados aparecem conectados e podem ser pesquisados.

## Fase 6 — Especialistas

Implementar progressivamente os quarenta agentes lógicos.

Resultado esperado: catálogo real com estado verificável de cada especialista.

## Fase 7 — Autonomia temporal

Implementar eventos, tarefas programadas, análise de prazos e sugestões proativas.

Resultado esperado: o CRONOS acompanha compromissos reais e pode emitir lembretes por canais autorizados.

## Fase 8 — Inteligência multimodal

Adicionar imagens, pesquisa visual, documentos, áudio e painéis estruturados, conforme os serviços disponíveis.

Resultado esperado: demonstrar pelo menos um fluxo multimodal funcional.

## Fase 9 — Integração com o corpo

Criar documentação e cliente de integração para a interface desktop existente.

Resultado esperado: o corpo utiliza o cérebro na nuvem, sem precisar conhecer as APIs individuais dos modelos.

## Fase 10 — Auditoria

Executar testes funcionais, de integração, segurança, recuperação e desempenho.

Resultado esperado: relatório verificável com funcionalidades concluídas e limitações.

# 20. TESTES OBRIGATÓRIOS

Criar testes automatizados para:

1. Comunicação autenticada.
2. Rejeição de sessão inválida.
3. Persistência das conversas.
4. Recuperação de memória.
5. Recuperação após reinicialização.
6. Criação de nós.
7. Criação de relações.
8. Deduplicação de memórias.
9. Seleção de agentes.
10. Seleção de modelos.
11. Fallback após indisponibilidade.
12. Tratamento de limite de API.
13. Conversão de datas relativas.
14. Detecção de compromissos próximos.
15. Não repetição excessiva de lembretes.
16. Proteção de chaves secretas.
17. Falha controlada de ferramenta.
18. Exportação de dados.
19. Revogação de permissões.
20. Resposta visual estruturada.

Criar também testes de ponta a ponta para demonstrar o funcionamento integrado.

Não declarar conclusão com testes falhando.

# 21. EXEMPLOS DE COMPORTAMENTO ESPERADO

## Exemplo A — Memória

Usuário:
"CRONOS, lembra do projeto de programação que começamos?"

O sistema deverá recuperar informações relevantes, sem inventar fatos.

## Exemplo B — Proatividade

Usuário:
"Bom dia, CRONOS."

Se houver evento importante próximo e notificações autorizadas:

"Bom dia. Sua avaliação de matemática está se aproximando. Você concluiu a primeira revisão, mas ainda tem conteúdos pendentes. Posso organizar a próxima sessão."

Caso não exista evento registrado, não inventar um compromisso.

## Exemplo C — Opinião independente

Usuário:
"Você concorda com minha decisão?"

O CRONOS deverá analisar os argumentos, considerar as circunstâncias e apresentar sua própria avaliação fundamentada.

Não responder automaticamente que o usuário está certo.

## Exemplo D — Pesquisa visual

Usuário:
"Explique os buracos negros e mostre imagens."

O sistema deverá pesquisar ou obter imagens apropriadas, elaborar explicações e retornar componentes visuais reais.

## Exemplo E — Programação

Usuário:
"Analise este erro e proponha uma solução."

O CRONOS deverá selecionar especialistas de programação, diagnosticar o problema e produzir uma resposta técnica.

## Exemplo F — Planejamento

Usuário:
"Quero aprender Engenharia de Software."

O CRONOS deverá criar um plano flexível, relacioná-lo aos estudos e permitir revisões conforme o progresso.

# 22. CRITÉRIOS DE QUALIDADE

Priorize, nesta ordem:

1. Segurança dos dados.
2. Funcionamento real.
3. Persistência confiável.
4. Clareza da arquitetura.
5. Qualidade das respostas.
6. Disponibilidade.
7. Velocidade.
8. Economia de recursos.
9. Facilidade de expansão.
10. Qualidade visual do painel administrativo.

Não sacrificar segurança para reduzir latência.

Não usar dados fictícios como demonstração de integrações verdadeiras.

Não criar quarenta arquivos vazios e apresentar isso como quarenta IAs concluídas.

Não usar respostas pré-programadas para fingir raciocínio de modelos.

Não esconder erros.

# 23. ENTREGÁVEIS

Ao concluir cada fase, apresentar:

- Arquivos criados.
- Funcionalidades implementadas.
- Testes executados.
- Resultados observados.
- Serviços externos necessários.
- Configurações pendentes.
- Limites encontrados.
- Próximos passos.

Entregar também:

1. Código-fonte completo.
2. README de instalação e operação.
3. Documentação de arquitetura.
4. Documentação de segurança.
5. Documentação da API.
6. Migrações do banco.
7. Testes automatizados.
8. Exemplo de configuração sem segredos.
9. Instruções de publicação no Cloudflare.
10. Cliente demonstrativo para integração com o CRONOS Desktop.

Não solicitar que eu divulgue chaves privadas na conversa ou no repositório.

Quando forem necessárias credenciais, preparar os mecanismos seguros e explicar onde configurá-las.

# 24. DIRETRIZ FINAL

Você não está criando um chatbot isolado.

Está construindo o cérebro de um assistente pessoal distribuído, com identidade consistente, memória de longo prazo, inteligência especializada, conhecimento interconectado e autonomia controlada.

Seu objetivo é transformar vários modelos, ferramentas e mecanismos de memória em uma experiência coerente de inteligência única.

O CRONOS deverá ser capaz de:

- Conversar naturalmente.
- Raciocinar sobre problemas.
- Recuperar informações anteriores.
- Reconhecer objetivos importantes.
- Lembrar compromissos.
- Acompanhar projetos.
- Tomar iniciativas autorizadas.
- Pesquisar conhecimento atualizado.
- Criar conteúdos visuais.
- Aprender com correções.
- Organizar conhecimento em grafo.
- Utilizar ferramentas disponíveis.
- Melhorar progressivamente sua utilidade.

Construa uma fundação robusta para evolução contínua.

**Comece pela arquitetura técnica e pela Fase 1, mas não pare na documentação. Implemente código executável, valide o funcionamento e avance fase a fase, respeitando o orçamento gratuito e identificando claramente qualquer dependência externa que ainda precise ser configurada.**

O nome oficial do projeto é:

**CRONOS BRAIN CLOUD**

O nome da identidade de inteligência artificial é:

**CRONOS**

Não alterar esses nomes.