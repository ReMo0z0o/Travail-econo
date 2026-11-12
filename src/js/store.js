// Sauvegarde des notes, des choix de raisonnement et de la progression.
//  - toujours dans le navigateur (localStorage), pour un affichage immédiat ;
//  - en plus, dans l'espace privé du lecteur quand la page est ouverte comme artifact
//    claude.ai (capacités "db" + "user") : une fiche par question sous data/users/<id>/.
// L'application fonctionne à l'identique sans aucune des deux.
(function () {
  'use strict';
  const A = window.A;
  const CLE = 'atelier-ecgeb352-v1';
  const etat = { q: {}, oral: { t: 0, c: {} }, ui: { t: 0 } };
  const abonnes = [];
  let mode = 'memoire', collection = null;
  const files = {};            // docId -> { enCours, attente, minuteur }

  function lireLocal() {
    try {
      const brut = window.localStorage.getItem(CLE);
      mode = 'local';
      if (!brut) return;
      const d = JSON.parse(brut);
      if (d && typeof d === 'object') { etat.q = d.q || {}; etat.oral = d.oral || etat.oral; etat.ui = d.ui || etat.ui; }
    } catch (e) { mode = 'memoire'; }
  }
  const ecrireLocal = A.debounce(function () {
    try { window.localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* stockage refusé : on continue en mémoire */ }
  }, 250);

  const docId = (qid) => 'q-' + String(qid).replace('.', '-');
  function donneesDe(id) {
    if (id === 'oral') return etat.oral;
    if (id === 'ui') return etat.ui;
    return etat.q[id.slice(2).replace('-', '.')];
  }
  function pousser(id) {
    if (!collection) return;
    const f = files[id] = files[id] || {};
    if (f.enCours) { f.attente = true; return; }
    const d = donneesDe(id);
    if (!d) return;
    f.enCours = collection.doc(id).set(JSON.parse(JSON.stringify(d)))
      .then(function () { f.essais = 0; }, function (e) {
        // Panne passagère : un seul nouvel essai, après un délai aléatoire. La copie du navigateur reste à jour.
        if (e && e.code === 'unavailable') { if (!f.essais) { f.essais = 1; setTimeout(function () { pousser(id); }, 1500 + Math.random() * 1500); } return; }
        // Écriture refusée (lecteur en lecture seule, quota…) : on reste sur le navigateur pour cette visite.
        collection = null; if (mode === 'compte') mode = 'local'; notifier('mode');
      })
      .then(function () { f.enCours = null; if (f.attente && collection) { f.attente = false; pousser(id); } });
  }
  function planifier(id) {
    ecrireLocal();
    if (!collection) return;
    const f = files[id] = files[id] || {};
    clearTimeout(f.minuteur);
    f.minuteur = setTimeout(() => pousser(id), 1200);
  }
  function notifier(quoi) { abonnes.forEach((fn) => { try { fn(quoi); } catch (e) { /* un abonné défaillant ne bloque pas les autres */ } }); }

  async function brancherCompte() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    let db, user;
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { return; }
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    let col;
    try { col = db.collection('data/users/' + uid); } catch (e) { return; }
    let instantane;
    try {
      instantane = await Promise.race([col.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('delai')), 10000))]);
    } catch (e) { return; }
    collection = col; mode = 'compte';
    let change = false;
    const vus = {};
    instantane.docs.forEach(function (doc) {
      const d = doc.data(); if (!d) return;
      vus[doc.id] = true;
      const local = donneesDe(doc.id);
      if (!local || (d.t || 0) > (local.t || 0)) {
        if (doc.id === 'oral') etat.oral = d; else if (doc.id === 'ui') etat.ui = d; else etat.q[doc.id.slice(2).replace('-', '.')] = d;
        change = true;
      } else if ((local.t || 0) > (d.t || 0)) pousser(doc.id);
    });
    // Ce qui n'existe que dans le navigateur est recopié dans le compte.
    Object.keys(etat.q).forEach((qid) => { if (!vus[docId(qid)] && etat.q[qid].t) pousser(docId(qid)); });
    if (!vus.oral && etat.oral.t) pousser('oral');
    if (change) ecrireLocal();
    notifier(change ? 'charge' : 'mode');
  }

  A.store = {
    etat,
    mode: () => mode,
    abonner(fn) { abonnes.push(fn); },
    q(qid) { return etat.q[qid] || (etat.q[qid] = { t: 0, fait: false, s: {}, quiz: {} }); },
    sous(qid, sid) { const q = this.q(qid); const k = sid || '_'; return q.s[k] || (q.s[k] = { opt: '', txt: '', ok: false }); },
    toucher(qid) { this.q(qid).t = Date.now(); planifier(docId(qid)); notifier('q'); },
    oral(cle, valeur) {
      if (valeur === undefined) return etat.oral.c[cle] || '';
      if (valeur) etat.oral.c[cle] = valeur; else delete etat.oral.c[cle];
      etat.oral.t = Date.now(); planifier('oral'); notifier('oral');
    },
    bilan() {
      const M = A.modele; let fait = 0, sousOk = 0, sousTotal = 0, redige = 0;
      M.ordre.forEach((id) => {
        const q = etat.q[id]; if (q && q.fait) fait++;
        M.questions[id].sous.forEach((s) => { sousTotal++; const e = q && q.s[s.id || '_']; if (e && e.ok) sousOk++; if (e && e.txt && e.txt.trim()) redige++; });
      });
      return { fait, total: M.ordre.length, sousOk, sousTotal, redige };
    },
    bilanPartie(num) {
      const M = A.modele, ids = M.parties.find((p) => p.num === num).questions;
      return { fait: ids.filter((id) => etat.q[id] && etat.q[id].fait).length, total: ids.length };
    },
    demarrer() { lireLocal(); brancherCompte(); }
  };
})();
