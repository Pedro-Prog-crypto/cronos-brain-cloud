# Segurança e limites

Credenciais de dispositivos e sessões são aleatórias, com 256 bits. Apenas SHA-256 é armazenado em D1. Sessões expiram em 15 minutos; revogação do dispositivo invalida todas imediatamente. Owner pode cadastrar dispositivos e conceder owner/reader somente em sua conta. Reader lê dados, mas não recebe diagnóstico administrativo, exportação nem escrita; logout é permitido para ambas as funções.

Credenciais de provedor ficam em secrets do Worker ou `.dev.vars` ignorado. Chave de dispositivo é exibida uma única vez na criação. O painel guarda token só na memória e descarta respostas de requisições de uma sessão anterior. CSP restringe scripts à própria origem; o conteúdo de terceiros é texto, sem execução HTML. O shell de login não contém dados privados.

A API exige TLS fora de loopback, SQL parametrizado, schemas estritos e limite de corpo de 32 KiB (restauração: 2 MB). Não habilita CORS aberto nem autenticação por cookies. Respostas privadas usam no-store. Limites de login e requisições persistem em D1. Cada consulta de dados privados inclui o usuário da sessão; importações nunca podem referenciar IDs de outra conta.

Nenhuma ferramenta executa comandos, pagamentos ou mensagens externas. Prompt injection pode influenciar texto gerado: marcação de contexto não é uma defesa absoluta. O limite de autorização está na API, fora do modelo. Pesquisa usa destino fixo; endpoints genéricos de inferência só podem ser definidos pelo operador, exigem HTTPS e não seguem redirects.

Atualizações de memória têm controle otimista de versão e histórico transacional. Backup inclui checksum contra corrupção, não assinatura de confiança; importações passam por validação adicional e remapeamento completo de referências. Dados importados continuam não confiáveis. Rotação de dispositivo: criar nova credencial, transferi-la por canal seguro, revogar a antiga. O painel permite isso.

Não há criptografia de aplicação/ponta a ponta dos dados em D1 ou arquivos locais. Verificar proteção em repouso do serviço escolhido e proteger o disco local. R2 fica desativado por padrão. Exclusão de usuário remove dados em cascata e backups R2 registrados; arquivos baixados pelo usuário ou snapshots externos do provedor exigem política própria de expurgo. Ativar R2 implica revisar retenção e políticas do serviço.

Limitações explícitas: MFA/Cloudflare Access e defesa de borda ainda dependem de configuração; quotas de chamadas não substituem quotas de tokens e preços do provedor; exportação pequena não substitui estratégia de recuperação de grandes bancos; não há auditoria externa ou teste de carga de produção. Não declarar invulnerabilidade nem implantar dados sensíveis em produção antes dessas verificações.
