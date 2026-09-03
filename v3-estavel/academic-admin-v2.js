(()=>{
'use strict';
if(!window.db||!window.professorControlBaseIdAluno)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=window.professorControlUid,persist=window.professorControlPersist,norm=window.professorControlNorm,baseIdAluno=window.professorControlBaseIdAluno;
const eh=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blabel=b=>b?`${b.serie||''} ${b.turma||''}${b.turno?' • '+b.turno:''}`.trim():'';
const vlabel=t=>t?`${t.serie||''} ${t.turma||''}${t.disciplina?' • '+t.disciplina:''}`.trim():'';
const pkey=t=>[t.escolaId||'',norm(t.serie),norm(t.turma),norm(t.turno)].join('|');
function addViews(){
 const tv=$('#view-turmas');
 if(tv)tv.innerHTML='<div class="section-shell"><div class="section-head"><div><h2>Turmas</h2><p>Cadastre a turma apenas uma vez. As disciplinas ficam em <b>Minhas Aulas</b>.</p></div><div class="toolbar"><button class="primary" id="novaTurmaBtn">+ Nova turma</button></div></div><div class="panel"><div id="turmasList" class="table-wrap"></div></div></div>';
 if(!$('#view-academico')){
  const s=document.createElement('section');s.id='view-academico';s.className='view';
  s.innerHTML='<div class="section-shell"><div class="section-head"><div><h2>Professor e Disciplinas</h2><p>Cadastre o professor e marque as disciplinas que ele leciona.</p></div></div><div class="grid2"><div class="panel"><div class="panel-head"><h3>Professores</h3><button class="primary" id="novoProfessorBtn">+ Professor</button></div><div id="professoresList"></div></div><div class="panel"><div class="panel-head"><h3>Disciplinas</h3><button class="primary" id="novaDisciplinaAcademicaBtn">+ Disciplina</button></div><div id="disciplinasAcademicasList"></div></div></div></div>';
  $('#view-alunos')?.parentNode?.insertBefore(s,$('#view-alunos'));
 }
 if(!$('#view-vinculos')){
  const s=document.createElement('section');s.id='view-vinculos';s.className='view';
  s.innerHTML='<div class="section-shell"><div class="section-head"><div><h2>Minhas Aulas</h2><p>Vincule professor + turma + disciplina. Os alunos são compartilhados entre todas as disciplinas daquela turma.</p></div><div class="toolbar"><button class="primary" id="novoVinculoBtn">+ Vincular aula</button></div></div><div class="panel"><div id="vinculosList" class="table-wrap"></div></div></div>';
  $('#view-alunos')?.parentNode?.insertBefore(s,$('#view-alunos'));
 }
 const nav=document.querySelector('.sidebar nav,aside nav'),alunos=nav?.querySelector('[data-view="alunos"]');
 if(nav&&alunos&&!nav.querySelector('[data-view="academico"]')){const b=document.createElement('button');b.className='nav-item';b.dataset.view='academico';b.innerHTML='<span class="nav-ico">👩‍🏫</span><span>Professor e Disciplinas</span>';nav.insertBefore(b,alunos);b.onclick=()=>openView('academico')}
 if(nav&&alunos&&!nav.querySelector('[data-view="vinculos"]')){const b=document.createElement('button');b.className='nav-item';b.dataset.view='vinculos';b.innerHTML='<span class="nav-ico">🔗</span><span>Minhas Aulas</span>';nav.insertBefore(b,alunos);b.onclick=()=>openView('vinculos')}
 if(!$('#academicAdminCss')){const st=document.createElement('style');st.id='academicAdminCss';st.textContent='.acad-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px;border:1px solid var(--border);border-radius:14px;margin:8px 0}.acad-actions{display:flex;gap:7px;flex-wrap:wrap}.acad-chip{display:inline-flex;padding:4px 8px;border-radius:999px;background:#edf5ff;color:#174a84;font-size:12px;font-weight:900;margin:2px}.disc-checks{display:grid;grid-template-columns:1fr 1fr;gap:7px}.disc-checks label{display:flex;gap:7px;align-items:center;padding:8px;border:1px solid #dbe5f1;border-radius:10px}@media(max-width:700px){.disc-checks{grid-template-columns:1fr}.acad-row{align-items:flex-start;flex-direction:column}}';document.head.appendChild(st)}
}
function openView(v){$$('.view').forEach(x=>x.classList.remove('active'));$$('.nav-item').forEach(x=>x.classList.remove('active'));$('#view-'+v)?.classList.add('active');$(`.nav-item[data-view="${v}"]`)?.classList.add('active');if($('#pageTitle'))$('#pageTitle').textContent=v==='academico'?'Professor e Disciplinas':'Minhas Aulas';$('#sidebar')?.classList.remove('open');v==='academico'?renderAcademic():renderLinks()}
function renderAcademic(){
 const p=$('#professoresList'),d=$('#disciplinasAcademicasList');if(!p||!d)return;
 p.innerHTML=db.professores.map(x=>`<div class="acad-row"><div><b>${eh(x.nome)}</b><div>${(x.disciplinaIds||[]).map(id=>{const z=db.disciplinas.find(q=>q.id===id);return z?`<span class="acad-chip">${eh(z.nome)}</span>`:''}).join('')||'<small class="muted">Nenhuma disciplina marcada</small>'}</div></div><button class="primary ghost" onclick="editarProfessorAcademico('${x.id}')">Editar</button></div>`).join('');
 d.innerHTML=db.disciplinas.filter(x=>x.ativo!==false).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(x=>`<div class="acad-row"><b>${eh(x.nome)}</b><button class="primary ghost" onclick="editarDisciplinaAcademica('${x.id}')">Editar</button></div>`).join('')||'<p class="muted">Nenhuma disciplina cadastrada.</p>';
}
function editProfessor(id=''){
 const p=id?db.professores.find(x=>x.id===id):null;
 const checks=db.disciplinas.filter(x=>x.ativo!==false).map(x=>`<label><input class="profDiscCheck" type="checkbox" value="${x.id}" ${(p?.disciplinaIds||[]).includes(x.id)?'checked':''}> ${eh(x.nome)}</label>`).join('');
 modal(p?'Editar professor':'Novo professor',`<label>Nome do professor<input id="profNomeAcademic" value="${eh(p?.nome||'')}" required></label><b>Disciplinas que leciona</b><div class="disc-checks">${checks||'<small class="muted">Cadastre as disciplinas primeiro.</small>'}</div>`,()=>{const nome=$('#profNomeAcademic').value.trim();if(!nome)return false;const ids=$$('.profDiscCheck:checked').map(x=>x.value);if(p){p.nome=nome;p.disciplinaIds=ids}else db.professores.push({id:uid(),nome,ativo:true,disciplinaIds:ids});persist();renderAcademic();return true});
}
function editDisciplina(id=''){
 const d=id?db.disciplinas.find(x=>x.id===id):null;
 modal(d?'Editar disciplina':'Nova disciplina',`<label>Nome da disciplina<input id="discNomeAcademic" value="${eh(d?.nome||'')}" required></label>`,()=>{const nome=$('#discNomeAcademic').value.trim();if(!nome)return false;if(db.disciplinas.some(x=>x.id!==id&&norm(x.nome)===norm(nome))){alert('Essa disciplina já está cadastrada.');return false}if(d){d.nome=nome;db.turmas.forEach(t=>{if(t.disciplinaId===d.id)t.disciplina=nome})}else db.disciplinas.push({id:uid(),nome,ativo:true});persist();renderAcademic();renderLinks();return true});
}
window.editarProfessorAcademico=editProfessor;window.editarDisciplinaAcademica=editDisciplina;
function renderBases(){
 const b=$('#turmasList');if(!b)return;const arr=db.turmasBase.filter(x=>x.ativo!==false);
 b.innerHTML=arr.length?`<table><thead><tr><th>Escola</th><th>Série</th><th>Turma</th><th>Turno</th><th>Alunos</th><th>Disciplinas</th></tr></thead><tbody>${arr.map(x=>{const e=db.escolas.find(q=>q.id===x.escolaId),n=db.alunos.filter(a=>baseIdAluno(a)===x.id).length,vs=db.turmas.filter(t=>t.turmaBaseId===x.id&&t.ativo!==false);return `<tr><td><b>${eh(e?.nome||'')}</b></td><td>${eh(x.serie)}</td><td>${eh(x.turma)}</td><td>${eh(x.turno||'')}</td><td>${n}</td><td>${vs.map(v=>`<span class="acad-chip">${eh(v.disciplina)}</span>`).join('')||'—'}</td></tr>`}).join('')}</tbody></table>`:'<p class="muted">Nenhuma turma cadastrada.</p>';
}
window.renderTurmas=renderBases;
function addBase(){
 if(!db.escolas.length){alert('Cadastre uma escola primeiro.');return}
 modal('Nova turma',`<label>Escola<select id="baseEscola">${db.escolas.map(e=>`<option value="${e.id}">${eh(e.nome)}</option>`).join('')}</select></label><label>Série/Ano<input id="baseSerie" placeholder="8º Ano" required></label><label>Turma<input id="baseTurma" placeholder="D" required></label><label>Turno<select id="baseTurno"><option>Matutino</option><option>Vespertino</option><option>Noturno</option></select></label>`,()=>{const x={id:uid(),escolaId:$('#baseEscola').value,serie:$('#baseSerie').value.trim(),turma:$('#baseTurma').value.trim(),turno:$('#baseTurno').value,ativo:true};if(!x.serie||!x.turma)return false;if(db.turmasBase.some(b=>b.ativo!==false&&pkey(b)===pkey(x))){alert('Essa turma já está cadastrada.');return false}db.turmasBase.push(x);persist();renderBases();return true});
}
function renderLinks(){
 const b=$('#vinculosList');if(!b)return;const arr=db.turmas.filter(t=>t.ativo!==false);
 b.innerHTML=arr.length?`<table><thead><tr><th>Escola</th><th>Turma</th><th>Disciplina</th><th>Professor</th><th></th></tr></thead><tbody>${arr.map(t=>{const e=db.escolas.find(x=>x.id===t.escolaId),p=db.professores.find(x=>x.id===t.professorId);return `<tr><td>${eh(e?.nome||'')}</td><td><b>${eh(`${t.serie||''} ${t.turma||''}`)}</b></td><td>${eh(t.disciplina||'')}</td><td>${eh(p?.nome||'')}</td><td><button class="link-btn" onclick="desativarVinculoAcademico('${t.id}')">Desativar</button></td></tr>`}).join('')}</tbody></table>`:'<p class="muted">Nenhuma aula vinculada.</p>';
}
window.desativarVinculoAcademico=id=>{const t=db.turmas.find(x=>x.id===id);if(!t||!confirm(`Desativar ${vlabel(t)}? Os alunos e o histórico não serão apagados.`))return;t.ativo=false;const v=db.vinculosEnsino.find(x=>x.id===id);if(v)v.ativo=false;persist();renderLinks();renderBases()};
function addLink(){
 if(!db.turmasBase.length||!db.professores.length||!db.disciplinas.length){alert('Cadastre turma, professor e disciplina primeiro.');return}
 modal('Vincular aula',`<label>Professor<select id="linkProf">${db.professores.filter(p=>p.ativo!==false).map(p=>`<option value="${p.id}">${eh(p.nome)}</option>`).join('')}</select></label><label>Escola<select id="linkEscola">${db.escolas.map(e=>`<option value="${e.id}">${eh(e.nome)}</option>`).join('')}</select></label><label>Turma<select id="linkBase"></select></label><label>Disciplina<select id="linkDisc"></select></label>`,()=>{const pid=$('#linkProf').value,bid=$('#linkBase').value,did=$('#linkDisc').value,base=db.turmasBase.find(x=>x.id===bid),d=db.disciplinas.find(x=>x.id===did);if(!base||!d)return false;if(db.turmas.some(t=>t.ativo!==false&&t.turmaBaseId===bid&&t.disciplinaId===did&&t.professorId===pid)){alert('Esse vínculo já existe.');return false}const t={id:uid(),escolaId:base.escolaId,serie:base.serie,turma:base.turma,turno:base.turno,disciplina:d.nome,turmaBaseId:bid,disciplinaId:did,professorId:pid,ativo:true};db.turmas.push(t);db.vinculosEnsino.push({id:t.id,turmaBaseId:bid,disciplinaId:did,professorId:pid,ativo:true});persist();renderLinks();renderBases();return true});
 const fillBase=()=>{$('#linkBase').innerHTML=db.turmasBase.filter(b=>b.ativo!==false&&b.escolaId===$('#linkEscola').value).map(b=>`<option value="${b.id}">${eh(blabel(b))}</option>`).join('')};
 const fillDisc=()=>{const p=db.professores.find(x=>x.id===$('#linkProf').value);let ds=db.disciplinas.filter(d=>d.ativo!==false);if(p?.disciplinaIds?.length)ds=ds.filter(d=>p.disciplinaIds.includes(d.id));$('#linkDisc').innerHTML=ds.map(d=>`<option value="${d.id}">${eh(d.nome)}</option>`).join('')};
 $('#linkEscola').onchange=fillBase;$('#linkProf').onchange=fillDisc;fillBase();fillDisc();
}
function wrapGo(){if(typeof go!=='function'||window.__academicAdminGo)return;window.__academicAdminGo=true;const old=go;window.go=go=function(v){if(v==='academico'||v==='vinculos'){openView(v);return}old(v);if(v==='turmas')renderBases()}}
function init(){addViews();wrapGo();renderBases();renderAcademic();renderLinks();if($('#novaTurmaBtn'))$('#novaTurmaBtn').onclick=addBase;if($('#novoProfessorBtn'))$('#novoProfessorBtn').onclick=()=>editProfessor();if($('#novaDisciplinaAcademicaBtn'))$('#novaDisciplinaAcademicaBtn').onclick=()=>editDisciplina();if($('#novoVinculoBtn'))$('#novoVinculoBtn').onclick=addLink;document.querySelectorAll('.shortcut-card').forEach(x=>{if((x.textContent||'').includes('Gerenciar Turmas')){const s=x.querySelector('small');if(s)s.textContent='Cadastre a turma uma vez; disciplinas ficam em Minhas Aulas.'}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();