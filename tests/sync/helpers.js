/* In-page helpers (evaluated in the app page via CDP). Synthetic data only. */
'use strict';
module.exports = String.raw`(() => {
  if (window.__gq) return true;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__gq = {
    async signIn(email, password) {
      state.settings.communityOptIn = true; persistState();
      communityOpen();
      for (let i = 0; i < 200 && !document.getElementById('community-email'); i++) await wait(50);
      const e = document.getElementById('community-email'), p = document.getElementById('community-password');
      if (!e || !p) return 'NO_FORM';
      e.value = email; p.value = password;
      await communitySignIn();
      return 'ok';
    },
    async signOut() { await communitySignOut(); return 'ok'; },
    addWorkout(id, date) {
      state.history.push({ id, planId: 'push', planName: 'Push', date: date || todayISO(), xp: 20, note: '',
        exercises: [{ name: 'Squats', exId: 'squats', sets: 3, reps: 5, weight: 60, setsDone: 3 }] });
      reconcileAchievements(); saveState(); renderAll(); return state.history.length;
    },
    addCustomPlan(id) {
      state.plans[id] = { id, builtin: false, customName: 'Test ' + id, location: null,
        exercises: [{ id: 'cx-' + id, name: 'My exercise ' + id, sets: 3, reps: 10, weight: 0 }] };
      state.planOrder.push(id); saveState(); return true;
    },
    addMeasurement(id, kg) { state.measurements.push(cleanMeasurement({ id, date: todayISO(), weightKg: kg || 80 })); saveState(); return true; },
    setGoal(n) { state.settings.weeklyGoal = n; syncGoalSnapshot(); saveState(); return true; },
    async addProgress(id, seed) {
      const blob = new Blob(['progress-' + seed + '-' + 'x'.repeat(64)], { type: 'image/jpeg' });
      const thumb = new Blob(['thumb-' + seed], { type: 'image/jpeg' });
      await idbWriteProgress({ id, date: todayISO(), note: 'note ' + seed, view: 'front', seq: 1, w: 10, h: 10, mime: 'image/jpeg', size: blob.size, addedAt: Date.now() },
        { id, blob, thumb, origName: '' });
      progressMeta = (await idbGetAll(PROGRESS_META_STORE)).map(cleanProgressMeta).filter(Boolean);
      return true;
    },
    async addPersonal(id, seed, ex) {
      const blob = new Blob(['personal-' + seed + '-' + 'y'.repeat(64)], { type: 'image/jpeg' });
      await idbWriteMetaAndBlob({ id, exerciseKey: ex || 'squats', kind: 'image', name: 'p-' + seed, type: 'image/jpeg', size: blob.size, seq: 1, hasPoster: false },
        { id, blob, posterBlob: null });
      return true;
    },
    async mediaHashes() {
      if (!mediaDb) mediaDb = await openMediaDb();
      const out = {};
      for (const m of await idbGetAll(PROGRESS_META_STORE)) { const r = await idbGetProgress(m.id); out['p:' + m.id] = r && r.blob ? await cloudSha256(r.blob) : null; }
      for (const m of await idbGetAll(MEDIA_META_STORE)) { const r = await idbGetBlob(m.id); out['m:' + m.id] = r && r.blob ? await cloudSha256(r.blob) : null; }
      return out;
    },
    async snap() {
      let journal = null, recovery = [];
      try { journal = (await syncDbAll('kv')).filter((x) => String(x.k).indexOf('journal:') === 0).length; recovery = (await syncDbAll('recovery')).map((r) => ({ id: r.id, kind: r.kind, keep: r.keep, hist: r.counts && r.counts.history, prior: (r.prior || []).length })); } catch (e) {}
      const meta = wsSlot ? syncMetaRead() : null;
      let reg = null; try { reg = JSON.parse(localStorage.getItem('gymquest_workspaces')); } catch (e) {}
      return {
        slot: wsSlot && wsSlot.id, owner: wsSlot && wsSlot.owner, stateKey: STORAGE_KEY, mediaDb: MEDIA_DB_NAME,
        hist: (state.history || []).map((h) => h.id).sort(), plans: Object.keys(state.plans || {}).sort(),
        achievements: Object.keys(state.achievements || {}).length, achIds: Object.keys(state.achievements || {}).sort(), meas: (state.measurements || []).length,
        activeSession: !!state.activeSession, lang: state.settings.lang,
        media: await this.mediaHashes(), meta, dirty: meta ? syncIsDirty(meta) : null,
        status: syncStatusKey(), lastError: syncLastError, notice: syncNotice, link: !!wsLinkUser, journal, recovery, registry: reg,
        localLine: (document.getElementById('sync-local-line') || {}).textContent || '',
        cloudLine: (document.getElementById('sync-cloud-line') || {}).textContent || '',
        chipHidden: (document.getElementById('btn-sync-chip') || {}).hidden,
        syncModal: !document.getElementById('modal-sync').hidden,
        syncModalTitle: document.getElementById('sync-modal-title').textContent,
        storageWarning: !document.getElementById('app-storage-warning').hidden,
      };
    },
    async syncNow() { await syncKick('test'); await syncChain; await syncChain; return true; },
    click(action) { const b = document.querySelector('[data-sync-action="' + action + '"]'); if (!b) return false; b.click(); return true; },
    lsKeys() { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = (localStorage.getItem(k) || '').length; } return o; },
  };
  return true;
})()`;
