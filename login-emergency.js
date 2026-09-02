(()=>{
  const SECURITY_KEY='professor_control_security_v1';
  const SESSION_KEY='professor_control_authenticated_session';

  function simpleHash(str){
    let h1=0x811c9dc5;
    for(let i=0;i<str.length;i++){
      h1 ^= str.charCodeAt(i);
      h1 = Math.imul(h1,0x01000193);
    }
    return (h1>>>0).toString(16);
  }

  function hasSavedPassword(){
    try{
      const s=JSON.parse(localStorage.getItem(SECURITY_KEY)||'{}');
      return !!s.passwordHash;
    }catch(e){return false}
  }

  function checkPassword(pass){
    try{
      if(typeof window.securityCheckPassword==='function')return !!window.securityCheckPassword(pass);
    }catch(e){}
    try{
      const s=JSON.parse(localStorage.getItem(SECURITY_KEY)||'{}');
      return !!s.passwordHash && s.passwordHash===simpleHash(pass||'');
    }catch(e){return false}
  }

  function lockVisible(){
    const lock=document.getElementById('authLock');
    return !!(lock&&!lock.classList.contains('hidden')&&getComputedStyle(lock).display!=='none');
  }

  function unlock(){
    const lock=document.getElementById('authLock');
    if(lock)lock.classList.add('hidden');
    try{sessionStorage.setItem(SESSION_KEY,'1')}catch(e){}
  }

  function emergencyLogin(){
    if(!hasSavedPassword()||!lockVisible())return;
    const pass=window.prompt('ACESSO DE EMERGÊNCIA\n\nDigite a senha do Professor Control:');
    if(pass===null)return;
    if(checkPassword(pass)){
      unlock();
      return;
    }
    window.alert('Senha incorreta. Tente novamente.');
  }

  function install(){
    try{localStorage.removeItem('professor_control_ui_state_v1')}catch(e){}
    const lock=document.getElementById('authLock');
    const input=document.getElementById('authPass');
    const input2=document.getElementById('authPass2');
    const btn=document.getElementById('authBtn');
    [input,input2,btn].forEach(el=>{
      if(!el)return;
      el.disabled=false;
      el.removeAttribute('readonly');
      el.style.pointerEvents='auto';
      el.style.touchAction='manipulation';
    });
    if(lock){
      lock.style.pointerEvents='auto';
      lock.style.zIndex='2147483000';
    }

    // Se o campo visual estiver bloqueado pelo WebView, tocar no botão usa o diálogo nativo.
    if(btn&&hasSavedPassword()){
      btn.textContent='Entrar';
      btn.onclick=e=>{e?.preventDefault?.();emergencyLogin()};
    }

    // Acesso automático de emergência após carregar, apenas para instalações que já têm senha.
    if(hasSavedPassword()&&lockVisible())setTimeout(emergencyLogin,700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  window.professorControlEmergencyLogin=emergencyLogin;
})();
