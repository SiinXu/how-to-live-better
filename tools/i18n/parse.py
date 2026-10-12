import re,json,glob,os
B='/tmp/dlgrv/book'
def parse(path):
    txt=open(path,encoding='utf-8').read()
    h1=re.search(r'^# (.+)$',txt,re.M).group(1).strip()
    parts=re.split(r'^### (\d+)\. (.+)$',txt,flags=re.M)
    ents={}
    for i in range(1,len(parts),3):
        n=int(parts[i]); t=parts[i+1].strip(); body=parts[i+2]
        f={}
        for m in re.finditer(r'^- ([^:：\n]{1,40})[:：]\s*(.*)$',body,re.M):
            f[m.group(1).strip()]=m.group(2).strip()
        tag=re.search(r'<!-- 成本标签: (.*?) -->',body)
        ents[n]={'t':t,'f':f,'tag':tag.group(1) if tag else ''}
    return h1,ents
out={}
for lang in ['zh','en','es']:
    files=sorted(glob.glob(B+'/*.md')) if lang=='zh' else sorted(glob.glob(f'{B}/{lang}/*.md'))
    out[lang]={}
    for p in files:
        n=int(os.path.basename(p)[:2]); out[lang][n]=parse(p)
json.dump(out,open('parsed.json','w'),ensure_ascii=False)
d=json.load(open('../site/data/book.json'))
bad=0;tot=0
for c in d['ch']:
    zh=out['zh'][c['n']][1]
    for e in c['e']:
        tot+=1
        z=zh.get(e['n'])
        if not z or z['t']!=e['t']: bad+=1; print('MISMATCH',c['n'],e['n'],e['t'],'|',z and z['t'])
print('total',tot,'bad',bad)
print(out['en'][1][1][1]['f'].keys(), out['es'][1][1][1]['f'].keys())
for l in ['en','es']:
  print(l,[ (n,len(out[l][n][1]),len(out['zh'][n][1])) for n in out[l] if len(out[l][n][1])!=len(out['zh'][n][1])])
