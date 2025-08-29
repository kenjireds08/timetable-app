// 基本設定データの復元スクリプト
// ブラウザのコンソールで実行してください

// 基本設定データ
const basicSettings = {
  // スケジュール情報
  scheduleInfo: {
    startDate: '2025-09-29',
    endDate: '2026-03-20',
    totalWeeks: 25
  },
  
  // 休日設定
  holidays: [
    // 祝日
    { date: '2025-10-13', name: 'スポーツの日' },
    { date: '2025-10-14', name: 'スポーツの日 振替休日' },
    { date: '2025-11-03', name: '文化の日' },
    { date: '2025-11-23', name: '勤労感謝の日' },
    { date: '2025-11-24', name: '勤労感謝の日 振替休日' },
    { date: '2025-12-23', name: '天皇誕生日' },
    { date: '2026-01-01', name: '元日' },
    { date: '2026-01-12', name: '成人の日' },
    { date: '2026-01-13', name: '成人の日 振替休日' },
    { date: '2026-02-11', name: '建国記念の日' },
    { date: '2026-02-23', name: '天皇誕生日' },
    { date: '2026-02-24', name: '天皇誕生日 振替休日' },
    { date: '2026-03-20', name: '春分の日' },
    
    // カスタム休日
    { date: '2025-12-22', name: '終業式' },
    { date: '2025-12-23', name: '冬期休暇開始' },
    { date: '2025-12-24', name: '冬期休暇' },
    { date: '2025-12-25', name: '冬期休暇' },
    { date: '2025-12-26', name: '冬期休暇' },
    { date: '2025-12-27', name: '冬期休暇' },
    { date: '2025-12-28', name: '冬期休暇' },
    { date: '2025-12-29', name: '冬期休暇' },
    { date: '2025-12-30', name: '冬期休暇' },
    { date: '2025-12-31', name: '冬期休暇' },
    { date: '2026-01-02', name: '冬期休暇' },
    { date: '2026-01-03', name: '冬期休暇' },
    { date: '2026-01-04', name: '冬期休暇' },
    { date: '2026-01-05', name: '冬期休暇' },
    { date: '2026-01-06', name: '冬期休暇' },
    { date: '2026-01-07', name: '冬期休暇終了' }
  ],
  
  // スケジュール調整要求
  adjustmentRequests: [
    '特別行事、注意事項、変更点など、スケジュール設定時に考慮すべき事項を記入してください。',
    '',
    '例：',
    '- 1/26-28: 成果発表会のため授業なし',
    '- 1/29-2/6: 補講期間（通常授業なし）',
    '- フィオーナ先生の木曜3限は13:15開始（15分遅れ）',
    '- 月曜に補填授業を入れる必要あり（3コマ分）'
  ].join('\n')
};

// LocalStorageに保存
localStorage.setItem('scheduleInfo', JSON.stringify(basicSettings.scheduleInfo));
localStorage.setItem('holidays', JSON.stringify(basicSettings.holidays));
localStorage.setItem('adjustmentRequests', basicSettings.adjustmentRequests);

console.log('✅ 基本設定データを復元しました！');
console.log('ページをリロードして確認してください。');

// 教師制約データのみを削除する関数（今後のため）
function clearOnlyTeacherConstraints() {
  localStorage.removeItem('teachers_constraints_2025H2');
  console.log('✅ 教師制約データのみをクリアしました');
}