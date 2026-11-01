export class BrainClient {
  constructor(private baseUrl: string, private sessionToken: string) {
    const u = new URL(baseUrl);
    if (u.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(u.hostname)) throw new Error('HTTPS obrigatório');
  }
  async request(path: string, method = 'GET', payload?: unknown): Promise<unknown> {
    if (!path.startsWith('/v1/')) throw new Error('Caminho inválido');
    const response = await fetch(new URL(path,this.baseUrl),{method,redirect:'error',headers:{Authorization:`Bearer ${this.sessionToken}`,...(payload ? {'Content-Type':'application/json'} : {})},body:payload ? JSON.stringify(payload) : undefined});
    const data = await response.json();
    if (!response.ok) throw new Error(`Brain HTTP ${response.status}`);
    return data;
  }
  chat(message: string, conversationId?: string) { return this.request('/v1/chat','POST',{message,conversationId}); }
  graph() { return this.request('/v1/knowledge/graph'); }
}
