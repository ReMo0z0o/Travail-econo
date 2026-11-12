// Mini-Markdown de l'atelier : titres, listes, tableaux, code R colorié, formules $...$,
// encadrés (:::type), blocs dépliables (+++), outils interactifs ({{w:nom clé=valeur}}),
// termes du glossaire ([[terme]]). Le contenu est écrit par l'auteur de l'atelier (fiable).
(function () {
  'use strict';
  const A = window.A, esc = A.esc;

  // ------------------------------------------------------------------ maths
  const GREC = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', chi: 'χ', Delta: 'Δ', Sigma: 'Σ' };
  const SYM = Object.assign({ cdot: '·', times: '×', approx: '≈', neq: '≠', leq: '≤', geq: '≥', sum: 'Σ', to: '→', pm: '±', infty: '∞', perp: '⊥', ln: 'ln', exp: 'exp', log: 'log', min: 'min', max: 'max', quad: '\u2003', mid: '|' }, GREC);
  function groupe(s, i) {
    let d = 0, j = i;
    for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (!d) break; } }
    return [s.slice(i + 1, j), j + 1];
  }
  const italiques = (t) => t.replace(/&[a-z]+;|[A-Za-zÀ-ÖØ-öø-ÿ_]+|[α-ω]/g, (w) => (w[0] !== '&' && w.length === 1 && w !== '_') ? '<i>' + w + '</i>' : w);
  function rendu(s) {
    let out = '', buf = '', i = 0;
    const vider = () => { out += italiques(buf); buf = ''; };
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
        if (m) {
          const nom = m[1]; i += m[0].length;
          if (s[i] === '{' && /^(frac|hat|bar|sqrt|text)$/.test(nom)) {
            vider();
            let a; [a, i] = groupe(s, i);
            if (nom === 'frac') { let b; [b, i] = groupe(s, i); out += '<span class="frac"><span>' + rendu(a) + '</span><span>' + rendu(b) + '</span></span>'; }
            else if (nom === 'hat') out += '<span class="chap">' + rendu(a) + '</span>';
            else if (nom === 'bar') out += '<span class="barre-h">' + rendu(a) + '</span>';
            else if (nom === 'sqrt') out += '√<span class="rac">' + rendu(a) + '</span>';
            else out += a;
            continue;
          }
          buf += SYM[nom] != null ? SYM[nom] : m[0];
          continue;
        }
      }
      if ((c === '_' || c === '^') && s[i + 1] === '{') {
        vider();
        let a; [a, i] = groupe(s, i + 1);
        out += (c === '_' ? '<sub>' : '<sup>') + rendu(a) + (c === '_' ? '</sub>' : '</sup>');
        continue;
      }
      buf += c; i++;
    }
    vider();
    return out;
  }
  A.math = (src) => '<span class="math">' + rendu(esc(src.trim())) + '</span>';

  // ------------------------------------------------------- coloration du R
  const RE_R = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?L?\b)|([A-Za-z_.][A-Za-z0-9_.]*)(?=\s*\()/gm;
  A.colorierR = function (code) {
    let out = '', dernier = 0, m;
    RE_R.lastIndex = 0;
    while ((m = RE_R.exec(code))) {
      out += esc(code.slice(dernier, m.index));
      const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'num' : 'fn';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      dernier = m.index + m[0].length;
    }
    return out + esc(code.slice(dernier));
  };

  // ----------------------------------------------------------------- inline
  function typo(t) {
    return t.replace(/ ([:;?!»%€])/g, '\u00a0$1').replace(/« /g, '«\u00a0').replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u202f');
  }
  function inline(src) {
    const cases = [];
    const garder = (html) => { cases.push(html); return '\u0000' + (cases.length - 1) + '\u0000'; };
    let t = src.replace(/`([^`]+)`/g, (_, c) => garder('<code>' + esc(c) + '</code>'));
    t = t.replace(/\$([^$\n]+)\$/g, (_, m) => garder(A.math(m)));
    t = typo(esc(t));
    t = t.replace(/\[\[([^\]]+?)(?:::([^\]]+))?\]\]/g, (_, terme, aff) => '<button type="button" class="terme" data-terme="' + terme.trim() + '">' + (aff || terme).trim() + '</button>');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => /^#/.test(url) ? '<a href="' + url + '">' + txt + '</a>' : '<a href="' + url + '" target="_blank" rel="noopener">' + txt + '</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[\s(«\u00a0'’>])\*([^*\s][^*]*?)\*(?=$|[\s.,;:!?)»\u00a0'’<])/g, '$1<em>$2</em>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, n) => cases[+n]);
  }
  A.inline = inline;

  // ------------------------------------------------------------------ blocs
  const ENCADRES = { cle: 'Idée clé', piege: 'Piège', astuce: 'Astuce', verif: 'À vérifier toi-même', ex: 'Exemple', def: 'Définition', note: 'Note', oral: 'À l’oral', image: 'Une image pour comprendre', calcul: 'Le calcul' };
  const ICO = { cle: 'cle', piege: 'piege', verif: 'ok' };
  const estDebutBloc = (l) => /^(```|:::|\+\+\+|\$\$|\{\{w:|#{1,4} |\||> |>> |- |\d+\. |---\s*$)/.test(l);

  function tableau(lignes) {
    // "\|" = barre verticale littérale dans une cellule (ex. la barre de ivreg).
    const cellules = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
    const tete = cellules(lignes[0]);
    let align = tete.map(() => ''), debut = 1;
    if (lignes[1] && /^\|?[\s:|-]+\|?$/.test(lignes[1]) && lignes[1].includes('-')) {
      align = cellules(lignes[1]).map((c) => /^-+:$/.test(c) ? 'd' : /^:-+:$/.test(c) ? 'c' : '');
      debut = 2;
    }
    const cl = (i) => align[i] ? ' class="' + align[i] + '"' : '';
    let h = '<div class="table-boite"><table><thead><tr>' + tete.map((c, i) => '<th' + cl(i) + '>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
    for (let k = debut; k < lignes.length; k++) h += '<tr>' + cellules(lignes[k]).map((c, i) => '<td' + cl(i) + '>' + inline(c) + '</td>').join('') + '</tr>';
    return h + '</tbody></table></div>';
  }

  function liste(lignes) {
    // Un seul niveau d'imbrication (indentation de 2 espaces ou plus).
    const ordonnee = /^\d+\. /.test(lignes[0]);
    const items = [];
    lignes.forEach((l) => {
      const m = /^(?:- |\d+\. )(.*)$/.exec(l);
      if (m) items.push({ texte: m[1], sous: [] });
      else if (items.length) {
        const t = l.replace(/^\s+/, '');
        if (/^(- |\d+\. )/.test(t)) items[items.length - 1].sous.push(t);
        else if (items[items.length - 1].sous.length) items[items.length - 1].sous[items[items.length - 1].sous.length - 1] += ' ' + t;
        else items[items.length - 1].texte += ' ' + t;
      }
    });
    const tag = ordonnee ? 'ol' : 'ul';
    return '<' + tag + '>' + items.map((it) => '<li>' + inline(it.texte) + (it.sous.length ? liste(it.sous) : '') + '</li>').join('') + '</' + tag + '>';
  }

  A.md = function (src) {
    if (!src) return '';
    const L = String(src).replace(/\r\n?/g, '\n').split('\n');
    let out = '', i = 0;
    while (i < L.length) {
      const l = L[i];
      if (!l.trim()) { i++; continue; }
      if (/^```/.test(l)) {
        const lang = l.slice(3).trim(), corps = [];
        i++;
        while (i < L.length && !/^```\s*$/.test(L[i])) corps.push(L[i++]);
        i++;
        const code = corps.join('\n');
        out += lang === 'r' ? '<pre class="code"><code>' + A.colorierR(code) + '</code></pre>' : '<pre class="code sortie"><code>' + esc(code) + '</code></pre>';
        continue;
      }
      if (/^:::/.test(l)) {
        const m = /^:::(\w+)\s*(.*)$/.exec(l), corps = [];
        i++;
        while (i < L.length && !/^:::\s*$/.test(L[i])) corps.push(L[i++]);
        i++;
        const type = m ? m[1] : 'note', titre = (m && m[2]) || ENCADRES[type] || 'Note';
        out += '<div class="encadre ' + type + '"><div class="etiquette">' + (ICO[type] ? A.ICONES[ICO[type]] : '') + inline(titre) + '</div>' + A.md(corps.join('\n')) + '</div>';
        continue;
      }
      if (/^\+\+\+/.test(l)) {
        const titre = l.slice(3).trim() || 'Aller plus loin', corps = [];
        i++;
        while (i < L.length && !/^\+\+\+\s*$/.test(L[i])) corps.push(L[i++]);
        i++;
        out += '<details class="plus"><summary>' + inline(titre) + '</summary><div class="interieur">' + A.md(corps.join('\n')) + '</div></details>';
        continue;
      }
      if (/^\$\$/.test(l)) {
        let f = l.replace(/^\$\$/, '');
        while (!/\$\$\s*$/.test(f) && i + 1 < L.length) f += ' ' + L[++i];
        i++;
        out += '<div class="equation">' + A.math(f.replace(/\$\$\s*$/, '')) + '</div>';
        continue;
      }
      if (/^\{\{w:/.test(l)) {
        const m = /^\{\{w:([\w-]+)\s*(.*?)\}\}\s*$/.exec(l);
        if (m) {
          const p = {};
          m[2].replace(/([\w-]+)=("[^"]*"|\S+)/g, (_, k, v) => { p[k] = v.replace(/^"|"$/g, ''); return ''; });
          out += '<div class="widget" data-w="' + m[1] + '" data-p="' + esc(JSON.stringify(p)) + '"></div>';
        }
        i++; continue;
      }
      let m;
      if ((m = /^(#{1,4}) (.*)$/.exec(l))) { out += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'; i++; continue; }
      if (/^---\s*$/.test(l)) { out += '<hr>'; i++; continue; }
      if (/^\|/.test(l)) { const t = []; while (i < L.length && /^\|/.test(L[i])) t.push(L[i++]); out += tableau(t); continue; }
      if (/^>> /.test(l)) { let t = l.slice(3); i++; while (i < L.length && L[i].trim() && !estDebutBloc(L[i])) t += ' ' + L[i++]; out += '<p class="chapo">' + inline(t) + '</p>'; continue; }
      if (/^> /.test(l)) { const t = []; while (i < L.length && /^>( |$)/.test(L[i])) t.push(L[i++].replace(/^> ?/, '')); out += '<blockquote>' + A.md(t.join('\n')) + '</blockquote>'; continue; }
      if (/^(- |\d+\. )/.test(l)) {
        const t = [];
        while (i < L.length && (/^(- |\d+\. )/.test(L[i]) || (/^\s{2,}\S/.test(L[i]) && t.length))) t.push(L[i++]);
        out += liste(t); continue;
      }
      let p = l; i++;
      while (i < L.length && L[i].trim() && !estDebutBloc(L[i])) p += ' ' + L[i++];
      out += '<p>' + inline(p) + '</p>';
    }
    return out;
  };

  // Texte brut (pour la recherche).
  A.brut = (src) => String(src || '').replace(/```[\s\S]*?```/g, ' ').replace(/\{\{w:[^}]*\}\}/g, ' ').replace(/[`*$#>|\\{}\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
})();
