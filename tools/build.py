#!/usr/bin/env python3
"""Build data for the HowToLiveBetter showcase site from the upstream repo clone."""
import json, re, os, sys, subprocess, html, hashlib
from pathlib import Path
import markdown

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/htlb-src')
OUT = Path(__file__).resolve().parent.parent / 'data'
GH = 'https://github.com/eternity4719/HowToLiveBetter'
(OUT / 'doc').mkdir(parents=True, exist_ok=True)
for f in (OUT / 'doc').glob('*.html'): f.unlink()

def md(text):
    return markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists', 'md_in_html'], output_format='html5')

def md_inline(text):
    h = md(text).strip()
    m = re.fullmatch(r'<p>(.*)</p>', h, re.S)
    return m.group(1) if m else h

# ---------- book ----------
chapters = []
titles = {}  # (ch, n) -> title
TAG = re.compile(r'<!-- 成本标签:\s*(.*?)\s*-->')
FIELD = {'成本': 'cost', '说人话': 'human', '收益': 'gain', '证据等级': 'grade', '来源': 'src', '备注': 'note'}
COST_W = {'money': {'0': 0, '少': 1, '多': 2}, 'time': {'少': 0, '中': 1, '多': 2}, 'will': {'否': 0, '些': 1, '是': 2}}
TAGKEY = {'钱': 'money', '时间': 'time', '毅力': 'will', '收益': 'level', '口径': 'lens'}
for f in sorted((SRC / 'book').glob('*.md')):
    num = int(f.name[:2]); text = f.read_text('utf-8')
    lines = text.split('\n')
    title = ''; intro = []; entries = []; cur = None; tail = False
    for ln in lines:
        if ln.startswith('[← 回总目录]'): continue
        if ln.startswith('# ') and not title:
            title = re.sub(r'^\d+\.\s*', '', ln[2:].strip()); continue
        if ln.startswith('## '):  # trailing licence block in one file
            tail = True; cur = None; continue
        if tail: continue
        m = re.match(r'^### (\d+)\.\s*(.*)$', ln)
        if m:
            cur = {'n': int(m.group(1)), 'title': m.group(2).strip()}; entries.append(cur); continue
        if cur is None:
            intro.append(ln); continue
        m = TAG.match(ln.strip())
        if m:
            for kv in m.group(1).split():
                k, v = kv.split('=', 1); cur[TAGKEY[k]] = v
            continue
        m = re.match(r'^- (成本|说人话|收益|证据等级|来源|备注)：(.*)$', ln)
        if m: cur[FIELD[m.group(1)]] = m.group(2).strip()
    for e in entries:
        titles[(num, e['n'])] = e['title']
    chapters.append({'n': num, 'file': f.name, 'title': title, 'intro': '\n'.join(intro).strip(), 'entries': entries})

# ---------- link rewriting & xrefs ----------
DOCS = sorted(p for p in (SRC / 'docs').glob('*.md'))
RECS = sorted((SRC / 'docs' / '核实记录').glob('*.md'))
doc_id = {p.stem: f'd{i}' for i, p in enumerate(DOCS)}
rec_id = {p.stem: f'r{i}' for i, p in enumerate(RECS)}
book_stem = {c['file'][:-3]: c['n'] for c in chapters}

def rewrite_href(href):
    if re.match(r'^(https?:|mailto:|#)', href): return href
    path, _, frag = href.partition('#')
    from urllib.parse import unquote
    path = unquote(path); name = path.rstrip('/').split('/')[-1]
    stem = name[:-3] if name.endswith('.md') else name
    if name == 'README.md' and 'skills' not in path: return '#/'
    if stem in book_stem:
        m = re.search(r'第\s*(\d+)\s*条', LINKTEXT[0]) if LINKTEXT else None
        return f'#/c/{book_stem[stem]}' + (f'/{m.group(1)}' if m else '')
    if '核实记录' in path and stem in rec_id: return f'#/rec/{rec_id[stem]}'
    if path.rstrip('/').endswith('核实记录'): return '#/rec'
    if stem in doc_id: return f'#/doc/{doc_id[stem]}'
    if name == '衍生项目.md': return '#/about/derived'
    if 'skills/life-decision-guide' in path: return '#/about/skill'
    clean = re.sub(r'^(\.\./)+', '', path)
    return f'{GH}/blob/main/{clean}' + (f'#{frag}' if frag else '')

XR = re.compile(r'第\s*(\d+)\s*节第\s*(\d+)\s*条')
BARE = re.compile(r'(?<!号，)(?<!号,)(?<!号, )第\s*(\d+)\s*条')

def link_text(seg, ch=None):
    def rx(m):
        c, n = int(m.group(1)), int(m.group(2)); t = titles.get((c, n))
        if not t: return m.group(0)
        return f'<a class="xr" href="#/c/{c}/{n}" title="第 {c} 节第 {n} 条：{html.escape(t, True)}">{m.group(0)}</a>'
    out = XR.sub(rx, seg)
    if ch is not None:
        parts = re.split(r'(<a [^>]*>.*?</a>)', out)
        def rb(m):
            n = int(m.group(1)); t = titles.get((ch, n))
            if not t: return m.group(0)
            return f'<a class="xr" href="#/c/{ch}/{n}" title="{html.escape(t, True)}">{m.group(0)}</a>'
        out = ''.join(p if p.startswith('<a ') else BARE.sub(rb, p) for p in parts)
    return out

LINKTEXT = []
def _rh(m):
    LINKTEXT[:] = [m.group(2)]
    return f'<a href="{html.escape(rewrite_href(html.unescape(m.group(1))), True)}"{m.group(3)}>{m.group(2)}</a>'
def post(h, ch=None):
    h = re.sub(r'<a href="([^"]*)"([^>]*)>(.*?)</a>', lambda m: _rh(type('M',(object,),{'group':lambda self,i:[None,m.group(1),m.group(3),m.group(2)][i]})()), h)
    h = re.sub(r'<a href="(https?:[^"]*)"', r'<a href="\1" target="_blank" rel="noopener"', h)
    # xrefs only in text nodes outside anchors/code
    toks = re.split(r'(<[^>]+>)', h); depth = 0; res = []
    for t in toks:
        if t.startswith('<'):
            if re.match(r'<(a|code|pre)\b', t): depth += 1
            elif re.match(r'</(a|code|pre)>', t): depth -= 1
            res.append(t)
        else:
            res.append(t if depth else link_text(t, ch))
    return ''.join(res)

stats = {'entries': 0, 'A': 0, 'B': 0, 'C': 0, '极高': 0, '高': 0, '一般': 0, 'dispute': 0}
out_ch = []
for c in chapters:
    ents = []
    for e in c['entries']:
        cs = COST_W['money'].get(e.get('money'), 0) + COST_W['time'].get(e.get('time'), 0) + COST_W['will'].get(e.get('will'), 0)
        lv = e.get('level')
        ratio = ('极高' if cs == 0 else '高' if cs <= 2 else '一般') if lv == '大' else ('高' if cs == 0 else '一般') if lv == '中' else '一般'
        note = e.get('note', '')
        grade = (e.get('grade') or '').strip()[:1]
        d = {'n': e['n'], 't': e['title'], 'g': grade, 'r': ratio, 'm': e.get('money'), 'ti': e.get('time'), 'w': e.get('will'),
             'lv': lv, 'ln': e.get('lens'), 'dp': 1 if note.startswith('争议') else 0,
             'todo': 1 if re.search(r'待核实|TODO', ''.join(e.get(k, '') for k in ('src', 'gain', 'note', 'cost'))) else 0}
        for k in ('cost', 'human', 'gain', 'src', 'note'):
            d[k] = post(md_inline(e.get(k, '')), None if k == 'src' else c['n'])
        d['gfull'] = e.get('grade', '')
        ents.append(d)
        stats['entries'] += 1; stats[grade] = stats.get(grade, 0) + 1; stats[ratio] += 1; stats['dispute'] += d['dp']
    out_ch.append({'n': c['n'], 't': c['title'], 'file': c['file'], 'intro': post(md(c['intro']), c['n']), 'e': ents})

# ---------- README sections ----------
readme = (SRC / 'README.md').read_text('utf-8')
def section(name):
    m = re.search(r'^## ' + re.escape(name) + r'\s*\n(.*?)(?=^## |\Z)', readme, re.S | re.M)
    return m.group(1).strip() if m else ''
qs = {}
for m in re.finditer(r'^\| (.+?) \| \[(\d+)\. ', section('这本书想回答的问题'), re.M):
    qs[int(m.group(2))] = m.group(1).strip()
toc = {}
for m in re.finditer(r'^(\d+)\. \[[^\]]+\]\([^)]+\)[：:](.*)$', section('目录'), re.M):
    toc[int(m.group(1))] = post(md_inline(m.group(2).strip()))
gloss = []
for m in re.finditer(r'^\| ([^|]+?) \| ([^|]+?) \|$', section('读懂数字（术语表）'), re.M):
    if m.group(1) in ('术语', '---'): continue
    gloss.append({'k': m.group(1).strip(), 'v': m.group(2).strip()})
head = readme.split('<div align="center">', 1)[1].split('</div>', 1)[0]
lede_lines = re.search(r'# 高性价比人生指南\n\n(.*?)\n\n', head, re.S).group(1)
lede = [s.strip() for s in lede_lines.replace('<br>', '\n').split('\n') if s.strip()]
notes = re.findall(r'^(不用全做.*|书里的内容可能过时.*|\*\*本项目从未发行.*)$', head, re.M)
gl_sec = section('读懂数字（术语表）'); gl_intro = gl_sec.split('<details>')[0].strip()
readme_secs = {k: post(md(section(k))) for k in ['怎么读', '四种资源', '证据分级', '性价比档', '许可', '正文', '自己跑一份']}
readme_secs['术语表导语'] = post(md(gl_intro))
dl = re.findall(r'\[(PDF|EPUB|离线单文件（HTML）|Anki 牌组)\]\((https://[^)]+)\)', head)
langs = re.findall(r'\[([^\]]+)\]\((https://[^)]+)\)', head.split('<b>其他语言</b>')[1].split('</td></tr>')[0])
# 目录 trailing paragraph(s)
toc_tail = post(md('\n\n'.join(p for p in section('目录').split('\n\n') if not re.match(r'^\d+\. ', p))))

# ---------- docs ----------
docs_meta = []
def write_doc(fid, p, kind):
    t = p.read_text('utf-8')
    m = re.search(r'^# (.+)$', t, re.M)
    title = m.group(1).strip() if m else p.stem
    body = re.sub(r'^\[← [^\]]*\]\([^)]*\)\s*$', '', t, flags=re.M)
    h = post(md(body))
    (OUT / 'doc' / f'{fid}.html').write_text(h, 'utf-8')
    plain = re.sub(r'<[^>]+>', '', h)
    first = next((ln.strip() for ln in body.split('\n') if ln.strip() and not ln.startswith('#') and not ln.startswith('[')), '')
    return {'id': fid, 'stem': p.stem, 'title': title, 'kind': kind, 'chars': len(plain),
            'path': str(p.relative_to(SRC)), 'lead': re.sub(r'[*`<>\[\]]', '', first)[:140]}
for p in DOCS: docs_meta.append(write_doc(doc_id[p.stem], p, 'rec' if p.stem == '引用对照' else 'doc'))
for p in RECS: docs_meta.append(write_doc(rec_id[p.stem], p, 'rec'))
extra = [('skill', SRC / 'skills/life-decision-guide/README.md'), ('derived', SRC / '衍生项目.md')]
for fid, p in extra: docs_meta.append(write_doc(fid, p, 'extra'))

commit = subprocess.check_output(['git', '-C', str(SRC), 'log', '-1', '--format=%H|%cI'], text=True).strip().split('|')
links = int((re.search(r'原始文献-(\d+)', readme) or re.search(r'(\d+)%20%E6%9D%A1%E9%93%BE%E6%8E%A5', readme)).group(1))
res4 = [{'k': m.group(1), 'v': m.group(2).strip()} for m in re.finditer(r'^- \*\*(.+?)\*\*：(.+)$', section('四种资源'), re.M)]
lens_n = {}
for c in out_ch:
    for e in c['e']: lens_n[e['ln']] = lens_n.get(e['ln'], 0) + 1
data = {'meta': {'links': links, 'res4': res4, 'lensN': lens_n, 'commit': commit[0], 'date': commit[1], 'repo': GH, 'stats': stats, 'lede': lede,
                 'notes': [post(md_inline(n)) for n in notes], 'dl': dl, 'langs': langs},
        'q': qs, 'toc': toc, 'tocTail': toc_tail, 'gloss': gloss, 'rd': readme_secs, 'docs': docs_meta, 'ch': out_ch}
(OUT / 'book.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), 'utf-8')
print(stats, len(gloss), len(qs), len(toc), len(docs_meta), commit)
