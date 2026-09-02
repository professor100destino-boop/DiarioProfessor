from pathlib import Path
import sys

ROOT=Path('.')
errors=[]

def read(path):
    p=ROOT/path
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

index=require('index.html',
    'backup-migration.js','update-app.js','attendance-pdf-fix.js','advertencias-print.js','advertencias-edit.js','advertencias-aluno-report.js',
    'academic-students-v2.js','academic-roster-v2.js','planning-execute.js','app-lifecycle.js','siap-integracao.js',
    'private-school-import.js')

backup=require('backup-migration.js',
    'professorControlExportBackup','professorControlChooseBackup','professorControlBackupForExit',
    'saveBackupQuick','chooseBackupLocation','importBackup','Restaurar backup','ok===true')

update=require('update-app.js',
    'Atualizar sistema agora','serviceWorker','caches.keys','location.replace','professorControlUpdateNow')
if 'atualizar.html' in update:
    errors.append('update-app.js: atualização interna voltou a depender de atualizar.html')

for unsafe in ('localStorage.clear(','sessionStorage.clear('):
    if unsafe in backup or unsafe in update:
        errors.append(f'Backup/atualização contém limpeza perigosa: {unsafe}')

sw=read('sw.js')
sw2=read('service-worker.js')
if sw!=sw2:
    errors.append('sw.js e service-worker.js estão diferentes')
for token in ('backup-migration.js','update-app.js','attendance-pdf-fix.js','academic-students-v2.js','private-school-import.js','advertencias-edit.js','advertencias-aluno-report.js','parts/part11.txt'):
    if token not in sw:
        errors.append(f'sw.js: faltando cache de {token}')

require('advertencias-edit.js','authorizeEdit','securityCheckPassword','Salvar alterações','editarAdvertencia','atualizadoEm')
require('advertencias-aluno-report.js','Relatório de advertências por aluno','Imprimir / Salvar em PDF','htmlRelatorioAluno','printHtml')
require('private-school-import.js','extractSaec','importSaecStudents','Rela[cç][aã]o de Notas Por Disciplina','SAE+C','turmaBaseDoVinculo','mediasBimestraisPorVinculo')
require('scripts/patch_backup_chooser.py','chooseBackupLocationInternal','saveBackupQuickInternal','@JavascriptInterface public boolean saveBackupQuick')
require('scripts/patch_print_advertencias.py','printHtmlInternal','@JavascriptInterface public void printHtml')
require('scripts/patch_app_lifecycle.py','professorControlBackupForExit')
require('scripts/patch_siap_login.py','verifyLoginAfterSubmit')
require('scripts/patch_remote_siap_permanent.py','showRemoteSiap','siapEvalRemoteInternal','siapFillCredentialsInternal','remoteSiapMode')
require('siap-remoto.html','onSiapPageFinished','siapFillCredentials','siapEval','Aguardando o SIAP confirmar a entrada','atualizável sem reinstalar o aplicativo')

require('android-app/app/src/main/AndroidManifest.xml','android.permission.INTERNET','.MainActivity','android:label="Docência Fácil"')
require('android-app/app/build.gradle',"applicationId 'br.com.professor100destino.docenciafacil.permanente'","versionName '3.0.0'")

critical_files=[
    'attendance-pdf-fix.js','advertencias.js','advertencias-print.js','advertencias-edit.js','advertencias-aluno-report.js','activities-quick-mark.js',
    'academic-data-v2.js','academic-admin-v2.js','academic-students-v2.js','academic-roster-v2.js',
    'academic-reports-v2.js','academic-dashboard-v2.js','planning-execute.js','horarios.js','siap-integracao.js',
    'recovery-transfer.js','update-app.js','siap-remoto.html','private-school-import.js'
]
for f in critical_files:
    read(f)

if errors:
    print('REGRESSION CHECK: FALHOU')
    for e in errors:
        print(' -',e)
    sys.exit(1)
print('REGRESSION CHECK: OK — base permanente preserva funções essenciais')
