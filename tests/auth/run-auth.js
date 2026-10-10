/* GymQuest account-email flows (signup confirmation, resend, password reset) — verification.
   Uses ONLY the disposable test accounts (GQ_CREDS_DIR + GQ_TEST_IDS, see tests/sync/README.md).
   Never triggers an email to an undeliverable address:
   - failure / rate-limit / offline paths are exercised by substituting the Auth response in the browser;
   - reset/confirmation LINKS are produced by an admin "generate link" helper (GQ_GENLINK: a command
     that writes a link to a file WITHOUT sending email) and opened in a real browser;
   - real server calls are only made where Supabase sends nothing (already-confirmed account signup,
     reset for a never-registered address).
   Email RECEIPT cannot be verified here — it needs an authorized inbox (see README). */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { startServer, Browser, Observer, loadCreds, readPublicConfig, waitFor } = require('../sync/lib');

const REPO = path.resolve(__dirname, '..', '..');
const PORT = 8124;
const BASE = process.env.GQ_BASE || 'http://localhost:' + PORT + '/';
const WORK = process.env.GQ_WORK || path.join(os.tmpdir(), 'gq-auth-work');
const PROFILES = path.join(WORK, 'profiles');
let nextPort = 9620;
const results = [];
let current = null;
const browsers = [];
function check(name, cond, detail) {
  const ok = !!cond;
  current.checks.push({ name, ok });
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (ok ? '' : '  -> ' + String(JSON.stringify(detail)).slice(0, 500)));
  return ok;
}
async function device(name) {
  const b = new Browser(name + '-' + Date.now().toString(36), nextPort++, PROFILES);
  browsers.push(b);
  const p = await b.launch();
  await p.navigate(BASE);
  await p.eval(`(document.getElementById('modal-setup').hidden = true, true)`);
  return { b, p };
}
async function openSignInForm(p) {
  await p.eval(`(async () => { state.settings.communityOptIn = true; persistState(); communityOpen();
    for (let i = 0; i < 200 && !document.getElementById('community-email'); i++) await new Promise((r) => setTimeout(r, 50)); return true; })()`);
}
async function fill(p, email, password) {
  await p.eval(`(() => { document.getElementById('community-email').value = ${JSON.stringify(email)}; document.getElementById('community-password').value = ${JSON.stringify(password)}; return true; })()`);
}
const communityMsg = (p) => p.eval(`(document.getElementById('community-status') || {}).textContent || ''`);
const authMsg = (p) => p.eval(`(document.getElementById('auth-status') && !document.getElementById('auth-status').hidden ? document.getElementById('auth-status').textContent : '') || ((document.querySelector('#auth-body .card-note') || {}).textContent || '')`);
const T = (p, key, vars) => p.eval(`t(${JSON.stringify(key)}, ${JSON.stringify(vars || null)})`);
async function clickCommunity(p, action) { await p.eval(`(document.querySelector('[data-community-action="${action}"]').click(), true)`); }
async function clickAuth(p, action) { await p.eval(`(document.querySelector('[data-auth-action="${action}"]').click(), true)`); }
async function settle(p) { await p.eval(`new Promise((r) => setTimeout(r, 600)).then(() => true)`); }

/* Browser-level substitution of Auth responses (no request reaches Supabase). */
async function intercept(p, pattern, responder) {
  const hits = [];
  await p.c.send('Fetch.enable', { patterns: [{ urlPattern: pattern, requestStage: 'Request' }] });
  const handler = async (ev) => {
    if (ev.request.method === 'OPTIONS') {
      await p.c.send('Fetch.fulfillRequest', { requestId: ev.requestId, responseCode: 200, responseHeaders: cors() });
      return;
    }
    hits.push(ev.request.url.replace(/\?.*$/, ''));
    const r = responder(hits.length);
    if (r.fail) { await p.c.send('Fetch.failRequest', { requestId: ev.requestId, errorReason: r.fail }); return; }
    await p.c.send('Fetch.fulfillRequest', { requestId: ev.requestId, responseCode: r.status,
      responseHeaders: cors().concat([{ name: 'Content-Type', value: 'application/json' }]),
      body: Buffer.from(JSON.stringify(r.body || {})).toString('base64') });
  };
  p.c.on('Fetch.requestPaused', handler);
  return { hits, async stop() { p.c.off('Fetch.requestPaused', handler); await p.c.send('Fetch.disable'); } };
}
function cors() {
  return [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,OPTIONS' }];
}
const RATE = { status: 429, body: { code: 'over_email_send_rate_limit', msg: 'For security purposes, you can only request this after 42 seconds.' } };
const SEND_FAIL = { status: 500, body: { code: 'unexpected_failure', msg: 'Error sending confirmation email' } };

function genLink(type, email, out) {
  const cmd = process.env.GQ_GENLINK;
  if (!cmd) throw new Error('GQ_GENLINK not set');
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', cmd, '-Type', type, '-Email', email, '-Redirect', BASE, '-Out', out], { stdio: 'ignore' });
  const link = fs.readFileSync(out, 'utf8').trim();
  fs.unlinkSync(out);
  return link;
}
function userStatus(id) {
  const out = execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', process.env.GQ_GENLINK, '-StatusId', id], { encoding: 'utf8' });
  return JSON.parse(out.trim().split(/\r?\n/).pop());
}
async function openLink(p, link) {
  const before = p.loads;
  await p.c.send('Page.navigate', { url: link });
  await waitFor(() => p.loads > before, 60000, 'link load');
  await waitFor(() => p.eval(`!!syncStartupPromise`).catch(() => false), 30000, 'app start');
  await p.ready();
}

const scenarios = [];
function scenario(name, fn) { scenarios.push({ name, fn }); }

scenario('E: signup/resend/reset show truthful rate-limit, failure and offline messages (no false "sent")', async () => {
  const { p } = await device('e');
  await openSignInForm(p);
  const sent = await T(p, 'auth.signUpRequested');
  await fill(p, 'gq-validation', 'secret123');
  await clickCommunity(p, 'signup'); await settle(p);
  check('invalid email rejected before any request', (await communityMsg(p)) === (await T(p, 'auth.errInvalidEmail')));
  await fill(p, 'gq-e-check@gymquest-tests.com', '123');
  await clickCommunity(p, 'signup'); await settle(p);
  check('short password rejected before any request', (await communityMsg(p)) === (await T(p, 'auth.errWeakPassword', { n: 6 })));
  let ic = await intercept(p, '*auth/v1/signup*', () => RATE);
  await fill(p, 'gq-e-check@gymquest-tests.com', 'secret123');
  await clickCommunity(p, 'signup'); await settle(p);
  let m = await communityMsg(p);
  check('signup rate limit: shows the wait time, never claims sending', ic.hits.length === 1 && m.indexOf('42') >= 0 && m !== sent, m);
  await ic.stop();
  ic = await intercept(p, '*auth/v1/signup*', () => SEND_FAIL);
  await fill(p, 'gq-e-check@gymquest-tests.com', 'secret123');
  await clickCommunity(p, 'signup'); await settle(p);
  m = await communityMsg(p);
  check('provider/send failure: "could not be sent", never claims sending', m === (await T(p, 'auth.errEmailNotSent')), m);
  await ic.stop();
  ic = await intercept(p, '*auth/v1/signup*', () => ({ fail: 'InternetDisconnected' }));
  await fill(p, 'gq-e-check@gymquest-tests.com', 'secret123');
  await clickCommunity(p, 'signup'); await settle(p);
  m = await communityMsg(p);
  check('network failure: offline message', m === (await T(p, 'auth.errNetwork')), m);
  await ic.stop();
  ic = await intercept(p, '*auth/v1/resend*', (n) => (n === 1 ? RATE : { status: 200, body: {} }));
  await fill(p, 'gq-e-check@gymquest-tests.com', '');
  await clickCommunity(p, 'resend-confirm'); await settle(p);
  m = await communityMsg(p);
  check('resend rate limit: wait time shown', m.indexOf('42') >= 0, m);
  await clickCommunity(p, 'resend-confirm'); await settle(p);
  m = await communityMsg(p);
  check('resend accepted: neutral "if an unconfirmed account exists" message', m === (await T(p, 'auth.resendRequested')), m);
  const btn = await p.eval(`(() => { const b = document.querySelector('[data-community-action="resend-confirm"]'); return { disabled: b.disabled, text: b.textContent }; })()`);
  check('resend button enters a visible cooldown', btn.disabled === true && /\d/.test(btn.text), btn);
  const hitsBefore = ic.hits.length;
  await p.eval(`(authResendConfirmation('gq-e-check@gymquest-tests.com', (x) => { window.__r = x; }), true)`); await settle(p);
  check('during cooldown no request is sent', ic.hits.length === hitsBefore && /\d/.test(await p.eval('window.__r')), await p.eval('window.__r'));
  await ic.stop();
  await p.eval(`(localStorage.removeItem('gymquest_mail_cooldown'), authAskReset('gq-e-check@gymquest-tests.com'), true)`);
  ic = await intercept(p, '*auth/v1/recover*', (n) => (n === 1 ? RATE : { status: 200, body: {} }));
  await clickAuth(p, 'send-reset'); await settle(p);
  m = await authMsg(p);
  check('reset rate limit: wait time shown, still on the request form', m.indexOf('42') >= 0 && (await p.eval(`!!document.getElementById('auth-email')`)), m);
  await clickAuth(p, 'send-reset'); await settle(p);
  m = await authMsg(p);
  check('reset accepted: neutral "if an account exists" message', m === (await T(p, 'auth.resetRequested')), m);
  await ic.stop();
  check('no page exceptions', p.errors.length === 0, p.errors);
});

scenario('F: signup with an already-registered email is indistinguishable and sends nothing', async (ctx) => {
  const before = userStatus(ctx.A.id);
  const { p } = await device('f');
  await openSignInForm(p);
  await fill(p, ctx.A.email, 'Different-' + Math.random().toString(36).slice(2, 10));
  await clickCommunity(p, 'signup');
  await waitFor(() => communityMsg(p).then((m) => m.length > 0), 30000, 'signup message');
  const m = await communityMsg(p);
  check('same neutral message as a new signup', m === (await T(p, 'auth.signUpRequested')), m);
  check('no session created by signing up an existing email', (await p.eval('syncSessionUser().then((u) => u === null)')) === true);
  const after = userStatus(ctx.A.id);
  check('server sent no email to the existing account (confirmation_sent_at unchanged)', after.confirmation_sent_at === before.confirmation_sent_at, { before: before.confirmation_sent_at, after: after.confirmation_sent_at });
  const obs = await new Observer(ctx.cfg, ctx.A).login().then(() => true).catch(() => false);
  check('existing account password unchanged', obs === true);
});

scenario('K: password reset response does not reveal whether an account exists', async () => {
  const { p } = await device('k');
  const nobody = 'gq-nobody-' + Date.now().toString(36) + '@gymquest-tests.com';
  await p.eval(`(authAskReset(${JSON.stringify(nobody)}), true)`);
  await clickAuth(p, 'send-reset');
  await waitFor(() => p.eval(`authCallbackState.view === 'sent' || !(document.getElementById('auth-status') || {}).hidden`), 30000, 'reset response');
  const realNobody = await authMsg(p);
  check('never-registered address (real server call): neutral message', realNobody === (await T(p, 'auth.resetRequested')), realNobody);
  await p.eval(`(localStorage.removeItem('gymquest_mail_cooldown'), authAskReset('gq-existing@gymquest-tests.com'), true)`);
  const ic = await intercept(p, '*auth/v1/recover*', () => ({ status: 200, body: {} }));
  await clickAuth(p, 'send-reset'); await settle(p);
  const existing = await authMsg(p);
  await ic.stop();
  check('existing-account response renders the identical message', existing === realNobody, { existing, realNobody });
});

scenario('H/I/J: reset link opens the GymQuest reset flow; new password works; reused or tampered links fail cleanly', async (ctx) => {
  const tmp = path.join(WORK, 'l' + Date.now().toString(36));
  const link = genLink('recovery', ctx.A.email, tmp);
  const { p } = await device('h');
  await openLink(p, link);
  await waitFor(() => p.eval(`!!document.getElementById('auth-newpass')`).catch(() => false), 30000, 'recovery form');
  check('H: link lands on GymQuest with the set-new-password form', await p.eval(`!!document.getElementById('auth-newpass') && authCallbackState.view === 'recovery'`));
  check('H: tokens removed from the address bar', !(await p.eval(`/access_token|refresh_token|token=|code=/.test(location.href)`)));
  const newPw = 'Gq-' + Math.random().toString(36).slice(2, 12) + '-R1';
  await p.eval(`(() => { document.getElementById('auth-newpass').value = '123'; document.getElementById('auth-newpass2').value = '123'; return true; })()`);
  await clickAuth(p, 'set-password'); await settle(p);
  check('I: too-short password refused', (await authMsg(p)).length > 0 && (await p.eval(`authCallbackState.view === 'recovery'`)));
  await p.eval(`(() => { document.getElementById('auth-newpass').value = ${JSON.stringify(newPw)}; document.getElementById('auth-newpass2').value = ${JSON.stringify(newPw)}; return true; })()`);
  await p.eval(`(window.__setpw = authSetNewPassword().then(() => true), true)`);
  await p.eval('window.__setpw');
  check('I: password updated', await p.eval(`authCallbackState.view === 'updated'`), await p.eval('authCallbackState'));
  ctx.A.password = newPw;
  ctx.saveCreds('a', ctx.A);
  const oldWorks = await new Observer(ctx.cfg, Object.assign({}, ctx.A, { password: ctx.oldPasswordA })).login().then(() => true).catch(() => false);
  const newWorks = await new Observer(ctx.cfg, ctx.A).login().then(() => true).catch(() => false);
  check('I: new password signs in, old one no longer does', newWorks && !oldWorks, { newWorks, oldWorks });
  const d2 = await device('h2');
  await openSignInForm(d2.p);
  await fill(d2.p, ctx.A.email, newPw);
  try { await d2.p.eval(`communitySignIn().then(() => true)`); } catch (e) { /* workspace switch reload */ }
  await d2.p.ready();
  check('I: normal GymQuest sign-in with the new password', (await d2.p.eval(`syncSessionUser().then((u) => u && u.id)`)) === ctx.A.id);
  const d3 = await device('j');
  await openLink(d3.p, link);
  await waitFor(() => d3.p.eval(`authCallbackState.view !== 'idle'`).catch(() => false), 30000, 'reused link view');
  check('J: reused link shows the invalid/expired page, nothing succeeds', (await d3.p.eval(`authCallbackState.view`)) === 'expired' && (await d3.p.eval(`syncSessionUser().then((u) => u === null)`)), await d3.p.eval('authCallbackState.view'));
  check('J: expired page offers both a new reset link and a new confirmation link', await d3.p.eval(`!!document.querySelector('[data-auth-action="send-reset"]') && !!document.querySelector('[data-auth-action="resend-confirm"]')`));
  const tampered = link.replace(/token=([^&]+)/, (m0, tok) => 'token=' + tok.split('').reverse().join(''));
  const d4 = await device('j2');
  await openLink(d4.p, tampered);
  await waitFor(() => d4.p.eval(`authCallbackState.view !== 'idle'`).catch(() => false), 30000, 'tampered link view');
  check('J: tampered link shows the invalid/expired page', (await d4.p.eval(`authCallbackState.view`)) === 'expired');
  check('J: password still the one set via the valid link', await new Observer(ctx.cfg, ctx.A).login().then(() => true).catch(() => false));
});

scenario('C (partial): an email sign-in link returns to GymQuest and signs in the intended account', async (ctx) => {
  const tmp = path.join(WORK, 'm' + Date.now().toString(36));
  const link = genLink('magiclink', ctx.B.email, tmp);
  const { p } = await device('c');
  await openLink(p, link);
  await waitFor(() => p.eval(`authCallbackState.view === 'confirmed'`).catch(() => false), 30000, 'confirmed view');
  check('lands on GymQuest with the "email confirmed / signed in" view', await p.eval(`authCallbackState.view === 'confirmed' && authCallbackState.signedIn === true`));
  check('signed in as the intended account and bound to its workspace', (await p.eval(`syncSessionUser().then((u) => u && u.id)`)) === ctx.B.id && (await p.eval('wsSlot.owner')) === ctx.B.id);
  check('tokens removed from the address bar', !(await p.eval(`/access_token|refresh_token|token=/.test(location.href)`)));
});

(async () => {
  fs.mkdirSync(PROFILES, { recursive: true });
  const server = process.env.GQ_BASE ? null : await startServer(PORT, { new: REPO });
  const cfg = readPublicConfig(REPO);
  const A = loadCreds('a'), B = loadCreds('b');
  const ctx = { A, B, cfg, oldPasswordA: A.password,
    saveCreds(n, c) { fs.writeFileSync(path.join(process.env.GQ_CREDS_DIR, 'cred-' + n + '.json'), JSON.stringify({ email: c.email, password: c.password, id: c.id })); } };
  const filter = process.argv[2] ? new RegExp(process.argv[2], 'i') : null;
  for (const sc of scenarios) {
    if (filter && !filter.test(sc.name)) continue;
    current = { name: sc.name, checks: [], error: null };
    results.push(current);
    console.log('\n== ' + sc.name);
    try { await sc.fn(ctx); } catch (e) { current.error = String(e && e.stack || e); console.log('  ERROR ' + current.error.split('\n').slice(0, 3).join(' | ')); }
    while (browsers.length) { const b = browsers.pop(); try { await b.closeGraceful(); } catch (e) { b.killHard(true); } }
  }
  if (server) await server.close();
  const pass = results.reduce((n, r) => n + r.checks.filter((c) => c.ok).length, 0);
  const fail = results.reduce((n, r) => n + r.checks.filter((c) => !c.ok).length, 0);
  const errs = results.filter((r) => r.error).length;
  fs.writeFileSync(path.join(WORK, 'auth-results.json'), JSON.stringify({ at: new Date().toISOString(), base: BASE, pass, fail, errors: errs, results }, null, 2));
  console.log('\n==== checks: ' + pass + ' passed, ' + fail + ' failed; scenario errors: ' + errs + ' ====');
  process.exit(fail || errs ? 1 : 0);
})();
