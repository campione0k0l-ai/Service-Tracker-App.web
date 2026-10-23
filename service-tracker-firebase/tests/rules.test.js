// Pruebas de las reglas de seguridad con el emulador oficial de Firestore.
//   npm install
//   npm run test:rules
// Lee el correo de administrador directamente de firestore.rules, así que funciona con el tuyo.
const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const ADMIN = (RULES.match(/function adminEmail\(\) \{ return '([^']+)'/) || [])[1];
const DAY = 864e5;
let env;

before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-service-tracker', firestore: { rules: RULES } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const as = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const seed = fn => env.withSecurityRulesDisabled(async ctx => fn(ctx.firestore()));
const shopRec = (over = {}) => ({
  code: 'AAAA1111', name: 'Taller', active: true, created: '2026-01-01', owner: null, ownerUid: null, signup: false, modules: {},
  sub: { paid: false, courtesy: false, expires: '2099-01-01', history: [] }, accessUntil: new Date(Date.now() + 7 * DAY), ...over });

async function world() { // administrador + dos talleres con un usuario cada uno
  await seed(async db => {
    await db.doc('config/admin').set({ uid: 'adm', email: ADMIN, name: 'Admin' });
    await db.doc('config/public').set({ adminReady: true, adminName: 'Admin', adminEmail: ADMIN });
    for (const [id, uid, code] of [['s1', 'u1', 'AAAA1111'], ['s2', 'u2', 'BBBB2222']]) {
      await db.doc('shops/' + id).set(shopRec({ code, ownerUid: uid }));
      await db.doc('users/' + uid).set({ shopId: id, name: uid, email: uid + '@x.com' });
      await db.doc('codes/' + code).set({ shopId: id });
      await db.doc('shops/' + id + '/data/meta').set({ ver: 1, n: 1 });
      await db.doc('shops/' + id + '/data/c0').set({ d: '{}', h: 'x' });
    }
  });
}

test('la configuración pública se puede leer sin iniciar sesión', async () => {
  await world();
  await assertSucceeds(anon().doc('config/public').get());
  await assertFails(anon().doc('config/admin').get());
});

test('el administrador solo se crea con el correo autorizado y confirmado, y una sola vez', async () => {
  await assertFails(as('x1', 'otro@x.com').doc('config/admin').set({ uid: 'x1', email: 'otro@x.com', name: 'x' }));
  await assertFails(as('a1', ADMIN, false).doc('config/admin').set({ uid: 'a1', email: ADMIN, name: 'x' }));
  const db = as('a1', ADMIN, true);
  await assertSucceeds(db.doc('config/admin').set({ uid: 'a1', email: ADMIN, name: 'Admin' }));
  await assertFails(as('a2', ADMIN, true).doc('config/admin').set({ uid: 'a2', email: ADMIN, name: 'Otro' }));
  await assertFails(db.doc('config/admin').delete());
});

test('un taller solo lee y escribe sus propios datos', async () => {
  await world();
  const u1 = as('u1', 'u1@x.com');
  await assertSucceeds(u1.doc('shops/s1/data/meta').get());
  await assertSucceeds(u1.doc('shops/s1/data/c0').set({ d: '{"a":1}', h: 'y' }));
  await assertFails(u1.doc('shops/s2/data/meta').get());
  await assertFails(u1.doc('shops/s2/data/c0').set({ d: 'x', h: 'y' }));
  await assertFails(u1.collection('shops').get());
  await assertFails(u1.collection('users').get());
  await assertFails(u1.doc('users/u2').get());
});

test('un taller no puede cambiar su suscripción, su código ni su bloqueo', async () => {
  await world();
  const u1 = as('u1', 'u1@x.com');
  await assertFails(u1.doc('shops/s1').update({ sub: { paid: true, courtesy: true, expires: '2099-12-31', history: [] } }));
  await assertFails(u1.doc('shops/s1').update({ accessUntil: new Date('2100-01-01') }));
  await assertFails(u1.doc('shops/s1').update({ code: 'HACKED11' }));
  await assertFails(u1.doc('users/u1').update({ shopId: 's2' }));
  await assertFails(u1.doc('config/billing').set({ price: 0 }));
});

test('taller bloqueado o con suscripción vencida: Firestore niega sus datos', async () => {
  await world();
  const u1 = as('u1', 'u1@x.com');
  await seed(db => db.doc('shops/s1').update({ active: false }));
  await assertFails(u1.doc('shops/s1/data/meta').get());
  await assertFails(u1.doc('shops/s1/data/c0').set({ d: 'x', h: 'y' }));
  await assertSucceeds(u1.doc('shops/s1').get()); // sí puede ver su estado para mostrar el aviso
  await seed(db => db.doc('shops/s1').update({ active: true, accessUntil: new Date(Date.now() - DAY) }));
  await assertFails(u1.doc('shops/s1/data/meta').get());
  await seed(db => db.doc('shops/s1').update({ accessUntil: new Date(Date.now() + DAY) }));
  await assertSucceeds(u1.doc('shops/s1/data/meta').get());
});

test('el administrador ve y gestiona todos los talleres', async () => {
  await world();
  const adm = as('adm', ADMIN);
  await assertSucceeds(adm.collection('shops').get());
  await assertSucceeds(adm.collection('users').get());
  await assertSucceeds(adm.doc('shops/s2/data/meta').get());
  await assertSucceeds(adm.doc('shops/s2').update({ active: false }));
  await assertSucceeds(adm.doc('config/billing').set({ trialDays: 7, price: 15 }));
  await assertSucceeds(adm.doc('config/rate').set({ date: '2026-10-19', rate: 41 }));
});

test('alta de cuenta nueva: solo un taller propio, con prueba limitada y sin suscripción pagada', async () => {
  const uid = 'n1', email = 'nuevo@x.com';
  const alta = (db, over = {}, id = 'sn', code = 'NNNN1111') => {
    const b = db.batch();
    b.set(db.doc('shops/' + id), shopRec({ code, ownerUid: uid, signup: true, ...over }));
    b.set(db.doc('users/' + uid), { shopId: id, name: 'N', email });
    b.set(db.doc('codes/' + code), { shopId: id });
    b.set(db.doc('shops/' + id + '/data/c0'), { d: '{}', h: 'x' });
    b.set(db.doc('shops/' + id + '/data/meta'), { ver: 1, n: 1 });
    return b.commit();
  };
  const db = as(uid, email);
  await assertFails(alta(db, { accessUntil: new Date(Date.now() + 200 * DAY) }));
  await assertFails(alta(db, { sub: { paid: true, courtesy: false, expires: '2099-01-01', history: [] } }));
  await assertFails(alta(db, { sub: { paid: false, courtesy: true, expires: '', history: [] } }));
  await assertSucceeds(alta(db));
  await assertFails(alta(db, {}, 'sm', 'MMMM2222')); // segundo taller para la misma cuenta
});

test('no se puede reclamar un taller ajeno ni repetir un código', async () => {
  await world();
  const db = as('n2', 'n2@x.com');
  await assertFails(db.doc('users/n2').set({ shopId: 's1', name: 'x', email: 'n2@x.com' }));
  const b = db.batch();
  b.set(db.doc('shops/sz'), shopRec({ code: 'AAAA1111', ownerUid: 'n2', signup: true }));
  b.set(db.doc('users/n2'), { shopId: 'sz', name: 'x', email: 'n2@x.com' });
  b.set(db.doc('codes/AAAA1111'), { shopId: 'sz' });
  await assertFails(b.commit()); // el código AAAA1111 ya existe
});
