// コンビ授業配置のテストユーティリティ
import { mockSubjects } from '../data/mockData';

export function validateComboPlacement(schedule: Map<string, any[]>): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // コンビペアを収集
  const comboPairs = new Map<string, any[]>();
  for (const subject of mockSubjects) {
    if (subject.comboPairId) {
      const existing = comboPairs.get(subject.comboPairId) || [];
      existing.push(subject);
      comboPairs.set(subject.comboPairId, existing);
    }
  }
  
  // 各グループのスケジュールをチェック
  for (const [groupId, entries] of schedule) {
    // 時限ごとにグループ化
    const slotMap = new Map<string, any[]>();
    
    for (const entry of entries) {
      const slotKey = `${entry.timeSlot.week}-${entry.timeSlot.dayOfWeek}-${entry.timeSlot.period}`;
      const slotEntries = slotMap.get(slotKey) || [];
      slotEntries.push(entry);
      slotMap.set(slotKey, slotEntries);
    }
    
    // コンビ授業のペアが同じ時限にあるかチェック
    for (const [slotKey, slotEntries] of slotMap) {
      for (const entry of slotEntries) {
        const subject = mockSubjects.find(s => s.id === entry.subjectId);
        if (!subject || !subject.comboPairId) continue;
        
        // ペアの相手を探す
        const pairSubjectId = subject.comboRole === 'A' 
          ? mockSubjects.find(s => s.comboPairId === subject.comboPairId && s.comboRole === 'B')?.id
          : mockSubjects.find(s => s.comboPairId === subject.comboPairId && s.comboRole === 'A')?.id;
        
        if (pairSubjectId) {
          const pairEntry = slotEntries.find(e => e.subjectId === pairSubjectId);
          if (!pairEntry) {
            issues.push(
              `${groupId} - 第${entry.timeSlot.week}週 ${entry.timeSlot.dayOfWeek}曜${entry.timeSlot.period}: ` +
              `${subject.name} のペア科目が同時配置されていません`
            );
          }
        }
      }
    }
  }
  
  // 片割れチェック（一方だけが配置されている場合）
  for (const [groupId, entries] of schedule) {
    for (const entry of entries) {
      const subject = mockSubjects.find(s => s.id === entry.subjectId);
      if (!subject || !subject.comboPairId) continue;
      
      const slotKey = `${entry.timeSlot.week}-${entry.timeSlot.dayOfWeek}-${entry.timeSlot.period}`;
      const slotEntries = entries.filter(e => 
        e.timeSlot.week === entry.timeSlot.week &&
        e.timeSlot.dayOfWeek === entry.timeSlot.dayOfWeek &&
        e.timeSlot.period === entry.timeSlot.period
      );
      
      const hasPartner = slotEntries.some(e => {
        const otherSubject = mockSubjects.find(s => s.id === e.subjectId);
        return otherSubject && 
               otherSubject.comboPairId === subject.comboPairId && 
               otherSubject.id !== subject.id;
      });
      
      if (!hasPartner && subject.comboPairId) {
        const partnerSubject = mockSubjects.find(s => 
          s.comboPairId === subject.comboPairId && s.id !== subject.id
        );
        if (partnerSubject) {
          issues.push(
            `${groupId} - 第${entry.timeSlot.week}週 ${entry.timeSlot.dayOfWeek}曜${entry.timeSlot.period}: ` +
            `${subject.name} が片割れ配置（${partnerSubject.name}なし）`
          );
        }
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues: [...new Set(issues)] // 重複を除去
  };
}

// 統計情報を取得
export function getComboStatistics(schedule: Map<string, any[]>): {
  totalComboPairs: number;
  correctPlacements: number;
  incorrectPlacements: number;
  thursdayPeriod1: number;
  thursdayPeriod2: number;
} {
  let totalComboPairs = 0;
  let correctPlacements = 0;
  let incorrectPlacements = 0;
  let thursdayPeriod1 = 0;
  let thursdayPeriod2 = 0;
  
  for (const [groupId, entries] of schedule) {
    const slotMap = new Map<string, any[]>();
    
    for (const entry of entries) {
      const slotKey = `${entry.timeSlot.week}-${entry.timeSlot.dayOfWeek}-${entry.timeSlot.period}`;
      const slotEntries = slotMap.get(slotKey) || [];
      slotEntries.push(entry);
      slotMap.set(slotKey, slotEntries);
    }
    
    for (const [slotKey, slotEntries] of slotMap) {
      const comboEntries = slotEntries.filter(e => {
        const subject = mockSubjects.find(s => s.id === e.subjectId);
        return subject && subject.comboPairId;
      });
      
      if (comboEntries.length === 2) {
        const [entry1, entry2] = comboEntries;
        const subject1 = mockSubjects.find(s => s.id === entry1.subjectId);
        const subject2 = mockSubjects.find(s => s.id === entry2.subjectId);
        
        if (subject1?.comboPairId === subject2?.comboPairId) {
          correctPlacements++;
          totalComboPairs++;
          
          // 木曜1,2限のカウント
          if (entry1.timeSlot.dayOfWeek === '木') {
            if (entry1.timeSlot.period === '1限') thursdayPeriod1++;
            if (entry1.timeSlot.period === '2限') thursdayPeriod2++;
          }
        }
      } else if (comboEntries.length === 1) {
        incorrectPlacements++;
        totalComboPairs++;
      }
    }
  }
  
  return {
    totalComboPairs: totalComboPairs / 2, // ペアなので2で割る
    correctPlacements: correctPlacements / 2,
    incorrectPlacements,
    thursdayPeriod1: thursdayPeriod1 / 2,
    thursdayPeriod2: thursdayPeriod2 / 2
  };
}