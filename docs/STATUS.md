# Resultado por fase — versão 0.2.0

O desenvolvimento avançou pelas partes locais das dez fases. **A especificação completa ainda não está concluída.** As dependências externas estão desativadas; funções ausentes não foram apresentadas como operacionais. Nenhum arquivo do Cronos Desktop foi alterado.

| Fase | Implementado e verificado nesta entrega | Ainda necessário |
|---|---|---|
| 1 — Fundação | Worker/TypeScript, D1, schemas, sessões, funções, limites, revogação, painel privado | Conta e publicação Cloudflare; MFA/Access e proteção de borda |
| 2 — Primeiro cérebro | Orquestração e histórico persistente; HTTP de modelo testado por interceptação | Conectar modelo real, validar respostas ao vivo, catálogo e cota gratuita |
| 3 — Provedores | Quatro adaptadores; no máximo dois candidatos, timeout de 12 s, Retry-After persistente, teto diário, consentimento de contexto, cache privado | Validação real de cada provedor, seleção por qualidade/latência, contexto longo e capacidades multimodais; orçamento específico de tokens/neuron |
| 4 — Memória | Cinco schemas, busca por termos, deduplicação, versões por trigger, edição otimista, propostas de revisão/consolidação via modelo, retenção opt-in de episódios, exportação e restauração transacional testada, backup R2 automático diário testado em emulador | Embeddings/busca vetorial, particionamento e migração entre motores, criptografia de aplicação, backups remotos reais e política de retenção desses backups |
| 5 — Grafo | Criação automática a partir de temas/relações explícitos da memória, referências de origem, correção por API, visualização canvas real, zoom, arraste, busca e lista acessível | Extração semântica de entidades por modelo, expansão além dos limites de 500 nós/1000 arestas, agrupamento físico avançado |
| 6 — Especialistas | 40 definições com instruções distintas, capacidades e condições de ativação; roteamento textual; execução direta de especialistas textuais e parte dos locais; análise paralela/crítica/síntese; histórico de execuções | Não há 40 especialistas plenamente operacionais: 9 capacidades externas permanecem planejadas; especialistas textuais aguardam inferência real; endpoints específicos atendem documentos, memória, grafo e composição visual |
| 7 — Autonomia | Agenda, tarefas, metas, planejamento relativo, opt-in, silêncio por fuso, deduplicação, confirmação, recorrência ao concluir e sugestões na conversa; handler de agendamento | Cron Trigger publicado, notificações externas autorizadas, extração de compromissos do chat, semântica temporal abrangente e revisão automática de progresso |
| 8 — Multimodal | Fluxo real de documento de texto → análise estrutural; dados → componente gráfico renderizado; PNG → dimensões; pesquisa Wikipedia implementada e desativada | Pesquisa validada na rede, notícias, PDFs, busca/criação de imagens, compreensão visual por IA, voz, áudio e vídeo; sem alegar análise semântica de PNG |
| 9 — Integração | Cliente TypeScript e contrato OpenAPI versionado; corpo não precisa conhecer provedor | Conectar o Desktop permanece adiado conforme instrução expressa de manter separado |
| 10 — Auditoria | TypeScript/build; 28 testes aprovados; teste real de navegador desktop/celular; recuperação, autorização e falhas verificadas | Auditoria independente, carga e segurança em produção, testes ao vivo de modelos e serviços externos |

O painel oferece telas de visão geral, conversa, memórias, grafo, agenda/metas, ferramentas, especialistas e configurações. Não contém métricas ou respostas fictícias de provedores.

## Evidências

`npm run check`: 28 testes passando, zero falhas. `CHROMIUM_PATH=/usr/bin/chromium npm run test:ui`: login, memória, grafo, composição de gráfico, 40 entradas do catálogo, responsividade e logout aprovados, sem exceções JavaScript. Migrações 0001 e 0002 aplicadas ao banco local. Detalhes em [AUDITORIA.md](AUDITORIA.md).

## Dependências que impedem a validação final

O ambiente inspecionado não possui credenciais de Cloudflare, Groq ou OpenRouter. A rede é restrita e não autoriza seus endpoints nem Wikipedia. Não é possível verificar inferência real, condições comerciais atuais ou hospedagem permanente sem essas configurações. Nenhum modelo foi escolhido por suposição; nenhuma integração externa está marcada como validada. Veja [PUBLICACAO.md](PUBLICACAO.md).

Além das credenciais, os itens marcados acima como implementação pendente ainda exigem desenvolvimento. Configurar uma chave não conclui automaticamente a especificação inteira.
