# Capacidades adicionadas na v0.3.0

## Estado verificável

Foram implementados conectores, schemas, controles de acesso e testes para visão, geração de imagens, transcrição, síntese de voz, análise de áudio por transcrição, análise de vídeo por quadros, notícias RSS/Atom, imagens do Wikimedia Commons, embeddings e notificações webhook. PDF é extraído localmente pelo unpdf; não depende de IA externa.

Os testes externos usam interceptação HTTP ou funções de transporte simuladas. **Não equivalem a validação com um provedor real.** Nenhuma conta de inferência ou nuvem está conectada nesta entrega. O painel pode testar uma conexão real de texto em `POST /v1/providers/probe` depois da configuração. Seu resultado fica vinculado à configuração testada.

## Inferência multimodal

`CAPABILITIES_JSON` é uma lista administrativa de objetos, com campos obrigatórios:

- `id`: identificador único, letras minúsculas, números e hífen;
- `kind`: `vision`, `transcription`, `speech`, `image-generation` ou `embedding`;
- `baseUrl`: HTTPS de um serviço com contrato compatível com OpenAI, incluindo prefixo, como `/v1`; não pode conter usuário/senha, query ou fragmento;
- `model`: nome confirmado no catálogo do serviço;
- `enabled`, `freeTierVerified`, `allowPersonalContext`: booleanos explícitos;
- `verifiedAt`: data ISO de verificação de plano/modelo, válida por 30 dias;
- `dailyRequestLimit`: 1–500.

Credencial: `CAPABILITY_API_KEY`, somente em secrets do Worker ou `.dev.vars` local privado. Este adaptador usa uma credencial compartilhada para os destinos explicitamente configurados pelo operador: não misturar serviços que exijam chaves distintas. Não aceitar baseUrl vinda do usuário final. Todos os serviços devem permanecer desativados se não for possível comprovar orçamento zero.

Contratos: `/chat/completions` com imagens, `/audio/transcriptions` multipart, `/audio/speech`, `/images/generations` com `b64_json`, `/embeddings`. São contratos de compatibilidade, não garantias de suporte de qualquer provedor. Até dois candidatos por capacidade, timeout de 20 s por tentativa, quota diária atômica e Retry-After. Respostas são limitadas a 8 MB. Falhas não retornam payload ou segredo do provedor.

Ferramentas em `/v1/tools/execute`:

| Ferramenta | Entrada principal | Resultado |
|---|---|---|
| vision.analyze | question, image:{mime,base64} | Análise de imagem por modelo |
| video.analyze | question, frames:[{atSeconds,image}] | Análise de até oito quadros; nunca afirma analisar o vídeo inteiro |
| speech.transcribe | audio base64, mime | Transcrição |
| speech.synthesize | text, voice | Áudio MP3 em base64 |
| audio.analyze | audio base64, mime | Transcrição seguida de análise textual; não detecta sons não verbais |
| image.generate | prompt | PNG/JPEG gerado pelo provedor |
| document.pdf | name, base64 | Texto e número de páginas, sem OCR |
| memory.vector.index | memoryId | Indexação de uma memória autorizada |
| memory.vector.search | query | Até seis correspondências por similaridade de cosseno |
| news.search | query | Artigos recentes com data declarada pela fonte e URL |
| images.search | query | Imagens com autoria, licença e referência |

Corpo máximo de ferramentas: 2 MB. Imagem/áudio/PDF até cerca de 1 MB. PDF até 40 páginas e 24 mil caracteres; documentos digitalizados sem texto retornam `pdf_requires_ocr`. O teste de PDF simples passou com aviso de fonte padrão do PDF.js; documentos com fontes não incorporadas/CJK precisam de validação adicional. PDFs são processados no event loop: limites de arquivo/página/imagem reduzem risco, mas isolamento dedicado para documentos hostis ainda é recomendado em produção.

O painel permite arquivos de imagem/áudio/PDF e extrai até seis quadros do vídeo local antes do envio. Não há captura contínua de câmera ou microfone. Voz usa identificador explicitamente compatível com o provedor escolhido.

## Memória vetorial

Vetores reais vêm do provedor de embeddings; não são gerados por heurística fingindo semântica. A tabela D1 guarda modelo/configuração, dimensão, versão da memória e valores. Alterações de memória invalidam o vetor por trigger. Busca limita o conjunto a 1000 registros por modelo/usuário; acima disso requer migração do armazenamento. Com vetores disponíveis e capacidade configurada, o chat combina busca semântica e lexical, com fallback local.

O índice vetorial é derivado: não entra no backup JSON v2. Após restaurar memórias, reindexar explicitamente. Ainda não há adaptador Vectorize nem particionamento automático.

## Pesquisa

`WEB_ENABLED=true` habilita conectores externos. Wikimedia Commons usa domínio fixo `commons.wikimedia.org` e preserva créditos/licenças. Wikipedia continua separada.

`RESEARCH_FEEDS_JSON`: até três objetos `{url,articleHosts}`. Somente feeds HTTPS selecionados pelo operador, sem redirects. As URLs dos artigos devem pertencer aos hosts permitidos. Itens sem data válida ou fora da janela de 30 dias são descartados; o resultado declara que o conteúdo não foi verificado independentemente. RSS/Atom com DOCTYPE/entidades é rejeitado. Cache privado por usuário de cinco minutos. Datas de publicação são evidência da fonte, não comprovação de veracidade da notícia.

## Notificações externas

`NOTIFICATION_ALLOWED_HOSTS_JSON` limita destinos HTTPS aprovados pelo operador. `NOTIFICATION_SIGNING_KEY` precisa ser um segredo real no Worker; não usar placeholder de proxy como chave HMAC local. Cada usuário habilita sua assinatura com `PUT /v1/notifications/subscription`, `{url,enabled}`. O destino precisa existir e ser configurado por você; não há serviço de mensagens implícito.

Cron consulta lembretes reais e opt-in, respeita silêncio e envia webhook assinado em HMAC-SHA256 pelo cabeçalho `X-Cronos-Signature`, sobre o corpo bruto. `Idempotency-Key` contém o ID do lembrete. O receptor deve deduplicar esse ID: entrega é pelo menos uma vez, não garantia de exatamente uma vez. Até três tentativas, Retry-After e lease de concorrência. Sem chave/assinatura ativa, nenhum envio ocorre. O código foi testado somente com transporte simulado.

## Dispositivos e especialistas

Owner concede somente `show_notification`, `open_panel` e `report_status` a dispositivos próprios por `/v1/devices/{id}/permissions`. Criar comando exige `{deviceId,action,payload,confirm:true}`. Comandos expiram em cinco minutos. O dispositivo autenticado consulta apenas sua fila e devolve resultado; permissões são rechecadas. Não existe execução de shell.

`client/device-runner.ts` fornece polling e callbacks para um cliente autorizado. O aplicativo hospedeiro deve persistir a deduplicação para sobreviver a reinicializações. A integração com o Cronos Desktop continua separada conforme solicitado.

Os 40 especialistas têm caminho de execução: texto, ferramenta especializada, memória, agenda, políticas, controle autorizado ou orquestração. Isso ainda não demonstra qualidade cognitiva dos 40 especialistas: depende de inferência e avaliação reais. `/v1/agents/{id}/run` aceita `message` e, conforme a função, `toolInput`, `memory` ou `command`. A lista de ferramentas permitidas é verificada no servidor.
