import json,re,html,os,glob
import opencc
cc=opencc.OpenCC('s2tw')
SITE='../site'
S={}
ORDER=['zh-CN','zh-TW','en','ja','ko','ms','vi','fr','es','de']
for l in ['zh','en','ja','ko','ms','vi','fr','es','de']:
    S['zh-CN' if l=='zh' else l]=json.load(open(f'str/{l}.json'))
tw={k:cc.convert(v) for k,v in S['zh-CN'].items()}
tw.update(langName='繁體中文',langShort='繁',uiLang='介面語言',site='高性價比人生指南',cTw=S['zh-CN']['cTw'],
          theme='切換明暗',searchPh='搜尋建議…',search='檢索',loading='正在載入 {n} 條建議…')
S['zh-TW']=tw
P=json.load(open('parsed.json'))
book=json.load(open(f'{SITE}/data/book.json'))
T=json.load(open('titles.json'))
titles={l:{str(i+1):t for i,t in enumerate(v)} for l,v in T.items()}
for l in ['en','es']:
    titles[l]={n:re.sub(r'^\d+\.\s*','',P[l][n][0]) for n in P[l]}
titles['zh-TW']={str(c['n']):cc.convert(c['t']) for c in book['ch']}
os.makedirs(f'{SITE}/i18n',exist_ok=True)
with open(f'{SITE}/i18n/strings.js','w') as f:
    f.write('/* UI strings. zh-TW chrome is generated from zh-CN via OpenCC s2tw. */\nwindow.HTLB_I18N='+json.dumps({'order':ORDER,'str':S,'titles':titles},ensure_ascii=False,separators=(',',':'))+';\n')

def md(s):
    if not s: return ''
    toks=[]
    def keep(h): toks.append(h); return f'\x00{len(toks)-1}\x00'
    s=re.sub(r'<(https?://[^>\s]+)>',lambda m:keep(f'<a href="{html.escape(m.group(1))}" target="_blank" rel="noopener">{html.escape(m.group(1))}</a>'),s)
    def link(m):
        t,u=m.group(1),m.group(2)
        if u.startswith('http'): return keep(f'<a href="{html.escape(u)}" target="_blank" rel="noopener">{html.escape(t)}</a>')
        return keep(html.escape(t))
    s=re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)',link,s)
    s=html.escape(s,quote=False)
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
    return re.sub(r'\x00(\d+)\x00',lambda m:toks[int(m.group(1))],s)
norm=lambda s: re.sub(r'\s+|<[^>]+>|\[|\]\([^)]*\)|\*\*|`','',html.unescape(s or ''))
LAB={'en':{'cost':'Cost','human':'In plain terms','gain':'Benefit','note':'Notes'},
     'es':{'cost':'Costo','human':'En términos sencillos','gain':'Beneficio','note':'Notas'}}
ZK={'cost':'成本','human':'说人话','gain':'收益','note':'备注'}
def intro_md(txt):
    paras=[p.strip() for p in txt.strip().split('\n\n') if p.strip()]
    out=[]
    for p in paras:
        if p.startswith('>') : continue
        if p.startswith('|'): continue
        out.append('<p>'+md(p.replace('\n',' '))+'</p>')
    return '\n'.join(out)
stats={}
for l in ['en','es']:
    o={'src':{'name':'dlgrv/HowToLiveBetter','url':f'https://github.com/dlgrv/HowToLiveBetter/tree/main/book/{l}','site':f'https://book.dlgrv.com/{l}/'},'ch':{},'e':{}}
    used=fb=0
    files=sorted(glob.glob(f'/tmp/dlgrv/book/{l}/*.md'))
    for c in book['ch']:
        n=str(c['n'])
        txt=open([f for f in files if os.path.basename(f).startswith('%02d-'%c['n'])][0]).read()
        body=txt.split('\n',1)[1]; pre=re.split(r'^### ',body,flags=re.M)[0]
        o['ch'][n]={'t':titles[l][n],'intro':intro_md(pre)}
        zh=P['zh'][n][1]; tr=P[l][n][1]
        for e in c['e']:
            k=str(e['n']); z=zh.get(k); t=tr.get(k)
            if not z or not t: continue
            r={}
            if z['t']==e['t']: r['t']=html.escape(t['t'],quote=False) and t['t']
            for f,zk in ZK.items():
                if not e.get(f): continue
                if norm(e[f])!=norm(z['f'].get(zk)): fb+=1; continue
                v=t['f'].get(LAB[l][f])
                if v: r[f]=md(v); used+=1
            if r: o['e'][f"{c['n']}-{k}"]=r
    if l=='en':
        rd=open('/tmp/dlgrv/README.md').read()
        for q,n in re.findall(r'^\|\s*(.+?)\s*\|\s*\[(\d+)\.\s',rd,re.M):
            o['ch'][n].setdefault('q',q)
    stats[l]=(len(o['e']),used,fb)
    json.dump(o,open(f'{SITE}/data/i18n-{l}.json','w'),ensure_ascii=False,separators=(',',':'))
# zh-TW overlay
C=cc.convert
o={'ch':{},'e':{},'q':{k:C(v) for k,v in book['q'].items()},'gloss':[{'k':C(g['k']),'v':C(g['v'])} for g in book['gloss']],
   'rd':{k:C(v) for k,v in book['rd'].items()},'docs':{d['id']:{'title':C(d['title']),'lead':C(d['lead'])} for d in book['docs']},
   'meta':{'lede':[C(x) for x in book['meta']['lede']],'notes':[C(x) for x in book['meta']['notes']]},'docDir':'doc-tw'}
for c in book['ch']:
    o['ch'][str(c['n'])]={'t':C(c['t']),'intro':C(c['intro'])}
    for e in c['e']:
        o['e'][f"{c['n']}-{e['n']}"]={f:C(e[f]) for f in ['t','human','cost','gain','note'] if e.get(f)}
json.dump(o,open(f'{SITE}/data/i18n-zh-TW.json','w'),ensure_ascii=False,separators=(',',':'))
os.makedirs(f'{SITE}/data/doc-tw',exist_ok=True)
for p in glob.glob(f'{SITE}/data/doc/*.html'):
    open(f'{SITE}/data/doc-tw/'+os.path.basename(p),'w').write(C(open(p).read()))
print(stats)
