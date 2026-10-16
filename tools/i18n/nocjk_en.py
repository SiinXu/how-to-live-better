#!/usr/bin/env python3
"""Make the non-Chinese overlays (data/i18n-en.json, data/i18n-es.json) Chinese-free. Run after build_i18n.py.
 - source lists (e.src, only in Chinese in book.json): agency / law names through the maps below, Chinese article
   numbers -> "Art. N", "等" -> "et al."; any remaining Chinese title or quote becomes a "[in Chinese]" marker
   (the link stays, so the original can still be opened)
 - stray Chinese terms inside translated text, e.g. "deposit (定金)", become pinyin
 - English supplements from en_extra.json (glossary, glossary intro, download labels, the few entry fields the
   upstream English translation lacks)
ja / ko / ms / vi / fr / de load the English overlay (app.js), so they are covered by i18n-en.json.
Usage: python3 tools/i18n/nocjk_en.py [site_root]"""
import json, os, re, sys
from pypinyin import lazy_pinyin, Style
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
H = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf]')
AG = {  # issuing bodies, longest first when applied
 '全国人民代表大会常务委员会': "NPC Standing Committee", '全国人大常委会': "NPC Standing Committee", '全国人民代表大会': "National People's Congress", '全国人大': "National People's Congress",
 '中共中央办公厅': "General Office of the CPC Central Committee", '国务院办公厅': "General Office of the State Council", '国务院就业促进和劳动保护工作领导小组': "State Council Leading Group on Employment Promotion and Labour Protection",
 '中央军委': "Central Military Commission", '国务院': "State Council", '最高人民法院': "Supreme People's Court", '最高人民检察院': "Supreme People's Procuratorate",
 '国家统计局': "National Bureau of Statistics", '国家卫生健康委员会': "National Health Commission", '国家卫生健康委办公厅': "General Office of the National Health Commission", '国家卫生健康委': "National Health Commission", '国家卫健委': "National Health Commission",
 '国家卫生和计划生育委员会': "National Health and Family Planning Commission", '国家卫生计生委': "National Health and Family Planning Commission", '卫生部': "Ministry of Health",
 '国家疾控局综合司': "General Department of the National Disease Control Administration", '中国疾病预防控制中心职业卫生与中毒控制所': "China CDC Institute of Occupational Health and Poison Control", '中国疾病预防控制中心': "Chinese Center for Disease Control and Prevention",
 '国家市场监督管理总局': "State Administration for Market Regulation", '市场监管总局': "State Administration for Market Regulation", '国家食品药品监督管理总局': "China Food and Drug Administration", '国家质量监督检验检疫总局': "General Administration of Quality Supervision, Inspection and Quarantine", '国家质检总局': "General Administration of Quality Supervision, Inspection and Quarantine",
 '国家医疗保障局': "National Healthcare Security Administration", '国家医保局办公室': "Office of the National Healthcare Security Administration", '国家医保局': "National Healthcare Security Administration",
 '公安部网络安全保卫局': "Cybersecurity Bureau of the Ministry of Public Security", '公安部': "Ministry of Public Security", '司法部': "Ministry of Justice", '民政部': "Ministry of Civil Affairs", '教育部办公厅': "General Office of the Ministry of Education", '教育部': "Ministry of Education",
 '应急管理部': "Ministry of Emergency Management", '财政部办公厅': "General Office of the Ministry of Finance", '财政部': "Ministry of Finance", '国家税务总局': "State Taxation Administration", '税务总局': "State Taxation Administration",
 '中国证监会': "China Securities Regulatory Commission", '厦门证监局': "CSRC Xiamen Bureau", '人力资源社会保障部办公厅': "General Office of the Ministry of Human Resources and Social Security", '人力资源社会保障部': "Ministry of Human Resources and Social Security", '人力资源和社会保障部': "Ministry of Human Resources and Social Security",
 '劳动部': "Ministry of Labour", '新华社': "Xinhua", '国家外汇管理局': "State Administration of Foreign Exchange", '中国人民银行': "People's Bank of China", '国家新闻出版署': "National Press and Publication Administration",
 '中国银行保险监督管理委员会': "China Banking and Insurance Regulatory Commission", '中国银保监会消费者权益保护局': "CBIRC Consumer Protection Bureau", '中国银保监会办公厅': "General Office of the CBIRC", '中国银保监会': "China Banking and Insurance Regulatory Commission", '银保监会': "China Banking and Insurance Regulatory Commission",
 '中国保险监督管理委员会': "China Insurance Regulatory Commission", '中国保险行业协会': "Insurance Association of China", '金融监管总局': "National Financial Regulatory Administration", '中央网信办': "Cyberspace Administration of China", '国家网信办': "Cyberspace Administration of China",
 '生态环境部': "Ministry of Ecology and Environment", '环境保护部': "Ministry of Environmental Protection", '工业和信息化部': "Ministry of Industry and Information Technology", '住房和城乡建设部': "Ministry of Housing and Urban-Rural Development", '商务部': "Ministry of Commerce",
 '国家版权局': "National Copyright Administration", '国家安全部': "Ministry of State Security", '自然资源部': "Ministry of Natural Resources", '退役军人事务部': "Ministry of Veterans Affairs", '农业农村部办公厅': "General Office of the Ministry of Agriculture and Rural Affairs",
 '国家核安全局': "National Nuclear Safety Administration", '中国气象局': "China Meteorological Administration", '国家烟草专卖局': "State Tobacco Monopoly Administration", '国家发展改革委': "National Development and Reform Commission", '国家经贸委': "State Economic and Trade Commission",
 '中国互联网络信息中心': "China Internet Network Information Center", '中国政府网': "Chinese government portal (gov.cn)", '中国营养学会': "Chinese Nutrition Society", '中国睡眠研究会': "Chinese Sleep Research Society", '中华医学会': "Chinese Medical Association", '美国糖尿病学会': "American Diabetes Association",
 '美国疾病控制与预防中心': "US Centers for Disease Control and Prevention", '人民法院报': "People's Court Daily", '检察日报': "Procuratorial Daily", '澎湃新闻': "The Paper", '中国环境报': "China Environment News", '法制日报': "Legal Daily",
}
LAW = {
 '民法典': 'Civil Code', '公司法': 'Company Law', '刑法修正案': 'Criminal Law Amendment', '刑法': 'Criminal Law', '劳动合同法实施条例': 'Regulations for the Implementation of the Labour Contract Law', '劳动合同法': 'Labour Contract Law', '劳动法': 'Labour Law',
 '劳动争议调解仲裁法': 'Labour Dispute Mediation and Arbitration Law', '道路交通安全法实施条例': 'Regulations for the Implementation of the Road Traffic Safety Law', '道路交通安全法': 'Road Traffic Safety Law', '治安管理处罚法': 'Public Security Administration Punishments Law',
 '个人所得税法': 'Individual Income Tax Law', '企业所得税法': 'Enterprise Income Tax Law', '税收征收管理法': 'Tax Collection Administration Law', '消费者权益保护法': 'Consumer Rights Protection Law', '食品安全法': 'Food Safety Law', '社会保险法': 'Social Insurance Law',
 '合伙企业法': 'Partnership Enterprise Law', '著作权法': 'Copyright Law', '商标法': 'Trademark Law', '专利法': 'Patent Law', '电子商务法': 'E-Commerce Law', '广告法': 'Advertising Law', '网络安全法': 'Cybersecurity Law', '数据安全法': 'Data Security Law',
 '个人信息保护法': 'Personal Information Protection Law', '未成年人保护法': 'Minors Protection Law', '反电信网络诈骗法': 'Anti-Telecom and Online Fraud Law', '反家庭暴力法': 'Anti-Domestic Violence Law', '民事诉讼法': 'Civil Procedure Law', '刑事诉讼法': 'Criminal Procedure Law',
 '行政处罚法': 'Administrative Penalty Law', '行政诉讼法': 'Administrative Litigation Law', '出境入境管理法': 'Exit and Entry Administration Law', '禁毒法': 'Narcotics Control Law', '职业病防治法': 'Occupational Disease Prevention Law', '安全生产法': 'Work Safety Law',
 '消防法': 'Fire Protection Law', '药品管理法': 'Drug Administration Law', '疫苗管理法': 'Vaccine Administration Law', '精神卫生法': 'Mental Health Law', '义务教育法': 'Compulsory Education Law', '教育法': 'Education Law', '妇女权益保障法': 'Women’s Rights Protection Law',
 '老年人权益保障法': 'Elderly Rights Protection Law', '残疾人保障法': 'Disabled Persons Protection Law', '证券法': 'Securities Law', '保险法': 'Insurance Law', '商业银行法': 'Commercial Banking Law', '反洗钱法': 'Anti-Money Laundering Law', '城市房地产管理法': 'Urban Real Estate Administration Law',
 '土地管理法': 'Land Administration Law', '就业促进法': 'Employment Promotion Law', '公证法': 'Notarization Law', '国家赔偿法': 'State Compensation Law', '兵役法': 'Military Service Law', '反不正当竞争法': 'Anti-Unfair Competition Law', '产品质量法': 'Product Quality Law',
 '海关法': 'Customs Law', '反间谍法': 'Counter-Espionage Law', '国家安全法': 'National Security Law', '慈善法': 'Charity Law', '婚姻法': 'Marriage Law', '继承法': 'Inheritance Law', '合同法': 'Contract Law', '物权法': 'Property Law', '侵权责任法': 'Tort Law',
 '城镇燃气管理条例': 'Regulations on Urban Gas Administration', '工伤保险条例': 'Regulations on Work-Related Injury Insurance', '职工带薪年休假条例': 'Regulations on Paid Annual Leave for Employees', '女职工劳动保护特别规定': 'Special Provisions on Labour Protection of Female Employees',
 '最低工资规定': 'Provisions on Minimum Wages', '增值税暂行条例': 'Provisional Regulations on Value-Added Tax', '外汇管理条例': 'Regulations on Foreign Exchange Administration', '个人所得税法实施条例': 'Regulations for the Implementation of the Individual Income Tax Law',
}
MARK = {'en': '[in Chinese]', 'es': '[en chino]'}
D = {'零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
def cn2n(s):
    if s.isdigit(): return int(s)
    total, cur = 0, 0
    for ch in s:
        if ch in D: cur = D[ch]
        elif ch == '十': total += (cur or 1) * 10; cur = 0
        elif ch == '百': total += cur * 100; cur = 0
        elif ch == '千': total += cur * 1000; cur = 0
        elif ch == '万': total = (total + cur) * 10000; cur = 0
    return total + cur
NUM = '零〇一二两三四五六七八九十百千万0-9'
def arts(m):
    ns = [str(cn2n(x)) for x in re.split(r'[、,，]', m.group(1)) if x]
    return ('Art. ' if len(ns) == 1 else 'Arts. ') + ', '.join(ns)
KEYS = sorted(list(AG) + list(LAW), key=len, reverse=True)
MAP = {**AG, **LAW}
KRE = re.compile('|'.join(map(re.escape, KEYS)))
HAN = '\u4e00-\u9fff\u3400-\u4dbf'
RUN = re.compile('[' + HAN + '《〈][' + HAN + r'\s\d%…·—《》〈〉\-]*[' + HAN + '》〉]|[' + HAN + ']')
PUN = (('；', '; '), ('。', '. '), ('：', ': '), ('，', ', '), ('、', ', '), ('（', ' ('), ('）', ')'), ('！', '! '), ('？', '? '))
def src_text(t, lang):
    if not H.search(t):
        for a, b in PUN: t = t.replace(a, b)
        return t
    t = KRE.sub(lambda m: MAP[m.group()], t)
    t = re.sub(r'令第\s*(\d+)\s*号', r' Order No. \1', t); t = re.sub(r'〔(\d{4})〕\s*(\d+)\s*号', r' [\1] No. \2', t); t = re.sub(r'第\s*(\d+)\s*号', r'No. \1', t)
    t = re.sub(r'第([' + NUM + r'、]+)条', lambda m: arts(type('M', (), {'group': lambda s, i: m.group(1)})()), t)
    t = re.sub(r'(\d{4})\s*年修订', r'\1 revision', t); t = re.sub(r'(\d{4})\s*年版', r'\1 edition', t)
    t = re.sub(r"([A-Za-z.'’]+)\s*等(?=\s*[\(（,，.])", r'\1 et al.', t); t = re.sub(r',\s*等(?=\s*[\(（.])', ', et al.', t)
    t = re.sub(r'^\s*同上', 'Ibid.', t); t = re.sub(r'同刊', 'Same journal,', t)
    for a, b in PUN: t = t.replace(a, b)
    t = re.sub(r'[「『“][^」』”]*[」』”]', lambda m: m.group() if not H.search(m.group()) else '\x01', t)
    t = RUN.sub('\x01', t)
    t = re.sub(r'\x01(?:[\s.,:()]*\x01)*', MARK[lang], t)
    t = re.sub(r'\(\s*' + re.escape(MARK[lang]) + r'\s*\)', MARK[lang], t)
    return re.sub(r'[ \t]{2,}', ' ', re.sub(r'\s+([.,;:)])', r'\1', t))
def tag(p):  # drop Chinese tooltips (title="第 16 节第 9 条：…") from inline tags
    return re.sub(r'\s(?:title|aria-label|alt)="[^"]*[\u4e00-\u9fff][^"]*"', '', p)
def src_html(h, lang):
    return ''.join(tag(p) if p.startswith('<') else src_text(p, lang) for p in re.split(r'(<[^>]+>)', h or ''))
def py(m):
    return ' '.join(lazy_pinyin(m.group(), style=Style.TONE))
def text_html(h):  # stray Chinese inside translated prose -> pinyin
    if not isinstance(h, str) or not H.search(h): return h
    return ''.join(tag(p) if p.startswith('<') else re.sub(r'[\u4e00-\u9fff\u3400-\u4dbf]+', py, p).replace('（', ' (').replace('）', ')').replace('「', '"').replace('」', '"') for p in re.split(r'(<[^>]+>)', h))
def walk(v):
    if isinstance(v, str): return text_html(v)
    if isinstance(v, list): return [walk(x) for x in v]
    if isinstance(v, dict): return {k: walk(x) for k, x in v.items()}
    return v
book = json.load(open(os.path.join(ROOT, 'data', 'book.json'), encoding='utf-8'))
EX = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'en_extra.json'), encoding='utf-8'))
for lang in ('en', 'es'):
    p = os.path.join(ROOT, 'data', f'i18n-{lang}.json'); o = json.load(open(p, encoding='utf-8'))
    for k, v in EX['e'].items():
        o['e'].setdefault(k, {})
        for f, x in v.items(): o['e'][k].setdefault(f, x)
    for c in book['ch']:
        for e in c['e']:
            if e.get('src'): o['e'].setdefault(f"{c['n']}-{e['n']}", {})['src'] = src_html(e['src'], lang)
    if lang == 'en' or 'gloss' not in o: o['gloss'] = EX['gloss']
    o.setdefault('rd', {}).update({k: v for k, v in EX['rd'].items() if k not in o['rd']})
    o.setdefault('meta', {}).setdefault('dl', EX['meta']['dl'])
    o['q'] = {k: v for k, v in (o.get('q') or {}).items() if not H.search(v)}
    o = walk(o)
    vals = json.dumps({k: v for k, v in o.items() if k != 'rd'}, ensure_ascii=False) + json.dumps(list(o.get('rd', {}).values()), ensure_ascii=False)
    left = sorted(set(re.findall(r'[\u4e00-\u9fff]+', vals)))
    assert not left, left[:20]
    json.dump(o, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(lang, 'ok: entries', len(o['e']), 'Chinese-free')
