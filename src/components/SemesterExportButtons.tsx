import { useState, useEffect } from 'react';
import { FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GroupStatus {
  [key: string]: 'complete' | 'incomplete';
}

interface SemesterExportButtonsProps {
  groupStatuses: GroupStatus;
  groupNames: { [key: string]: string };
}

const SemesterExportButtons = ({ groupStatuses, groupNames }: SemesterExportButtonsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    const allGroupsComplete = Object.values(groupStatuses).every(status => status === 'complete');
    setAllComplete(allGroupsComplete);
  }, [groupStatuses]);

  const handleExportClick = async () => {
    if (!allComplete) {
      alert('まだ書き出し条件を満たしていません。未完成のタブを確認してください。');
      return;
    }

    setIsExporting(true);
    
    try {
      // 生成されたデータをLocalStorageから取得
      const generatedData = localStorage.getItem('generatedSemesterData');
      const generatedSettings = localStorage.getItem('lastGeneratedSettings');
      
      let semesterData;
      let settings = null;
      
      if (generatedData) {
        semesterData = JSON.parse(generatedData);
        if (generatedSettings) {
          settings = JSON.parse(generatedSettings);
        }
      } else {
        // フォールバック：デフォルトデータを使用
        const response = await fetch('/semester_schedule.json');
        semesterData = await response.json();
      }

      // ワークブック作成
      const workbook = XLSX.utils.book_new();

      // 科目・教師ごとの色分け用カラーマップ
      const subjectColors = new Map();
      const teacherColors = new Map();
      const colors = [
        'FFE6F2FF', // 薄い青
        'FFE6FFF2', // 薄い緑
        'FFFFF2E6', // 薄い黄
        'FFFFE6E6', // 薄い赤
        'FFF2E6FF', // 薄い紫
        'FFE6F2E6', // 薄いミント
        'FFF2F2E6', // 薄いピンク
        'FFE6E6F2', // 薄いラベンダー
      ];

      // 時限の時刻情報
      const periodTimes = {
        '1限': '9:00-10:30',
        '2限': '10:40-12:10', 
        '3限': '13:00-14:30',
        '4限': '14:40-16:10'
      };

      // 各グループごとにシートを作成
      Object.keys(semesterData.groups).forEach((groupKey, groupIndex) => {
        const group = semesterData.groups[groupKey];
        
        // シートデータの準備（改良版フォーマット - 時限別に行を分ける）
        const sheetData = [
          [`${group.name} - 半年分時間割 (${settings?.title || semesterData?.title || '時間割'})`, '', '', '', '', '', ''],
          ['', '', '', '', '', '', ''],
          ['週', '時限', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日']
        ];

        // 実際の週数分のデータを準備（改良版）
        const actualWeeks = semesterData.weeks || 25;
        for (let week = 1; week <= actualWeeks; week++) {
          // 週の日付を計算（SemesterTimetableと同じロジック）
          const semesterStartDate = new Date(semesterData.startDate || '2025-09-29');
          
          // 開始日が月曜日でない場合、最初の月曜日を見つける
          const startDayOfWeek = semesterStartDate.getDay();
          const daysToMonday = startDayOfWeek === 0 ? 1 : (8 - startDayOfWeek) % 7;
          
          const firstMonday = new Date(semesterStartDate);
          if (startDayOfWeek !== 1) {
            firstMonday.setDate(semesterStartDate.getDate() + daysToMonday);
          }
          
          // 指定週の月曜日を計算
          const weekStartDate = new Date(firstMonday);
          weekStartDate.setDate(firstMonday.getDate() + (week - 1) * 7);

          // 週のヘッダー行（日付+曜日付き）
          const weekDates: string[] = [];
          const dayNames = ['月', '火', '水', '木', '金'];
          dayNames.forEach((day, dayIndex) => {
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + dayIndex);
            const dateStr = `${dayDate.getMonth() + 1}/${dayDate.getDate()}(${day})`;
            weekDates.push(dateStr);
          });
          
          // 週のヘッダー行を追加
          sheetData.push([`第${week}週`, '', ...weekDates]);
          
          // 各時限の行を作成
          ['1限', '2限', '3限', '4限'].forEach(period => {
            const periodRow = ['', period];
            
            const dayNames = ['月', '火', '水', '木', '金'];
            dayNames.forEach((day, dayIndex) => {
              // 同じ時間帯のすべてのエントリを取得（コンビ授業対応）
              const entries = group.schedule.filter((e: any) => 
                e.timeSlot.week === week && 
                e.timeSlot.dayOfWeek === day && 
                e.timeSlot.period === period
              );
              
              if (entries.length > 0) {
                // コンビ授業の場合は複数エントリを結合
                if (entries.length > 1) {
                  const subjects = entries.map((e: any) => e.subjectName).join(' / ');
                  const teachers = entries.map((e: any) => e.teacherName).join(' / ');
                  const classrooms = entries.map((e: any) => e.classroomName).join(' / ');
                  
                  // 色分け用のインデックス設定
                  entries.forEach((e: any) => {
                    if (!subjectColors.has(e.subjectName)) {
                      subjectColors.set(e.subjectName, colors[subjectColors.size % colors.length]);
                    }
                    if (!teacherColors.has(e.teacherName)) {
                      teacherColors.set(e.teacherName, colors[teacherColors.size % colors.length]);
                    }
                  });
                  
                  // 完全なテキストを保持（Excel側で切り詰め表示）
                  periodRow.push(`🤝${subjects}\n${teachers}\n${classrooms}`);
                } else {
                  // 単一授業の場合
                  const entry = entries[0];
                  
                  // 色分け用のインデックス設定
                  if (!subjectColors.has(entry.subjectName)) {
                    subjectColors.set(entry.subjectName, colors[subjectColors.size % colors.length]);
                  }
                  if (!teacherColors.has(entry.teacherName)) {
                    teacherColors.set(entry.teacherName, colors[teacherColors.size % colors.length]);
                  }
                  
                  const isCombo = entry.subjectName.includes('[コンビ]');
                  const comboMark = isCombo ? '🤝' : '';
                  
                  // 完全なテキストを保持（Excel側で切り詰め表示）
                  periodRow.push(`${comboMark}${entry.subjectName}\n${entry.teacherName}\n${entry.classroomName}`);
                }
              } else {
                periodRow.push('');
              }
            });
            
            sheetData.push(periodRow);
          });
          
          // 週の区切り行を追加
          sheetData.push(['', '', '', '', '', '', '']);
        }

        // 統計情報を追加（改良版）
        sheetData.push(['']);
        sheetData.push(['📊 統計情報', '', '', '', '', '', '']);
        sheetData.push(['総授業数', group.schedule.length.toString(), '', '', '', '', '']);
        sheetData.push(['期間', `${semesterData.startDate} 〜 ${semesterData.endDate}`, '', '', '', '', '']);
        sheetData.push(['週数', `${actualWeeks}週`, '', '', '', '', '']);
        sheetData.push(['月曜日使用', settings?.mondayAvoid ? '無し（予備日）' : '有り', '', '', '', '', '']);
        if (settings?.remarks && settings.remarks.trim()) {
          sheetData.push(['備考', settings.remarks, '', '', '', '', '']);
        }
        sheetData.push(['ステータス', groupStatuses[groupKey] === 'complete' ? '✅ 完璧' : '❌ 未完成', '', '', '', '', '']);
        sheetData.push(['生成日時', new Date().toLocaleString('ja-JP'), '', '', '', '', '']);

        // シート作成
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // 列幅調整（コンパクトサイズ - 折り返し重視）
        worksheet['!cols'] = [
          { width: 12 },  // 週
          { width: 10 },  // 時限
          { width: 30 },  // 月曜日
          { width: 30 },  // 火曜日
          { width: 30 },  // 水曜日
          { width: 30 },  // 木曜日
          { width: 30 },  // 金曜日
        ];

        // 行の高さ設定の改良版
        const rowHeights: any[] = [];
        
        for (let i = 0; i < sheetData.length; i++) {
          const row = sheetData[i];
          
          // タイトル行
          if (i === 0) {
            rowHeights.push({ hpx: 40 });
          }
          // 空行
          else if (i === 1) {
            rowHeights.push({ hpx: 15 });
          }
          // ヘッダー行（曜日ヘッダー）- 4行目削除したので2行目のみ
          else if (i === 2) {
            rowHeights.push({ hpx: 35 });
          }
          // 週の日付行（第X週の行）
          else if (row[0] && row[0].toString().includes('第') && row[0].toString().includes('週')) {
            rowHeights.push({ hpx: 30 }); // 日付行は適度な高さ
          }
          // 時限行（1限〜4限）
          else if (row[1] && ['1限', '2限', '3限', '4限'].includes(row[1])) {
            rowHeights.push({ hpx: 80 }); // 時限行の高さを適度に調整
          }
          // 空行（週の区切り）
          else if (row.every((cell: any) => !cell || cell === '')) {
            rowHeights.push({ hpx: 10 });
          }
          // その他の行（統計情報等）
          else {
            rowHeights.push({ hpx: 25 });
          }
        }
        
        worksheet['!rows'] = rowHeights;
        
        // セルの色付け設定
        for (let i = 0; i < sheetData.length; i++) {
          const row = sheetData[i];
          
          // 週の日付行に背景色を設定
          if (row[0] && row[0].toString().includes('第') && row[0].toString().includes('週')) {
            for (let col = 0; col < 7; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: i, c: col });
              if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
              
              worksheet[cellAddress].s = {
                fill: { 
                  patternType: 'solid',
                  fgColor: { rgb: 'B3E5FC' } // より鮮やかな青色
                },
                font: { 
                  bold: true, 
                  color: { rgb: '01579B' }, // 濃い青色
                  sz: 12
                },
                alignment: { 
                  horizontal: 'center', 
                  vertical: 'center',
                  wrapText: true
                },
                border: {
                  top: { style: 'medium', color: { rgb: '0277BD' } },
                  bottom: { style: 'medium', color: { rgb: '0277BD' } },
                  left: { style: 'medium', color: { rgb: '0277BD' } },
                  right: { style: 'medium', color: { rgb: '0277BD' } }
                }
              };
            }
          }
          
          // ヘッダー行のスタイル設定
          if (i === 2) {
            for (let col = 0; col < 7; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: i, c: col });
              if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
              
              worksheet[cellAddress].s = {
                fill: { 
                  patternType: 'solid',
                  fgColor: { rgb: 'F3F4F6' } // 薄いグレー
                },
                font: { 
                  bold: true, 
                  color: { rgb: '374151' },
                  sz: 12
                },
                alignment: { 
                  horizontal: 'center', 
                  vertical: 'center'
                },
                border: {
                  top: { style: 'medium', color: { rgb: '374151' } },
                  bottom: { style: 'medium', color: { rgb: '374151' } },
                  left: { style: 'thin', color: { rgb: '9CA3AF' } },
                  right: { style: 'thin', color: { rgb: '9CA3AF' } }
                }
              };
            }
          }
        }
        
        // 全セルに表示設定を適用（空セルも含めてはみ出し防止）
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            
            // 空セルも含めてセルを初期化
            if (!worksheet[cellAddress]) {
              worksheet[cellAddress] = { t: 's', v: '' };
            }
            
            // 既存のスタイルを保持しつつ、表示設定を追加
            if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
            if (!worksheet[cellAddress].s.alignment) worksheet[cellAddress].s.alignment = {};
            
            // 文字縮小でセル内に収める（データは完全保持）
            worksheet[cellAddress].s.alignment.wrapText = false; // 折り返し無効
            worksheet[cellAddress].s.alignment.shrinkToFit = true; // 文字縮小でセル内に収める
            
            // セルごとの詳細設定
            if (row > 2 && col > 1) {
              // 授業内容セル：上寄せ・左寄せ・文字縮小・境界線追加
              worksheet[cellAddress].s.alignment.vertical = 'top';
              worksheet[cellAddress].s.alignment.horizontal = 'left';
              worksheet[cellAddress].s.alignment.wrapText = false; // 折り返し無効
              worksheet[cellAddress].s.alignment.shrinkToFit = true; // 文字縮小
              
              // 境界線を追加してはみ出しを完全に防ぐ
              if (!worksheet[cellAddress].s.border) {
                worksheet[cellAddress].s.border = {
                  top: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  right: { style: 'thin', color: { rgb: 'D1D5DB' } }
                };
              }
            } else if (col <= 1) {
              // 週・時限列：中央寄せ
              worksheet[cellAddress].s.alignment.horizontal = 'center';
              worksheet[cellAddress].s.alignment.vertical = 'center';
            } else {
              // その他のセル：中央寄せ・境界線追加
              worksheet[cellAddress].s.alignment.horizontal = 'center';
              worksheet[cellAddress].s.alignment.vertical = 'center';
              
              // 境界線を追加してはみ出しを完全に防ぐ
              if (!worksheet[cellAddress].s.border) {
                worksheet[cellAddress].s.border = {
                  top: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  left: { style: 'thin', color: { rgb: 'D1D5DB' } },
                  right: { style: 'thin', color: { rgb: 'D1D5DB' } }
                };
              }
            }
          }
        }
        
        // セルマージの設定（タイトル行）
        if (!worksheet['!merges']) worksheet['!merges'] = [];
        worksheet['!merges'].push({
          s: { r: 0, c: 0 }, // 開始セル
          e: { r: 0, c: 6 }  // 終了セル（A1:G1をマージ）
        });
        
        // セルの書式設定を試行
        for (let rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
          const row = sheetData[rowIndex];
          
          // 週の日付行に色を付ける
          if (row[0] && row[0].toString().includes('第') && row[0].toString().includes('週')) {
            for (let colIndex = 0; colIndex < 7; colIndex++) {
              const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
              if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
              
              // セルに書式を設定（日付行の色分けを改善）
              worksheet[cellAddress].s = {
                fill: { 
                  patternType: 'solid',
                  fgColor: { rgb: 'B3E5FC' } // より鮮やかな青色
                },
                font: { 
                  bold: true, 
                  color: { rgb: '01579B' }, // 濃い青色
                  sz: 12
                },
                alignment: { 
                  horizontal: 'center', 
                  vertical: 'center',
                  wrapText: true
                },
                border: {
                  top: { style: 'medium', color: { rgb: '0277BD' } },
                  bottom: { style: 'medium', color: { rgb: '0277BD' } },
                  left: { style: 'medium', color: { rgb: '0277BD' } },
                  right: { style: 'medium', color: { rgb: '0277BD' } }
                }
              };
            }
          }
          
          // 時限行のスタイル設定
          if (row[1] && ['1限', '2限', '3限', '4限'].includes(row[1])) {
            for (let colIndex = 0; colIndex < 7; colIndex++) {
              const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
              if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
              
              worksheet[cellAddress].s = {
                alignment: { 
                  vertical: 'top',
                  horizontal: colIndex > 1 ? 'left' : 'center', // 授業内容は左寄せ
                  wrapText: false, // 折り返し無効
                  shrinkToFit: true // 文字縮小でセル内に収める
                },
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                }
              };
            }
          }
        }

        // シートをワークブックに追加
        const sheetName = group.name.replace(/[\\/:*?\"<>|]/g, ''); // 無効文字除去
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // 全体サマリーシートの作成
      const summaryData = [
        ['AI時間割自動生成システム - 全体サマリー'],
        [''],
        ['学科・学年', '状態', '総授業数', '完成度'],
      ];

      Object.keys(semesterData.groups).forEach(groupKey => {
        const group = semesterData.groups[groupKey];
        const status = groupStatuses[groupKey];
        summaryData.push([
          group.name,
          status === 'complete' ? '✅ 完璧' : '❌ 未完成',
          group.schedule.length.toString(),
          status === 'complete' ? '100%' : '未完成'
        ]);
      });

      summaryData.push(['']);
      summaryData.push(['期間', `${semesterData.startDate} 〜 ${semesterData.endDate}`]);
      summaryData.push(['週数', `${semesterData.weeks || 25}週`]);
      summaryData.push(['月曜日使用', settings?.mondayAvoid ? '無し（予備日）' : '有り']);
      if (settings?.remarks && settings.remarks.trim()) {
        summaryData.push(['備考', settings.remarks]);
      }
      summaryData.push(['生成日時', new Date().toLocaleString('ja-JP')]);
      summaryData.push(['システム', 'AI時間割自動生成システム']);
      summaryData.push(['学校', 'アイデアITカレッジ阿蘇']);

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'サマリー');

      // 教師別サマリーシートの作成
      const teacherSummaryData = [
        ['教師別スケジュール一覧'],
        [''],
        ['※各教師の授業スケジュールを時系列で表示'],
        ['']
      ];

      // 日付計算用の関数
      const calculateActualDate = (week: number, dayOfWeek: string) => {
        const semesterStartDate = new Date(semesterData.startDate || '2025-09-29');
        
        // 開始日が月曜日でない場合、最初の月曜日を見つける
        const startDayOfWeek = semesterStartDate.getDay();
        const daysToMonday = startDayOfWeek === 0 ? 1 : (8 - startDayOfWeek) % 7;
        
        const firstMonday = new Date(semesterStartDate);
        if (startDayOfWeek !== 1) {
          firstMonday.setDate(semesterStartDate.getDate() + daysToMonday);
        }
        
        // 指定週の月曜日を計算
        const weekStartDate = new Date(firstMonday);
        weekStartDate.setDate(firstMonday.getDate() + (week - 1) * 7);
        
        // 曜日オフセット
        const dayOffsets: { [key: string]: number } = {
          '月': 0, '火': 1, '水': 2, '木': 3, '金': 4
        };
        
        const actualDate = new Date(weekStartDate);
        actualDate.setDate(weekStartDate.getDate() + dayOffsets[dayOfWeek]);
        
        return actualDate;
      };

      // 全授業データを収集
      const allLessons: any[] = [];
      Object.keys(semesterData.groups).forEach(groupKey => {
        const group = semesterData.groups[groupKey];
        group.schedule.forEach((lesson: any) => {
          const actualDate = calculateActualDate(lesson.timeSlot.week, lesson.timeSlot.dayOfWeek);
          const dateString = `${actualDate.getMonth() + 1}/${actualDate.getDate()}`;
          
          allLessons.push({
            teacherName: lesson.teacherName,
            date: dateString,
            dayOfWeek: lesson.timeSlot.dayOfWeek,
            period: lesson.timeSlot.period,
            subjectName: lesson.subjectName,
            groupName: group.name,
            classroomName: lesson.classroomName,
            sortKey: `${lesson.timeSlot.week.toString().padStart(2, '0')}-${lesson.timeSlot.dayOfWeek}-${lesson.timeSlot.period}`,
            actualDate: actualDate
          });
        });
      });

      // 教師別にグループ化
      const teacherGroups: { [key: string]: any[] } = {};
      allLessons.forEach(lesson => {
        if (!teacherGroups[lesson.teacherName]) {
          teacherGroups[lesson.teacherName] = [];
        }
        teacherGroups[lesson.teacherName].push(lesson);
      });

      // 各教師のスケジュールを時系列でソート・表示
      Object.keys(teacherGroups).sort().forEach((teacherName, index) => {
        if (index > 0) {
          teacherSummaryData.push(['']); // 教師間の区切り
        }
        
        teacherSummaryData.push([`◆ ${teacherName}`, '', '', '', '', '']);
        teacherSummaryData.push(['日程', '曜日', '時限', '科目名', '対象', '教室']);
        
        // 時系列でソート
        const sortedLessons = teacherGroups[teacherName].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        
        sortedLessons.forEach(lesson => {
          teacherSummaryData.push([
            lesson.date,
            lesson.dayOfWeek,
            lesson.period,
            lesson.subjectName,
            lesson.groupName,
            lesson.classroomName
          ]);
        });
      });

      // 教師別サマリーシートを作成
      const teacherSummarySheet = XLSX.utils.aoa_to_sheet(teacherSummaryData);
      
      // 列幅設定
      teacherSummarySheet['!cols'] = [
        { width: 12 },  // 日程
        { width: 8 },   // 曜日
        { width: 8 },   // 時限
        { width: 35 },  // 科目名
        { width: 25 },  // 対象
        { width: 15 },  // 教室
      ];

      XLSX.utils.book_append_sheet(workbook, teacherSummarySheet, '教師別スケジュール');

      // ファイル書き出し
      const fileName = `半年分時間割_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Excel書き出しエラー:', error);
      alert('Excel書き出し中にエラーが発生しました。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="semester-export-container">
      <div className="export-status">
        <div className="status-summary">
          {allComplete ? (
            <div className="status-complete">
              <CheckCircle size={20} />
              <span>すべてのタブが完璧な状態です</span>
            </div>
          ) : (
            <div className="status-incomplete">
              <AlertCircle size={20} />
              <span>未完成のタブがあります</span>
            </div>
          )}
        </div>
        
        <div className="group-status-list">
          {Object.keys(groupStatuses).map(groupKey => (
            <div key={groupKey} className={`group-status ${groupStatuses[groupKey]}`}>
              {groupStatuses[groupKey] === 'complete' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{groupNames[groupKey] || groupKey}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        className={`btn-semester-export ${!allComplete ? 'disabled' : ''}`}
        onClick={handleExportClick}
        disabled={isExporting || !allComplete}
      >
        <FileSpreadsheet size={20} />
        {isExporting ? '書き出し中...' : '半年分時間割をExcel出力'}
      </button>
    </div>
  );
};

export default SemesterExportButtons;