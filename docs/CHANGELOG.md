# Histórico de mudanças

## 0.2.1 — 1 de novembro de 2026

- Busca de memória indexada com FTS5, ranking por relevância, acentos opcionais e prefixos. A migração 0003 indexa dados existentes e mantém o índice por triggers.
- Datas relativas reconhecem hoje, amanhã, depois de amanhã e números por extenso de um a dez. Expressões ambíguas pedem esclarecimento em vez de escolher silenciosamente.
- Desativar notificações de um evento remove o aviso já criado e impede sua recuperação na conversa.
- O scheduler deixa de gastar seus lotes com eventos já notificados e avança por vencimento.
- Testes de API: 34 aprovados. Painel validado novamente em desktop e celular.
- Nenhuma integração paga foi ativada. IA externa e os demais itens pendentes seguem descritos em STATUS.md.
