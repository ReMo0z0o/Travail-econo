// Statistiques utilisées par les outils interactifs : descriptives, MCO matriciels avec
// erreurs-types classiques, robustes (HC1) et groupées, lois normale et du khi-deux.
// Les résultats sont vérifiés contre R dans tests/verifier.mjs.
(function () {
  'use strict';
  const A = window.A;
  const S = A.stats = {};

  S.somme = (x) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i]; return s; };
  S.moyenne = (x) => S.somme(x) / x.length;
  S.variance = (x) => { const m = S.moyenne(x); let s = 0; for (let i = 0; i < x.length; i++) s += (x[i] - m) * (x[i] - m); return s / (x.length - 1); };
  S.ecartType = (x) => Math.sqrt(S.variance(x));
  // Quantile de type 7 (celui de R par défaut).
  S.quantile = function (x, p) {
    const t = Array.from(x).sort((a, b) => a - b), h = (t.length - 1) * p, i = Math.floor(h);
    return i + 1 < t.length ? t[i] + (h - i) * (t[i + 1] - t[i]) : t[i];
  };
  S.mediane = (x) => S.quantile(x, 0.5);
  // Coefficient d'asymétrie : m3 / m2^(3/2), moments centrés divisés par n (formule de l'atelier).
  S.asymetrie = function (x) {
    const m = S.moyenne(x); let m2 = 0, m3 = 0;
    for (let i = 0; i < x.length; i++) { const d = x[i] - m; m2 += d * d; m3 += d * d * d; }
    m2 /= x.length; m3 /= x.length;
    return m3 / Math.pow(m2, 1.5);
  };
  S.correlation = function (x, y) {
    const mx = S.moyenne(x), my = S.moyenne(y); let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); syy += (y[i] - my) * (y[i] - my); }
    return sxy / Math.sqrt(sxx * syy);
  };

  // Inverse d'une matrice carrée (Gauss-Jordan avec pivot partiel). null si singulière.
  S.inverser = function (M) {
    const n = M.length, a = M.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      if (Math.abs(a[p][c]) < 1e-12) return null;
      [a[c], a[p]] = [a[p], a[c]];
      const d = a[c][c];
      for (let j = 0; j < 2 * n; j++) a[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = a[r][c]; if (f) for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[c][j]; }
    }
    return a.map((r) => r.slice(n));
  };
  const fois = (P, Q) => P.map((r) => Q[0].map((_, j) => r.reduce((s, v, k) => s + v * Q[k][j], 0)));

  // MCO. X : tableau de lignes (constante comprise), y : vecteur. opts.groupes : identifiant de groupe par ligne.
  S.mco = function (X, y, opts) {
    const n = X.length, k = X[0].length;
    const XtX = Array.from({ length: k }, () => new Array(k).fill(0)), Xty = new Array(k).fill(0);
    for (let i = 0; i < n; i++) { const x = X[i]; for (let a = 0; a < k; a++) { Xty[a] += x[a] * y[i]; for (let b = a; b < k; b++) XtX[a][b] += x[a] * x[b]; } }
    for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) XtX[a][b] = XtX[b][a];
    const inv = S.inverser(XtX);
    if (!inv) return null;
    const b = inv.map((r) => r.reduce((s, v, j) => s + v * Xty[j], 0));
    const ajuste = new Array(n), resid = new Array(n);
    let scr = 0, sy = 0;
    for (let i = 0; i < n; i++) { let f = 0; for (let a = 0; a < k; a++) f += X[i][a] * b[a]; ajuste[i] = f; resid[i] = y[i] - f; scr += resid[i] * resid[i]; sy += y[i]; }
    const my = sy / n; let sct = 0;
    for (let i = 0; i < n; i++) sct += (y[i] - my) * (y[i] - my);
    const s2 = scr / (n - k);
    const viande = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < n; i++) { const e2 = resid[i] * resid[i], x = X[i]; for (let a = 0; a < k; a++) for (let c = 0; c < k; c++) viande[a][c] += e2 * x[a] * x[c]; }
    const V = fois(fois(inv, viande), inv).map((r) => r.map((v) => v * n / (n - k)));
    const res = { b, n, k, r2: 1 - scr / sct, scr, s2, ajuste, resid, inv, V,
      se: inv.map((r, i) => Math.sqrt(s2 * r[i])), seHC1: V.map((r, i) => Math.sqrt(r[i])) };
    if (opts && opts.groupes) {
      const sommes = new Map();
      for (let i = 0; i < n; i++) { let s = sommes.get(opts.groupes[i]); if (!s) { s = new Array(k).fill(0); sommes.set(opts.groupes[i], s); } for (let a = 0; a < k; a++) s[a] += X[i][a] * resid[i]; }
      const G = sommes.size, v2 = Array.from({ length: k }, () => new Array(k).fill(0));
      sommes.forEach((s) => { for (let a = 0; a < k; a++) for (let c = 0; c < k; c++) v2[a][c] += s[a] * s[c]; });
      const corr = (G / (G - 1)) * ((n - 1) / (n - k));
      res.G = G; res.VCL = fois(fois(inv, v2), inv).map((r) => r.map((v) => v * corr));
      res.seCL = res.VCL.map((r, i) => Math.sqrt(r[i]));
    }
    return res;
  };
  // Erreur-type d'une combinaison linéaire c'b : sqrt(c' V c).
  S.seCombinaison = function (V, c) { let s = 0; for (let i = 0; i < c.length; i++) for (let j = 0; j < c.length; j++) s += c[i] * V[i][j] * c[j]; return Math.sqrt(s); };

  // Test de Breusch-Pagan studentisé (Koenker) : n × R² de la régression de e² sur Z.
  S.breuschPagan = function (resid, Z) {
    const e2 = resid.map((e) => e * e), m = S.mco(Z, e2);
    return { stat: resid.length * m.r2, ddl: Z[0].length - 1 };
  };

  // Lois.
  S.erf = function (x) {
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  };
  S.normaleCDF = (z) => 0.5 * (1 + S.erf(z / Math.SQRT2));
  S.normalePDF = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  S.pBilaterale = (z) => 2 * (1 - S.normaleCDF(Math.abs(z)));
  function lnGamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
    let s = 1.000000000190015;
    for (let j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) { let ap = a, s = 1 / a, d = s; for (let n = 0; n < 200; n++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-12) break; } return s * Math.exp(-x + a * Math.log(x) - lnGamma(a)); }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 200; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-12) break; }
    return 1 - Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
  }
  S.khi2CDF = (x, k) => gammaP(k / 2, x / 2);
  S.khi2PDF = (x, k) => x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lnGamma(k / 2));
})();
