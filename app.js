/* How to Live Better — reading site. Content: eternity4719/HowToLiveBetter (CC BY 4.0). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const LABEL = { m:{'0':'不花钱','少':'花少量钱','多':'花不少钱'}, ti:{'少':'顺手','中':'花几小时','多':'每天占时间'}, w:{'否':'不用毅力','些':'要一点毅力','是':'要很多毅力'} };
const ZERO = { m:'0', ti:'少', w:'否' };
const LENS = {'死亡率':'换寿命','金钱':'换钱','时间':'换时间精力','自由':'换人身自由'};
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

let D, ALL = [], CH = {};
const docCache = {};

/* ---------- theme / chrome ---------- */
$('#theme').onclick = () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  $('meta[name=theme-color]').content = t === 'dark' ? '#1b1b1f' : '#ffffff';
  try { localStorage.setItem('htlb-theme', t); } catch (e) {}
};
addEventListener('scroll', () => $('#top').classList.toggle('scrolled', scrollY > 8), { passive: true });
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.sp'); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });
$('#sbtn').onclick = () => { location.hash = '#/search'; setTimeout(() => $('#q')?.focus(), 60); };
addEventListener('keydown', e => {
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#sbtn').click(); }
});
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
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('已复制这条的链接'), () => toast(url));
  }
});

/* ---------- data ---------- */
fetch('data/book.json').then(r => r.json()).then(d => {
  D = d;
  for (const c of d.ch) {
    CH[c.n] = c;
    c.cnt = { A: 0, B: 0, C: 0, '极高': 0 };
    for (const e of c.e) {
      e.c = c.n; c.cnt[e.g]++; if (e.r === '极高') c.cnt['极高']++;
      e.hay = [e.t, e.human, e.cost, e.gain, e.note, e.src].join('\n').replace(/<[^>]+>/g, '').toLowerCase();
      ALL.push(e);
    }
  }
  const cm = $('#fcommit'); cm.textContent = d.meta.commit.slice(0, 7) + '（' + d.meta.date.slice(0, 10) + '）'; cm.href = GH + '/commit/' + d.meta.commit;
  route();
}).catch(() => { app.innerHTML = '<div class="wrap empty">数据没加载出来，刷新试试。</div>'; });
addEventListener('hashchange', route);

function setNav(r) { $$('#tabs a,#bottom a').forEach(a => a.classList.toggle('on', a.dataset.r === r)); }
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
  document.title = (title ? title + ' · ' : '') + '高性价比人生指南';
  $$('.prose table', app).forEach(t => { if (!t.parentElement.classList.contains('tw')) { const w = document.createElement('div'); w.className = 'tw'; t.before(w); w.append(t); } });
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
function entryHTML(e, o = {}) {
  const t = o.terms;
  const rc = { '极高': 'r3', '高': 'r2', '一般': 'plain' }[e.r] || 'plain';
  const costPills = ['m', 'ti', 'w'].map(k => LABEL[k][e[k]] ? `<span class="bd plain">${LABEL[k][e[k]]}</span>` : '').join('');
  const noteRow = e.note ? `<div class="k">备注</div><div class="v note">${hl(e.note, t)}</div>` : '';
  return `<article class="entry card" id="e${e.c}-${e.n}">
    <div class="eh card-h"><span class="en idx">${e.n}</span><h3>${hl(esc(e.t), t)}</h3><button class="cp anchor" data-copy="#/c/${e.c}/${e.n}" aria-label="复制链接" title="复制这条的链接">#</button></div>
    <div class="badges">
      ${o.showCh ? `<a class="bd ch" href="#/c/${e.c}/${e.n}">第 ${e.c} 节 · ${esc(CH[e.c].t)}</a>` : ''}
      <span class="bd ${rc}" title="作者判断：由收益量级与三项成本合成，同口径内可比">性价比 ${e.r}</span>
      <span class="bd g g${e.g}" title="证据等级">证据 ${e.g} 级</span>
      <span class="bd plain">${LENS[e.ln] || e.ln}</span>
      ${costPills}
      ${e.dp ? '<span class="bd dp">争议</span>' : ''}${e.todo ? '<span class="bd dp">含待核实</span>' : ''}
    </div>
    ${e.human ? `<p class="human">${hl(e.human, t)}</p>` : ''}
    <div class="rows">
      <div class="k">成本</div><div class="v">${hl(e.cost, t)}</div>
      <div class="k">收益</div><div class="v">${hl(e.gain, t)}</div>
      ${noteRow}
    </div>
    <details class="src"${o.open ? ' open' : ''}><summary>来源<span class="cnt"> · 证据 ${esc(e.gfull || e.g)}</span></summary><div class="body">${e.src || '—'}</div></details>
  </article>`;
}

/* ---------- home ---------- */
function home() {
  const m = D.meta, s = m.stats;
  const res = m.res4.map(r => {
    const ln = RES_LENS[r.k];
    return `<a class="sp res" href="#/search?ln=${encodeURIComponent(ln)}"><span class="ico">${ICON[ln]}</span><h3>${esc(r.k)}</h3><p>${esc(r.v)}</p><div class="ft"><span><b>${m.lensN[ln]}</b> 条 · ${LENS[ln]}</span><span class="go">${ARROW}</span></div></a>`;
  }).join('');
  const chs = D.ch.map(c => `<a class="sp cc" href="#/c/${c.n}"><div class="top2"><span class="num">${pad(c.n)}</span><span class="cnt">${c.e.length} 条</span></div><h3>${esc(c.t)}</h3><p>${esc(D.q[c.n] || '')}</p><div class="bars">${evBar(c)}<div class="lg"><span>A <b>${c.cnt.A}</b> · B <b>${c.cnt.B}</b> · C <b>${c.cnt.C}</b></span><span>极高 <b>${c.cnt['极高']}</b></span></div></div></a>`).join('');
  const longs = D.docs.filter(d => d.kind === 'doc').map(docCard).join('');
  render(`
  <section class="wrap hero">
    <p class="eyebrow"><span class="dot"></span>开源 · ${s.entries} 条建议 · 证据分级 · CC BY 4.0</p>
    <h1>用最少的钱、时间和精力，换回最多的<em>寿命、金钱和人身自由</em></h1>
    <p class="lede">${esc(m.lede[0])}<br><b>${esc(m.lede[1])}</b></p>
    <form class="hsearch" id="hs" role="search">${SEARCH}<input id="hq" type="search" placeholder="搜条目，比如「低钠盐」「担保」「被裁」" autocomplete="off"><button type="submit">检索</button></form>
    <div class="quick">
      <a class="chip" href="#/search?r=极高">性价比极高 <span class="n">${s['极高']}</span></a>
      <a class="chip" href="#/search?g=A">只看证据 A <span class="n">${s.A}</span></a>
      <a class="chip" href="#/search?r=极高&g=A">极高 × A</a>
      <a class="chip" href="#/c/13">紧急情况：先做什么</a>
      <a class="chip" href="#/docs">长文与场景清单</a>
    </div>
    <dl class="hstats">
      <div><dt>${s.entries}</dt><dd>条建议，分 ${D.ch.length} 节</dd></div>
      <div><dt>${s.A}</dt><dd>条证据 A（有具体数字、出处可核）</dd></div>
      <div><dt>${s['极高']}</dt><dd>条性价比「极高」</dd></div>
      <div><dt>${m.links.toLocaleString()}</dt><dd>条原始文献链接，见核实记录</dd></div>
    </dl>
  </section>
  <section class="wrap"><div class="notes">${m.notes.map((n, i) => `<div class="glass"><span class="k">${['怎么用', '注意', '声明'][i] || ''}</span>${n}</div>`).join('')}</div></section>
  <section class="wrap sec"><div class="sec-h"><h2><span class="no">01</span>四种资源<small>想帮你多留住的</small></h2><p class="meta">不同口径之间不做比较</p></div><div class="grid g4">${res}</div></section>
  <section class="wrap sec"><div class="sec-h"><h2><span class="no">02</span>目录<small>${D.ch.length} 节，每节按性价比排</small></h2><p class="meta">条形图：证据 A / B / C 占比</p></div><div class="grid">${chs}</div></section>
  <section class="wrap sec"><div class="sec-h"><h2><span class="no">03</span>长文<small>和按时间排的场景清单</small></h2><a class="more" href="#/docs">全部长文 →</a></div><div class="grid">${longs}</div></section>
  <section class="wrap sec"><div class="sec-h"><h2><span class="no">04</span>怎么读<small>先看这几条</small></h2><a class="more" href="#/about">完整说明 →</a></div>
    <div class="grid">
      <a class="sp dc" href="#/about"><span class="k">证据分级</span><h3>A / B / C 各代表什么</h3><p>A 有具体数字、出处可核；B 有研究支持但说不出确切数字；C 是作者经验或公认做法。</p><div class="ft"><span>A ${s.A} · B ${s.B} · C ${s.C}</span>${ARROW}</div></a>
      <a class="sp dc" href="#/about"><span class="k">性价比档</span><h3>极高 / 高 / 一般怎么算</h3><p>由收益量级和三项成本（花钱、花时间、要毅力）合出来，是作者自己的判断，不是证据。</p><div class="ft"><span>极高 ${s['极高']} · 高 ${s['高']} · 一般 ${s['一般']}</span>${ARROW}</div></a>
      <a class="sp dc" href="#/gloss"><span class="k">术语表</span><h3>看不懂那串数字</h3><p>总死亡率、HR、RR、95% CI、荟萃分析……${D.gloss.length} 条术语的大白话解释。</p><div class="ft"><span>${D.gloss.length} 条</span>${ARROW}</div></a>
    </div>
  </section>`, 'home');
  $('#hs').onsubmit = e => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent($('#hq').value.trim()); };
}
function docCard(d) {
  const mins = Math.max(1, Math.round(d.chars / 500));
  return `<a class="sp dc" href="#/${d.kind === 'rec' ? 'rec' : 'doc'}/${d.id}"><span class="k">${d.kind === 'rec' ? '核实记录' : '长文'}</span><h3>${esc(d.title)}</h3><p>${esc(d.lead)}</p><div class="ft"><span>约 ${mins} 分钟 · ${(d.chars / 1000).toFixed(1)}k 字</span>${ARROW}</div></a>`;
}

/* ---------- chapter ---------- */
let cf = { n: 0, g: new Set(), r: new Set(), ln: new Set(), q: '' };
function chapter(n, focus, same) {
  const c = CH[n]; if (!c) return home();
  if (cf.n !== n) cf = { n, g: new Set(), r: new Set(), ln: new Set(), q: '' };
  if (!same || !$('#elist')) {
    const sideLinks = D.ch.map(x => `<a href="#/c/${x.n}" class="${x.n === n ? 'on' : ''}"><span>${pad(x.n)}</span>${esc(x.t)}</a>`).join('');
    const prev = CH[n - 1], next = CH[n + 1];
    render(`<div class="wrap cpage">
      <aside class="side" id="cside">
        <div class="group"><div class="gt">性价比 <small>作者判断，同口径内可比</small></div><div class="chips" id="side-r">${['极高','高','一般'].map(r => `<button class="chip" data-r="${r}" aria-pressed="false">${r}</button>`).join('')}</div></div>
        <div class="group"><div class="gt">证据等级 <small>荟萃/RCT · 研究 · 共识</small></div><div class="chips" id="side-g">${['A','B','C'].map(g => `<button class="chip" data-g="${g}" aria-pressed="false">${g} 级 <span class="n">${c.cnt[g]}</span></button>`).join('')}</div></div>
        <div class="group"><div class="gt">换回什么 <small>不跨口径比较</small></div><div class="chips" id="side-ln">${LENS_ORDER.map(k => `<button class="chip" data-ln="${k}" aria-pressed="false">${LENS[k]}</button>`).join('')}</div></div>
        <div class="group"><div class="gt">章节 <small>${D.ch.length} 节 · 一次只看一个</small></div>${sideLinks}</div>
        <p class="hint">同组多选是「或」，不同组是「且」。每节内按性价比从高到低排。</p>
      </aside>
      <div>
        <div class="mchap"><select id="chsel" aria-label="切换章节">${D.ch.map(x => `<option value="${x.n}"${x.n === n ? ' selected' : ''}>${pad(x.n)} · ${esc(x.t)}</option>`).join('')}</select></div>
        <header class="chead">
          <p class="eyebrow"><span class="dot"></span>第 ${pad(n)} 节 · ${c.e.length} 条 · A ${c.cnt.A} · 极高 ${c.cnt['极高']}</p>
          <h1><span class="no">${n}.</span>${esc(c.t)}</h1>
          ${D.q[n] ? `<p class="q">${esc(D.q[n])}</p>` : ''}
        </header>
        <details class="intro"${c.e.length ? '' : ' open'}><summary>本节导读与分组索引<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body">${c.intro}</div></details>
        <div class="fbar" id="fbar">
          <label class="mini">${SEARCH}<input id="cq" type="search" placeholder="本节内筛选" value="${esc(cf.q)}"></label>
          <span class="sep"></span>
          ${['A', 'B', 'C'].map(g => `<button class="chip" data-g="${g}">证据 ${g} <span class="n">${c.cnt[g]}</span></button>`).join('')}
          <span class="sep"></span>
          ${['极高', '高', '一般'].map(r => `<button class="chip" data-r="${r}">${r}</button>`).join('')}
          <span class="cnt" id="ccnt"></span>
        </div>
        <div class="elist" id="elist"></div>
        <nav class="pager">${prev ? `<a class="sp" href="#/c/${prev.n}"><small>← 第 ${prev.n} 节</small><b>${esc(prev.t)}</b></a>` : ''}${next ? `<a class="sp nx" href="#/c/${next.n}"><small>第 ${next.n} 节 →</small><b>${esc(next.t)}</b></a>` : ''}</nav>
        <p class="meta" style="margin-top:20px">原文：<a href="${GH}/blob/main/book/${encodeURIComponent(c.file)}" target="_blank" rel="noopener" style="text-decoration:underline">book/${esc(c.file)}</a></p>
      </div></div>`, 'c', c.t);
    $('#chsel').onchange = e => location.hash = '#/c/' + e.target.value;
    $('#cq').oninput = e => { cf.q = e.target.value.trim().toLowerCase(); drawEntries(c); };
    const toggleSet = (set, v) => { set.has(v) ? set.delete(v) : set.add(v); };
    $$('#fbar [data-g], #side-g [data-g]').forEach(b => b.onclick = () => { toggleSet(cf.g, b.dataset.g); drawEntries(c); });
    $$('#fbar [data-r], #side-r [data-r]').forEach(b => b.onclick = () => { toggleSet(cf.r, b.dataset.r); drawEntries(c); });
    $$('#side-ln [data-ln]').forEach(b => b.onclick = () => { toggleSet(cf.ln, b.dataset.ln); drawEntries(c); });
    const on = $('.side a.on'); if (on) on.scrollIntoView({ block: 'center' });
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
  $('#ccnt').textContent = list.length === c.e.length ? `${c.e.length} 条` : `${list.length} / ${c.e.length} 条`;
  $('#elist').innerHTML = list.length ? list.map(e => entryHTML(e, { terms })).join('') : '<div class="empty">没有符合条件的条目</div>';
}

/* ---------- search ---------- */
const SF = [
  ['g', '证据等级', [['A', '证据 A'], ['B', '证据 B'], ['C', '证据 C']]],
  ['r', '性价比', [['极高', '极高'], ['高', '高'], ['一般', '一般']]],
  ['ln', '换回什么', LENS_ORDER.map(k => [k, LENS[k]])],
  ['m', '花钱', [['0', '不花钱'], ['少', '少量'], ['多', '不少']]],
  ['ti', '花时间', [['少', '顺手'], ['中', '几小时'], ['多', '每天占时间']]],
  ['w', '要毅力', [['否', '不用'], ['些', '一点'], ['是', '很多']]],
];
let sState, sShown = 40;
function search(q) {
  sState = { q: q.get('q') || '', ch: q.get('ch') || '', dp: q.get('dp') === '1' };
  for (const [k] of SF) sState[k] = new Set((q.get(k) || '').split(',').filter(Boolean));
  sShown = 40;
  render(`<section class="wrap shead">
    <p class="eyebrow"><span class="dot"></span>按关键词、章节、证据和成本筛选 · 条件可叠加</p>
    <h1>检索 ${D.meta.stats.entries} 条<em>建议</em></h1>
    <form class="hsearch" id="sf" role="search">${SEARCH}<input id="q" type="search" placeholder="多个词用空格隔开，比如「孩子 发烧」" value="${esc(sState.q)}" autocomplete="off"></form>
    <div class="fpanel glass">
      <div class="frow"><label>章节</label><div class="ops"><select id="sch"><option value="">全部 ${D.ch.length} 节</option>${D.ch.map(c => `<option value="${c.n}"${String(c.n) === sState.ch ? ' selected' : ''}>${pad(c.n)} · ${esc(c.t)}</option>`).join('')}</select></div></div>
      ${SF.map(([k, lab, ops]) => `<div class="frow"><label>${lab}</label><div class="ops">${ops.map(([v, t]) => `<button class="chip" data-k="${k}" data-v="${esc(v)}">${t}<span class="n" data-c></span></button>`).join('')}</div></div>`).join('')}
      <div class="frow"><label>其他</label><div class="ops"><button class="chip" id="sdp">只看标了争议的</button><button class="chip" id="sclr">清空条件</button></div></div>
    </div>
    <div class="sres"><p class="meta" id="scount"></p></div>
    <div class="sgrid" id="sgrid"></div>
    <div class="lmore"><button class="btn" id="smore" hidden>再显示 40 条</button></div>
  </section>`, 'search', '检索');
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
    b.querySelector('[data-c]').textContent = ' ' + ALL.filter(e => String(e[k]) === b.dataset.v && sMatch(e, k)).length;
  });
  $('#sdp').classList.toggle('on', s.dp);
  const any = s.q || s.ch || s.dp || SF.some(([k]) => s[k].size);
  $('#scount').innerHTML = any ? `找到 <b>${list.length}</b> 条 · 每节内按性价比排` : `全部 <b>${list.length}</b> 条，按节、按性价比排`;
  $('#sgrid').innerHTML = list.length ? list.slice(0, sShown).map(e => entryHTML(e, { showCh: true, terms: s.terms })).join('') : '<div class="empty">没找到。换个说法，或者少勾几个条件。</div>';
  $('#smore').hidden = list.length <= sShown;
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
    <p class="eyebrow"><span class="dot"></span>${longs.length} 篇长文 · 原仓库 docs/</p>
    <h1>长文与<em>场景清单</em></h1>
    <p class="lede" style="animation:none">正文条目之外，原书把几件大事单独写成长文，另有四份按时间排的场景清单。每条来源的核实过程见<a href="#/rec" style="text-decoration:underline">核实记录</a>。</p>
  </section>
  <section class="wrap sec"><div class="grid">${longs.map(docCard).join('')}</div></section>
  <section class="wrap sec"><div class="sec-h"><h2>更多<small>工具与衍生</small></h2></div><div class="grid">${extra.map(d => `<a class="sp dc" href="#/about/${d.id}"><span class="k">${d.id === 'skill' ? 'AI skill' : '读者作品'}</span><h3>${esc(d.title)}</h3><p>${esc(d.lead)}</p><div class="ft"><span>${esc(d.path)}</span>${ARROW}</div></a>`).join('')}<a class="sp dc" href="#/rec"><span class="k">核实记录</span><h3>每条来源是怎么核实的</h3><p>按节和按追加主题记下的原文摘录、打开方式和未采用的来源。</p><div class="ft"><span>${D.docs.filter(d => d.kind === 'rec').length} 份</span>${ARROW}</div></a></div></section>`, 'docs', '长文');
}
function recs() {
  const rs = D.docs.filter(d => d.kind === 'rec');
  const groups = [['按节核实', r => /^\d/.test(r.stem)], ['追加条目', r => /^追加/.test(r.stem)], ['补来源 · 排查 · 口径变更', r => /^(补来源|排查|口径|新增)/.test(r.stem)]];
  const used = new Set();
  const html = groups.map(([name, f]) => { const l = rs.filter(r => !used.has(r.id) && f(r)); l.forEach(r => used.add(r.id)); return [name, l]; });
  const rest = rs.filter(r => !used.has(r.id)); if (rest.length) html.push(['其他', rest]);
  const sorted = l => l.slice().sort((a, b) => a.stem.localeCompare(b.stem, 'zh-CN', { numeric: true }));
  render(`<section class="wrap shead">
    <p class="eyebrow"><span class="dot"></span>${rs.length} 份 · 原仓库 docs/核实记录/</p>
    <h1>核实<em>记录</em></h1>
    <p class="lede" style="animation:none">原书每条来源的核实过程：打开了哪个链接、原文怎么写、哪些来源没能核实因而没有采用。</p>
    <form class="hsearch" id="rf">${SEARCH}<input id="rq" type="search" placeholder="按标题筛选，比如「保险」「第 13 节」" autocomplete="off"></form>
  </section>
  <section class="wrap" id="rwrap">${html.map(([n, l]) => `<div class="rgroup"><h3>${n} · ${l.length}</h3><div class="rlist">${sorted(l).map(r => `<a class="sp rl" href="#/rec/${r.id}" data-t="${esc(r.title + ' ' + r.stem)}"><b>${esc(r.title)}</b><small>${(r.chars / 1000).toFixed(1)}k</small></a>`).join('')}</div></div>`).join('')}</section>`, 'rec', '核实记录');
  $('#rf').onsubmit = e => e.preventDefault();
  $('#rq').oninput = e => {
    const t = e.target.value.trim().toLowerCase().replace(/\s+/g, '');
    $$('#rwrap .rl').forEach(a => a.hidden = t && !a.dataset.t.toLowerCase().replace(/\s+/g, '').includes(t));
    $$('#rwrap .rgroup').forEach(g => g.hidden = !$$('.rl:not([hidden])', g).length);
  };
}
async function loadDoc(id) {
  if (!docCache[id]) docCache[id] = await fetch('data/doc/' + id + '.html').then(r => { if (!r.ok) throw 0; return r.text(); });
  return docCache[id];
}
async function doc(id, kind, back) {
  const d = D.docs.find(x => x.id === id); if (!d) return docs();
  render('<div class="wrap loading"><div class="spin"></div></div>', kind === 'rec' ? 'rec' : (back ? 'about' : 'docs'), d.title);
  let h; try { h = await loadDoc(id); } catch (e) { app.innerHTML = '<div class="wrap empty">这篇没加载出来，刷新试试。</div>'; return; }
  const crumb = kind === 'rec' ? '<a href="#/rec">核实记录</a>' : back ? '<a href="#/about">关于</a>' : '<a href="#/docs">长文</a>';
  render(`<div class="wrap dpage fade">
    <article><div class="crumb">${crumb}<span>/</span><span>${esc(d.path)}</span></div>
      <div class="prose" id="prose">${h}</div>
      <div class="dmeta"><a class="btn ghost" href="${GH}/blob/main/${d.path.split('/').map(encodeURIComponent).join('/')}" target="_blank" rel="noopener">在 GitHub 看原文 ↗</a><a class="btn ghost" href="${kind === 'rec' ? '#/rec' : back ? '#/about' : '#/docs'}">← 返回</a></div>
    </article>
    <aside class="dtoc" id="dtoc"></aside></div>`, kind === 'rec' ? 'rec' : (back ? 'about' : 'docs'), d.title);
  buildToc();
}
function buildToc() {
  const hs = $$('#prose h2, #prose h3'); const toc = $('#dtoc');
  if (hs.length < 3) { toc.remove(); return; }
  hs.forEach((h, i) => h.id = h.id || 's' + i);
  toc.innerHTML = '<p class="lab">本文目录</p>' + hs.map(h => `<a href="#${h.id}" class="${h.tagName.toLowerCase()}">${esc(h.textContent)}</a>`).join('');
  const links = $$('a', toc);
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id)); } }), { rootMargin: '-80px 0px -70% 0px' });
  hs.forEach(h => io.observe(h));
}

/* ---------- glossary ---------- */
function gloss() {
  render(`<section class="wrap shead">
    <p class="eyebrow"><span class="dot"></span>${D.gloss.length} 条 · 原书 README「读懂数字」</p>
    <h1>读懂<em>数字</em></h1>
    <div class="prose" style="margin-top:18px">${D.rd['术语表导语']}</div>
    <form class="hsearch" id="gf">${SEARCH}<input id="gq" type="search" placeholder="查术语，比如 HR、荟萃、LPR" autocomplete="off"></form>
  </section>
  <section class="wrap sec"><div class="grid g4" id="gl">${D.gloss.map(g => `<dl class="sp gl" data-t="${esc((g.k + g.v).toLowerCase())}"><dt>${esc(g.k)}</dt><dd>${esc(g.v)}</dd></dl>`).join('')}</div></section>`, 'gloss', '术语表');
  $('#gf').onsubmit = e => e.preventDefault();
  $('#gq').oninput = e => { const t = e.target.value.trim().toLowerCase(); $$('#gl .gl').forEach(x => x.hidden = t && !x.dataset.t.includes(t)); };
}

/* ---------- about ---------- */
function about(sub) {
  if (sub === 'skill' || sub === 'derived') return doc(sub, 'extra', true);
  const m = D.meta, rd = D.rd;
  const sec = (k, title) => `<h2 id="${title}">${title}</h2>${rd[k]}`;
  render(`<div class="wrap dpage fade"><article>
    <div class="crumb"><span>关于这本书</span><span>/</span><span>README.md</span></div>
    <div class="prose" id="prose">
      <h1>关于这本书</h1>
      <p>${esc(m.lede[0])}</p><p>${esc(m.lede[1])}</p>
      ${m.notes.map(n => `<blockquote><p>${n}</p></blockquote>`).join('')}
      <h2 id="下载">下载与其他版本</h2>
      <p>原作者提供的离线版本（正文每次更新后自动重新生成）：</p>
      <div class="alist">${m.dl.map(([t, u]) => `<a class="btn ghost" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}<a class="btn ghost" href="https://eternity4719.github.io/HowToLiveBetter/" target="_blank" rel="noopener">原版在线检索页 ↗</a><a class="btn ghost" href="https://eternity4719.github.io/HowToLiveBetter/selfcheck.html" target="_blank" rel="noopener">生活自查 ↗</a></div>
      <p>其他语言（由他人维护，内容可能落后，以原仓库中文原文为准）：</p>
      <div class="alist">${m.langs.filter(([t]) => !/^(仓库|dlgrv|parveen0029|chuanman2707)$/.test(t)).map(([t, u]) => `<a class="btn ghost" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}</div>
      <p>让 AI 照书回答：<a href="#/about/skill">life-decision-guide skill 说明</a> · 读者做的网站、App 和数据集：<a href="#/about/derived">衍生项目</a></p>
      ${sec('怎么读', '怎么读')}
      ${sec('四种资源', '四种资源')}
      ${sec('证据分级', '证据分级')}
      ${sec('性价比档', '性价比档')}
      ${sec('正文', '正文')}
      ${sec('许可', '许可')}
      <h2 id="关于本站">关于本站</h2>
      <p>本站是《高性价比人生指南》的重新排版阅读站，由 SiinXu 整理排版，不是原作者的官方站点。条目、长文和核实记录的文字逐字取自 <a href="${GH}" target="_blank" rel="noopener">eternity4719/HowToLiveBetter</a>；改动只有排版、导航、交叉引用链接和筛选界面。性价比档按原检索页公开的同一规则计算。</p>
      <p>同步版本：原仓库提交 <a href="${GH}/commit/${m.commit}" target="_blank" rel="noopener"><code>${m.commit.slice(0, 7)}</code></a>（${m.date.slice(0, 10)}）。书里的法条、补贴标准和截止日期经常更新，以原仓库最新版为准；发现错误请<a href="${GH}/issues" target="_blank" rel="noopener">向原作者提 issue</a>。</p>
      <p>正文许可：<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>。原书也提供微信赞赏码，见<a href="${GH}#赞赏" target="_blank" rel="noopener">原仓库 README</a>。</p>
    </div></article><aside class="dtoc" id="dtoc"></aside></div>`, 'about', '关于');
  buildToc();
}
})();
