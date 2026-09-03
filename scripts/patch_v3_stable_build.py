from pathlib import Path

main = Path('android-app/app/src/main/java/br/com/professor100destino/docenciafacil/MainActivity.java')
text = main.read_text(encoding='utf-8')
old = 'private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/";'
new = 'private static final String PROFESSOR_URL="https://professor100destino-boop.github.io/DiarioProfessor/v3-estavel/";'
if old not in text and new not in text:
    raise SystemExit('PROFESSOR_URL esperado não encontrado')
text = text.replace(old, new)
main.write_text(text, encoding='utf-8')

gradle = Path('android-app/app/build.gradle')
g = gradle.read_text(encoding='utf-8')
g = g.replace('versionCode 300', 'versionCode 3999')
g = g.replace("versionName '3.0.0'", "versionName '3.0.0-estavel'")
gradle.write_text(g, encoding='utf-8')

print('V3 estável: URL congelada e versão de atualização aplicadas')
