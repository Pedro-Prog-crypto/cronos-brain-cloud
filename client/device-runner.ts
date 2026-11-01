import {BrainClient} from './brain';
export interface Command {id:string;action:'show_notification'|'open_panel'|'report_status';payload:string;expires_at:string}
/** The desktop supplies narrow callbacks. This client never executes shell commands. */
export async function pollDeviceCommands(client:BrainClient,handlers:Record<Command['action'],(payload:string)=>Promise<string>>,completed:Set<string>){
 const {commands}=await client.request('/v1/commands') as {commands:Command[]};
 for(const command of commands){
  if(Date.parse(command.expires_at)<=Date.now())continue;
  if(completed.has(command.id)){await client.request(`/v1/commands/${command.id}/result`,'POST',{status:'succeeded',result:'Already handled by this device'});continue;}
  let status:'succeeded'|'failed'='succeeded',result='';
  try{const handler=handlers[command.action];if(!handler)throw Error('Unsupported action');result=(await handler(command.payload)).slice(0,2000);completed.add(command.id);}catch{status='failed';result='Device handler failed';}
  await client.request(`/v1/commands/${command.id}/result`,'POST',{status,result});
 }
}
