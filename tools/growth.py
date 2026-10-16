"""Analytics + SEO/GEO + newsletter for How to Live Better (idempotent). python3 tools/growth.py"""
import json, os, re, html, subprocess
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, '..'); BASE = 'https://siinxu.github.io/how-to-live-better/'
b = json.load(open(os.path.join(R, 'data/book.json'))); en = json.load(open(os.path.join(R, 'data/i18n-en.json')))
st = b['meta']['stats']; N, A, B, C = st['entries'], st['A'], st['B'], st['C']; NC = len(b['ch'])
INTRO = {
 'zh-CN': f'这是开源中文书《高性价比人生指南》（eternity4719/HowToLiveBetter）的重新排版阅读站：{NC} 章 {N} 条建议，每条写明花掉什么、换回什么、证据有多硬（A 级 {A} 条、B 级 {B} 条、C 级 {C} 条）。适合想少走弯路、把时间和钱花在确定收益上的普通人。',
 'zh-TW': f'這是開源中文書《高性價比人生指南》（eternity4719/HowToLiveBetter）的重新排版閱讀站：{NC} 章 {N} 條建議，每條寫明花掉什麼、換回什麼、證據有多硬（A 級 {A} 條、B 級 {B} 條、C 級 {C} 條）。適合想少走彎路、把時間和錢花在確定收益上的普通人。',
 'en': f'A re-typeset reading site for the open-source Chinese book “How to Live Better” (eternity4719/HowToLiveBetter): {N} pieces of advice in {NC} chapters, each stating what it costs, what you gain and how strong the evidence is ({A} grade A, {B} grade B, {C} grade C). For anyone who wants to spend time and money where the payoff is reliable.',
 'ja': f'オープンソースの中国語書籍『How to Live Better（高性価比人生指南）』（eternity4719/HowToLiveBetter）を読みやすく再組版したサイトです。{NC} 章・{N} 項目の助言それぞれに、かかるコスト・得られるもの・エビデンスの強さ（A {A}・B {B}・C {C}）を明記しています。',
 'ko': f'오픈소스 중국어 책 〈How to Live Better(高性价比人生指南)〉(eternity4719/HowToLiveBetter)을 다시 조판한 읽기 사이트입니다. {NC}개 장, {N}개 조언마다 드는 비용, 얻는 것, 근거의 강도(A {A}·B {B}·C {C})를 적었습니다.',
 'ms': f'Laman bacaan susun semula untuk buku sumber terbuka bahasa Cina “How to Live Better” (eternity4719/HowToLiveBetter): {N} nasihat dalam {NC} bab, setiap satu menyatakan kosnya, faedahnya dan kekuatan bukti (A {A}, B {B}, C {C}).',
 'vi': f'Trang đọc dàn trang lại cho cuốn sách mã nguồn mở tiếng Trung “How to Live Better” (eternity4719/HowToLiveBetter): {N} lời khuyên trong {NC} chương, mỗi lời khuyên ghi rõ chi phí, lợi ích và độ mạnh của bằng chứng (A {A}, B {B}, C {C}).',
 'fr': f'Un site de lecture remis en page pour le livre chinois open source « How to Live Better » (eternity4719/HowToLiveBetter) : {N} conseils en {NC} chapitres, chacun indiquant ce qu’il coûte, ce qu’il rapporte et la solidité des preuves (A {A}, B {B}, C {C}).',
 'es': f'Un sitio de lectura remaquetado del libro chino de código abierto «How to Live Better» (eternity4719/HowToLiveBetter): {N} consejos en {NC} capítulos, cada uno con lo que cuesta, lo que aporta y la solidez de la evidencia (A {A}, B {B}, C {C}).',
 'de': f'Eine neu gesetzte Leseseite für das chinesische Open-Source-Buch „How to Live Better“ (eternity4719/HowToLiveBetter): {N} Ratschläge in {NC} Kapiteln, jeweils mit Kosten, Nutzen und Evidenzstärke (A {A}, B {B}, C {C}).'}
txt = lambda s: html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s or ''))).strip()
chs = [(c['n'], c['t'], (en['ch'].get(str(c['n'])) or {}).get('t', ''), txt((en['ch'].get(str(c['n'])) or {}).get('intro', ''))) for c in b['ch']]
e = html.escape
# default HTML is English (served to every locale before JS picks the language); Chinese lives in JS / ?lang=zh-CN
ssr = ('<!--IA--><section class="wrap ssr-index" style="padding:24px 0 8px"><h1>How to Live Better</h1>'
       f'<p>{e(INTRO["en"])}</p><h2>Chapters</h2><ol>'
       + ''.join(f'<li><a href="#/c/{n}">{e(te or str(n))}</a></li>' for n, t, te, _ in chs) + '</ol></section><!--/IA-->')
cfg = {'root': R, 'base': BASE, 'name': 'How to Live Better', 'site': 'htlb', 'cf_token': '41d8abdb6f1247c08f2412afcd5f2143', 'goal': 'scroll_75', 'og_image': 'og.png', 'hreflang': True,
       'subcss_path': os.path.join(D, 'subscribe.css'), 'intro': INTRO, 'intro_after': '</header>', 'intro_fallback': 'en', 'desc': INTRO['en'],
       'intro_css': 'max-width:1080px;margin:14px auto 0;padding:0 20px;font-size:12.5px;line-height:1.55;opacity:.72',
       'sub_before': '<footer', 'sub_css': 'max-width:760px;margin:32px auto;padding:0 20px;--ie-acc:var(--inv);--ie-acc-ink:var(--inv-fg)',
       'pages': [{'file': 'index.html', 'rel': '', 'ld': [{'@type': 'Book', 'name': 'How to Live Better', 'url': 'https://github.com/eternity4719/HowToLiveBetter', 'inLanguage': 'zh-CN', 'numberOfPages': None and 0},
                                                        {'@type': 'WebPage', 'name': 'How to Live Better — reading site', 'url': BASE, 'about': {'@type': 'Book', 'name': 'How to Live Better'}, 'isBasedOn': 'https://github.com/eternity4719/HowToLiveBetter', 'publisher': {'@id': 'https://incidental.site/#org'}}]}]}
cfg['pages'][0]['ld'][0].pop('numberOfPages')
llms = f'# How to Live Better — reading site\n> {INTRO["en"]}\n\n- Site: {BASE}\n- Source book: https://github.com/eternity4719/HowToLiveBetter\n- English translation source: {en["src"]["url"]}\n- Languages: en (default), zh-CN, zh-TW, ja, ko, ms, vi, fr, es, de (append ?lang=<code>)\n- Reading site by Incidental AI (https://incidental.site/)\n- Full text: {BASE}llms-full.txt\n\n## Chapters\n' + ''.join(f'- {n}. {te or "Chapter " + str(n)}\n' for n, t, te, _ in chs)
cfg['llms.txt'] = llms
cfg['llms-full.txt'] = llms + '\n' + ''.join(f'\n## {n}. {te or t}\n{it}\n' for n, t, te, it in chs if it)
p = '/tmp/htlb-ia.json'; json.dump(cfg, open(p, 'w'), ensure_ascii=False)
subprocess.run(['python3', os.path.join(D, 'ia_inject.py'), p], check=True)
ip = os.path.join(R, 'index.html'); s = open(ip, encoding='utf-8').read()
s = re.sub(r'<!--IA--><section class="wrap ssr-index".*?<!--/IA-->', '', s, flags=re.S)
s = re.sub(r'(<main id="app"[^>]*>.*?)(</main>)', lambda m: m.group(1) + ssr + m.group(2), s, count=1, flags=re.S)
open(ip, 'w', encoding='utf-8').write(s); print('growth ok')
