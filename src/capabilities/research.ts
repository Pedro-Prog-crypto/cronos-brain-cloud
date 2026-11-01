import {z} from 'zod';
import {XMLParser} from 'fast-xml-parser';
import {ApiError,type Env,type Principal} from '../types';
import {limitedBytes} from './gateway';
import {hash} from '../auth/auth';
export const researchInput=z.discriminatedUnion('tool',[
 z.object({tool:z.literal('news.search'),query:z.string().min(2).max(200)}).strict(),
 z.object({tool:z.literal('images.search'),query:z.string().min(2).max(200)}).strict(),
]);
const https=z.url().refine(v=>new URL(v).protocol==='https:'&&!new URL(v).username&&!new URL(v).password);
const feedsSchema=z.array(z.object({url:https,articleHosts:z.array(z.string().regex(/^[a-z0-9.-]+$/)).min(1).max(10)}).strict()).min(1).max(3);
const clean=(v:unknown)=>typeof v==='string'?v.replace(/<[^>]*>/g,'').slice(0,2000):'';
export function parseNews(xml:string,articleHosts:string[],now=new Date()){
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new ApiError(502,'unsupported_feed_entities');
 const parsed=new XMLParser({ignoreAttributes:false,processEntities:false,parseTagValue:false}).parse(xml);
 const raw=parsed.rss?.channel?.item??parsed.feed?.entry??[];const entries=Array.isArray(raw)?raw:[raw];
 return entries.flatMap((r:any)=>{
  const candidates=Array.isArray(r.link)?r.link:[r.link];
  const link=candidates.find((v:any)=>typeof v==='string'||v?.['@_rel']==='alternate')??candidates[0];
  const url=typeof link==='string'?link:link?.['@_href'];
  const date=Date.parse(r.pubDate??r.published??r.updated??'');
  try{if(!url||!articleHosts.includes(new URL(url).hostname)||new URL(url).protocol!=='https:'||!Number.isFinite(date)||date>now.getTime()+300000||date<now.getTime()-30*86400000)return [];}catch{return [];}
  const title=clean(r.title);if(!title)return [];
  return [{title,url,publishedAt:new Date(date).toISOString(),excerpt:clean(r.description??r.summary),retrievedAt:now.toISOString(),verification:'source-publication-date; claims-not-independently-verified'}];
 }).slice(0,30);
}
export async function executeResearch(env:Env,p:Principal,input:z.infer<typeof researchInput>){
 if(env.WEB_ENABLED!=='true')throw new ApiError(503,'web_search_not_configured');
 const key='research:'+await hash(JSON.stringify([p.userId,input,env.RESEARCH_FEEDS_JSON]));
 const cached=await env.DB.prepare('SELECT value FROM response_cache WHERE key=? AND user_id=? AND expires_at>?').bind(key,p.userId,Date.now()).first<{value:string}>();if(cached)return {...JSON.parse(cached.value),cached:true};
 let result:unknown;
 if(input.tool==='news.search'){
  let feeds:z.infer<typeof feedsSchema>;try{feeds=feedsSchema.parse(JSON.parse(env.RESEARCH_FEEDS_JSON??'[]'));}catch{throw new ApiError(503,'news_feeds_not_configured');}
  const responses=await Promise.allSettled(feeds.map(async f=>{const r=await fetch(f.url,{redirect:'manual',signal:AbortSignal.timeout(8000)});if(!r.ok)throw new ApiError(502,'feed_unavailable');return parseNews(new TextDecoder().decode(await limitedBytes(r,1_000_000)),f.articleHosts);}));
  if(responses.every(r=>r.status==='rejected'))throw new ApiError(503,'all_feeds_unavailable');
  const terms=input.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const sources=responses.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(r=>terms.some(t=>(r.title+' '+r.excerpt).toLowerCase().includes(t)));
  result={type:'sources',kind:'news',sources:[...new Map(sources.map(s=>[s.url,s])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,10),failedSources:responses.filter(r=>r.status==='rejected').length,claimsVerified:false};
 }else{
  const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',generator:'search',gsrsearch:input.query,gsrnamespace:'6',gsrlimit:'6',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'640'}).toString();
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000)});if(!r.ok)throw new ApiError(503,'image_search_unavailable');
  const data=JSON.parse(new TextDecoder().decode(await limitedBytes(r,1_000_000)));
  const sources=Object.values(data.query?.pages??{}).flatMap((page:any)=>{
   const info=page.imageinfo?.[0],meta=info?.extmetadata;
   if(!info||!meta?.LicenseShortName?.value)return [];
   try{if(new URL(info.thumburl??info.url).hostname!=='upload.wikimedia.org'||new URL(info.descriptionurl).hostname!=='commons.wikimedia.org')return [];}catch{return [];}
   return [{title:clean(page.title),imageUrl:info.thumburl??info.url,sourceUrl:info.descriptionurl,author:clean(meta.Artist?.value),license:clean(meta.LicenseShortName.value),attribution:clean(meta.Attribution?.value),retrievedAt:new Date().toISOString()}];
  });result={type:'image-sources',sources};
 }
 await env.DB.prepare('INSERT OR REPLACE INTO response_cache VALUES (?,?,?,?)').bind(key,p.userId,JSON.stringify(result),Date.now()+300000).run();return result;
}
