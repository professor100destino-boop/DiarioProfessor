(()=>{
'use strict';
if(!window.db)return;
const $=s=>document.querySelector(s);
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const uid=()=>window.professorControlUid?.()||crypto?.randomUUID?.()||('id_'+Date.now()+'_'+Math.random().toString(36).slice(2));
const persist=()=>{if(window.professorControlPersist)window.professorControlPersist();else localStorage.setItem(typeof KEY!=='undefined'?KEY:'professorControlV1',JSON.stringify(db));};
const parseNota=v=>{
  const s=String(v??'').trim();
  if(!s||/^---+$/.test(s))return null;
  if(/^dez$/i.test(s))return 10;
  const n=Number(s.replace(',','.'));
  return Number.isFinite(n)?n:null;
};
async function loadPdf(){
  const pdfjsLib=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
  return pdfjsLib;
}
function clusterRows(items){
  const groups=[];
  [...items].sort((a,b)=>b.y-a.y||a.x-b.x).forEach(it=>{
    let g=groups.find(r=>Math.abs(r.y-it.y)<=2.2);
    if(!g){g={y:it.y,items:[]};groups.push(g)}
    g.items.push(it);
  });
  return groups.sort((a,b)=>b.y-a.y).map(g=>g.items.sort((a,b)=>a.x-b.x));
}
async function extractSaec(file){
  const pdfjsLib=await loadPdf();
  const data=new Uint8Array(await file.arrayBuffer());
  const pdf=await pdfjsLib.getDocument({data}).promise;
  const alunos=[];let meta='';
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p),content=await page.getTextContent(),w=page.view[2];
    const items=content.items.filter(i=>String(i.str||'').trim()).map(i=>({text:String(i.str).replace(/\s+/g,' ').trim(),x:Number(i.transform[4]),y:Number(i.transform[5])}));
    meta+=' '+items.map(i=>i.text).join(' ');
    for(const row of clusterRows(items)){
      const n=row.find(i=>i.x<w*.075&&/^\d{1,3}$/.test(i.text));
      const cod=row.find(i=>i.x>=w*.075&&i.x<w*.16&&/^\d{2,8}$/.test(i.text));
      if(!n||!cod)continue;
      const nome=row.filter(i=>i.x>=w*.13&&i.x<w*.47&&/[A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ]/i.test(i.text)).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();
      if(!nome||/^(Nº|Código|Aluno)/i.test(nome))continue;
      const vals=row.filter(i=>i.x>=w*.47).map(i=>i.text);
      if(vals.length<4)continue;
      alunos.push({
        numero:n.text,codigo:cod.text,matricula:cod.text,nome,
        media1:parseNota(vals[0]),falta1:parseNota(vals[1]),
        media2:parseNota(vals[2]),falta2:parseNota(vals[3]),
        media3:parseNota(vals[4]),falta3:parseNota(vals[5]),
        media4:parseNota(vals[6]),falta4:parseNota(vals[7])
      });
    }
  }
  const clean=meta.replace(/\s+/g,' ').trim();
  const isSaec=/Rela[cç][aã]o de Notas Por Disciplina|SAE\+C|ESCOLA MUNDO INFANTIL/i.test(clean);
  if(!isSaec)return null;
  const escola=(clean.match(/(ESCOLA\s+[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ .'-]+?\s+LTDA)/i)||[])[1]||'';
  const disc=(clean.match(/Disciplina:\s*([A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ ]+?)(?=\s+N[º°.]|\s+Curso:|$)/i)||[])[1]||((clean.match(/Rela[cç][aã]o de Notas Por Disciplina\s*-\s*[^-]+\s*-\s*([A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ ]+)/i)||[])[1]||'');
  const turno=(clean.match(/Turno:\s*([A-Za-zÁÀÃÂÉÊÍÓÔÕÚÇ]+)/i)||[])[1]||'';
  const ano=(clean.match(/Ano:\s*(20\d{2})/i)||[])[1]||'';
  const bimestre=(clean.match(/Bimestre:\s*([1-4])/i)||[])[1]||'';
  const byCode=new Map();
  alunos.forEach(a=>{const old=byCode.get(a.codigo);if(!old||a.nome.length>old.nome.length)byCode.set(a.codigo,a)});
  return{formato:'SAE+C',escolaNome:escola.trim(),disciplina:disc.trim(),turno:turno.trim(),ano,bimestre,alunos:[...byCode.values()].sort((a,b)=>Number(a.numero)-Number(b.numero))};
}
function importSaec(parsed,tid){
  const t=db.turmas.find(x=>x.id===tid),base=window.turmaBaseDoVinculo?.(tid),bid=base?.id||t?.turmaBaseId||'';
  db.mediasBimestrais=db.mediasBimestrais&&typeof db.mediasBimestrais==='object'?db.mediasBimestrais:{};
  db.mediasBimestraisPorVinculo=db.mediasBimestraisPorVinculo&&typeof db.mediasBimestraisPorVinculo==='object'?db.mediasBimestraisPorVinculo:{};
  db.faltasBimestraisPorVinculo=db.faltasBimestraisPorVinculo&&typeof db.faltasBimestraisPorVinculo==='object'?db.faltasBimestraisPorVinculo:{};
  db.matriculas=Array.isArray(db.matriculas)?db.matriculas:[];
  let novos=0,atualizados=0,medias=0;
  for(const r of parsed.alunos){
    let a=db.alunos.find(x=>(window.professorControlBaseIdAluno?.(x)||x.turmaBaseId||'')===bid&&String(x.matricula||'')===String(r.codigo||''));
    if(!a)a=db.alunos.find(x=>(window.professorControlBaseIdAluno?.(x)||x.turmaBaseId||'')===bid&&norm(x.nome)===norm(r.nome));
    if(!a){a={id:uid(),turmaBaseId:bid,turmaId:tid,numero:r.numero||'',nome:r.nome.trim(),matricula:r.codigo||'',codigoEscola:r.codigo||'',ativo:true};db.alunos.push(a);novos++}
    else{if(r.numero)a.numero=r.numero;if(r.codigo){a.matricula=a.matricula||r.codigo;a.codigoEscola=r.codigo}if(r.nome&&r.nome.length>String(a.nome||'').length)a.nome=r.nome.trim();atualizados++}
    if(bid&&!db.matriculas.some(m=>m.alunoId===a.id&&m.turmaBaseId===bid&&m.status==='ativa'))db.matriculas.push({id:uid(),alunoId:a.id,turmaBaseId:bid,dataInicio:new Date().toISOString().slice(0,10),dataFim:'',status:'ativa',motivo:''});
    db.mediasBimestrais[a.id]??={};db.mediasBimestraisPorVinculo[a.id]??={};db.mediasBimestraisPorVinculo[a.id][tid]??={};db.faltasBimestraisPorVinculo[a.id]??={};db.faltasBimestraisPorVinculo[a.id][tid]??={};
    for(let b=1;b<=4;b++){
      const v=r['media'+b],f=r['falta'+b],key=`${b}º Bimestre`;
      if(Number.isFinite(v)){db.mediasBimestraisPorVinculo[a.id][tid][key]=v;if(db.mediasBimestrais[a.id][key]===undefined)db.mediasBimestrais[a.id][key]=v;medias++}
      if(Number.isFinite(f))db.faltasBimestraisPorVinculo[a.id][tid][key]=f;
    }
  }
  persist();window.professorControlNormalizeStudents?.();persist();if(typeof renderAll==='function')renderAll();
  return{novos,atualizados,medias};
}
async function handleSaec(e,original){
  const input=e.currentTarget||e.target,f=input.files?.[0];
  if(!f||!f.name.toLowerCase().endsWith('.pdf'))return original?.call(input,e);
  let parsed;
  try{parsed=await extractSaec(f)}catch(err){console.error('SAE+C:',err);return original?.call(input,e)}
  if(!parsed)return original?.call(input,e);
  const eid=$('#alunosEscola')?.value,tid=$('#alunosTurma')?.value,t=db.turmas.find(x=>x.id===tid),esc=db.escolas.find(x=>x.id===eid);
  if(!eid){alert('Selecione primeiro a escola de destino.');input.value='';return}
  if(!tid){alert('Selecione a turma de destino.');input.value='';return}
  if(!t||t.escolaId!==eid){alert('A turma selecionada não pertence à escola escolhida.');input.value='';return}
  if(!parsed.alunos.length){alert('Reconheci o formato SAE+C, mas não consegui localizar os alunos no relatório.');input.value='';return}
  const aviso=[`Formato reconhecido: SAE+C / escola particular`,`Alunos encontrados: ${parsed.alunos.length}`,parsed.escolaNome?`Escola no arquivo: ${parsed.escolaNome}`:'',parsed.disciplina?`Disciplina no arquivo: ${parsed.disciplina}`:'',parsed.turno?`Turno: ${parsed.turno}`:'',`Destino: ${esc?.nome||''} → ${t?.serie||''} ${t?.turma||''}`,``,`O código do aluno será usado como identificação única nesta escola.`,`Serão importadas também as notas bimestrais disponíveis.`,``,`Deseja continuar?`].filter(Boolean).join('\n');
  if(!confirm(aviso)){input.value='';return}
  const r=importSaec(parsed,tid);
  alert(`Importação SAE+C concluída.\n\nNovos alunos: ${r.novos}\nAlunos já existentes atualizados: ${r.atualizados}\nNotas bimestrais gravadas: ${r.medias}`);
  input.value='';
}
function addHint(){
  const input=$('#importFile');if(!input||document.getElementById('pcImportFormats'))return;
  const d=document.createElement('div');d.id='pcImportFormats';d.style.cssText='margin:10px 0 4px;padding:12px 14px;border-radius:12px;background:#eef6ff;color:#184b87;font-weight:700';d.innerHTML='📥 Importação compatível com <b>SIGE/SEDUC-GO</b> e <b>SAE+C / Escola Mundo Infantil</b>. O sistema identifica o formato automaticamente.';input.insertAdjacentElement('afterend',d);
}
function install(){
  const input=$('#importFile');if(!input||input.dataset.saecPatched==='1')return;
  const original=input.onchange;input.dataset.saecPatched='1';input.onchange=e=>handleSaec(e,original);addHint();
}
window.extractSaecNotas=extractSaec;
window.importSaecStudents=importSaec;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
