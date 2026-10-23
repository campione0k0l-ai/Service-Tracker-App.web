/* =====================================================================
   Service Tracker — conexión con Firebase  (el ÚNICO archivo que tienes que editar)

   1) Firebase → Configuración del proyecto → "Tus apps" → app web (</>) → copia estos valores.
   2) adminEmail: el correo de la ÚNICA cuenta de administrador.
      Debe ir en MINÚSCULAS y ser exactamente el mismo que pongas en firestore.rules.

   Mientras estos valores sigan como están (PEGA_AQUI…), la app funciona en
   "modo local" (datos solo en cada navegador), sin Firebase.
   Los valores de "firebase" NO son secretos: la seguridad la dan las reglas de firestore.rules.
   ===================================================================== */
window.ST_CLOUD = {
  firebase: {
    apiKey: "PEGA_AQUI_TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",   // opcional
    messagingSenderId: "000000000000",          // opcional
    appId: "1:000000000000:web:0000000000000000" // opcional
  },
  adminEmail: "admin@tudominio.com"
};
