/**
 * 科目名正規化ユーティリティ
 * 科目名の表記揺れを統一する
 * 
 * ルール:
 * 1. I/II は別々のエントリとして扱う
 * 2. I, II の前には必ずスペースを入れる
 * 3. 西洋数字 (I, II) を使用（ローマ数字 Ⅰ, Ⅱ は使わない）
 */

/**
 * 科目名を正規化する
 * @param name 元の科目名
 * @returns 正規化された科目名
 */
export function normalizeSubjectName(name: string): string {
  // ローマ数字を西洋数字に変換
  let normalized = name
    .replace(/Ⅰ/g, 'I')
    .replace(/Ⅱ/g, 'II');
  
  // スペースなしのI/IIの前にスペースを追加（ただしAIなどの単語は除外）
  // キャリア実践I → キャリア実践 I のようなケース
  normalized = normalized.replace(/([^A-Z\s/])I(?![A-Z])/g, '$1 I');
  normalized = normalized.replace(/([^A-Z\s/])II(?![A-Z])/g, '$1 II');
  
  // I/II 形式の場合は警告（分割が必要）
  if (normalized.includes('I/II')) {
    console.warn(`⚠️ 科目名に I/II が含まれています: ${normalized}`);
    console.warn('  → I と II を別々の科目として登録してください');
  }
  
  return normalized;
}

/**
 * I/II形式の科目を分割する
 * @param name 科目名
 * @returns [I版の科目名, II版の科目名] または null（分割不要の場合）
 */
export function splitCombinedSubject(name: string): [string, string] | null {
  if (!name.includes('I/II')) {
    return null;
  }
  
  const baseName = name.replace(' I/II', '').replace('I/II', '');
  return [
    `${baseName} I`,
    `${baseName} II`
  ];
}

/**
 * 科目名が正規化されているかチェック
 * @param name 科目名
 * @returns 正規化されていればtrue
 */
export function isNormalizedSubjectName(name: string): boolean {
  // チェック項目:
  // 1. ローマ数字（Ⅰ, Ⅱ）が含まれていない
  if (name.includes('Ⅰ') || name.includes('Ⅱ')) {
    return false;
  }
  
  // 2. I/II 形式が含まれていない（分割すべき）
  if (name.includes('I/II')) {
    return false;
  }
  
  // 3. I, II の前にスペースがある（AIなどは除外）
  // キャリア実践I のようなケースをチェック
  if (name.match(/[^A-Z\s/]I(?![A-Z])/) || name.match(/[^A-Z\s/]II(?![A-Z])/)) {
    return false;
  }
  
  return true;
}

/**
 * 科目リストの正規化状態をレポート
 * @param subjects 科目リスト
 */
export function reportNormalizationStatus(subjects: Array<{ id: string; name: string }>): void {
  const issues: string[] = [];
  
  subjects.forEach(subject => {
    if (!isNormalizedSubjectName(subject.name)) {
      issues.push(`❌ ${subject.id}: ${subject.name}`);
      
      // 修正案を提示
      const normalized = normalizeSubjectName(subject.name);
      if (normalized !== subject.name) {
        issues.push(`   → 修正案: ${normalized}`);
      }
      
      // I/II分割が必要な場合
      const split = splitCombinedSubject(subject.name);
      if (split) {
        issues.push(`   → 分割案: ${split[0]} と ${split[1]}`);
      }
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ すべての科目名が正規化されています');
  } else {
    console.log('📋 科目名正規化レポート:');
    issues.forEach(issue => console.log(issue));
  }
}