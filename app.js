/* How to Live Better — reading site. Content: eternity4719/HowToLiveBetter (CC BY 4.0). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
/* ---------- i18n ---------- */
const I = window.HTLB_I18N, LANG = window.HTLB_LANG || 'zh-CN';
const STR = I.str[LANG] || I.str['zh-CN'];
const t = (k, v) => { let s = STR[k]; if (s == null || s === '') s = (I.str.en[k] || I.str['zh-CN'][k] || k); return v ? s.replace(/\{(\w+)\}/g, (_, x) => v[x] != null ? v[x] : '') : s; };
const IS_ZH = LANG === 'zh-CN' || LANG === 'zh-TW';
/* non-Chinese locales without their own content translation read the English overlay (never the Chinese original) */
const CONTENT = { 'zh-TW': 1, en: 1, es: 1 }[LANG] ? LANG : (IS_ZH ? '' : 'en');
const LOCALE = { 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' }[LANG] || LANG;
const chT = c => (I.titles[LANG] && I.titles[LANG][c.n]) || c.t;
const LABEL = { m:{'0':t('m0'),'少':t('m少'),'多':t('m多')}, ti:{'少':t('ti少'),'中':t('ti中'),'多':t('ti多')}, w:{'否':t('w否'),'些':t('w些'),'是':t('w是')} };
const ZERO = { m:'0', ti:'少', w:'否' };
const LENS = {'死亡率':t('ln死亡率'),'金钱':t('ln金钱'),'时间':t('ln时间'),'自由':t('ln自由')};
const RATE = r => t('r' + r);
const LENS_ORDER = ['死亡率','时间','金钱','自由'];
const RES_LENS = {'寿命':'死亡率','时间与精力':'时间','金钱':'金钱','人身自由':'自由'};
const ICON = {
  '死亡率':'<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/><path d="M3 12h4l2-3 3 6 2-3h7"/></svg>',
  '时间':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  '金钱':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 8l3 4 3-4M12 12v6M9 13h6M9 16h6"/></svg>',
  '自由':'<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>'
};
const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
const LINK = '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
const SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const GH = 'https://github.com/eternity4719/HowToLiveBetter';

let D, OV, ALL = [], CH = {};
const docCache = {};

/* ---------- theme / chrome ---------- */
$('#theme').onclick = () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  $('meta[name=theme-color]').content = t === 'dark' ? '#08090a' : '#fafafa';
  try { localStorage.setItem('htlb-theme-v8', t); } catch (e) {}
};
addEventListener('scroll', () => $('#top').classList.toggle('scrolled', scrollY > 8), { passive: true });
$('#sbtn').onclick = () => { location.hash = '#/search'; setTimeout(() => $('#q')?.focus(), 60); };
addEventListener('keydown', e => {
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#sbtn').click(); }
});
/* ---------- motion: spotlight, reveal, ticker ---------- */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('pointermove', e => {
  const el = e.target.closest && e.target.closest('.spot');
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });
const rvIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); rvIO.unobserve(en.target); }
}), { rootMargin: '0px 0px -6% 0px' }) : null;
function reveal(root = app) {
  $$('.rv:not(.in)', root).forEach((el, i) => {
    if (!rvIO || RM) { el.classList.add('in'); return; }
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i, 8) * 50 + 'ms');
    rvIO.observe(el);
  });
  $$('[data-count]', root).forEach(el => {
    const to = +el.dataset.count; if (RM || !to) { el.textContent = to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1100;
    const step = now => { const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(to * k).toLocaleString(); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function moveInd() {
  const on = $('#tabs a.on'), ind = $('#tabind'); if (!ind) return;
  if (!on) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1; ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`;
}
addEventListener('resize', moveInd);
document.fonts && document.fonts.ready.then(moveInd);
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1800); }
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a && !a.getAttribute('href').startsWith('#/')) {
    e.preventDefault();
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const el = document.getElementById(id) || $$('.prose h2,.prose h3').find(h => h.textContent.trim() === id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
  const cp = e.target.closest('[data-copy]');
  if (cp) {
    const url = location.origin + location.pathname + cp.dataset.copy;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(t('copied')), () => toast(url));
  }
});

/* ---------- data ---------- */
const ovP = CONTENT ? fetch('data/i18n-' + CONTENT + '.json?v=10').then(r => r.json()).catch(() => null) : Promise.resolve(null);
Promise.all([fetch('data/book.json').then(r => r.json()), ovP]).then(([d, ov]) => {
  D = d; OV = ov;
  if (ov) applyOverlay(d, ov);
  for (const c of d.ch) {
    CH[c.n] = c;
    c.cnt = { A: 0, B: 0, C: 0, '极高': 0 };
    for (const e of c.e) {
      e.c = c.n; c.cnt[e.g]++; if (e.r === '极高') c.cnt['极高']++;
      e.hay = [e.t, e.human, e.cost, e.gain, e.note, e.src, e.zh ? Object.values(e.zh).join('\n') : ''].join('\n').replace(/<[^>]+>/g, '').toLowerCase();
      ALL.push(e);
    }
  }
  const cm = $('#fcommit') || {}; cm.textContent = d.meta.commit.slice(0, 7) + '（' + d.meta.date.slice(0, 10) + '）'; cm.href = GH + '/commit/' + d.meta.commit;
  route();
}).catch(err => { console.error(err); app.innerHTML = '<div class="wrap empty">' + esc(t('loadFail')) + '</div>'; });
function applyOverlay(d, ov) {
  for (const c of d.ch) {
    const oc = ov.ch && ov.ch[c.n];
    if (oc) { if (oc.t) { c.zt = c.t; c.t = oc.t; } if (oc.intro) c.intro = oc.intro; if (oc.q) d.q[c.n] = oc.q; }
    for (const e of c.e) {
      const oe = ov.e && ov.e[c.n + '-' + e.n]; if (!oe) continue;
      e.zh = {}; e.tr = 0;
      for (const k of ['t', 'human', 'cost', 'gain', 'note']) if (oe[k]) { e.zh[k] = e[k]; e[k] = oe[k]; e.tr++; }
      if (oe.src) e.src = oe.src;
    }
  }
  if (ov.q) Object.assign(d.q, ov.q);
  if (ov.gloss) d.gloss = ov.gloss;
  if (ov.rd) Object.assign(d.rd, ov.rd);
  if (ov.docs) d.docs.forEach(x => ov.docs[x.id] && Object.assign(x, ov.docs[x.id]));
  if (ov.meta) Object.assign(d.meta, ov.meta);
}
addEventListener('hashchange', route);

function setNav(r) { $$('#tabs a,#bottom a').forEach(a => a.classList.toggle('on', a.dataset.r === r)); moveInd(); }
function parseHash() {
  // Accept original deep links like #e-1-16
  const raw = location.hash.replace(/^#/, '');
  const m = /^e-(\d+)-(\d+)$/.exec(raw);
  if (m) {
    history.replaceState(null, '', '#/c/' + m[1] + '/' + m[2]);
    return { parts: ['c', m[1], m[2]], q: new URLSearchParams() };
  }
  const h = raw.replace(/^\/?/, '');
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs || '') };
}
let lastKey = '';
function route() {
  if (!D) return;
  const { parts, q } = parseHash();
  const p0 = parts[0] || '';
  const key = p0 + '/' + (parts[1] || '');
  const same = key === lastKey; lastKey = key;
  if (p0 === 'c') return chapter(+parts[1] || 1, +parts[2] || 0, same);
  if (!same) scrollTo(0, 0);
  if (p0 === 'search') return search(q);
  if (p0 === 'docs') return docs();
  if (p0 === 'doc' || (p0 === 'rec' && parts[1])) return doc(parts[1], p0);
  if (p0 === 'rec') return recs();
  if (p0 === 'gloss') return gloss();
  if (p0 === 'about') return about(parts[1]);
  home();
}
function render(html, nav, title) {
  app.innerHTML = html; setNav(nav);
  document.title = (title ? title + ' · ' : '') + t('site');
  $$('.prose table', app).forEach(t => { if (!t.parentElement.classList.contains('tw')) { const w = document.createElement('div'); w.className = 'tw'; t.before(w); w.append(t); } });
  reveal();
}

/* ---------- pieces ---------- */
function evBar(c) {
  const t = c.e.length;
  return `<div class="ev" aria-hidden="true"><i class="a" style="width:${c.cnt.A / t * 100}%"></i><i class="b" style="width:${c.cnt.B / t * 100}%"></i><i class="c" style="width:${c.cnt.C / t * 100}%"></i></div>`;
}
function hl(html, terms) {
  if (!terms || !terms.length) return html;
  const re = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return html.split(/(<[^>]+>)/).map(s => s.startsWith('<') ? s : s.replace(re, '<mark>$1</mark>')).join('');
}

function formatSrc(html) {
  if (!html) return '—';
  // Shorten visible URL text; keep full href + title for hover/copy
  let s = String(html).replace(/<a\s+([^>]*href="([^"]+)"[^>]*)>(https?:\/\/[^<]+)<\/a>/gi, (_, attrs, href, text) => {
    let label = text;
    try {
      const u = new URL(href);
      const host = u.hostname.replace(/^www\./, '');
      const path = u.pathname + (u.search || '');
      let shortPath = path === '/' ? '' : path;
      if (shortPath.length > 28) shortPath = shortPath.slice(0, 14) + '…' + shortPath.slice(-10);
      label = host + shortPath;
    } catch (e) {
      label = text.length > 56 ? text.slice(0, 54) + '…' : text;
    }
    return `<a ${attrs} class="src-a" title="${esc(text)}">${esc(label)}</a>`;
  });
  const parts = s.split(/\s*;\s+/).map(x => x.trim()).filter(Boolean);
  if (parts.length <= 1) return `<div class="src-item">${s}</div>`;
  return `<ul class="src-list">${parts.map(x => `<li class="src-item">${x}</li>`).join('')}</ul>`;
}

function entryHTML(e, o = {}) {
  const tt = o.terms;
  const rc = { '极高': 'r3', '高': 'r2', '一般': 'r1' }[e.r] || 'r1';
  const cost = ['m', 'ti', 'w'].map(k => LABEL[k][e[k]] ? `<span class="tg${e[k] === ZERO[k] ? ' z' : ''}">${LABEL[k][e[k]]}</span>` : '').join('');
  return `<article class="entry${o.compact ? ' compact' : ''}" id="${o.compact ? 'w' : ''}e${e.c}-${e.n}">
    <header class="eh">
      <span class="en">${o.showCh || o.compact ? `${e.c}.` : ''}${e.n}</span>
      <h3>${o.compact ? esc(e.t) : `<a href="#/c/${e.c}/${e.n}">${hl(esc(e.t), tt)}</a>`}</h3>
      ${o.compact ? '' : `<button class="cp" data-copy="#/c/${e.c}/${e.n}" aria-label="${esc(t('copyLink'))}" title="${esc(t('copyTitle'))}">${LINK}</button>`}
    </header>
    <div class="meta-row">
      ${o.showCh ? `<a class="tg chl" href="#/c/${e.c}">${esc(t('chNT', { n: e.c, t: chT(CH[e.c]) }))}</a>` : ''}
      <span class="rate ${rc}" title="${esc(t('rateTitle'))}">${esc(t('rate', { r: RATE(e.r) }))}</span>
      <span class="gd g${e.g}" title="${esc(t('evTitle', { g: gf(e) }))}"><i></i>${esc(t('ev', { g: e.g }))}</span>
      <span class="tg ln">${LENS[e.ln] || e.ln}</span>
      ${cost}
      ${e.dp ? `<span class="tg warn">${t('dispute')}</span>` : ''}${e.todo ? `<span class="tg warn">${t('todo')}</span>` : ''}
    </div>
    ${e.human ? `<p class="human"><span class="lb">${t('plain')}</span>${hl(e.human, tt)}</p>` : ''}
    <div class="cg">
      <div class="col"><div class="k">${t('cost')}<span>${t('costSub')}</span></div><div class="v">${hl(e.cost, tt)}</div></div>
      <div class="col"><div class="k">${t('gain')}<span>${t('gainSub')}</span></div><div class="v">${hl(e.gain, tt)}</div></div>
    </div>
    ${o.compact ? '' : `${e.note ? `<div class="note"><span class="k">${t('note')}</span><div>${hl(e.note, tt)}</div></div>` : ''}
    <details class="src"${o.open ? ' open' : ''}><summary><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>${t('sources')}<span class="cnt">${esc(t('ev', { g: gf(e) }))}</span></summary><div class="body">${formatSrc(e.src)}</div></details>`}
  </article>`;
}

/* ---------- home ---------- */
const SOURCES = IS_ZH ? [['国务院', '国务院'], ['最高人民法院', '最高人民法院'], ['JAMA', 'JAMA'], ['国家卫生健康委', '国家卫健委'], ['Cochrane', 'Cochrane'], ['Lancet', 'The Lancet'], ['公安部', '公安部'], ['New England Journal of Medicine', 'NEJM'], ['BMJ', 'BMJ']]
  : [['State Council', 'State Council'], ["Supreme People's Court", "Supreme People's Court"], ['JAMA', 'JAMA'], ['National Health Commission', 'NHC'], ['Cochrane', 'Cochrane'], ['Lancet', 'The Lancet'], ['Ministry of Public Security', 'Public Security'], ['New England Journal of Medicine', 'NEJM'], ['BMJ', 'BMJ']];
function home() {
  const m = D.meta, s = m.stats;
  const pick = (c, n) => CH[c] && CH[c].e.find(e => e.n === n);
  const firstOf = ln => ALL.find(e => e.r === '极高' && e.g === 'A' && e.ln === ln);
  const wins = [pick(1, 16) || ALL[0], firstOf('金钱'), firstOf('自由') || firstOf('时间')].filter(Boolean);
  const srcN = SOURCES.map(([k, label]) => [k, label, ALL.filter(e => e.src && e.src.includes(k)).length]);
  const ord = { '极高': 0, '高': 1, '一般': 2 }, gord = { A: 0, B: 1, C: 2 };
  const res = m.res4.map(r => {
    const ln = RES_LENS[r.k];
    const top = ALL.filter(e => e.ln === ln).sort((a, b) => ord[a.r] - ord[b.r] || gord[a.g] - gord[b.g]).slice(0, 3);
    return `<div class="tile">
      <div class="stage">
        <div class="th"><span class="ti">${ICON[ln]}</span><b>${esc(t('res' + r.k))}</b><span class="tn">${m.lensN[ln]}</span></div>
        <p class="tv">${esc(IS_ZH ? r.v : t('resv' + r.k))}</p>
        <ul class="tl">${top.map(e => `<li><a href="#/c/${e.c}/${e.n}"><span>↳</span>${esc(e.t)}</a></li>`).join('')}</ul>
      </div>
      <a class="tf" href="#/search?ln=${encodeURIComponent(ln)}"><span>${LENS[ln]}</span><span class="go">${esc(t('seeAll', { n: m.lensN[ln] }))} ${ARROW}</span></a>
    </div>`;
  }).join('');
  const chs = D.ch.map(c => `<a class="cell" href="#/c/${c.n}"><span class="cn">${pad(c.n)}</span><b>${esc(chT(c))}</b>${IS_ZH || LANG === 'en' ? `<small>${esc(D.q[c.n] || '')}</small>` : ''}<span class="cf">${evBar(c)}<span class="cc">${esc(t('cellCount', { n: c.e.length, a: c.cnt.A }))}</span><span class="ca">${ARROW}</span></span></a>`).join('');
  const longs = IS_ZH ? D.docs.filter(d => d.kind === 'doc').map(docRow).join('') : zhOnly();
  const sugg = (IS_ZH || LANG === 'en' ? [2, 5, 7, 13] : []).filter(n => D.q[n]).map(n => `<li><a href="#/c/${n}"><span>↳</span><em>${esc(D.q[n])}</em></a></li>`).join('');
  const lede = m.lede[0].split('。').filter(Boolean);
  render(`
  <section class="hero">
    <div class="wrap">
      <a class="announce ld" style="--i:0" href="#/about"><b>${esc(t('announce', { n: s.entries }))}</b><span>${esc(t('announceSub', { c: m.commit.slice(0, 7) }))}</span>${CHEV}</a>
      <h1 class="ld" style="--i:1"><span>${esc(t('h1a'))}</span><span>${esc(t('h1b'))}</span></h1>
      <div class="hgrid">
        <div class="hcopy">
          <p class="lede ld" style="--i:2"><b>${esc(t('ledeB'))}</b>${IS_ZH ? esc(lede.slice(0, 2).join('。')) + '。' : ' ' + esc(t('heroLede'))}</p>
          <div class="cta ld" style="--i:3"><a class="btn pri" href="#/c/1"><span>${esc(t('ctaStart'))}</span><span class="bi">${ARROW}</span></a><a class="btn out" href="#/search?r=极高&g=A">${esc(t('ctaTop'))}</a></div>
          <form class="hsearch ld" style="--i:4" id="hs" role="search">${SEARCH}<input id="hq" type="search" placeholder="${esc(t('heroPh', { n: s.entries }))}" autocomplete="off"><kbd>↵</kbd></form>
          <ul class="sugg ld" style="--i:5">${sugg}</ul>
        </div>
        <div class="hwin ld" style="--i:3">
          <div class="sheet s2" aria-hidden="true"></div><div class="sheet s1" aria-hidden="true"></div>
          <div class="win">
            <div class="wbar"><span class="dots"><i></i><i></i><i></i></span><span class="path" id="wpath"></span></div>
            <div class="wtabs" role="tablist">${wins.map((e, i) => `<button role="tab" data-i="${i}" class="${i ? '' : 'on'}"><span>${e.c}.${e.n}</span>${esc(LENS[e.ln])}</button>`).join('')}</div>
            <div class="wbody" id="wbody"></div>
            <a class="wopen" id="wopen" href="#">${esc(t('openThis'))} ${ARROW}</a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="strip"><div class="wrap"><p>${esc(t('strip'))}</p><div class="marks">${srcN.map(([k, l, n]) => `<a href="#/search?q=${encodeURIComponent(k)}" title="${esc(t('stripTitle', { l }))}"><b>${esc(l)}</b><small>${n}</small></a>`).join('')}</div></div></section>
  <section class="sec"><div class="wrap">
    <header class="sh"><p class="kk">${t('resKk')}</p><h2>${t('resH2')}</h2><p class="sub"><b>${t('resSubB')}</b> ${t('resSub')}</p></header>
    <div class="tray">${res}</div>
  </div></section>
  <section class="sec"><div class="wrap">
    <header class="sh row"><div><p class="kk">${t('tocKk')}</p><h2>${esc(t('tocH2', { n: D.ch.length }))}</h2><p class="sub"><b>${t('tocSubB')}</b> ${t('tocSub')} <i class="lg a"></i>A <i class="lg b"></i>B <i class="lg c"></i>C</p></div><a class="btn out sm" href="#/search">${t('byFilter')} ${ARROW}</a></header>
    <div class="cgrid">${chs}<div class="cell fill"><b>${t('fillB')}</b><small>${esc(t('fillS', { n: ALL.filter(e => e.r === '极高' && e.g === 'A').length }))}</small><span class="cf"><a class="btn pri sm" href="#/search?r=极高&g=A"><span>${t('fillBtn')}</span><span class="bi">${ARROW}</span></a><a class="btn out sm" href="#/search?m=0">${t('freeBtn')}</a></span></div></div>
  </div></section>
  <section class="sec"><div class="wrap two">
    <div><header class="sh sm"><p class="kk">${t('longKk')}</p><h2>${t('longH2')}</h2></header><div class="dlist">${longs}</div><a class="more" href="#/docs">${t('allLongs')} ${ARROW}</a></div>
    <div><header class="sh sm"><p class="kk">${t('howKk')}</p><h2>${t('howH2')}</h2></header><div class="dlist">
      <a class="drow" href="#/about"><b>${t('evRowB')}</b><small>${t('evRowS')}</small><span class="dm">A ${s.A} · B ${s.B} · C ${s.C}</span></a>
      <a class="drow" href="#/about"><b>${t('rateRowB')}</b><small>${t('rateRowS')}</small><span class="dm">${s['极高']} · ${s['高']} · ${s['一般']}</span></a>
      <a class="drow" href="#/gloss"><b>${t('gloss')}</b><small>${t('glossRowS')}</small><span class="dm">${esc(t('nItems', { n: D.gloss.length }))}</span></a>
      <a class="drow" href="#/rec"><b>${t('rec')}</b><small>${t('recRowS')}</small><span class="dm">${esc(t('nDocs', { n: D.docs.filter(d => d.kind === 'rec').length }))}</span></a>
    </div>
    ${IS_ZH ? `<div class="notes">${m.notes.map((n, i) => `<div class="nt"><span class="nk">${[t('noteUse'), t('noteWarn'), t('noteDecl')][i] || ''}</span><p>${n}</p></div>`).join('')}</div>` : `<div class="notes">${langNote()}</div>`}
    </div>
  </div></section>`, 'home');
  $('#hs').onsubmit = e => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent($('#hq').value.trim()); };
  const show = i => {
    const e = wins[i];
    $$('.wtabs button').forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#wbody').innerHTML = entryHTML(e, { compact: true });
    $('#wpath').textContent = `${t('chNT', { n: e.c, t: chT(CH[e.c]) })}  /  #e-${e.c}-${e.n}`;
    $('#wopen').href = `#/c/${e.c}/${e.n}`;
  };
  $$('.wtabs button').forEach(b => b.onclick = () => show(+b.dataset.i));
  show(0);
}
/* long reads and verification records exist only in Chinese: non-Chinese pages point to the Chinese version instead of showing it */
function gf(e) { if (IS_ZH || !e.gfull || !/[\u4e00-\u9fff]/.test(e.gfull)) return e.gfull || e.g; return /争议/.test(e.gfull) ? `${e.g} (${t('dispute')})` : e.g; }
function zhOnly() { return `<div class="lnote"><p>${esc(t('cPageZh'))} <a href="#" data-setlang="zh-CN">${esc(I.str['zh-CN'].langName)}</a></p></div>`; }
function docRow(d) {
  const mins = Math.max(1, Math.round(d.chars / 500));
  return `<a class="drow spot rv" href="#/${d.kind === 'rec' ? 'rec' : 'doc'}/${d.id}"><b>${esc(d.title)}</b><small>${esc(d.lead)}</small><span class="dm">${esc(t('mins', { n: mins }))}</span></a>`;
}
const docCard = docRow;

/* ---------- chapter ---------- */
let cf = { n: 0, g: new Set(), r: new Set(), ln: new Set(), q: '' };
function chapter(n, focus, same) {
  const c = CH[n]; if (!c) return home();
  if (cf.n !== n) cf = { n, g: new Set(), r: new Set(), ln: new Set(), q: '' };
  if (!same || !$('#elist')) {
    const sideLinks = D.ch.map(x => `<a href="#/c/${x.n}" class="${x.n === n ? 'on' : ''}" title="${esc(chT(x))}"><span class="sn">${pad(x.n)}</span><span class="st">${esc(chT(x))}</span><span class="sc">${x.e.length}</span></a>`).join('');
    const prev = CH[n - 1], next = CH[n + 1];
    render(`<div class="wrap cpage">
      <aside class="side" id="cside">
        <div class="group"><div class="gt">${t('lnGroup')}</div><div class="seg col" id="side-ln">${LENS_ORDER.map(k => `<button class="chip" data-ln="${k}" aria-pressed="false"${c.e.some(e => e.ln === k) ? '' : ' disabled hidden'}><span class="ic">${ICON[k]}</span>${LENS[k]}<span class="n">${c.e.filter(e => e.ln === k).length}</span></button>`).join('')}</div></div>
        <div class="group grow"><div class="gt">${t('chapters')}<small>${esc(t('nCh', { n: D.ch.length }))}</small></div><nav class="snav">${sideLinks}</nav></div>
      </aside>
      <div class="cmain">
        <div class="mchap"><select id="chsel" aria-label="${esc(t('switchCh'))}">${D.ch.map(x => `<option value="${x.n}"${x.n === n ? ' selected' : ''}>${pad(x.n)} · ${esc(chT(x))}</option>`).join('')}</select></div>
        <header class="chead">
          <p class="crumbs"><a href="#/">${t('home')}</a><span>/</span><a href="#/c/1">${t('read')}</a><span>/</span><span>${esc(t('chN', { n }))}</span></p>
          <h1><span class="no">${pad(n)}</span>${esc(chT(c))}</h1>
          ${D.q[n] && (IS_ZH || LANG === 'en') ? `<p class="q"><b>${t('answers')}</b>${esc(D.q[n])}</p>` : ''}
          <div class="cstat"><span>${t('statN', { n: c.e.length })}</span><span>${t('statA', { n: c.cnt.A })}</span><span>${t('statTop', { n: c.cnt['极高'] })}</span>${evBar(c)}</div>
          ${IS_ZH && LANG === 'zh-CN' ? '' : `<div class="lnote">${langNote()}</div>`}
        </header>
        <details class="intro"${c.e.length ? '' : ' open'}><summary><span>${t('intro')}</span><svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body">${c.intro}</div></details>
        <div class="fbar" id="fbar">
          <label class="mini">${SEARCH}<input id="cq" type="search" placeholder="${esc(t('filterPh'))}" value="${esc(cf.q)}"></label>
          <div class="seg">${['A', 'B', 'C'].map(g => `<button class="chip" data-g="${g}">${esc(t('ev', { g }))}<span class="n">${c.cnt[g]}</span></button>`).join('')}</div>
          <div class="seg">${['极高', '高', '一般'].map(r => `<button class="chip" data-r="${r}">${esc(RATE(r))}</button>`).join('')}</div>
          <span class="cnt" id="ccnt"></span>
        </div>
        <div class="elist" id="elist"></div>
        <nav class="pager">${prev ? `<a class="pg" href="#/c/${prev.n}"><small>${esc(t('prev', { n: pad(prev.n) }))}</small><b>${esc(chT(prev))}</b></a>` : '<span></span>'}${next ? `<a class="pg nx" href="#/c/${next.n}"><small>${esc(t('next', { n: pad(next.n) }))}</small><b>${esc(chT(next))}</b></a>` : ''}</nav>
        <p class="srcline">${t('origFile')}<a href="${GH}/blob/main/book/${encodeURIComponent(c.file)}" target="_blank" rel="noopener">${IS_ZH ? 'book/' + esc(c.file) : 'HowToLiveBetter · ' + esc(String(c.file).split('-')[0])}</a> · ${t('byAuthor')} · CC BY 4.0</p>
      </div></div>`, 'c', chT(c));
    $('#chsel').onchange = e => location.hash = '#/c/' + e.target.value;
    $('#cq').oninput = e => { cf.q = e.target.value.trim().toLowerCase(); drawEntries(c); };
    const toggleSet = (set, v) => { set.has(v) ? set.delete(v) : set.add(v); };
    $$('#fbar [data-g], #side-g [data-g]').forEach(b => b.onclick = () => { toggleSet(cf.g, b.dataset.g); drawEntries(c); });
    $$('#fbar [data-r], #side-r [data-r]').forEach(b => b.onclick = () => { toggleSet(cf.r, b.dataset.r); drawEntries(c); });
    $$('#side-ln [data-ln]').forEach(b => b.onclick = () => { toggleSet(cf.ln, b.dataset.ln); drawEntries(c); });
    const on = $('.side a.on'), sn = $('.snav'); if (on && sn) sn.scrollTop = on.offsetTop - sn.clientHeight / 2;
    if (!focus) scrollTo(0, 0);
  }
  if (focus) { cf.g.clear(); cf.r.clear(); cf.ln.clear(); cf.q = ''; if ($('#cq')) $('#cq').value = ''; }
  drawEntries(c);
  if (focus) {
    const el = document.getElementById(`e${n}-${focus}`);
    if (el) { requestAnimationFrame(() => { el.scrollIntoView({ behavior: same ? 'smooth' : 'auto', block: 'start' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }); }
  }
}
function drawEntries(c) {
  const terms = cf.q ? cf.q.split(/\s+/).filter(Boolean) : null;
  const list = c.e.filter(e => (!cf.g.size || cf.g.has(e.g)) && (!cf.r.size || cf.r.has(e.r)) && (!cf.ln.size || cf.ln.has(e.ln)) && (!terms || terms.every(t => e.hay.includes(t))));
  $$('#fbar [data-g], #side-g [data-g]').forEach(b => { const on = cf.g.has(b.dataset.g); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  $$('#fbar [data-r], #side-r [data-r]').forEach(b => { const on = cf.r.has(b.dataset.r); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  $$('#side-ln [data-ln]').forEach(b => { const on = cf.ln.has(b.dataset.ln); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  $('#ccnt').textContent = list.length === c.e.length ? t('countAll', { n: c.e.length }) : t('countSome', { a: list.length, b: c.e.length });
  $('#elist').innerHTML = list.length ? list.map(e => entryHTML(e, { terms })).join('') : `<div class="empty">${t('emptyFilter')}</div>`;
  reveal($('#elist'));
}

/* ---------- search ---------- */
const SF = [
  ['g', t('fG'), ['A', 'B', 'C'].map(g => [g, t('ev', { g })])],
  ['r', t('fR'), ['极高', '高', '一般'].map(r => [r, RATE(r)])],
  ['ln', t('fLn'), LENS_ORDER.map(k => [k, LENS[k]])],
  ['m', t('fM'), ['0', '少', '多'].map(v => [v, t('fm' + v)])],
  ['ti', t('fTi'), ['少', '中', '多'].map(v => [v, t('fti' + v)])],
  ['w', t('fW'), ['否', '些', '是'].map(v => [v, t('fw' + v)])],
];
let sState, sShown = 40;
function search(q) {
  sState = { q: q.get('q') || '', ch: q.get('ch') || '', dp: q.get('dp') === '1' };
  for (const [k] of SF) sState[k] = new Set((q.get(k) || '').split(',').filter(Boolean));
  sShown = 40;
  render(`<section class="wrap shead">
    <p class="eyebrow">${t('sEyebrow')}</p>
    <h1>${esc(t('sH1', { n: D.meta.stats.entries }))}</h1>
    <form class="hsearch" id="sf" role="search">${SEARCH}<input id="q" type="search" placeholder="${esc(t('sPh'))}" value="${esc(sState.q)}" autocomplete="off"></form>
    <div class="fpanel">
      <div class="frow"><label>${t('fCh')}</label><div class="ops"><select id="sch"><option value="">${esc(t('fAllCh', { n: D.ch.length }))}</option>${D.ch.map(c => `<option value="${c.n}"${String(c.n) === sState.ch ? ' selected' : ''}>${pad(c.n)} · ${esc(chT(c))}</option>`).join('')}</select></div></div>
      ${SF.map(([k, lab, ops]) => `<div class="frow"><label>${lab}</label><div class="ops">${ops.map(([v, t]) => `<button class="chip" data-k="${k}" data-v="${esc(v)}">${t}<span class="n" data-c></span></button>`).join('')}</div></div>`).join('')}
      <div class="frow"><label>${t('fOther')}</label><div class="ops"><button class="chip" id="sdp">${t('fDispute')}</button><button class="chip" id="sclr">${t('fClear')}</button></div></div>
    </div>
    <div class="sres"><p class="meta" id="scount"></p></div>
    <div class="sgrid" id="sgrid"></div>
    <div class="lmore"><button class="btn" id="smore" hidden>${t('sMore')}</button></div>
  </section>`, 'search', t('search'));
  let tm;
  $('#q').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { sState.q = e.target.value.trim(); sShown = 40; sDraw(); }, 140); };
  $('#sf').onsubmit = e => { e.preventDefault(); $('#q').blur(); };
  $('#sch').onchange = e => { sState.ch = e.target.value; sShown = 40; sDraw(); };
  $$('.fpanel [data-k]').forEach(b => b.onclick = () => { const s = sState[b.dataset.k]; s.has(b.dataset.v) ? s.delete(b.dataset.v) : s.add(b.dataset.v); sShown = 40; sDraw(); });
  $('#sdp').onclick = () => { sState.dp = !sState.dp; sDraw(); };
  $('#sclr').onclick = () => { sState.q = ''; sState.ch = ''; sState.dp = false; for (const [k] of SF) sState[k].clear(); $('#q').value = ''; $('#sch').value = ''; sDraw(); };
  $('#smore').onclick = () => { sShown += 40; sDraw(true); };
  sDraw();
}
function sMatch(e, skip) {
  const s = sState;
  if (s.ch && String(e.c) !== s.ch) return false;
  if (s.dp && !e.dp) return false;
  for (const [k] of SF) if (k !== skip && s[k].size && !s[k].has(String(e[k]))) return false;
  return !s.terms || s.terms.every(t => e.hay.includes(t));
}
function sDraw(append) {
  const s = sState;
  s.terms = s.q ? s.q.toLowerCase().split(/\s+/).filter(Boolean) : null;
  const list = ALL.filter(e => sMatch(e));
  $$('.fpanel [data-k]').forEach(b => {
    const k = b.dataset.k; b.classList.toggle('on', s[k].has(b.dataset.v));
    const nn = ALL.filter(e => String(e[k]) === b.dataset.v && sMatch(e, k)).length;
    b.querySelector('[data-c]').textContent = ' ' + nn; b.hidden = nn === 0 && !s[k].has(b.dataset.v);
  });
  $('#sdp').classList.toggle('on', s.dp);
  const any = s.q || s.ch || s.dp || SF.some(([k]) => s[k].size);
  $('#scount').innerHTML = t(any ? 'sFound' : 'sAll', { n: list.length });
  $('#sgrid').innerHTML = list.length ? list.slice(0, sShown).map(e => entryHTML(e, { showCh: true, terms: s.terms })).join('') : `<div class="empty">${t('sNone')}</div>`;
  $('#smore').hidden = list.length <= sShown;
  reveal($('#sgrid'));
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q); if (s.ch) p.set('ch', s.ch); if (s.dp) p.set('dp', '1');
  for (const [k] of SF) if (s[k].size) p.set(k, [...s[k]].join(','));
  const h = '#/search' + (p.toString() ? '?' + p : '');
  if (location.hash !== h) history.replaceState(null, '', h);
}

/* ---------- docs ---------- */
function docs() {
  const longs = D.docs.filter(d => d.kind === 'doc');
  const extra = D.docs.filter(d => d.kind === 'extra');
  render(`<section class="wrap shead">
    <p class="eyebrow">${esc(t('dEyebrow', { n: longs.length }))}</p>
    <h1>${t('dH1')}</h1>
    <p class="lede" style="animation:none">${t('dLede', { link: `<a href="#/rec" style="text-decoration:underline">${t('rec')}</a>` })}</p>
    ${IS_ZH && LANG === 'zh-CN' ? '' : `<div class="lnote">${langNote(true)}</div>`}
  </section>
  <section class="wrap sec"><div class="dlist">${IS_ZH ? longs.map(docRow).join('') : zhOnly()}</div></section>
  <section class="wrap sec"><header class="sh"><h2>${t('more')}</h2><span>${t('moreSub')}</span></header><div class="dlist">${extra.map(d => `<a class="drow" href="#/about/${d.id}"><b>${esc(IS_ZH ? d.title : t(d.id === 'skill' ? 'aSkill' : 'aDerived'))}</b><small>${IS_ZH ? esc(d.lead) : ''}</small><span class="dm">${d.id === 'skill' ? t('aiSkill') : t('readerWork')}</span></a>`).join('')}<a class="drow" href="#/rec"><b>${t('recRowT')}</b><small>${t('recRowL')}</small><span class="dm">${esc(t('nDocs', { n: D.docs.filter(d => d.kind === 'rec').length }))}</span></a></div></section>`, 'docs', t('docs'));
}
function recs() {
  const rs = D.docs.filter(d => d.kind === 'rec');
  const groups = [[t('rgCh'), r => /^\d/.test(r.stem)], [t('rgAdd'), r => /^追加/.test(r.stem)], [t('rgFix'), r => /^(补来源|排查|口径|新增)/.test(r.stem)]];
  const used = new Set();
  const html = groups.map(([name, f]) => { const l = rs.filter(r => !used.has(r.id) && f(r)); l.forEach(r => used.add(r.id)); return [name, l]; });
  const rest = rs.filter(r => !used.has(r.id)); if (rest.length) html.push([t('rgOther'), rest]);
  const sorted = l => l.slice().sort((a, b) => a.stem.localeCompare(b.stem, 'zh-CN', { numeric: true }));
  render(`<section class="wrap shead">
    <p class="eyebrow">${esc(t('rEyebrow', { n: rs.length }))}</p>
    <h1>${t('rec')}</h1>
    <p class="lede" style="animation:none">${t('rLede')}</p>
    <form class="hsearch" id="rf">${SEARCH}<input id="rq" type="search" placeholder="${esc(t('rPh'))}" autocomplete="off"></form>
  </section>
  <section class="wrap" id="rwrap">${!IS_ZH ? zhOnly() : html.map(([n, l]) => `<div class="rgroup"><h3>${n} · ${l.length}</h3><div class="rlist">${sorted(l).map(r => `<a class="rl" href="#/rec/${r.id}" data-t="${esc(r.title + ' ' + r.stem)}"><b>${esc(r.title)}</b><small>${(r.chars / 1000).toFixed(1)}k</small></a>`).join('')}</div></div>`).join('')}</section>`, 'rec', t('rec'));
  $('#rf').onsubmit = e => e.preventDefault();
  $('#rq').oninput = e => {
    const t = e.target.value.trim().toLowerCase().replace(/\s+/g, '');
    $$('#rwrap .rl').forEach(a => a.hidden = t && !a.dataset.t.toLowerCase().replace(/\s+/g, '').includes(t));
    $$('#rwrap .rgroup').forEach(g => g.hidden = !$$('.rl:not([hidden])', g).length);
  };
}
async function loadDoc(id) {
  if (!docCache[id]) docCache[id] = await fetch('data/' + ((OV && OV.docDir) || 'doc') + '/' + id + '.html').then(r => { if (!r.ok) throw 0; return r.text(); });
  return docCache[id];
}
async function doc(id, kind, back) {
  const d = D.docs.find(x => x.id === id); if (!d) return docs();
  const dTitle = IS_ZH ? d.title : (kind === 'rec' ? t('rec') : kind === 'extra' ? t(id === 'skill' ? 'aSkill' : 'aDerived') : t('docs'));
  render('<div class="wrap loading"><div class="spin"></div></div>', kind === 'rec' ? 'rec' : (back ? 'about' : 'docs'), dTitle);
  let h; try { h = IS_ZH ? await loadDoc(id) : ''; } catch (e) { app.innerHTML = '<div class="wrap empty">' + esc(t('docFail')) + '</div>'; return; }
  const crumb = kind === 'rec' ? `<a href="#/rec">${t('rec')}</a>` : back ? `<a href="#/about">${t('about')}</a>` : `<a href="#/docs">${t('docs')}</a>`;
  render(`<div class="wrap dpage fade">
    <article><div class="crumb">${crumb}${IS_ZH ? `<span>/</span><span>${esc(d.path)}</span>` : ''}</div>
      ${IS_ZH ? (LANG === 'zh-CN' ? '' : `<div class="lnote">${langNote(true)}</div>`) : zhOnly()}<div class="prose" id="prose">${h}</div>
      <div class="dmeta"><a class="btn ghost" href="${GH}/blob/main/${d.path.split('/').map(encodeURIComponent).join('/')}" target="_blank" rel="noopener">${t('viewGH')}</a><a class="btn ghost" href="${kind === 'rec' ? '#/rec' : back ? '#/about' : '#/docs'}">${t('back')}</a></div>
    </article>
    <aside class="dtoc" id="dtoc"></aside></div>`, kind === 'rec' ? 'rec' : (back ? 'about' : 'docs'), dTitle);
  buildToc();
}
function buildToc() {
  const hs = $$('#prose h2, #prose h3'); const toc = $('#dtoc');
  if (hs.length < 3) { toc.remove(); return; }
  hs.forEach((h, i) => h.id = h.id || 's' + i);
  toc.innerHTML = '<p class="lab">' + esc(t('toc')) + '</p>' + hs.map(h => `<a href="#${h.id}" class="${h.tagName.toLowerCase()}">${esc(h.textContent)}</a>`).join('');
  const links = $$('a', toc);
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id)); } }), { rootMargin: '-80px 0px -70% 0px' });
  hs.forEach(h => io.observe(h));
}

/* ---------- glossary ---------- */
function gloss() {
  render(`<section class="wrap shead">
    <p class="eyebrow">${esc(t('gEyebrow', { n: D.gloss.length }))}</p>
    <h1>${t('gH1')}</h1>
    ${IS_ZH && LANG === 'zh-CN' ? '' : `<div class="lnote">${langNote(true)}</div>`}
    <div class="prose" style="margin-top:18px">${D.rd['术语表导语']}</div>
    <form class="hsearch" id="gf">${SEARCH}<input id="gq" type="search" placeholder="${esc(t('gPh'))}" autocomplete="off"></form>
  </section>
  <section class="wrap sec"><div class="glist" id="gl">${D.gloss.map(g => `<dl class="gl" data-t="${esc((g.k + g.v).toLowerCase())}"><dt>${esc(g.k)}</dt><dd>${esc(g.v)}</dd></dl>`).join('')}</div></section>`, 'gloss', t('gloss'));
  $('#gf').onsubmit = e => e.preventDefault();
  $('#gq').oninput = e => { const t = e.target.value.trim().toLowerCase(); $$('#gl .gl').forEach(x => x.hidden = t && !x.dataset.t.includes(t)); };
}

/* ---------- about ---------- */
function about(sub) {
  if (sub === 'skill' || sub === 'derived') return doc(sub, 'extra', true);
  const m = D.meta, rd = D.rd;
  const A = (h, txt) => `<a href="${h}" target="_blank" rel="noopener">${txt}</a>`;
  const sec = k => `<h2 id="${k}">${esc(t('sec' + k))}</h2>${rd[k]}`;
  render(`<div class="wrap dpage fade"><article>
    <div class="crumb"><span>${t('aCrumb')}</span><span>/</span><span>README.md</span></div>
    <div class="prose" id="prose">
      <h1>${t('aH1')}</h1>
      ${IS_ZH ? '' : `<p>${esc(t('ledeB'))} ${esc(t('heroLede'))}</p>`}
      <h2 id="site">${t('aSiteH')}</h2>
      <p>${t('aSite1', { repo: A(GH, 'eternity4719/HowToLiveBetter') })}</p>
      <p>${t('aSite2', { commit: A(GH + '/commit/' + m.commit, `<code>${m.commit.slice(0, 7)}</code>`), date: m.date.slice(0, 10), issue: A(GH + '/issues', t('aIssue')) })}</p>
      <p>${t('aSite3', { lic: A('https://creativecommons.org/licenses/by/4.0/', 'CC BY 4.0'), readme: A(GH + '#赞赏', t('aReadme')) })}</p>
      ${IS_ZH && LANG === 'zh-CN' ? '' : `<div class="lnote">${langNote(true)}</div>`}
      <h2 id="dl">${t('aDl')}</h2>
      <p>${t('aDlP')}</p>
      <div class="alist">${m.dl.map(([x, u]) => `<a class="btn ghost" href="${esc(u)}" target="_blank" rel="noopener">${esc(x)} ↗</a>`).join('')}<a class="btn ghost" href="https://eternity4719.github.io/HowToLiveBetter/" target="_blank" rel="noopener">${t('aOnline')}</a><a class="btn ghost" href="https://eternity4719.github.io/HowToLiveBetter/selfcheck.html" target="_blank" rel="noopener">${t('aSelf')}</a></div>
      <p>${t('aLangsP')}</p>
      <div class="alist">${m.langs.filter(([x]) => !/^(仓库|dlgrv|parveen0029|chuanman2707)$/.test(x)).map(([x, u]) => `<a class="btn ghost" href="${esc(u)}" target="_blank" rel="noopener">${esc(x)} ↗</a>`).join('')}</div>
      <p>${t('aAi', { skill: `<a href="#/about/skill">${t('aSkill')}</a>`, derived: `<a href="#/about/derived">${t('aDerived')}</a>` })}</p>
      ${IS_ZH ? `<p>${esc(m.lede[0])}</p><p>${esc(m.lede[1])}</p>${m.notes.map(n => `<blockquote><p>${n}</p></blockquote>`).join('')}` : `<p><em>${t('cAboutNote')}</em></p>`}
      ${['怎么读', '四种资源', '证据分级', '性价比档', '正文', '许可'].filter(k => IS_ZH || (OV && OV.rd && OV.rd[k])).map(sec).join('')}
    </div></article><aside class="dtoc" id="dtoc"></aside></div>`, 'about', t('about'));
  buildToc();
}

/* ---------- language note + switcher ---------- */
function langNote(zhPage) {
  const go = l => `<a href="#" data-setlang="${l}">${esc(I.str[l].langName)}</a>`;
  if (LANG === 'zh-TW') return `<p>${esc(t('cTw'))} ${go('zh-CN')}</p>`;
  if (CONTENT && OV && OV.src && zhPage) return `<p>${esc(t('cPageZh'))} <a href="#" data-setlang="zh-TW">${esc(I.str['zh-TW'].langName)}</a></p>`;
  if (CONTENT && OV && OV.src) return `<p>${t('cTrans', { src: `<a href="${OV.src.url}" target="_blank" rel="noopener">${OV.src.name}</a>` })} <a href="#" data-setlang="zh-CN">${t('cShowZh')}</a></p>`;
  return `<p>${esc(t('cZhOnly', { lang: STR.langName }))} ${t('cZhOnlyEn')} ${go('en')} · ${go('es')} · ${go('zh-TW')}</p>`;
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-setlang]'); if (!a) return;
  e.preventDefault(); window.HTLB_SETLANG(a.dataset.setlang);
});
(function chrome() {
  const sel = $('#langSel');
  sel.innerHTML = I.order.map(l => `<option value="${l}"${l === LANG ? ' selected' : ''}>${esc(I.str[l].langName)}</option>`).join('');
  sel.setAttribute('aria-label', t('uiLang'));
  $('#langV b').textContent = STR.langShort;
  sel.onchange = () => window.HTLB_SETLANG(sel.value);
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-i18n-html]').forEach(el => {
    const k = el.dataset.i18nHtml;
    if (k === 'footContent') el.innerHTML = t(k, { repo: '<a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">eternity4719/HowToLiveBetter</a>', lic: '<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>' });
    if (k === 'footOnly') el.innerHTML = t(k, { commit: '<a id="fcommit" target="_blank" rel="noopener"></a>' });
  });
  const ld = $('#app .loading p'); if (ld) ld.textContent = t('loading', { n: 677 });
})();
})();
