# AGENTS.md

Reglas compartidas entre herramientas de IA para este proyecto.
Fuente única de verdad para el contexto de infraestructura — no dupliques estos datos en otros archivos del repo.

**Para el PROCEDIMIENTO de despliegue** (no el estado de este proyecto, sino cómo desplegar en general en el servidor de Axel, con las trampas conocidas), ver `~/.claude/skills/codetec-deploy/SKILL.md`. Este archivo es el estado específico de `TributoMichaelJackson`.

## Estado del despliegue

- **EN VIVO en `https://tributo.codetec.app`** (desplegado 2026-09-14, HTTP 200 confirmado, contenedor `healthy`).
- **Tipo de sitio**: Astro SSG estático (sin adaptador SSR, sin backend) — servido por Nginx dentro del contenedor.
- **Dependencias**: usa las librerías propias `sonicfx`, `sonicmotion`, `sonicperf`, `sonicscroll`, `sonicwave` publicadas en el registro público de npm (autor `axscq`), más `SonicLyrics` vendorizada como código fuente en `src/libs/soniclyrics/`. El `package.json` commiteado en `main` usa rangos de versión npm normales (`^1.0.0`, etc.) — **no** `workspace:*`. Si ves `workspace:*` en tu checkout local, es un cambio sin commitear (para desarrollo local dentro del monorepo `sonic-suite`), no lo pushees a `main` o el build en el servidor va a fallar.

## Recurso en Coolify

- **Proyecto Coolify**: "Tributo Michael Jackson", uuid `ixxeri2guf9hcreobj067xpf`
- **Environment**: "production", uuid `jmgxhatqvceaynb70ylkj1pv`
- **Aplicación**: uuid `vy8phalcp3nkbhrckbd8t8gc`, nombre interno `tributo-michael-jackson`
- **Server/destination**: `w9xgpps0ojt7o7chlfqgxnca` (localhost, el mismo servidor Coolify) / destination `iczb37rlnvqej4aprs5yr1uc` (red `coolify`)
- **build_pack**: `dockerfile` (usa el `Dockerfile`/`nginx.conf` de este repo, mismo patrón que `AstroPrueba` y `quiz-arica-parinacota` — Node 20 alpine para el build, `nginx:1.27-alpine` para servir `dist/`)
- **Deploy key**: `tributomj-deploy-key` (Coolify uuid `qf1shrfbycelsqxpnv95d7bw`), agregada como Deploy Key de **solo lectura** en este repo de GitHub (id `163204674`, `coolify-tributomj-deploy`).
- **Sin variables de entorno** — el sitio no las necesita (estático, sin API keys ni backend).
- **Redeploy**: `POST /api/v1/deploy?uuid=vy8phalcp3nkbhrckbd8t8gc` (token de API de Coolify, ejecutar el curl desde dentro del servidor por SSH — ver skill de despliegue). No hay webhook de auto-deploy configurado todavía (push a `main` no redespliega solo).

## Pendiente / ideas futuras

- Configurar webhook de GitHub → Coolify para auto-deploy en cada push (hoy hay que disparar el deploy manualmente).
- Agregar monitor en Uptime Kuma apuntando a `https://tributo.codetec.app`.
