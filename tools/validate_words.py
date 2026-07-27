#!/usr/bin/env python3
"""語彙CSVの形式、重複、読み、各難易度の件数を確認します。"""
from pathlib import Path
import csv,re,collections,sys
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'data'/'words.csv'
counts=collections.Counter(); words={}; errors=[]; readings=0
with path.open(encoding='utf-8-sig',newline='') as f:
    for no,row in enumerate(csv.DictReader(f),2):
        level=row.get('level','').strip(); word=row.get('word','').strip(); rs=[x.strip() for x in row.get('readings','').split('/') if x.strip()]
        counts[level]+=1; readings+=len(rs)
        if word in words: errors.append(f'{no}: 「{word}」は{words[word]}行目と重複')
        words[word]=no
        if not rs or any(not re.fullmatch(r'[ぁ-ゖ]+',x) for x in rs): errors.append(f'{no}: 読みが不正 {rs}')
        try:
            if not 1<=int(row.get('rank','0'))<=5: errors.append(f'{no}: rank範囲外')
        except ValueError: errors.append(f'{no}: rankが整数でない')
print('難易度別:',dict(counts));print('合計:',sum(counts.values()),'語 /',readings,'読み')
if errors: print('\n'.join(errors),file=sys.stderr);raise SystemExit(1)
print('検証OK')
