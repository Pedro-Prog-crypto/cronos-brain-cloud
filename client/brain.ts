export class BrainClient {
  constructor(private baseUrl: string, private sessionToken: string) {
    const u = new URL(baseUrl);
    if (u.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(u.hostname)) throw new Error('HTTPS obrigatório');
  }
  static async connect(baseUrl: string, deviceId: string, credential: string): Promise<BrainClient> {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('HTTPS obrigatório');
    const response = await fetch(new URL('/v1/auth/sessions',url),{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId,credential})});
    if (!response.ok) throw new Error(`Conexão CRONOS HTTP ${response.status}`);
    const data = await response.json() as {accessToken:string};
    return new BrainClient(baseUrl,data.accessToken);
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
  heartbeat(client = 'CRONOS Desktop') { return this.request('/v1/devices/heartbeat','POST',{client}); }
}
