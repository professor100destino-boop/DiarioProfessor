(()=>{
  // Docência Fácil 4.0: sem bloqueio por senha na abertura.
  // Mantém a infraestrutura de senha apenas para ações administrativas opcionais.
  const style=document.createElement('style');
  style.textContent='#authLock{display:none!important;pointer-events:none!important;}';
  document.head.appendChild(style);

  try{
    if(typeof initSecurity==='function'){
      document.removeEventListener('DOMContentLoaded',initSecurity);
    }
  }catch(e){}

  const originalCheck=typeof window.securityCheckPassword==='function'
    ? window.securityCheckPassword
    : null;

  if(originalCheck){
    window.securityCheckPassword=function(pass){
      try{
        const s=typeof securityLoad==='function'?securityLoad():{};
        // Sem senha administrativa configurada, ações protegidas continuam utilizáveis.
        // Se o professor configurar uma senha depois, ela volta a ser exigida nessas ações.
        if(!s||!s.passwordHash)return true;
      }catch(e){return true;}
      return originalCheck(pass);
    };
  }

  const unlock=()=>{
    try{
      const lock=document.getElementById('authLock');
      if(lock){
        lock.classList.add('hidden');
        lock.setAttribute('aria-hidden','true');
        lock.style.display='none';
        lock.style.pointerEvents='none';
      }
      sessionStorage.setItem('professor_control_authenticated_session','1');
      document.body.classList.remove('menu-open');
    }catch(e){}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',unlock);
  else unlock();

  window.professorControlV4NoLogin=true;
})();
