from pathlib import Path

# Gera o Docência Fácil 4.0 como aplicativo paralelo, sem substituir a instalação anterior.

gradle=Path('android-app/app/build.gradle')
s=gradle.read_text(encoding='utf-8')
s=s.replace("applicationId 'br.com.professor100destino.docenciafacil.permanente'","applicationId 'br.com.professor100destino.docenciafacil.v4'")
s=s.replace("versionCode 301","versionCode 400")
s=s.replace("versionName '3.0.1'","versionName '4.0.0'")
if "br.com.professor100destino.docenciafacil.v4" not in s:
    raise SystemExit('Falha ao aplicar applicationId da versão 4.0')
gradle.write_text(s,encoding='utf-8')

manifest=Path('android-app/app/src/main/AndroidManifest.xml')
m=manifest.read_text(encoding='utf-8')
m=m.replace('android:label="Docência Fácil"','android:label="Docência Fácil 4.0"')
if 'android:label="Docência Fácil 4.0"' not in m:
    raise SystemExit('Falha ao aplicar nome da versão 4.0')
manifest.write_text(m,encoding='utf-8')

main=Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
j=main.read_text(encoding='utf-8')
j=j.replace('private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/";',
            'private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/v4.html";')
if 'DiarioProfessor/v4.html' not in j:
    raise SystemExit('Falha ao apontar WebView para v4.html')
main.write_text(j,encoding='utf-8')

print('Patch paralelo 4.0 aplicado: pacote novo, nome novo e página sem login')
