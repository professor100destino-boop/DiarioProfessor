(()=>{
'use strict';
if(!window.db||!window.alunosDoVinculo)return;
const $$=s=>[...document.querySelectorAll(s)];
const baseId=a=>window.professorControlBaseIdAluno(a);
const baseLabel=bid=>{const b=db.turmasBase.find(x=>x.id===bid);return b?`${b.serie||''} ${b.turma||''}${b.turno?' • '+b.turno:''}`.trim():''};
const escolaBase=bid=>{const b=db.turmasBase.find(x=>x.id===bid);return db.escolas.find(e=>e.id===b?.escolaId)?.nome||''};
function csv(name,rows){if(!rows.length){if(typeof toast==='function')toast('Sem dados para exportar');return}const keys=Object.keys(rows[0]),val=v=>'"'+String(v??'').replaceAll('"','""')+'"',text='\ufeff'+[keys.join(';'),...rows.map(r=>keys.map(k=>val(r[k])).join(';'))].join('\n'),blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},2000)}
function alunosReport(){return db.alunos.map(a=>({Escola:escolaBase(baseId(a)),Turma:baseLabel(baseId(a)),Numero:a.numero||'',Nome:a.nome||'',Matricula:a.matricula||'',Status:a.ativo===false?(a.motivoInativo||'Inativo'):'Ativo'})).sort((a,b)=>a.Escola.localeCompare(b.Escola,'pt-BR')||a.Turma.localeCompare(b.Turma,'pt-BR')||a.Nome.localeCompare(b.Nome,'pt-BR'))}
function freqReport(){return (db.frequencias||[]).map(f=>{const a=db.alunos.find(x=>x.id===f.alunoId),t=db.turmas.find(x=>x.id===f.turmaId),e=db.escolas.find(x=>x.id===t?.escolaId);return{Data:f.data||'',Aula:f.aulaDia?`${f.aulaDia}ª`:'',Escola:e?.nome||'',Turma:t?`${t.serie||''} ${t.turma||''}`:'',Disciplina:t?.disciplina||'',Aluno:a?.nome||'',Status:f.status||''}})}
function notasReport(){const rows=[];for(const t of db.turmas.filter(x=>x.ativo!==false)){for(const a of window.alunosDoVinculo(t.id)){const c=typeof calcAluno==='function'?calcAluno(a.id,t.id,'3º Bimestre'):{atividadeMedia:null,media:null};rows.push({Escola:db.escolas.find(e=>e.id===t.escolaId)?.nome||'',Turma:`${t.serie||''} ${t.turma||''}`,Disciplina:t.disciplina||'',Aluno:a.nome||'','Média Atividades':c.atividadeMedia===null?'':c.atividadeMedia.toFixed(2),'Média Final':c.media===null?'':c.media.toFixed(2)})}}return rows}
function bind(){$$('[data-report]').forEach(b=>b.onclick=()=>{const t=b.dataset.report;if(t==='alunos')csv('alunos.csv',alunosReport());else if(t==='frequencia')csv('frequencia.csv',freqReport());else if(t==='notas')csv('notas.csv',notasReport())})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();