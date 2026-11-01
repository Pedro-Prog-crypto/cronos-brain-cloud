# Configuração e publicação

Não foi feita publicação. O ID D1 de zeros em `wrangler.jsonc` é deliberadamente local. Nenhum domínio público está habilitado. A hospedagem permanente depende de uma conta Cloudflare configurada e validada.

1. Conferir planos e cotas atuais nas fontes oficiais: https://developers.cloudflare.com/workers/platform/pricing/ , https://developers.cloudflare.com/d1/platform/pricing/ , https://developers.cloudflare.com/workers-ai/platform/pricing/ , https://console.groq.com/docs/rate-limits e https://openrouter.ai/docs/faq . Não ativar faturamento para esta etapa.
2. Nas configurações seguras do ambiente, adicionar somente os segredos necessários: `CLOUDFLARE_API_TOKEN` para operação de infraestrutura; `GROQ_API_KEY` ou `OPENROUTER_API_KEY` se esse provedor for escolhido. Não enviar valores no chat. Definir `CLOUDFLARE_ACCOUNT_ID` como variável de configuração. Preferir token restrito à conta e recursos do Brain.
3. Solicitar adição dos domínios necessários à rede, preservando a lista existente: `api.cloudflare.com`, `developers.cloudflare.com` e, conforme escolha, `api.groq.com`, `console.groq.com` ou `openrouter.ai`. A rede deste ambiente ainda não os autoriza. Publicação pode requerer outros domínios indicados por erros concretos do CLI.
4. Criar D1 no plano gratuito e colocar seu UUID real em `wrangler.jsonc`. Aplicar migrações remotas somente ao banco do Brain: `npx wrangler d1 migrations apply DB --remote`.
5. Provisionar usuário/dispositivo pelo canal administrativo seguro. O gerador local é um exemplo; não reutilizar credenciais de teste em produção.
6. Configurar secrets com `npx wrangler secret put GROQ_API_KEY` (ou outro escolhido). Para Workers AI, adicionar binding `AI` apenas depois da verificação da cota; o binding não está ativo na configuração inicial.
7. Configurar `PROVIDERS_JSON` como lista de objetos descritos abaixo. Usar identificador de modelo realmente existente no catálogo oficial. Não reutilizar nomes de fixtures dos testes.
8. Testar uma inferência real, expiração, revogação, isolamento e restauração. Só então habilitar domínio TLS e publicar com `npx wrangler deploy` após revisão. O deploy não faz parte dos scripts automáticos de instalação.

Cada objeto de provedor exige `id` (`groq`, `openrouter`, `generic`, `cloudflare`), `model`, `enabled`, `freeTierVerified`, `verifiedAt` em ISO UTC, `dailyRequestLimit` (1–1000), `allowPersonalContext`. `generic` também exige endpoint HTTPS confiável. A configuração expira após 30 dias para forçar revalidação do plano/modelo. Apenas campos administrativos escolhem endpoints: não aceitar destinos fornecidos pelo chat. O status `configured` indica configuração, nunca teste ao vivo ou garantia de cota gratuita.

O gateway usa um teto conservador de solicitações e máximo de 1024 tokens de saída. Cotas de tokens/neuron e preços específicos ainda precisam de adaptadores por provedor. Por isso mantenha contas sem cobrança habilitada. Se não for possível garantir orçamento zero no serviço escolhido, mantenha-o desativado.

Para agendamento futuro, após validar consentimento e limites, adicionar `triggers.crons` em Wrangler. O handler existe, mas nenhum Cron Trigger foi ativado. O código de backup R2 automático existe e foi testado no emulador. Para ativar, verificar disponibilidade sem cobrança, adicionar binding `BACKUPS`, definir `BACKUPS_ENABLED="true"` e obter opt-in no painel. Vectorize permanece pendente. Não presumir disponibilidade gratuita.

Backup manual de desenvolvimento: `npx wrangler d1 export DB --local --output /caminho/seguro/brain.sql`. Restauração de dumps SQL exige banco de destino separado e migrações compatíveis. A restauração JSON pela API já foi validada localmente: use o backup v2 e uma conta vazia. Recuperação remota por dump SQL ainda não foi validada. Nunca guardar backups pessoais no repositório.


Pesquisa opcional: o conector usa exclusivamente `pt.wikipedia.org`, com `WEB_ENABLED="true"`. Ele está desativado e a rede atual não permite esse domínio. Adicionar o domínio pelo fluxo de configuração e testar antes de ativar. Não habilita notícias, busca de imagens ou acesso arbitrário a URLs.

O painel `/admin` é servido junto com o Worker; em produção, usar domínio HTTPS e preferencialmente proteção adicional Cloudflare Access. O shell de login é público, os recursos privados exigem sessão. Não expor `wrangler dev` na Internet: ele é um servidor de desenvolvimento e pode incluir ferramentas locais de inspeção.
