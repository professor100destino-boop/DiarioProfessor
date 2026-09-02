from pathlib import Path
import sys

errors=[]

def read(path):
    p=Path(path)
    if not p.exists():
        errors.append(f'Arquivo ausente: {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')

def require(path,*tokens):
    text=read(path)
    for token in tokens:
        if token not in text:
            errors.append(f'{path}: faltando {token!r}')
    return text

# O código-base antigo continua presente no repositório; o patch 4.0 só altera o workspace do build.
require('v4.html','v4-no-login.js','backup-migration.js','advertencias-edit.js','advertencias-aluno-report.js','planning-execute.js','private-school-import.js','update-app.js')
no_login=require('v4-no-login.js','removeEventListener','initSecurity','#authLock','professorControlV4NoLogin')
if 'view-state.js' in read('v4.html'):
    errors.append('v4.html: não reintroduzir view-state.js nesta base estável')

require('android-app/app/build.gradle',"applicationId 'br.com.professor100destino.docenciafacil.v4'","versionCode 400","versionName '4.0.0'")
require('android-app/app/src/main/AndroidManifest.xml','android.permission.INTERNET','android:label="Docência Fácil 4.0"')
main=require('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java','DiarioProfessor/v4.html','ensureProfessorWebInteractive','setClickable(true)','setFocusableInTouchMode(true)')
if 'uiWeb.restoreState' in main:
    errors.append('MainActivity 4.0: uiWeb não pode restaurar WebView congelada')

# Funções críticas que devem acompanhar a nova instalação.
for f in [
    'attendance-pdf-fix.js','advertencias.js','advertencias-print.js','advertencias-edit.js','advertencias-aluno-report.js',
    'activities-quick-mark.js','academic-data-v2.js','academic-admin-v2.js','academic-students-v2.js','academic-roster-v2.js',
    'academic-reports-v2.js','academic-dashboard-v2.js','planning-execute.js','horarios.js','siap-integracao.js',
    'recovery-transfer.js','backup-migration.js','update-app.js','siap-remoto.html','private-school-import.js'
]:
    read(f)

if errors:
    print('REGRESSION CHECK V4: FALHOU')
    for e in errors: print(' -',e)
    sys.exit(1)

print('REGRESSION CHECK V4: OK — instalação paralela, sem senha na abertura e WebView interativa')
