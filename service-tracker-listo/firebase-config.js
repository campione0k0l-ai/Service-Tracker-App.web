/* =====================================================================
   Service Tracker — conexión con Firebase  (el ÚNICO archivo que tienes que editar)

   1) Firebase → Configuración del proyecto → "Tus apps" → app web (</>) → copia estos valores.
   2) adminEmail: el correo de la ÚNICA cuenta de administrador (ya viene puesto).
      Debe ir en MINÚSCULAS y ser exactamente el mismo que esté en firestore.rules.
      Esa cuenta se crea en la consola de Firebase (Authentication → Usuarios → Agregar usuario);
      la app NO ofrece ninguna pantalla para crear administradores.

   Mientras estos valores sigan como están (PEGA_AQUI…), la app funciona en
   "modo local" (datos solo en cada navegador), sin Firebase.
   Los valores de "firebase" NO son secretos: la seguridad la dan las reglas de firestore.rules.
   ===================================================================== */
window.ST_CLOUD = {
  firebase: {
    apiKey: "AIzaSyAngsdXRiDfSEV1acilDIUuFDRHcNI4CeQ",
    authDomain: "service-tracker-appweb.firebaseapp.com",
    projectId: "service-tracker-appweb",
    storageBucket: "service-tracker-appweb.firebasestorage.app",
    messagingSenderId: "394580108734",
    appId: "1:394580108734:web:5c910215f3491d7f55c5ef"
  },
  adminEmail: "admin.servicetracker@gmail.com"
};
