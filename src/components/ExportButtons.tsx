import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ScheduleEntry, Teacher, Subject, Classroom } from '../types';

interface ExportButtonsProps {
  schedule: ScheduleEntry[];
  teachers: Teacher[];
  subjects: Subject[];
  classrooms: Classroom[];
}

// jsPDF の型拡張
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const ExportButtons = ({ teachers, subjects, classrooms }: ExportButtonsProps) => {
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  // Suppressing unused variable warnings for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTeacherName = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId)?.name || 'Unknown';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getClassroomName = (classroomId: string) => {
    return classrooms.find(c => c.id === classroomId)?.name || 'Unknown';
  };

  const exportToExcel = async () => {
    setIsExporting('excel');
    
    try {
      // 半年分のデータを取得
      const response = await fetch('/semester_schedule.json');
      const semesterData = await response.json();

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
        
        // シートデータの準備（改良版フォーマット）
        const sheetData = [
          [`${group.name} - 半年分時間割`, '', '', '', '', ''],
          ['', '', '', '', '', ''],
          ['週', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日'],
          ['', '(月)', '(火)', '(水)', '(木)', '(金)']
        ];

        // 24週分のデータを準備（改良版）
        for (let week = 1; week <= 24; week++) {
          // 週の日付を計算
          const startDate = new Date(semesterData.startDate || '2025-10-07');
          const weekStartDate = new Date(startDate);
          weekStartDate.setDate(startDate.getDate() + (week - 1) * 7);

          const weekData = [`第${week}週`];
          
          ['月', '火', '水', '木', '金'].forEach((day, dayIndex) => {
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + dayIndex);
            const dateStr = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`;

            const dayEntries = group.schedule
              .filter((entry: any) => entry.timeSlot.week === week && entry.timeSlot.dayOfWeek === day)
              .map((entry: any) => {
                // 色分け用のインデックス設定
                if (!subjectColors.has(entry.subjectName)) {
                  subjectColors.set(entry.subjectName, colors[subjectColors.size % colors.length]);
                }
                if (!teacherColors.has(entry.teacherName)) {
                  teacherColors.set(entry.teacherName, colors[teacherColors.size % colors.length]);
                }

                const periodTime = periodTimes[entry.timeSlot.period] || '';
                return `【${entry.timeSlot.period} ${periodTime}】\n${entry.subjectName}\n👨‍🏫 ${entry.teacherName}\n🏫 ${entry.classroomName}`;
              })
              .join('\n\n');
            
            weekData.push(dayEntries ? `${dateStr}\n${dayEntries}` : dateStr);
          });
          
          sheetData.push(weekData);
        }

        // 統計情報を追加（改良版）
        sheetData.push(['']);
        sheetData.push(['📊 統計情報', '', '', '', '', '']);
        sheetData.push(['総授業数', group.schedule.length.toString(), '', '', '', '']);
        sheetData.push(['期間', `${semesterData.startDate} 〜 ${semesterData.endDate}`, '', '', '', '']);
        sheetData.push(['生成日時', new Date().toLocaleString('ja-JP'), '', '', '', '']);

        // シート作成
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // 列幅調整（改良版）
        worksheet['!cols'] = [
          { width: 12 },  // 週
          { width: 30 },  // 月曜日
          { width: 30 },  // 火曜日
          { width: 30 },  // 水曜日
          { width: 30 },  // 木曜日
          { width: 30 },  // 金曜日
        ];

        // シートをワークブックに追加
        const sheetName = group.name.replace(/[\\/:*?"<>|]/g, ''); // 無効文字除去
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // 全体サマリーシートの作成
      const summaryData = [
        ['AI時間割自動生成システム - 全体サマリー'],
        [''],
        ['学科・学年', '総授業数', '生成日時'],
      ];

      Object.keys(semesterData.groups).forEach(groupKey => {
        const group = semesterData.groups[groupKey];
        summaryData.push([
          group.name,
          group.schedule.length.toString(),
          new Date().toLocaleString('ja-JP')
        ]);
      });

      summaryData.push(['']);
      summaryData.push(['システム', 'AI時間割自動生成システム']);
      summaryData.push(['学校', 'アイデアITカレッジ阿蘇']);

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'サマリー');

      // ファイル書き出し
      const fileName = `半年分時間割_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Excel書き出しエラー:', error);
      alert('Excel書き出し中にエラーが発生しました。');
    } finally {
      setIsExporting(null);
    }
  };

  const exportToPDF = async () => {
    setIsExporting('pdf');
    
    try {
      // 半年分のデータを取得
      const response = await fetch('/semester_schedule.json');
      const semesterData = await response.json();

      const pdf = new jsPDF();
      
      // 日本語フォント設定（簡易版）
      pdf.setFont('helvetica');

      // タイトル
      pdf.setFontSize(20);
      pdf.text('AI時間割自動生成システム', 105, 20, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(`アイデアITカレッジ阿蘇 半年分時間割`, 105, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`期間: ${semesterData.startDate} 〜 ${semesterData.endDate}`, 105, 40, { align: 'center' });

      let currentY = 60;

      // 各グループごとのサマリー表を作成
      const summaryData: string[][] = [];
      Object.keys(semesterData.groups).forEach(groupKey => {
        const group = semesterData.groups[groupKey];
        summaryData.push([
          group.name,
          group.schedule.length.toString(),
          group.status === 'complete' ? '✓ 完璧' : '✗ 未完成'
        ]);
      });

      // サマリー表を描画
      pdf.setFontSize(16);
      pdf.text('各学科・学年の授業統計', 20, currentY);
      currentY += 20;

      pdf.autoTable({
        head: [['学科・学年', '総授業数', '状態']],
        body: summaryData,
        startY: currentY,
        styles: {
          fontSize: 10,
          cellPadding: 4,
          valign: 'middle',
          halign: 'center'
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        margin: { left: 20, right: 20 }
      });

      // 新しいページを追加して詳細情報を表示
      pdf.addPage();
      currentY = 30;

      // 全体統計を表示
      pdf.setFontSize(16);
      pdf.text('全体統計情報', 20, currentY);
      currentY += 20;

      const totalClasses = Object.values(semesterData.groups).reduce((sum: number, group: any) => sum + group.schedule.length, 0);
      const completedGroups = Object.values(semesterData.groups).filter((group: any) => group.status === 'complete').length;
      
      const statsData = [
        ['項目', '値'],
        ['総学科・学年数', Object.keys(semesterData.groups).length.toString()],
        ['完成済みグループ', `${completedGroups}/${Object.keys(semesterData.groups).length}`],
        ['全体授業総数', totalClasses.toString()],
        ['期間', `${semesterData.startDate} 〜 ${semesterData.endDate}`],
        ['週数', '24週'],
        ['生成日時', new Date().toLocaleString('ja-JP')]
      ];

      pdf.autoTable({
        head: [['項目', '値']],
        body: statsData.slice(1),
        startY: currentY,
        styles: {
          fontSize: 10,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255]
        },
        columnStyles: {
          0: { cellWidth: 80, fillColor: [249, 250, 251] }
        },
        margin: { left: 20, right: 20 }
      });

      // フッター
      pdf.setFontSize(8);
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Generated by AI時間割自動生成システム - Page ${i}/${pageCount}`, 20, 290);
      }

      // PDF保存
      pdf.save(`半年分時間割_サマリー_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('PDF書き出しエラー:', error);
      alert('PDF書き出し中にエラーが発生しました。');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="export-buttons">
      <button
        className="btn-export excel"
        onClick={exportToExcel}
        disabled={isExporting !== null}
      >
        <FileSpreadsheet size={20} />
        {isExporting === 'excel' ? 'Excel出力中...' : '半年分時間割をExcel出力'}
      </button>
      
      <button
        className="btn-export pdf"
        onClick={exportToPDF}
        disabled={isExporting !== null}
      >
        <FileText size={20} />
        {isExporting === 'pdf' ? 'PDF出力中...' : '半年分サマリーをPDF出力'}
      </button>
    </div>
  );
};

export default ExportButtons;