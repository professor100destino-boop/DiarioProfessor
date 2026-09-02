from pathlib import Path

p=Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
s=p.read_text(encoding='utf-8')

# Injeta helper depois que todos os outros patches já alteraram showProfessor.
anchor='''    private void showProfessor(){
'''
helper='''    private void ensureProfessorWebInteractive(){
        if(uiWeb==null)return;
        try{
            uiWeb.setEnabled(true);
            uiWeb.setClickable(true);
            uiWeb.setFocusable(true);
            uiWeb.setFocusableInTouchMode(true);
            uiWeb.setVisibility(View.VISIBLE);
            uiWeb.bringToFront();
            uiWeb.requestFocus(View.FOCUS_DOWN);
        }catch(Exception ignored){}
    }

'''
if 'private void ensureProfessorWebInteractive()' not in s:
    if anchor not in s: raise SystemExit('showProfessor não encontrado')
    s=s.replace(anchor,helper+anchor,1)

# Acrescenta chamada no showProfessor sem depender de sua forma exata.
start=s.find('    private void showProfessor(){')
if start<0: raise SystemExit('showProfessor ausente')
end=s.find('    }\n',start)
block=s[start:end+6]
if 'ensureProfessorWebInteractive();' not in block:
    block2=block.replace('uiWeb.setVisibility(View.VISIBLE);','uiWeb.setVisibility(View.VISIBLE); ensureProfessorWebInteractive();',1)
    if block2==block:
        raise SystemExit('Não foi possível injetar proteção em showProfessor')
    s=s[:start]+block2+s[end+6:]

# Também garante interação imediatamente após configurar o WebView principal.
needle='''        configureWeb(uiWeb,true);
        configureWeb(siapWeb,false);
'''
replacement='''        configureWeb(uiWeb,true);
        configureWeb(siapWeb,false);
        uiWeb.setEnabled(true);
        uiWeb.setClickable(true);
        uiWeb.setFocusable(true);
        uiWeb.setFocusableInTouchMode(true);
'''
if replacement not in s:
    if needle not in s: raise SystemExit('configureWeb não encontrado')
    s=s.replace(needle,replacement,1)

p.write_text(s,encoding='utf-8')
print('WebView interaction patch applied')