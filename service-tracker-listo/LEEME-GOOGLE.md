# Ingreso y registro con Google

La app ya trae los botones **“Continuar con Google”** (inicio de sesión) y **“Registrarme con Google (sin contraseña)”**
(crear cuenta + taller). Solo aparecen en **modo Firebase** (con `firebase-config.js` completo): el modo local no puede hacer OAuth.

## 1. Sobre el SHA-1 y el SHA-256
**No los necesitas.** Son las huellas del certificado de firma de una **app Android** y salen de *tu* llavero (keystore);
yo no tengo acceso a él y cualquier cifra que te diera sería inventada. Esta es una app **web**: Google la identifica por el dominio
autorizado, no por una huella. No hay que pegar SHA-1/SHA-256 en ningún archivo de esta carpeta.

Solo si algún día empaquetas la app como Android (TWA/Capacitor), así los obtienes:
| Tu caso | Comando / ruta |
|---|---|
| Llavero de depuración (Linux/macOS) | `keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android` |
| Llavero de depuración (Windows) | `keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android` |
| Tu llavero de publicación | `keytool -list -v -keystore mi-llavero.jks -alias mi_alias` |
| Proyecto Android Studio | `./gradlew signingReport` |
| Play App Signing | Play Console → *Configuración → Integridad de la app* → certificado de firma **y** de carga |
Busca las líneas `SHA1:` y `SHA256:` y pégalas en Firebase → ⚙ *Configuración del proyecto* → *Tus apps* → app Android → *Agregar huella digital*
(o `firebase apps:android:sha:create <APP_ID> <SHA>`). Luego descarga `google-services.json`. En iOS se usa el *Bundle ID* y `GoogleService-Info.plist`.

## 2. Lo que sí necesitas para la web (5 minutos)
| # | Qué | Dónde |
|---|---|---|
| 1 | Activar Google | Firebase → *Authentication* → *Sign-in method* → **Google** → *Habilitar* |
| 2 | “Nombre público del proyecto” y “Correo de asistencia del proyecto” (son obligatorios) | En esa misma ventana (usa tu Gmail) → *Guardar* |
| 3 | Dominios autorizados | *Authentication* → *Configuración* → *Dominios autorizados* → agrega `tu-sitio.netlify.app` y tu dominio propio (`localhost` ya viene) |
| 4 | Vinculación de cuentas con el mismo correo | *Authentication* → *Configuración* → *Vinculación de cuentas de usuario* → deja **“Vincular cuentas que usan el mismo correo”** (valor por defecto) |
| 5 | *(Solo si Google muestra “app no verificada” o limita a usuarios de prueba)* | Google Cloud Console → *APIs y servicios* → *Pantalla de consentimiento de OAuth* → **Publicar aplicación**. Los permisos básicos (correo, perfil) no requieren verificación |

**No necesitas**: client secret, SHA-1/SHA-256, `google-services.json`, ningún cambio en `firebase-config.js` ni en `firestore.rules`.
(El “ID de cliente web” y el secreto que muestra el proveedor Google solo sirven para código de servidor; esta app no los usa.)

## 3. El código (ya está en `index.html`)
```js
const prov = new firebase.auth.GoogleAuthProvider();
prov.setCustomParameters({ prompt: 'select_account' });      // siempre deja elegir la cuenta
const cred = await firebase.auth().signInWithPopup(prov);    // abre la ventana de Google
const user = cred.user;                                      // user.email, user.displayName, user.uid
```
Funciones de la app: `googleAuth()`, `cloudGoogleLogin()`, `cloudGoogleSignup()`, `cloudFinishSignup()` y los mensajes de error en `googleErr()`.
La política de seguridad de `netlify.toml` / `firebase.json` ya permite `apis.google.com`, `accounts.google.com` y `*.firebaseapp.com`.
**No agregues** la cabecera `Cross-Origin-Opener-Policy: same-origin`: rompe la ventana de Google.

## 4. Cómo se comporta
| Quién | Qué pasa |
|---|---|
| **Administrador** (`admin.servicetracker@gmail.com`) | “Continuar con Google” con esa cuenta → entra **sin código**. La primera vez no hace falta correo de confirmación (Google ya lo verifica) y se inicializa todo. Es lo más seguro: protege la cuenta con la verificación en dos pasos de Google en vez de una contraseña corta. |
| **Dueño de taller nuevo** | “Crear cuenta nueva” → escribe solo el nombre del taller → “Registrarme con Google”. Toma el nombre y el correo de Google, crea el taller con 7 días de prueba y muestra su código. Después entra con “Continuar con Google” + el código. |
| **Empleado creado por el administrador** | Si usa Google con **el mismo correo**, Firebase lo vincula a su cuenta (requiere el ajuste 4) y entra con el código del taller. Si no se vincula, verá “aún no está registrada”: que use su contraseña. |
| **Cuenta de Google sin registrar** | No entra; se le indica cómo registrarse. (Firebase deja una cuenta vacía en *Authentication*; puedes borrarla.) |
| **Correo del administrador en el registro** | Rechazado. La regla de administrador único no cambia. |
Taller bloqueado o suscripción vencida: también se bloquea al entrar con Google (mismas reglas).

## 5. “Correos de Google”
- **Entrar con Gmail o con Google Workspace** funciona igual (cualquier cuenta de Google).
- Los correos de **verificación y restablecimiento** los envía Firebase; no usa tu Gmail ni SMTP. Para personalizarlos: *Authentication → Plantillas* (idioma, texto y, con dominio verificado, el remitente).

## 6. Si algo falla
| Mensaje / síntoma | Causa y solución |
|---|---|
| “El ingreso con Google no está activado” (`auth/operation-not-allowed`) | Paso 1. |
| “Este dominio no está autorizado” (`auth/unauthorized-domain`) | Paso 3. |
| “Tu navegador bloqueó la ventana” | Permitir ventanas emergentes para el sitio. |
| Google dice “Acceso bloqueado: app no verificada” / “disallowed_useragent” | Paso 5, o abre el enlace en Chrome/Safari (no dentro de Instagram, Facebook, WhatsApp…). |
| Entra pero dice “aún no está registrada” | Esa cuenta de Google no tiene taller: usa “Registrarme con Google”, o pídele al administrador que cree su usuario con ese correo. |

## 7. Qué se probó
Con un simulador de Firebase que imita la ventana de Google (23 comprobaciones sin errores): botones, ventana cerrada, proveedor desactivado,
administrador con Google sin código ni confirmación, otra cuenta de Google que no puede ser administrador, registro con Google,
ingreso con código correcto/incorrecto/ausente, registrarse dos veces sin duplicar taller, correo del administrador reservado,
registro con contraseña intacto y bloqueo por el administrador.
**No se probó con la ventana real de Google** (no hay Internet en el entorno de desarrollo): haz una prueba con tu cuenta tras activar el proveedor.
