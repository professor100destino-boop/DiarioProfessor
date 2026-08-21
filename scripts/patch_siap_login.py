from pathlib import Path

p = Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
s = p.read_text(encoding='utf-8')

s = s.replace(
    '    private boolean loginSubmitted=false;\n    private boolean captchaAfterFailure=false;\n',
    '    private boolean loginSubmitted=false;\n    private boolean loginCheckPending=false;\n    private boolean captchaAfterFailure=false;\n'
)

old = '''                if(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?")){
                    boolean failed=loginSubmitted;
                    loginSubmitted=false;
                    captchaAfterFailure=failed;
                    if(failed)loginAttempts++;
                    showShell("captcha");
                    injectLoginAndReadCaptcha();
                    return;
                }
'''
new = '''                if(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?")){
                    if(loginSubmitted){
                        if(!loginCheckPending){
                            loginCheckPending=true;
                            siapWeb.postDelayed(()->verifyLoginAfterSubmit(),1400);
                        }
                        return;
                    }
                    loginCheckPending=false;
                    showShell("captcha");
                    injectLoginAndReadCaptcha();
                    return;
                }
                // Qualquer navegação para fora da página de login após o envio confirma a entrada.
                if(loginSubmitted){
                    loginSubmitted=false;
                    loginCheckPending=false;
                    captchaAfterFailure=false;
                    loginAttempts=0;
                    showShell("menu");
                    return;
                }
'''
if old not in s:
    raise SystemExit('Bloco onPageFinished do login não encontrado')
s = s.replace(old, new, 1)

anchor = '''    private void menuActionInternal(String action){
'''
method = '''    private void verifyLoginAfterSubmit(){
        String url=siapWeb.getUrl();
        String low=url==null?"":url.toLowerCase();
        if(!(low.contains("login.aspx")||low.endsWith("/login")||low.contains("/login?"))){
            loginSubmitted=false; loginCheckPending=false; captchaAfterFailure=false; loginAttempts=0;
            showShell("menu");
            return;
        }
        String js="(function(){try{"+
            "var vis=function(e){return e&&e.offsetParent!==null&&!e.disabled};"+
            "var ins=[].slice.call(document.querySelectorAll('input')).filter(vis);"+
            "var p=ins.find(function(i){return (i.type||'').toLowerCase()==='password';});"+
            "var c=ins.find(function(i){var z=((i.id||'')+' '+(i.name||'')+' '+(i.placeholder||'')).toLowerCase();var t=(i.type||'text').toLowerCase();return i!==p&&(t==='text'||t==='tel'||t==='number')&&/cod|segur|captcha|verif/.test(z);});"+
            "return !!p&&!!c;"+
            "}catch(e){return true;}})();";
        siapWeb.evaluateJavascript(js,value->runOnUiThread(()->{
            loginCheckPending=false;
            String v=value==null?"":value.replace("\\\"","").trim();
            boolean stillLogin="true".equalsIgnoreCase(v);
            if(!stillLogin){
                loginSubmitted=false; captchaAfterFailure=false; loginAttempts=0;
                showShell("menu");
                return;
            }
            loginSubmitted=false;
            captchaAfterFailure=true;
            loginAttempts++;
            showShell("captcha");
            injectLoginAndReadCaptcha();
        }));
    }

'''
if anchor not in s:
    raise SystemExit('Âncora menuActionInternal não encontrada')
s = s.replace(anchor, method + anchor, 1)

old_submit = '''            "var bs=[].slice.call(document.querySelectorAll('input[type=submit],input[type=button],button')).filter(vis);var b=bs.find(function(x){return /entrar/i.test((x.value||x.innerText||''));})||bs[0];if(b)b.click();"+
'''
new_submit = '''            "var bs=[].slice.call(document.querySelectorAll('input[type=submit],input[type=button],input[type=image],button')).filter(vis);var b=bs.find(function(x){return /entrar|acessar|login/i.test((x.value||x.innerText||x.getAttribute('alt')||''));})||bs[0];if(b)b.click();else if(c&&c.form){if(c.form.requestSubmit)c.form.requestSubmit();else c.form.submit();}"+
'''
if old_submit not in s:
    raise SystemExit('Bloco de envio do captcha não encontrado')
s = s.replace(old_submit, new_submit, 1)

# Reinicia também o verificador quando inicia um novo login.
s = s.replace(
    '        loginAttempts=0; loginSubmitted=false; captchaAfterFailure=false; showShell("captcha"); siapWeb.loadUrl(LOGIN_URL);',
    '        loginAttempts=0; loginSubmitted=false; loginCheckPending=false; captchaAfterFailure=false; showShell("captcha"); siapWeb.loadUrl(LOGIN_URL);'
)

p.write_text(s, encoding='utf-8')
print('SIAP login patch aplicado com sucesso')
