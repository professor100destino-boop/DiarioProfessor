(()=>{
'use strict';
if(!window.db)return;
const K=typeof KEY!=='undefined'?KEY:'professorControlV1',BK='professorControlPreAcademicV2';
const uid=()=>crypto?.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const persist=()=>localStorage.setItem(K,JSON.stringify(db));
const today=()=>new Date().toISOString().slice(0,10);
const pkey=t=>[t.escolaId||'',norm(t.serie),norm(t.turma),norm(t.turno)].join('|');
function ensure(){
 ['turmas','alunos','escolas','disciplinas','professores','turmasBase','vinculosEnsino','matriculas','transferencias'].forEach(k=>db[k]=Array.isArray(db[k])?db[k]:[]);
 db.notas=db.notas&&typeof db.notas==='object'?db.notas:{};
 db.mediasBimestrais=db.mediasBimestrais&&typeof db.mediasBimestrais==='object'?db.mediasBimestrais:{};
 db.mediasBimestraisPorVinculo=db.mediasBimestraisPorVinculo&&typeof db.mediasBimestraisPorVinculo==='object'?db.mediasBimestraisPorVinculo:{};
}
function disc(nome){
 const n=String(nome||'').trim()||'Sem disciplina';
 let d=db.disciplinas.find(x=>norm(x.nome)===norm(n));
 if(!d){d={id:uid(),nome:n,ativo:true};db.disciplinas.push(d)}
 return d;
}
function professorPadrao(){
 let p=db.professores.find(x=>x.ativo!==false);
 if(!p){p={id:uid(),nome:String(db.config?.profNome||'Professor').trim()||'Professor',ativo:true,disciplinaIds:[]};db.professores.push(p)}
 return p;
}
function baseDoVinculo(tid){const t=db.turmas.find(x=>x.id===tid);return db.turmasBase.find(b=>b.id===t?.turmaBaseId)||null}
function baseIdAluno(a){if(a?.turmaBaseId)return a.turmaBaseId;return db.turmas.find(t=>t.id===a?.turmaId)?.turmaBaseId||''}
function roster(tid,includeInactive=false){const bid=baseDoVinculo(tid)?.id;if(!bid)return[];return db.alunos.filter(a=>baseIdAluno(a)===bid&&(includeInactive||a.ativo!==false))}
window.alunosDoVinculo=roster;
window.turmaBaseDoVinculo=baseDoVinculo;
window.professorControlBaseIdAluno=baseIdAluno;
window.professorControlNorm=norm;
window.professorControlUid=uid;
window.professorControlPersist=persist;
window.professorControlToday=today;
function normalizeStudents(){
 const map=new Map(),idmap=new Map(),out=[];
 for(const a0 of db.alunos){
  const bid=baseIdAluno(a0)||db.turmas.find(t=>t.id===a0.turmaId)?.turmaBaseId||'';
  const ident=String(a0.matricula||'').trim()?`m:${String(a0.matricula).trim()}`:`n:${norm(a0.nome)}`;
  const key=bid+'|'+ident;
  let a=map.get(key);
  if(!a){a={...a0,turmaBaseId:bid,ativo:a0.ativo!==false,motivoInativo:a0.motivoInativo||'',dataInativacao:a0.dataInativacao||''};map.set(key,a);out.push(a)}
  else{
   if(!a.matricula&&a0.matricula)a.matricula=a0.matricula;
   if(!a.numero&&a0.numero)a.numero=a0.numero;
   if((a0.nome||'').length>(a.nome||'').length)a.nome=a0.nome;
   if(a0.ativo!==false)a.ativo=true;
  }
  idmap.set(a0.id,a.id);
  if(db.notas[a0.id]){db.notas[a.id]??={};Object.entries(db.notas[a0.id]).forEach(([k,v])=>{if(db.notas[a.id][k]===undefined)db.notas[a.id][k]=v})}
  if(db.mediasBimestrais[a0.id]){
   db.mediasBimestraisPorVinculo[a.id]??={};
   db.mediasBimestraisPorVinculo[a.id][a0.turmaId||'legado']={...(db.mediasBimestraisPorVinculo[a.id][a0.turmaId||'legado']||{}),...db.mediasBimestrais[a0.id]};
   db.mediasBimestrais[a.id]??={};
   Object.entries(db.mediasBimestrais[a0.id]).forEach(([k,v])=>{if(db.mediasBimestrais[a.id][k]===undefined)db.mediasBimestrais[a.id][k]=v});
  }
 }
 db.alunos=out;
 Object.keys(db.notas).forEach(k=>{const n=idmap.get(k);if(n&&n!==k)delete db.notas[k]});
 Object.keys(db.mediasBimestrais).forEach(k=>{const n=idmap.get(k);if(n&&n!==k)delete db.mediasBimestrais[k]});
 db.frequencias=(db.frequencias||[]).map(f=>({...f,alunoId:idmap.get(f.alunoId)||f.alunoId}));
 db.advertencias=(db.advertencias||[]).map(r=>({...r,alunoId:idmap.get(r.alunoId)||r.alunoId}));
 for(const a of db.alunos){
  const bid=baseIdAluno(a);if(!bid)continue;
  const active=db.matriculas.some(m=>m.alunoId===a.id&&m.status==='ativa');
  const sameBase=db.matriculas.some(m=>m.alunoId===a.id&&m.turmaBaseId===bid);
  if(a.ativo!==false){
   if(!active)db.matriculas.push({id:uid(),alunoId:a.id,turmaBaseId:bid,dataInicio:today(),dataFim:'',status:'ativa',motivo:''});
  }else if(!sameBase){
   db.matriculas.push({id:uid(),alunoId:a.id,turmaBaseId:bid,dataInicio:today(),dataFim:today(),status:'inativa',motivo:a.motivoInativo||''});
  }
 }
 persist();
}
window.professorControlNormalizeStudents=normalizeStudents;
function migrate(){
 ensure();
 if(Number(db.academicModelVersion||0)>=2){normalizeStudents();return}
 try{if(!localStorage.getItem(BK))localStorage.setItem(BK,JSON.stringify(db))}catch(e){console.warn(e)}
 const p=professorPadrao(),bases=new Map();db.turmasBase.forEach(b=>bases.set(pkey(b),b));
 db.turmas.forEach(t=>{
  let b=bases.get(pkey(t));
  if(!b){b={id:uid(),escolaId:t.escolaId||'',serie:t.serie||'',turma:t.turma||'',turno:t.turno||'',ativo:true};db.turmasBase.push(b);bases.set(pkey(t),b)}
  const d=disc(t.disciplina);
  t.turmaBaseId=b.id;t.disciplinaId=t.disciplinaId||d.id;t.professorId=t.professorId||p.id;t.ativo=t.ativo!==false;t.disciplina=d.nome;
  if(!p.disciplinaIds.includes(d.id))p.disciplinaIds.push(d.id);
  if(!db.vinculosEnsino.some(v=>v.id===t.id))db.vinculosEnsino.push({id:t.id,turmaBaseId:b.id,disciplinaId:d.id,professorId:t.professorId,ativo:t.ativo});
 });
 db.academicModelVersion=2;db.academicMigratedAt=new Date().toISOString();
 normalizeStudents();
}
migrate();
})();