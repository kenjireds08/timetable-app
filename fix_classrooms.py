#!/usr/bin/env python3
"""
サマリシートの教室データに基づいてmockData.tsの教室を修正するスクリプト
"""

# サマリシートからの教室データ（●がある＝利用可能）
classroom_data = {
    # 全学年合同（たかねこのみ）
    'クリエイティブコミュニケーションラボ I/II': ['c1'],
    '次世代地域リーダー学 I/II': ['c1'],
    'SNS/PR実践 I/II': ['c1'],
    '地域課題実践プロジェクト I/II': ['c1'],
    
    # 1年生共通科目（たかねこ、ICT1、ICT2）
    '次世代地域リーダー学 I': ['c1', 'c4', 'c5'],
    'Essential English I': ['c1', 'c4', 'c5'],
    'グローバルスタディーズ I': ['c1', 'c4', 'c5'],
    'ビジネス実務 I': ['c1', 'c4', 'c5'],
    'キャリア実践 I': ['c1', 'c4', 'c5'],
    'デザインとプレゼンテーション': ['c1', 'c4', 'c5'],
    
    # 1年生ビジネス日本語（しらかわ、なか、ICT1、ICT2）
    'ビジネス日本語 I': ['c2', 'c3', 'c4', 'c5'],
    
    # 2年生共通科目（しらかわ、なか、ICT1、ICT2）
    '次世代地域リーダー学 II': ['c2', 'c3', 'c4', 'c5'],
    'Essential English II': ['c2', 'c3', 'c4', 'c5'],
    'ビジネス日本語 II': ['c2', 'c3', 'c4', 'c5'],
    'グローバルスタディーズ II': ['c2', 'c3', 'c4', 'c5'],
    'ビジネス実務 II': ['c2', 'c3', 'c4', 'c5'],
    
    # IT1年専門（たかねこのみ必須）
    'データベース概論': ['c1'],
    'オブジェクト指向プログラミング': ['c1'],
    'データベース設計': ['c1'],
    
    # IT1年専門（たかねこ、ICT1、ICT2）
    '地域課題×IT I': ['c1', 'c4', 'c5'],
    'IoTとデータ活用 I': ['c1', 'c4', 'c5'],
    'セキュリティ基礎': ['c1', 'c4', 'c5'],
    '進級制作': ['c1', 'c4', 'c5'],
    
    # IT2年専門（しらかわ、なか、ICT1、ICT2）
    'IoTとデータ活用 II': ['c2', 'c3', 'c4', 'c5'],
    '生成AI開発': ['c2', 'c3', 'c4', 'c5'],
    '情報視覚化': ['c2', 'c3', 'c4', 'c5'],
    'Webアプリ開発': ['c2', 'c3', 'c4', 'c5'],
    'セキュリティ診断': ['c2', 'c3', 'c4', 'c5'],
    '卒業制作': ['c2', 'c3', 'c4', 'c5'],
    
    # TD専門（全て：しらかわ、なか、ICT1、ICT2）
    'Active Communication in English I': ['c2', 'c3', 'c4', 'c5'],
    'Active Communication in English II': ['c2', 'c3', 'c4', 'c5'],
    'Business English I': ['c2', 'c3', 'c4', 'c5'],
    'Business English II': ['c2', 'c3', 'c4', 'c5'],
    'ビジネス&マーケティング応用': ['c2', 'c3', 'c4', 'c5'],
    'ビジネス開発演習': ['c2', 'c3', 'c4', 'c5'],
    '観光地域づくり実践（黒川温泉FW）': ['c2', 'c3', 'c4', 'c5'],
    'Webデザイン（ノーコード）': ['c2', 'c3', 'c4', 'c5'],
    '地域観光マーケティング': ['c2', 'c3', 'c4', 'c5'],
    '観光地域マネジメント': ['c2', 'c3', 'c4', 'c5'],
    '卒業プロジェクト': ['c2', 'c3', 'c4', 'c5'],
    '地域商品開発': ['c2', 'c3', 'c4', 'c5'],
}

# mockData.tsファイルの読み込みと修正
import re

with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 各科目の教室設定を更新
for subject_name, classroom_ids in classroom_data.items():
    # 科目名にマッチするパターンを作成
    pattern = f"name: '{re.escape(subject_name)}'.*?availableClassroomIds: \\[[^\\]]*\\]"
    replacement = f"name: '{subject_name}',\n    teacherIds: $1,\n    availableClassroomIds: {classroom_ids}"
    
    # より正確なパターンマッチング
    pattern = rf"(name: '{re.escape(subject_name)}',.*?availableClassroomIds: )\[[^\]]*\]"
    classroom_str = str(classroom_ids).replace("'", '"')  # TypeScript形式に変換
    replacement = rf"\1{classroom_str}"
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print(f"更新: {subject_name} → {classroom_ids}")

# ファイルの書き込み
with open('src/data/mockData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 教室データの修正が完了しました")