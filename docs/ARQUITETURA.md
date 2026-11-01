> Evolução v0.3.0: consulte CAPACIDADES.md para mídia, vetores e ações. As limitações de integrações descritas abaixo refletem a fundação v0.2.1 quando indicado.

# Arquitetura

## Entrada e identidade

Worker TypeScript recebe HTTPS, valida schemas/tamanho, autentica sessão opaca e extrai usuário/dispositivo/função do banco. IDs de usuário fornecidos pelo cliente nunca selecionam o proprietário dos dados. D1 contém dados estruturados; interfaces `MemoryStore` e `InferenceProvider` separam persistência e inferência de suas implementações. R2 é opcional para backups; Vectorize permanece ausente; embeddings via provedor configurável ficam em tabela D1 e são opcionais.

O painel é uma aplicação estática servida pelo mesmo Worker em `/admin`. O shell de login é público; todos os dados vêm da API autenticada. Tokens ficam apenas na memória da página. Não há chave de provedor no JavaScript. Conteúdo do usuário é renderizado com textContent; não se utiliza innerHTML para memória, documentos ou respostas.

## Conversa

Intenção textual seleciona um especialista em pedidos comuns. `complex:true` executa até duas análises paralelas, uma crítica e uma síntese; portanto até quatro gerações, cada uma com no máximo dois candidatos. Falha da revisão retorna a análise bem-sucedida com aviso explícito. A resposta ao usuário mantém identidade CRONOS.

O contexto inclui até dez mensagens truncadas e seis memórias recuperadas por termos. A recuperação usa índice FTS5, normalização de acentos e ranking BM25; ainda é lexical, não embeddings. O índice acompanha criação, edição, exclusão e restauração via triggers. O prompt declara relógio UTC, fuso e indisponibilidade de ferramentas de ação. Especialistas não recebem permissão para executar comandos. Memórias e documentos são dados não confiáveis.

Gateway requer configuração explícita recente (até 30 dias), cota gratuita verificada pelo operador, credencial e consentimento para contexto pessoal. Reserva solicitações atomicamente em D1. Timeout por tentativa: 12 segundos. 429 grava cooldown persistente, inclusive na mudança de dia. Não segue redirecionamentos. O cache de respostas é privado por usuário/contexto/configuração/tempo, tem validade de até 60 segundos e é invalidado pela edição de memória. SSE entrega progresso e resultado final, sem fingir transmissão token a token.

## Memória e conhecimento

Cinco tipos têm metadados distintos. SHA-256 de representação canônica auxilia deduplicação. Atualizações exigem versão esperada; um trigger guarda snapshot da versão anterior na mesma transação SQL. Mudança de temas refaz ligações daquela memória. Memórias semânticas criam nós a partir dos temas declarados; memórias relacionais criam relações explícitas. Isso preserva proveniência e evita inferências inventadas. Extração de entidades por modelo ainda não existe.

Consultas e referências de grafo são restritas ao proprietário. Canvas mostra apenas nomes dos assuntos, com cor por categoria, busca, seleção, zoom e arraste. A API limita cada resposta a 500 nós e 1000 arestas e remove arestas cujos nós não estão no recorte.

## Tempo e autonomia

Datas ficam em UTC; preferências validam o fuso IANA. Expressões relativas suportam dias/semanas, hoje, amanhã e depois de amanhã, com precisão de dia e confirmação explícita do horário. O planejamento de prova cria meta, evento e três tarefas genéricas de preparação; não inventa conteúdos escolares nem progresso.

Scheduler consulta até 200 eventos ainda sem lembrete por execução, ordenados pelo vencimento, cria lembretes internos opt-in para próximos três dias e respeita silêncio. A chamada manual fica restrita aos dados do usuário. O handler de Cron é global, mas nenhum gatilho de produção foi publicado. Recorrências de 1–366 dias criam a próxima ocorrência ao concluir a atual, com ID determinístico contra duplicação. São intervalos UTC; não representam recorrências de calendário com ajuste automático de horário de verão.

Proatividade exige preferência explícita e lembrete real ainda não visto. Retenção opt-in apaga somente episódios antigos. Metas, tarefas e memória semântica não são descartadas por essa política.

## Ferramentas e recuperação

Ferramentas disponíveis: análise estrutural de TXT/Markdown, resumo opcional via modelo, dados estruturados de gráfico e inspeção de cabeçalho/dimensões PNG. Inspeção PNG não interpreta a cena nem valida integralmente o arquivo. Wikipedia usa origem fixa e permanece desativada; ela não é um serviço de notícias verificadas.

Backup JSON v2 inclui dados de domínio, documentos, versões, relações, perfil e histórico de operação. SHA-256 detecta corrupção, não autentica a origem do arquivo. A importação valida estrutura/referências, exige conta sem dados, remapeia IDs e grava em transação. Dispositivos e sessões nunca são importados. Proatividade, retenção destrutiva e uploads automáticos exigem consentimento renovado após restauração. Limites: 1000 registros totais e 1,5 MB; excedentes exigem backup de banco por ferramenta do provedor.

R2 automático só funciona com binding, flag administrativa e opt-in do usuário; grava uma cópia diária por conta, até 20 contas por execução. Testado no emulador. Exclusão da conta remove os objetos registrados antes de excluir o usuário. Exportações baixadas pelo usuário ficam sob seu controle.
