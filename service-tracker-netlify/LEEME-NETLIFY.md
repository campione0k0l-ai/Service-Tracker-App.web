# Publicar Service Tracker en Netlify

## Qué contiene esta carpeta
| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa (un solo archivo). |
| `firebase-config.js` | Conexión opcional con Firebase (déjalo como está para seguir en modo local). |
| `netlify.toml` | Configuración de Netlify: seguridad (HTTPS, cabeceras) y que siempre cargue la versión más reciente. |
| `.github/workflows/deploy.yml` | **Opcional.** Despliegue automático desde GitHub. No lo necesitas para arrastrar y soltar. |

## ¿Necesito claves?
- **La aplicación no usa claves ni APIs.** No hay que configurar variables de entorno.
- **Opción A (arrastrar y soltar): no necesitas ninguna clave**, solo una cuenta gratuita en netlify.com.
- Solo las opciones B y C piden dos datos **personales de tu cuenta de Netlify** (nadie más puede generarlos):
  - `NETLIFY_AUTH_TOKEN`: Netlify → tu foto de perfil → *User settings* → *Applications* → *Personal access tokens* → *New access token*.
  - `NETLIFY_SITE_ID`: Netlify → tu sitio → *Site configuration* → *Site details* → **Site ID**.
  - Trátalos como contraseñas: no los pegues en chats ni en archivos que subas a repositorios públicos.

## Opción A — Arrastrar y soltar (la más fácil)
1. Entra a https://app.netlify.com y crea tu cuenta (o inicia sesión).
2. *Add new site* → **Deploy manually**.
3. Arrastra **esta carpeta completa** (o el `.zip`) al recuadro.
4. En segundos recibes una dirección `https://algo.netlify.app`. Puedes cambiarla en *Site configuration → Change site name*.
5. Para actualizar la app más adelante: *Deploys* → arrastra la carpeta nueva.

## Opción B — Línea de comandos
```bash
npm install -g netlify-cli
netlify login                     # abre el navegador para autorizar
netlify deploy --prod --dir .     # estando dentro de esta carpeta
```
En servidores o scripts (sin navegador):
```bash
export NETLIFY_AUTH_TOKEN="tu_token"
export NETLIFY_SITE_ID="tu_site_id"
netlify deploy --prod --dir . --site "$NETLIFY_SITE_ID" --auth "$NETLIFY_AUTH_TOKEN"
```

## Opción C — Desde GitHub (despliegue automático)
1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify: *Add new site* → *Import an existing project* → elige el repositorio. *Build command*: vacío. *Publish directory*: `.`
3. Cada cambio que subas a `main` se publica solo.
   (Alternativa: usa `.github/workflows/deploy.yml` y crea los secretos `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID` en *Settings → Secrets and variables → Actions*.)

## Después de publicar
1. Abre tu dirección `https://…netlify.app`. La primera vez aparece **“Primer inicio”**: ahí se crea la cuenta de administrador y el primer taller. **Hazlo tú mismo antes de compartir el enlace** y guarda tu clave de recuperación.
2. En *Ajustes* define tus datos y descarga un **respaldo** de vez en cuando.
3. Dominio propio: *Domain management → Add a domain*. El HTTPS es automático y gratuito.

> **Novedad:** esta carpeta ya incluye soporte para Firebase. Si quieres que los datos vivan en la nube y se compartan entre equipos, sigue la guía de la carpeta `firebase-deploy` (`LEEME-FIREBASE.md`). Sin configurar `firebase-config.js`, la app sigue en modo local como se describe aquí.

## Importante: dónde se guardan los datos (modo local)
Esta versión **no tiene servidor**: toda la información se guarda en el navegador de cada persona (almacenamiento local).
- Cada navegador o dispositivo que abra el enlace tiene **su propia copia vacía** de la app y **su propio administrador**.
- Lo que se registre en un equipo **no aparece en otro**, y el administrador **no verá** las cuentas creadas por otras personas en sus equipos.
- Por eso las **suscripciones, los bloqueos y la prueba de 7 días funcionan solo dentro de un mismo navegador**: no se pueden hacer cumplir entre equipos distintos.
- Borrar los datos del navegador borra la información: usa los respaldos de *Ajustes*.

Para operar como servicio real (varios usuarios en equipos distintos, un administrador que vea y bloquee talleres de verdad, cobros por suscripción), hace falta una base de datos en línea con inicio de sesión (por ejemplo Supabase o Firebase). La aplicación se puede conectar a una; es un paso aparte.
