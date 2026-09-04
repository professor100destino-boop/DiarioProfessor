# Docência Fácil Online

Esta pasta contém a cópia de trabalho da versão V3 estável, preparada para hospedagem estática no Cloudflare Pages.

## Preservação da base

- Origem Android: `Docencia-Facil-V3-Estavel.zip`
- SHA-256 do ZIP: `619cd9bb580254d1f130b7417e4df89565c20c8ed91d57ae260e6088db18c214`
- Origem web: diretório `v3-estavel` do commit `b965b2d0736521a62bdea9681cb610a217fc5018`
- Nenhum arquivo funcional da V3 foi alterado para a adaptação inicial.

## Cloudflare Pages

O aplicativo é estático e não exige etapa de compilação. O arquivo `wrangler.toml` aponta o próprio diretório como saída do Pages. O arquivo `_headers` evita que o navegador retenha versões antigas do HTML, manifest e service workers, mantendo os demais recursos e o funcionamento offline existentes.

## Armazenamento

Os dados continuam no `localStorage` do navegador, separados por origem. Dados existentes no APK ou no GitHub Pages não aparecem automaticamente no domínio Cloudflare. Use a função de backup/restauração já existente para migrá-los com segurança.

## Limite da versão web

A integração direta com o SIAP usa a ponte nativa do APK quando disponível. No navegador comum, o SIAP abre como site externo; sessões, bloqueios de popup e políticas entre domínios dependem do próprio navegador e do SIAP.
