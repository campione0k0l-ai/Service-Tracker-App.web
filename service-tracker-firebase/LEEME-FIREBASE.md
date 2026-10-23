# Service Tracker con base de datos en la nube (Firebase)

Con Firebase los datos dejan de vivir en cada navegador: se guardan en la nube, se comparten entre
dispositivos, y las reglas de seguridad **las aplica el servidor de Google**, no la app.

## Qué contiene esta carpeta
| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación (la misma de siempre; usa Firebase cuando `firebase-config.js` está completo). |
| `firebase-config.js` | **Lo único que editas**: datos de tu proyecto Firebase y el correo del administrador. |
| `firestore.rules` | Reglas de seguridad (administrador único, aislamiento por taller, suscripción). **Editas 1 línea.** |
| `firestore.indexes.json` | Índices de Firestore (vacío: no se necesitan). |
| `firebase.json`, `.firebaserc` | Para publicar reglas y/o el sitio con la herramienta de Firebase (opcional). |
| `netlify.toml` | Para publicar el sitio en Netlify (opcional). Incluye la política de seguridad que permite Firebase. |
| `tests/rules.test.js`, `package.json` | Pruebas de las reglas con el emulador oficial (recomendado). |

## Datos que tienes que conseguir tú (yo no puedo generarlos)
| Dato | Dónde se obtiene | Dónde se pone |
|---|---|---|
| `apiKey`, `authDomain`, `projectId` (y los opcionales `storageBucket`, `messagingSenderId`, `appId`) | Firebase → ⚙ Configuración del proyecto → *Tus apps* → app web `</>` → “Configuración del SDK” | `firebase-config.js` |
| Correo del administrador (en **minúsculas**) | El tuyo | `firebase-config.js` (`adminEmail`) **y** `firestore.rules` (línea `adminEmail()`), idénticos |

> `apiKey` **no es una contraseña**: solo identifica el proyecto. Lo que protege tus datos son las reglas.
> No necesitas claves de servicio, ni tokens, ni variables de entorno.

## Paso a paso
1. **Crea el proyecto**: https://console.firebase.google.com → *Agregar proyecto* (puedes desactivar Google Analytics).
2. **Activa el inicio de sesión**: *Authentication* → *Comenzar* → pestaña *Sign-in method* → habilita **Correo electrónico/contraseña**.
   (Deja desactivado “Acceso con vínculo por correo” y los demás proveedores.)
3. **Crea la base de datos**: *Firestore Database* → *Crear base de datos* → **modo de producción** → elige región cercana (p. ej. `us-east1`).
4. **Registra la app web**: ⚙ Configuración del proyecto → *Tus apps* → `</>` → ponle un nombre → copia el objeto `firebaseConfig`.
5. **Edita `firebase-config.js`**: pega esos valores y escribe tu `adminEmail` (minúsculas).
6. **Edita `firestore.rules`**: en la línea marcada `<<<<<`, cambia `admin@tudominio.com` por **el mismo** correo.
7. **Publica las reglas**: *Firestore Database* → pestaña *Reglas* → pega el contenido de `firestore.rules` → **Publicar**.
   (O con la herramienta: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules`, tras poner tu proyecto en `.firebaserc`.)
8. **Autoriza tu dominio**: *Authentication* → *Configuración* → *Dominios autorizados* → agrega tu dirección de Netlify (`algo.netlify.app`) o tu dominio propio.
9. **Publica el sitio**: arrastra esta carpeta a Netlify (*Add new site → Deploy manually*) **o** `firebase deploy --only hosting`.
10. **Crea el administrador — hazlo tú, primero**: abre el sitio. Verás “Configuración inicial” con tu correo ya fijado.
    Completa los datos → te llega un correo de confirmación → ábrelo → vuelve y pulsa **“Ya confirmé mi correo”**.
    Desde ese momento **nadie más puede crear una cuenta de administrador** (ver abajo).
11. *(Opcional)* *Authentication → Plantillas*: pon los correos de verificación y de restablecimiento en español.

## Cómo queda la regla “solo una cuenta de administrador”
- La cuenta de administrador solo puede crearla **el correo que pusiste en `adminEmail`**, y **solo con ese correo ya confirmado**
  (un desconocido que se registre con tu correo antes que tú no puede confirmarlo, así que no puede tomar el control).
- Una vez creada, el servidor **rechaza** crear otra, reemplazarla o borrarla. El formulario de “Crear cuenta nueva” rechaza ese correo.
- Todas las demás cuentas son usuarios normales: o se registran solas (cada una crea **un** taller con prueba gratis), o las crea el administrador.

## Qué se guarda y dónde (modelo de datos)
| Ruta | Contenido | Quién puede |
|---|---|---|
| `config/public` | ¿Hay administrador? (nombre y correo públicos) | Leer: cualquiera · Crear: administrador (una vez) |
| `config/admin` | `uid`, correo, nombre del administrador | Leer: cuentas con sesión · Crear: una vez · Borrar: nadie |
| `config/billing`, `config/rate` | Datos de pago de la suscripción · tasa del día | Leer: sesión · Escribir: administrador |
| `codes/{CÓDIGO}` | Garantiza que cada código de taller sea único | Administrador |
| `users/{uid}` | A qué taller pertenece cada cuenta | Leer: la propia cuenta/administrador |
| `shops/{id}` | Nombre, código, suscripción, bloqueo, titular, `accessUntil` | Leer: su taller/administrador · Escribir: **solo administrador** |
| `shops/{id}/data/meta` y `c0, c1…` | Los datos del taller (clientes, servicios, facturas…) en fragmentos de 250 000 caracteres | Su taller **mientras esté activo y con suscripción vigente**, y el administrador |

Si un taller está **bloqueado** o su **suscripción venció**, Firestore le **niega la lectura y escritura** de sus datos
(`accessUntil` lo calcula la app al registrar pagos/extensiones; solo el administrador puede modificarlo).

## Límites y costos que debes conocer
- **Gratis (plan Spark)**: ~50 000 lecturas y 20 000 escrituras al día en Firestore. La app guarda con 1,2 s de retraso y solo reescribe los fragmentos que cambian; un taller pequeño queda muy por debajo. Si crecen mucho, Firebase pasa a cobro por uso: configura una **alerta de presupuesto** (Google Cloud → Facturación).
- **Dos personas editando a la vez el mismo taller**: gana el último en guardar; si otro dispositivo guardó antes, la app avisa y carga la versión más reciente (puedes perder lo que tu pantalla aún no había guardado).
- **Permisos dentro de un taller**: las reglas aíslan talleres y suscripciones, pero los permisos finos de cada empleado (quién ve facturas, etc.) los aplica la app. Un empleado con conocimientos técnicos podría saltárselos **dentro de su propio taller**; no puede tocar otros talleres, su suscripción ni al administrador.
- **Eliminar usuarios o talleres** borra sus datos y su perfil, pero la cuenta de acceso queda en *Authentication* (bórrala a mano si quieres liberar el correo).
- **Correo de acceso**: no se puede cambiar desde la app. **Recuperar contraseña** funciona por el correo de Firebase (ya no existe la “clave de recuperación” del modo local).
- **Restaurar todos los talleres a la vez** no está disponible en modo nube; sí **respaldar todos** y **restaurar un taller** (Ajustes).

## Pasar los datos que ya tienes (modo local) a la nube
En la versión local: *Ajustes → Respaldo → Descargar* (por taller). En la versión con Firebase, entra como administrador →
*Talleres → Entrar* al taller destino → *Ajustes → Restaurar* y elige el archivo.

## Cómo comprobar que las reglas funcionan (hazlo antes de abrir al público)
**Con el emulador (recomendado)**: `npm install` y luego `npm run test:rules` (requiere Node 18+ y Java). Ejecuta 8 pruebas: administrador único,
aislamiento entre talleres, bloqueo/vencimiento, alta de cuentas y que no se pueda reclamar un taller ajeno.
**A mano**: crea 2 cuentas con “Crear cuenta nueva” y comprueba que una no ve los datos de la otra; bloquea una desde *Suscripciones* y verifica que se bloquea en vivo.

## Qué se probó y qué no (importante)
- **Probado**: todo el flujo de la app en modo nube (configuración inicial con confirmación de correo, registro, ingreso con código, aislamiento, bloqueo y vencimiento en vivo, pagos, usuarios creados por el administrador, dos dispositivos sincronizados, cambio y recuperación de contraseña) y con la política de seguridad de `netlify.toml`.
  Se hizo contra **un simulador local de Firebase que aplica las mismas reglas**, porque desde el entorno de desarrollo no hay conexión a Internet.
- **No probado**: contra un proyecto real de Firebase (ni el SDK real, ni la sintaxis de `firestore.rules` en el motor de Google, ni los correos reales). Por eso incluí `tests/rules.test.js` y la lista de arriba: **ejecútalos una vez** antes de usar datos reales.

## Si algo falla
| Mensaje | Causa probable |
|---|---|
| “No se pudo conectar con Firebase… permission-denied” | Aún no publicaste `firestore.rules`, o el `adminEmail` no coincide en ambos archivos. |
| `auth/operation-not-allowed` | No activaste *Correo electrónico/contraseña* (paso 2). |
| “Falta configurar adminEmail” | `adminEmail` sigue con el valor de ejemplo. |
| No llega el correo de confirmación | Revisa spam; en *Authentication → Plantillas* verifica el remitente; reenvía desde la pantalla. |
| `auth/unauthorized-domain` / enlaces rotos | Agrega tu dominio en *Dominios autorizados* (paso 8). |
| La app abre en “modo local” | `firebase-config.js` no se cargó o `apiKey` sigue como `PEGA_AQUI…`. |
