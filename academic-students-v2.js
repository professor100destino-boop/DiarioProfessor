(()=>{
'use strict';
if(!window.db||!window.alunosDoVinculo)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=window.professorControlUid,persist=window.professorControlPersist,norm=window.professorControlNorm,baseIdAluno=window.professorControlBaseIdAluno,today=window.professorControlToday;
const eh=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blabel=b=>b?`${b.serie||''} ${b.turma||''}${b.turno?' • '+b.turno:''}`.trim():'';
function uniqueBaseOptions(escolaId,selectedTid=''){
 const arr=db.turmas.filter(t=>t.ativo!==false&&t.escolaId===escolaId),seen=new Set(),out=[];
 for(const t of arr){if(!t.turmaBaseId||seen.has(t.turmaBaseId))continue;seen.add(t.turmaBaseId);out.push(t)}
 return out.map(t=>`<option value="${t.id}" ${t.id===selectedTid?'selected':''}>${eh(`${t.serie||''} ${t.turma||''}${t.turno?' • '+t.turno:''}`)}</option>`).join('');
}
function syncAlunoSel(){
 const e=$('#alunosEscola'),t=$('#alunosTurma');if(!e||!t)return;
 const oldE=e.value,oldT=t.value;e.innerHTML=db.escolas.map(x=>`<option value="${x.id}">${eh(x.nome)}</option>`).join('');if(db.escolas.some(x=>x.id===oldE))e.value=oldE;
 t.innerHTML=uniqueBaseOptions(e.value,oldT);
}
function renderHistory(list){
 const h=$('#historicoBimestres');if(!h)return;const rows=[];
 for(const a of list){
  const por=db.mediasBimestraisPorVinculo[a.id]||{};
  for(const [vid,m] of Object.entries(por)){const v=db.turmas.find(t=>t.id===vid);if(m&&(m['1º Bimestre']!==undefined||m['2º Bimestre']!==undefined))rows.push({a,v,m})}
  if(!Object.keys(por).length&&db.mediasBimestrais[a.id])rows.push({a,v:null,m:db.mediasBimestrais[a.id]});
 }
 h.innerHTML=rows.length?`<table><thead><tr><th>Aluno</th><th>Disciplina</th><th>1º Bimestre</th><th>2º Bimestre</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${eh(r.a.nome)}</b></td><td>${eh(r.v?.disciplina||'Histórico importado')}</td><td>${r.m['1º Bimestre']===undefined?'—':Number(r.m['1º Bimestre']).toFixed(1)}</td><td>${r.m['2º Bimestre']===undefined?'—':Number(r.m['2º Bimestre']).toFixed(1)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Nenhuma média anterior importada para esta turma.</p>';
}
function renderStudents(){
 syncAlunoSel();const tid=$('#alunosTurma')?.value,bid=window.turmaBaseDoVinculo(tid)?.id;
 const list=db.alunos.filter(a=>baseIdAluno(a)===bid).sort((a,b)=>(Number(a.numero)||999)-(Number(b.numero)||999)||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
 const box=$('#alunosList');if(box)box.innerHTML=list.length?`<table><thead><tr><th>Nº</th><th>Aluno</th><th>Matrícula</th><th>Status</th><th></th></tr></thead><tbody>${list.map(a=>`<tr><td>${eh(a.numero||'')}</td><td><b>${eh(a.nome)}</b></td><td>${eh(a.matricula||'')}</td><td>${a.ativo===false?`<span class="badge bad">${eh(a.motivoInativo||'Inativo')}</span>`:'<span class="badge ok">Ativo</span>'}</td><td><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn-transfer-academic" onclick="transferirAlunoAcademico('${a.id}')">Transferir</button><button class="primary ghost" onclick="historicoAlunoAcademico('${a.id}')">Histórico</button></div></td></tr>`).join('')}</tbody></table>`:'<p class="muted">Nenhum aluno nesta turma.</p>';
 renderHistory(list);
}
window.renderAlunos=renderStudents;
function copyEquivalentGrades(aid,orig,dest){
 const notes=db.notas[aid]||{};let count=0;db.mediasBimestraisPorVinculo[aid]??={};
 const src=db.turmas.filter(t=>t.turmaBaseId===orig),dst=db.turmas.filter(t=>t.turmaBaseId===dest&&t.ativo!==false);
 for(const st of src){
  for(const dt of dst.filter(x=>x.disciplinaId===st.disciplinaId)){
   const sm=db.mediasBimestraisPorVinculo[aid]?.[st.id];if(sm&&!db.mediasBimestraisPorVinculo[aid][dt.id])db.mediasBimestraisPorVinculo[aid][dt.id]={...sm};
   const sa=(db.avaliacoes||[]).filter(x=>x.turmaId===st.id),da=(db.avaliacoes||[]).filter(x=>x.turmaId===dt.id);
   for(const av of sa){
    if(notes[av.id]===undefined||notes[av.id]==='')continue;
    const eq=da.find(x=>x.tipo===av.tipo&&x.bimestre===av.bimestre&&norm(x.nome)===norm(av.nome)&&Number(x.valor||10)===Number(av.valor||10));
    if(eq&&notes[eq.id]===undefined){notes[eq.id]=notes[av.id];count++}
   }
  }
 }
 db.notas[aid]=notes;return count;
}
function rerenderAllStudentViews(){renderStudents();if(window.renderFreq)renderFreq();if(window.renderAtividades)renderAtividades();if(window.renderNotas)renderNotas();}
function transfer(aid){
 const a=db.alunos.find(x=>x.id===aid);if(!a)return;const orig=baseIdAluno(a),origBase=db.turmasBase.find(b=>b.id===orig);
 modal('Transferir aluno',`<div class="transfer-academic-box"><b>${eh(a.nome)}</b><br>Turma atual: ${eh(blabel(origBase))}</div><label>Escola de destino<select id="transEscolaAcademic">${db.escolas.map(e=>`<option value="${e.id}">${eh(e.nome)}</option>`).join('')}</select></label><label>Turma de destino<select id="transTurmaAcademic"></select></label><label>Novo número da chamada<input id="transNumeroAcademic" type="number" value="${eh(a.numero||'')}"></label><label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input id="transNotasAcademic" type="checkbox" checked> Copiar notas para avaliações equivalentes na nova turma</label><div class="notice"><b>Histórico preservado:</b> as notas, chamadas, advertências e médias anteriores não serão apagadas.</div>`,()=>{
  const destTid=$('#transTurmaAcademic').value,dest=window.turmaBaseDoVinculo(destTid)?.id;if(!dest||dest===orig){alert('Escolha uma turma de destino diferente.');return false}
  const snapshot={notas:JSON.parse(JSON.stringify(db.notas[aid]||{})),medias:JSON.parse(JSON.stringify(db.mediasBimestraisPorVinculo[aid]||{}))};
  const copied=$('#transNotasAcademic').checked?copyEquivalentGrades(aid,orig,dest):0;
  const mat=db.matriculas.find(m=>m.alunoId===aid&&m.status==='ativa');if(mat){mat.status='transferida';mat.dataFim=today();mat.motivo='Mudança de turma'}
  db.matriculas.push({id:uid(),alunoId:aid,turmaBaseId:dest,dataInicio:today(),dataFim:'',status:'ativa',motivo:'Mudança de turma'});
  db.transferencias.push({id:uid(),alunoId:aid,origemTurmaBaseId:orig,destinoTurmaBaseId:dest,data:today(),criadoEm:new Date().toISOString(),notasCopiadas:copied,notasSnapshot:snapshot.notas,mediasSnapshot:snapshot.medias});
  a.turmaBaseId=dest;a.turmaId=destTid;a.numero=$('#transNumeroAcademic').value||a.numero;a.ativo=true;a.motivoInativo='';a.dataInativacao='';persist();rerenderAllStudentViews();alert(`Aluno transferido com sucesso.\nTodos os dados e notas anteriores foram preservados.\nNotas copiadas para avaliações equivalentes: ${copied}.`);return true;
 });
 const fill=()=>{$('#transTurmaAcademic').innerHTML=uniqueBaseOptions($('#transEscolaAcademic').value)};$('#transEscolaAcademic').onchange=fill;
 const origemEscola=origBase?.escolaId;if(origemEscola&&db.escolas.some(e=>e.id===origemEscola))$('#transEscolaAcademic').value=origemEscola;fill();
}
window.transferirAlunoAcademico=transfer;
window.historicoAlunoAcademico=aid=>{
 const a=db.alunos.find(x=>x.id===aid);if(!a)return;const ms=db.matriculas.filter(m=>m.alunoId===aid).sort((x,y)=>String(y.dataInicio).localeCompare(String(x.dataInicio))),ts=db.transferencias.filter(t=>t.alunoId===aid).sort((x,y)=>String(y.data).localeCompare(String(x.data)));
 const body=`<div class="transfer-academic-box"><b>${eh(a.nome)}</b><br>Matrícula: ${eh(a.matricula||'—')}</div><h4>Turmas</h4>${ms.map(m=>`<div class="transfer-academic-box"><b>${eh(blabel(db.turmasBase.find(b=>b.id===m.turmaBaseId)))}</b><br><small>${eh(m.status)} • ${eh(m.dataInicio||'')} ${m.dataFim?'até '+eh(m.dataFim):''}</small></div>`).join('')||'<p class="muted">Sem histórico.</p>'}<h4>Transferências</h4>${ts.map(t=>`<div class="transfer-academic-box">${eh(t.data)} • ${eh(blabel(db.turmasBase.find(b=>b.id===t.origemTurmaBaseId)))} → ${eh(blabel(db.turmasBase.find(b=>b.id===t.destinoTurmaBaseId)))}<br><small>${t.notasCopiadas||0} nota(s) copiada(s) para avaliações equivalentes. O restante permanece no histórico.</small></div>`).join('')||'<p class="muted">Nenhuma transferência.</p>'}`;
 modal('Histórico do aluno',body,()=>true);const bt=$('#modalSave');if(bt){bt.textContent='Fechar';bt.onclick=e=>{e.preventDefault();$('#modal').close();bt.textContent='Salvar'}};
};
function confirmPassword(msg){const senha=prompt(msg);if(senha===null)return false;if(typeof securityCheckPassword==='function'&&!securityCheckPassword(senha)){alert('Senha incorreta.');return false}return true}
function inativarAluno(aid,motivo){
 const a=db.alunos.find(x=>x.id===aid);if(!a)return;
 if(!confirm(`Confirmar desativação de ${a.nome}?\nMotivo: ${motivo}`))return;
 if(!confirmPassword('Digite a senha do Professor Control para confirmar:'))return;
 const mat=db.matriculas.find(m=>m.alunoId===aid&&m.status==='ativa');if(mat){mat.status='inativa';mat.dataFim=today();mat.motivo=motivo}
 a.ativo=false;a.motivoInativo=motivo;a.dataInativacao=new Date().toISOString();persist();rerenderAllStudentViews();alert('Aluno desativado com sucesso.');
}
function desativarAcademico(aid){
 const a=db.alunos.find(x=>x.id===aid);if(!a)return;
 const op=prompt(`Aluno: ${a.nome}\n\n1 - Transferência (saiu da escola)\n2 - Parou de estudar\n3 - Mudou de turma\n4 - Outro\n\nDigite o número:`);if(op===null)return;
 if(String(op)==='3'){transfer(aid);return}
 let motivo='';if(String(op)==='1')motivo='Transferência';else if(String(op)==='2')motivo='Parou de estudar';else if(String(op)==='4'){motivo=(prompt('Informe o motivo:')||'').trim();if(!motivo)return}else{alert('Opção inválida.');return}
 inativarAluno(aid,motivo);
}
function reativarAcademico(aid){
 const a=db.alunos.find(x=>x.id===aid);if(!a)return;
 if(!confirmPassword(`Digite a senha para reativar ${a.nome}:`))return;
 a.ativo=true;a.motivoInativo='';a.dataInativacao='';const bid=baseIdAluno(a);if(bid&&!db.matriculas.some(m=>m.alunoId===aid&&m.status==='ativa'))db.matriculas.push({id:uid(),alunoId:aid,turmaBaseId:bid,dataInicio:today(),dataFim:'',status:'ativa',motivo:'Reativação'});persist();rerenderAllStudentViews();alert('Aluno reativado com sucesso.');
}
function setup(){
 if(!$('#academicStudentCss')){const st=document.createElement('style');st.id='academicStudentCss';st.textContent='.btn-transfer-academic{border:1px solid #2563eb;background:#eff6ff;color:#1d4ed8;border-radius:10px;padding:7px 10px;font-weight:900}.transfer-academic-box{padding:10px;border-left:4px solid #f59e0b;background:#fffaf0;border-radius:10px;margin:8px 0}';document.head.appendChild(st)}
 const e=$('#alunosEscola'),t=$('#alunosTurma');if(e)e.onchange=()=>{syncAlunoSel();renderStudents()};if(t)t.onchange=renderStudents;
 const novo=$('#novoAlunoBtn');if(novo)novo.onclick=()=>{const tid=$('#alunosTurma').value,bid=window.turmaBaseDoVinculo(tid)?.id;if(!bid){alert('Primeiro vincule pelo menos uma disciplina à turma em “Minhas Aulas”.');return}modal('Novo aluno','<label>Nome<input id="novoAlunoNomeAcademic" required></label><label>Matrícula<input id="novoAlunoMatAcademic"></label><label>Número da chamada<input id="novoAlunoNumAcademic" type="number"></label>',()=>{const nome=$('#novoAlunoNomeAcademic').value.trim(),mat=$('#novoAlunoMatAcademic').value.trim();if(!nome)return false;const globalMat=mat?db.alunos.find(a=>a.matricula===mat):null;if(globalMat){alert('Esta matrícula já pertence a um aluno cadastrado. Use o botão Transferir no cadastro desse aluno.');return false}if(db.alunos.some(a=>!mat&&norm(a.nome)===norm(nome)&&baseIdAluno(a)===bid)){alert('Este aluno já está cadastrado nesta turma.');return false}const a={id:uid(),turmaId:tid,turmaBaseId:bid,nome,matricula:mat,numero:$('#novoAlunoNumAcademic').value,ativo:true,motivoInativo:'',dataInativacao:''};db.alunos.push(a);db.matriculas.push({id:uid(),alunoId:a.id,turmaBaseId:bid,dataInicio:today(),dataFim:'',status:'ativa',motivo:''});persist();renderStudents();return true})};
 if(typeof renderAll==='function'&&!window.__academicStudentsRenderWrap){window.__academicStudentsRenderWrap=true;const old=renderAll;window.renderAll=renderAll=function(){if(window.professorControlNormalizeStudents)window.professorControlNormalizeStudents();old();setTimeout(renderStudents,0)}}
 if(typeof go==='function'&&!window.__academicStudentsGoWrap){window.__academicStudentsGoWrap=true;const old=go;window.go=go=function(v){old(v);if(v==='alunos')renderStudents()}}
 window.desativarAlunoChamada=desativarAcademico;window.reativarAluno=reativarAcademico;
 renderStudents();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();