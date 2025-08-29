/**
 * Excel/PDF出力用の共通ヘルパー関数
 * ExportButtons, SemesterExportButtons で使用される共通処理を集約
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// jsPDFの日本語フォント設定用の型拡張
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

/**
 * 共通のExcelエクスポート設定
 */
export const getExcelExportConfig = () => ({
  bookType: 'xlsx' as XLSX.BookType,
  cellStyles: {
    header: {
      fill: { fgColor: { rgb: 'FFD3D3D3' } },
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    cell: {
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    }
  }
});

/**
 * PDF生成用の共通設定
 */
export const createPdfDocument = (orientation: 'portrait' | 'landscape' = 'landscape') => {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });
  
  // 日本語フォント設定（実際の実装では適切なフォントを読み込む必要があります）
  doc.setFont('helvetica');
  
  return doc;
};

/**
 * 時間割データをExcel用の2次元配列に変換
 */
export const createTimetableMatrix = (
  days: string[],
  periods: string[],
  entries: any[],
  getEntryKey: (day: string, period: string) => any
) => {
  const rows: any[][] = [];
  
  // ヘッダー行
  rows.push(['', ...days]);
  
  // 各時限の行
  periods.forEach(period => {
    const row = [period];
    days.forEach(day => {
      const entry = getEntryKey(day, period);
      if (entry) {
        row.push(`${entry.subjectName}\n${entry.teacherName}\n${entry.classroomName}`);
      } else {
        row.push('');
      }
    });
    rows.push(row);
  });
  
  return rows;
};

/**
 * Excelファイルをダウンロード
 */
export const downloadExcel = (workbook: XLSX.WorkBook, filename: string) => {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * PDFファイルをダウンロード
 */
export const downloadPdf = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

/**
 * 日付フォーマット
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * 週番号から日付を計算
 */
export const getWeekDates = (weekNumber: number, startDate: Date): { start: Date; end: Date } => {
  const start = new Date(startDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 4); // 金曜日まで
  
  return { start, end };
};

/**
 * カラー設定（科目タイプ別）
 */
export const getSubjectTypeColor = (subjectName: string): string => {
  if (subjectName.includes('[合同]')) return 'rgb(255, 223, 186)'; // オレンジ系
  if (subjectName.includes('[共通]')) return 'rgb(186, 230, 255)'; // 青系
  if (subjectName.includes('[コンビ]')) return 'rgb(255, 186, 255)'; // ピンク系
  return 'rgb(255, 255, 255)'; // デフォルト白
};