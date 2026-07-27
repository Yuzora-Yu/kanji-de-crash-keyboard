#!/usr/bin/env python3
"""data/words.csv からブラウザ用 data/words.js を生成します。依存パッケージ不要。"""
from pathlib import Path
import csv, json, re, sys
ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'data' / 'words.csv'
JS_PATH = ROOT / 'data' / 'words.js'
COUNT_PATH = ROOT / 'data' / 'word-counts.json'
LEVELS = ['beginner','intermediate','advanced','expert','oni']
LABELS = {'beginner':'初級','intermediate':'中級','advanced':'上級','expert':'超級','oni':'鬼'}

def main():
    data={k:[] for k in LEVELS}; seen=set(); errors=[]
    with CSV_PATH.open(encoding='utf-8-sig', newline='') as f:
        for line,row in enumerate(csv.DictReader(f),2):
            level=row['level'].strip(); word=row['word'].strip(); readings=[x.strip() for x in row['readings'].split('/') if x.strip()]
            try: rank=int(row['rank'])
            except ValueError: errors.append(f'{line}: rankが整数ではありません'); continue
            if level not in data: errors.append(f'{line}: 不明なlevel {level}'); continue
            if not word or not readings: errors.append(f'{line}: word/readingsが空です'); continue
            if not 1 <= rank <= 5: errors.append(f'{line}: rankは1〜5'); continue
            if any(not re.fullmatch(r'[ぁ-ゖ]+',r) for r in readings): errors.append(f'{line}: 読みはひらがなのみ: {readings}'); continue
            if word in seen: errors.append(f'{line}: 重複語 {word}'); continue
            seen.add(word); data[level].append({'word':word,'readings':readings,'rank':rank})
    if errors:
        print('\n'.join(errors),file=sys.stderr); return 1
    header='// 独自選定の語彙データ。漢検の公式問題・公式語彙集ではありません。\n// 難易度は漢検の対象漢字範囲と一般的な学習段階を参考にしたゲーム独自区分です。\n'
    JS_PATH.write_text(header+'window.KCK_WORDS = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    counts={LABELS[k]:len(v) for k,v in data.items()}; COUNT_PATH.write_text(json.dumps(counts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'生成完了: {sum(counts.values())}語 {counts}')
    return 0
if __name__=='__main__': raise SystemExit(main())
