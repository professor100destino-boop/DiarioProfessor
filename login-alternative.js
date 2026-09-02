(()=>{
  const SESSION_KEY='professor_control_authenticated_session';
  const $=s=>document.querySelector(s);

  function checkPassword(pass){
    try{
      if(typeof window.securityCheckPassword==='function')return window.securityCheckPassword(pass);
      if(typeof securityCheckPassword==='function')return securityCheckPassword(pass);
    }catch(e){}
    return false;
  }

  function unlock(pass){
    if(!checkPassword(pass)){
      alert('Senha incorreta.');
      return false;
    }
    const lock=$('#authLock');
    if(lock)lock.classList.add('hidden');
    try{sessionStorage.setItem(SESSION_KEY,'1')}catch(e){}
    return true;
  }

  function promptLogin(){
    const pass=window.prompt('Digite a senha do Professor Control:');
    if(pass===null)return;
    unlock(pass);
  }

  function makeKeyboard(){
    if($('#pcAltKeyboard'))return;
    const lock=$('#authLock');
    const card=lock?.querySelector('.auth-card');
    if(!card)return;

    const wrap=document.createElement('div');
    wrap.id='pcAltKeyboard';
    wrap.style.cssText='display:none;margin-top:12px;padding:12px;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc';
    wrap.innerHTML=`
      <div id="pcAltDisplay" style="height:44px;border:1px solid #cbd5e1;border-radius:10px;background:white;margin-bottom:10px;padding:10px 12px;font-size:20px;letter-spacing:2px;overflow:hidden">••••</div>
      <div id="pcAltKeys" style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
        <button type="button" id="pcAltShift" style="background:#475569">Maiúsculas</button>
        <button type="button" id="pcAltBack" style="background:#475569">⌫ Apagar</button>
        <button type="button" id="pcAltEnter" style="background:#15803d">Entrar</button>
      </div>`;
    card.appendChild(wrap);

    let value='', upper=false;
    const display=$('#pcAltDisplay');
    const chars='1234567890qwertyuiopasdfghjklçzxcvbnm@!#$_-*.';
    const render=()=>{
      display.textContent=value?('•'.repeat(value.length)):'Digite pela tela';
      const keys=$('#pcAltKeys');
      keys.innerHTML='';
      for(const c0 of chars){
        const c=upper?c0.toUpperCase():c0;
        const b=document.createElement('button');
        b.type='button'; b.textContent=c;
        b.style.cssText='min-width:0;padding:9px 2px;background:#e2e8f0;color:#0f172a;border:0;border-radius:8px;font-weight:800';
        b.onclick=()=>{value+=c;render()};
        keys.appendChild(b);
      }
    };
    $('#pcAltShift').onclick=()=>{upper=!upper;render()};
    $('#pcAltBack').onclick=()=>{value=value.slice(0,-1);render()};
    $('#pcAltEnter').onclick=()=>{if(unlock(value))value='';render()};
    render();
  }

  function install(){
    const lock=$('#authLock');
    const card=lock?.querySelector('.auth-card');
    const mainBtn=$('#authBtn');
    if(!lock||!card||!mainBtn)return;

    // Só exibe o acesso alternativo quando já existe senha cadastrada.
    let hasPassword=false;
    try{hasPassword=!!securityLoad?.().passwordHash}catch(e){
      try{hasPassword=!!JSON.parse(localStorage.getItem('professor_control_security_v1')||'{}').passwordHash}catch(_){}
    }
    if(!hasPassword)return;

    if(!$('#pcAltLoginBtn')){
      const btn=document.createElement('button');
      btn.type='button'; btn.id='pcAltLoginBtn';
      btn.textContent='Entrar por acesso alternativo';
      btn.style.cssText='margin-top:10px;background:#1d4ed8';
      btn.onclick=promptLogin;
      mainBtn.insertAdjacentElement('afterend',btn);
    }
    if(!$('#pcAltKeyboardBtn')){
      const btn=document.createElement('button');
      btn.type='button'; btn.id='pcAltKeyboardBtn';
      btn.textContent='⌨️ Usar teclado interno';
      btn.style.cssText='margin-top:8px;background:#475569';
      btn.onclick=()=>{
        makeKeyboard();
        const kb=$('#pcAltKeyboard');
        if(kb)kb.style.display=kb.style.display==='none'?'block':'none';
      };
      $('#pcAltLoginBtn').insertAdjacentElement('afterend',btn);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,500)});
  else {install();setTimeout(install,500)}

  window.professorControlAlternativeLogin=promptLogin;
})();
