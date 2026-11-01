# Histórico de mudanças

## 0.4.1 — 1 de novembro de 2026

- Permissões existentes são carregadas ao selecionar um dispositivo antes de salvar mudanças.
- Tela de proteção mostra e permite configurar a entrega de lembretes quando o servidor tem assinatura configurada.
- 61 operações documentadas; testes locais e navegador revalidados.


## 0.4.0 — 1 de novembro de 2026

- Painel espacial azul/violeta com as 12 páginas da imagem, navegação lateral, ilustrações vetoriais e atlas interativo.
- Especialistas com busca, categorias, detalhes e execução; memória com edição inline e histórico; calendário, pesquisa, estúdio e integração.
- Personalidade persistida em memória versionada, aplicada ao chat e aos especialistas textuais; cache considera o estilo.
- Composição em Markdown, visualização legível dos resultados, seleção/arraste de arquivo e prévia local de imagem.
- 44 testes aprovados; as 12 páginas verificadas no navegador em desktop/celular. Recursos ainda não integrados aparecem desabilitados ou a configurar.
- GET/PUT /v1/personality; 60 operações documentadas.


## 0.3.0 — 1 de novembro de 2026

- Conectores de visão, geração de imagem, transcrição, voz, análise de áudio por transcrição e vídeo por quadros.
- PDF local, notícias RSS/Atom com datas e imagens Commons com créditos.
- Embeddings persistentes, busca semântica e fallback lexical no chat.
- Despacho dos 40 especialistas para caminhos de execução compatíveis.
- Permissões por ação, fila de dispositivos, expiração e confirmação de resultados.
- Webhooks opt-in assinados, Retry-After, silêncio e deduplicação por destinatário; lembretes já vistos não são reenviados.
- Sondagem de provedor, painel multimodal e contrato de 58 operações.
- Node.js 24+; migrações até 0006; testes externos usam transportes simulados, sem alegar conexão real.


## 0.2.1 — 1 de novembro de 2026

- Busca de memória indexada com FTS5, ranking por relevância, acentos opcionais e prefixos. A migração 0003 indexa dados existentes e mantém o índice por triggers.
- Datas relativas reconhecem hoje, amanhã, depois de amanhã e números por extenso de um a dez. Expressões ambíguas pedem esclarecimento em vez de escolher silenciosamente.
- Desativar notificações de um evento remove o aviso já criado e impede sua recuperação na conversa.
- O scheduler deixa de gastar seus lotes com eventos já notificados e avança por vencimento.
- Testes de API: 34 aprovados. Painel validado novamente em desktop e celular.
- Nenhuma integração paga foi ativada. IA externa e os demais itens pendentes seguem descritos em STATUS.md.
