import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Calendar, CheckCircle, AlertCircle, Edit3, Trash2, Plus, UserCheck } from 'lucide-react';
import type { Teacher, Subject, Classroom } from '../types';
import SemesterExportButtons from './SemesterExportButtons';

interface SemesterEntry {
  id: string;
  timeSlot?: {
    week: number;
    date: string;
    dayOfWeek: string;
    period: string;
  };
  // 新しい形式のプロパティ（placeSonPairedSubjectsで使用）
  groupId?: string;
  week?: number;
  date?: string;
  dayOfWeek?: string;
  period?: string;
  isFixed?: boolean;
  // 共通プロパティ
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classroomId: string;
  classroomName: string;
}

interface GroupData {
  name: string;
  department: string;
  grade: string;
  status: 'complete' | 'incomplete';
  schedule: SemesterEntry[];
}

interface SemesterData {
  groups: {
    [key: string]: GroupData;
  };
  weeks: number;
  startDate: string;
  endDate: string;
}

interface SemesterTimetableProps {
  teachers: Teacher[];
  subjects: Subject[];
  classrooms: Classroom[];
  onValidationError: (message: string) => void;
  semesterTitle?: string;
  startDate?: string;
  endDate?: string;
  holidays?: string[];
  scheduleRequests?: Array<{ date: string; description: string; periods: string[]; }>;
}

const DraggableEntry = ({ 
  entry, 
  onDelete, 
  progressInfo,
  subjects 
}: { 
  entry: SemesterEntry; 
  onDelete: (id: string) => void;
  progressInfo?: { current: number; total: number; };
  subjects: Subject[];
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'schedule-entry',
    item: () => {
      console.log('🎯 ドラッグ開始:', entry.subjectName);
      return { entry };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: true,
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      console.log('🎯 ドラッグ終了:', entry.subjectName, didDrop ? '成功' : '失敗');
    }
  });

  // 科目管理から対応する科目を探してタイプを判定
  const cleanSubjectName = entry.subjectName
    .replace(' [コンビ]', '')
    .replace(' [共通]', '')
    .replace(' [合同]', '');
  
  const matchingSubject = subjects.find(s => 
    s.name === cleanSubjectName || s.name === entry.subjectName
  );
  
  // 授業タイプの判定（優先順位: コンビ > 合同 > 共通 > 専門）
  const isComboClass = entry.subjectName.includes('[コンビ]') || matchingSubject?.lessonType === 'コンビ授業';
  const isJointClass = !isComboClass && matchingSubject?.department === '共通' && (matchingSubject?.grade === '全学年' || matchingSubject?.grade === '全学年（合同）');
  const isCommonSubject = !isComboClass && !isJointClass && matchingSubject?.department === '共通';
  const isSpecializedSubject = !isComboClass && !isJointClass && !isCommonSubject && matchingSubject?.department !== '共通';
  
  // CSSクラス名を決定（修正版：全学年合同の判定を追加）
  let entryTypeClass = '';
  
  // 全学年合同授業を最優先でチェック
  const isAllGradesJoint = entry.subjectName.includes('[全学年合同]') || 
                           entry.subjectName.includes('クリエイティブコミュニケーションラボ') ||
                           entry.subjectName.includes('Creative Communication Lab');
  
  if (isAllGradesJoint) {
    entryTypeClass = 'joint-class'; // 紫色のクラス
  } else if (isComboClass) {
    entryTypeClass = 'combo-class'; // 黄色のクラス
  } else if (isCommonSubject || 
             entry.subjectName.includes('デザインとプレゼンテーション') ||
             entry.subjectName.includes('Active Communication')) {
    entryTypeClass = 'common-class'; // 青色のクラス
  } else {
    entryTypeClass = 'specialized-class'; // 緑色のクラス
  }
  
  return (
    <div
      ref={drag}
      className={`semester-entry ${isDragging ? 'dragging' : ''} ${entryTypeClass}`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="entry-header">
        <div className="entry-subject">
          {isAllGradesJoint && <span className="joint-indicator">🎓</span>}
          {!isAllGradesJoint && isComboClass && <span className="combo-indicator">🤝</span>}
          {!isAllGradesJoint && !isComboClass && isCommonSubject && <span className="common-indicator">📚</span>}
          {!isAllGradesJoint && !isComboClass && !isCommonSubject && <span className="specialized-indicator">⚙️</span>}
          <span className="subject-name">{entry.subjectName}</span>
          {progressInfo && (
            <span className="entry-progress">({progressInfo.current}/{progressInfo.total})</span>
          )}
        </div>
      </div>
      <div className="entry-details">
        <span className="entry-teacher">{entry.teacherName}</span>
        <span className="entry-classroom">{entry.classroomName}</span>
      </div>
      <div className="entry-actions">
        <button className="btn-icon edit" title="編集">
          <Edit3 size={14} />
        </button>
        <button 
          className="btn-icon delete" 
          title="削除"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const DroppableCell = ({ 
  week, 
  day, 
  period, 
  entries, 
  entriesWithProgress,
  onDrop, 
  onAdd,
  isHoliday = false,
  scheduleRequest = null,
  subjects
}: { 
  week: number;
  day: string;
  period: string;
  entries: SemesterEntry[];
  entriesWithProgress: { entry: SemesterEntry; progressInfo: { current: number; total: number; } }[];
  onDrop: (entry: SemesterEntry, week: number, day: string, period: string) => void;
  onAdd: (week: number, day: string, period: string) => void;
  isHoliday?: boolean;
  scheduleRequest?: { date: string; description: string; periods: string[]; } | null;
  subjects: Subject[];
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'schedule-entry',
    drop: (item: { entry: SemesterEntry }) => {
      console.log('📍 ドロップ:', item.entry.subjectName, `→ ${day}曜日${period}`);
      onDrop(item.entry, week, day, period);
      return undefined;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    canDrop: (item) => {
      console.log('❓ ドロップ可能チェック:', item?.entry?.subjectName, `→ ${day}曜日${period}`, isHoliday ? '(休日)' : '', scheduleRequest ? `(${scheduleRequest.description})` : '');
      // 休日またはスケジュール調整要求日の場合はドロップ不可
      if (isHoliday || scheduleRequest) {
        return false;
      }
      // 基本的な事前チェック（完全な検証は onDrop で行う）
      return true; // 詳細な制約チェックは handleDrop で実行
    },
    hover: (item) => {
      console.log('🎯 ホバー中:', item?.entry?.subjectName, `→ ${day}曜日${period}`);
    }
  });

  return (
    <div
      ref={drop}
      className={`semester-cell ${isHoliday ? 'holiday-cell' : ''} ${scheduleRequest ? 'schedule-request-cell' : ''} ${isOver ? 'drag-over' : ''} ${entries.length > 0 ? 'has-entries' : ''} ${isOver && canDrop ? 'can-drop' : ''} ${isOver && !canDrop ? 'cannot-drop' : ''}`}
      style={{
        minHeight: '80px',
        backgroundColor: isHoliday 
          ? 'rgba(229, 231, 235, 0.5)' // グレー - 休日
          : scheduleRequest
            ? 'rgba(251, 207, 232, 0.3)' // ピンク - スケジュール調整要求
            : isOver 
              ? canDrop 
                ? 'rgba(34, 197, 94, 0.1)' // 緑色 - ドロップ可能
                : 'rgba(239, 68, 68, 0.1)'  // 赤色 - ドロップ不可
              : 'transparent',
        backgroundImage: scheduleRequest && !isHoliday
          ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 114, 182, 0.1) 10px, rgba(244, 114, 182, 0.1) 20px)'
          : 'none'
      }}
    >
      {entriesWithProgress.map(({ entry, progressInfo }) => (
        <DraggableEntry 
          key={entry.id} 
          entry={entry}
          progressInfo={progressInfo}
          onDelete={() => {}} 
          subjects={subjects}
        />
      ))}
      {entries.length === 0 && !isHoliday && !scheduleRequest && (
        <button 
          className="add-entry-btn"
          onClick={() => onAdd(week, day, period)}
          title="授業を追加"
        >
          <Plus size={16} />
        </button>
      )}
      {isHoliday && entries.length === 0 && (
        <div className="holiday-message">
          休日
        </div>
      )}
      {scheduleRequest && !isHoliday && entries.length === 0 && (
        <div className="schedule-request-message" style={{ color: '#ec4899', fontSize: '12px', textAlign: 'center' }}>
          {scheduleRequest.description}
        </div>
      )}
    </div>
  );
};

const SemesterTimetable = ({ 
  teachers, 
  subjects: _subjects, 
  classrooms: _classrooms, 
  onValidationError,
  semesterTitle = '2025年度 後期',
  startDate = '2025-10-07',
  endDate = '2026-03-20',
  holidays = [],
  scheduleRequests = []
}: SemesterTimetableProps) => {
  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('it-1');
  const [groupStatuses, setGroupStatuses] = useState<{[key: string]: 'complete' | 'incomplete'}>({});

  useEffect(() => {
    const loadSemesterData = async () => {
      try {
        // 生成されたデータがLocalStorageにあるかチェック
        const generatedData = localStorage.getItem('generatedSemesterData');
        let data;
        
        if (generatedData) {
          data = JSON.parse(generatedData);
          // 基本設定の情報で更新
          data.startDate = startDate;
          data.endDate = endDate;
          data.title = semesterTitle;
        } else {
          const response = await fetch('/semester_schedule.json');
          data = await response.json();
        }
        
        setSemesterData(data);
        
        // Initialize group statuses
        const statuses: {[key: string]: 'complete' | 'incomplete'} = {};
        Object.keys(data.groups).forEach(key => {
          statuses[key] = data.groups[key].status;
        });
        setGroupStatuses(statuses);
      } catch (error) {
        console.error('Failed to load semester data:', error);
      }
    };

    loadSemesterData();
  }, [startDate, endDate, semesterTitle]);

  const handleDrop = useCallback((entry: SemesterEntry, week: number, day: string, period: string) => {
    console.log('🔍 ドロップバリデーション開始:', entry.subjectName, `→ ${day}曜日${period}`);
    
    // 教師の制約をチェック
    const teacher = teachers.find(t => t.id === entry.teacherId);
    if (teacher) {
      // 利用不可日チェック
      if (teacher.constraints?.unavailableDays?.includes(day as any)) {
        onValidationError(`❌ ${teacher.name}先生は${day}曜日はNG（利用不可日）のため移動できません`);
        console.log(`🚫 バリデーションエラー: ${teacher.name}先生は${day}曜日はNG`);
        return;
      }
      
      // 利用可能日チェック
      if (teacher.constraints?.availableDays) {
        const dayMap: { [key: string]: string } = {
          '月': 'monday', '火': 'tuesday', '水': 'wednesday', '木': 'thursday', '金': 'friday'
        };
        const englishDay = dayMap[day];
        if (!teacher.constraints.availableDays.includes(englishDay as any)) {
          const availableDaysJapanese = teacher.constraints.availableDays.map(d => {
            const reverseMap: { [key: string]: string } = {
              'monday': '月', 'tuesday': '火', 'wednesday': '水', 'thursday': '木', 'friday': '金'
            };
            return reverseMap[d];
          }).join('・');
          onValidationError(`❌ ${teacher.name}先生は${day}曜日は利用できません（利用可能日: ${availableDaysJapanese}）`);
          console.log(`🚫 バリデーションエラー: ${teacher.name}先生は${day}曜日は利用不可 (利用可能日: ${availableDaysJapanese})`);
          return;
        }
      }
      
      // フィオーナ先生の3限目限定制約チェック
      if (teacher.name.includes('フィオーナ') && teacher.constraints?.requiredPeriods) {
        if (!teacher.constraints.requiredPeriods.includes(period)) {
          onValidationError(`❌ フィオーナ先生は3限目のみ利用可能です`);
          console.log(`🚫 バリデーションエラー: フィオーナ先生は${period}利用不可（3限のみ）`);
          return;
        }
      }

      // 森田先生の週3コマまとめて配置制約チェック
      if (teacher.name.includes('森田') && teacher.constraints?.weeklyGrouping) {
        const relatedSubjects = ['卒業制作', '進級制作', 'Web基礎'];
        const targetSubject = _subjects.find(s => s.id === entry.subjectId);
        if (targetSubject && relatedSubjects.includes(targetSubject.name)) {
          // 水曜日・金曜日のみ
          if (day !== '水' && day !== '金') {
            onValidationError(`❌ 森田先生の授業は水曜日・金曜日のみ配置可能です`);
            return;
          }
          
          // 週3コマ制限
          const weeklyCount = countTeacherWeeklyClasses(teacher.id, week, day, period);
          if (weeklyCount >= 3) {
            onValidationError(`❌ 森田先生は週3コマ制限に達しています`);
            return;
          }
        }
      }
      
      // 木下先生の月・金のみ、金曜日優先制約チェック
      if (teacher.name.includes('木下') && teacher.constraints?.preferConsecutiveClasses) {
        if (day !== '月' && day !== '金') {
          onValidationError(`❌ 木下先生は月曜日・金曜日のみ利用可能です`);
          console.log(`🚫 バリデーションエラー: 木下先生は${day}曜日は利用不可（月・金のみ）`);
          return;
        }
      }
    }
    
    // 教室の重複チェック
    const classroom = _classrooms.find(c => c.id === entry.classroomId);
    if (classroom) {
      const conflictingEntry = semesterData?.groups[activeTab].schedule.find(item => 
        item.id !== entry.id &&
        item.timeSlot.week === week &&
        item.timeSlot.dayOfWeek === day &&
        item.timeSlot.period === period &&
        item.classroomId === entry.classroomId
      );
      
      if (conflictingEntry) {
        onValidationError(`❌ ${classroom.name}教室は${day}曜日${period}に「${conflictingEntry.subjectName}」で使用中です`);
        return;
      }
    }

    // コンビ授業の特別処理：ペア科目も同時に移動 + グループ間重複チェック
    const isComboClass = entry.subjectName.includes('[コンビ]');
    if (isComboClass) {
      console.log('🤝 コンビ授業の移動処理:', entry.subjectName);
      
      // 他のグループでも同じコンビ授業が同時刻に配置されていないかチェック
      const comboConflict = checkComboClassConflictAcrossGroups(entry, week, day, period);
      if (comboConflict) {
        onValidationError(`❌ ${comboConflict.conflictGroup}でも同じコンビ授業が${day}曜日${period}に配置されています`);
        return;
      }
      
      // コンビ授業のペア科目を探す
      const subject = _subjects.find(s => s.id === entry.subjectId);
      if (subject?.comboSubjectId && semesterData) {
        const pairEntry = semesterData.groups[activeTab].schedule.find(item => 
          item.subjectId === subject.comboSubjectId &&
          (item.timeSlot?.week || item.week) === (entry.timeSlot?.week || entry.week) &&
          (item.timeSlot?.dayOfWeek || item.dayOfWeek) === (entry.timeSlot?.dayOfWeek || entry.dayOfWeek) &&
          (item.timeSlot?.period || item.period) === (entry.timeSlot?.period || entry.period)
        );
        
        if (pairEntry) {
          // ペア科目の教室制約もチェック
          const pairSubject = _subjects.find(s => s.id === pairEntry.subjectId);
          const pairClassroom = _classrooms.find(c => c.id === pairEntry.classroomId);
          
          if (pairSubject && pairClassroom) {
            const pairConflict = semesterData.groups[activeTab].schedule.find(item => 
              item.id !== pairEntry.id &&
              item.timeSlot.week === week &&
              item.timeSlot.dayOfWeek === day &&
              item.timeSlot.period === period &&
              item.classroomId === pairEntry.classroomId
            );
            
            if (pairConflict) {
              onValidationError(`❌ コンビ授業のペア科目「${pairEntry.subjectName}」の教室${pairClassroom.name}が使用中です`);
              return;
            }
          }
          
          console.log('🤝 コンビ授業ペア移動:', pairEntry.subjectName);
        }
      }
    }

    console.log('✅ バリデーション通過:', entry.subjectName);
    
    // Update the entry (and combo pair if applicable)
    setSemesterData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      const groupData = newData.groups[activeTab];
      
      let updatedSchedule = [...groupData.schedule];
      
      // メインエントリーの更新
      updatedSchedule = updatedSchedule.map(item => 
        item.id === entry.id 
          ? { 
              ...item, 
              timeSlot: { 
                ...item.timeSlot, 
                week, 
                dayOfWeek: day, 
                period 
              } 
            }
          : item
      );
      
      // コンビ授業の場合、ペア科目も同時移動
      if (isComboClass) {
        const subject = _subjects.find(s => s.id === entry.subjectId);
        if (subject?.comboSubjectId) {
          const pairEntry = groupData.schedule.find(item => 
            item.subjectId === subject.comboSubjectId &&
            (item.timeSlot?.week || item.week) === (entry.timeSlot?.week || entry.week) &&
            (item.timeSlot?.dayOfWeek || item.dayOfWeek) === (entry.timeSlot?.dayOfWeek || entry.dayOfWeek) &&
            (item.timeSlot?.period || item.period) === (entry.timeSlot?.period || entry.period)
          );
          
          if (pairEntry) {
            updatedSchedule = updatedSchedule.map(item =>
              item.id === pairEntry.id
                ? {
                    ...item,
                    timeSlot: {
                      ...item.timeSlot,
                      week,
                      dayOfWeek: day,
                      period
                    }
                  }
                : item
            );
            console.log('🤝 コンビ授業ペア移動完了:', pairEntry.subjectName);
          }
        }
      }
      
      newData.groups[activeTab] = {
        ...groupData,
        schedule: updatedSchedule
      };
      
      return newData;
    });
  }, [activeTab, teachers, _subjects, _classrooms, semesterData, onValidationError]);

  const countTeacherWeeklyClasses = (teacherId: string, targetWeek: number, targetDay: string, targetPeriod: string): number => {
    if (!semesterData) return 0;
    
    const currentGroup = semesterData.groups[activeTab];
    return currentGroup.schedule.filter(item => 
      item.teacherId === teacherId && 
      item.timeSlot.week === targetWeek &&
      !(item.timeSlot.dayOfWeek === targetDay && item.timeSlot.period === targetPeriod)
    ).length;
  };

  const checkComboClassConflictAcrossGroups = useCallback((entry: SemesterEntry, week: number, day: string, period: string) => {
    if (!semesterData) return null;

    // コンビ授業の科目名を取得（[コンビ]マークを除去）
    const baseSubjectName = entry.subjectName.replace(' [コンビ]', '');
    
    // 他のすべてのグループをチェック
    for (const [groupKey, groupData] of Object.entries(semesterData.groups)) {
      if (groupKey === activeTab) continue; // 現在のグループは除外
      
      // 同じ時刻に同じコンビ授業がないかチェック
      const conflict = groupData.schedule.find(item => 
        item.timeSlot.week === week &&
        item.timeSlot.dayOfWeek === day &&
        item.timeSlot.period === period &&
        (item.subjectName.replace(' [コンビ]', '') === baseSubjectName ||
         // ペア科目もチェック（Essential English ↔ ビジネス日本語）
         (baseSubjectName.includes('Essential English') && item.subjectName.includes('ビジネス日本語')) ||
         (baseSubjectName.includes('ビジネス日本語') && item.subjectName.includes('Essential English')))
      );
      
      if (conflict) {
        return {
          conflictGroup: groupData.name,
          conflictEntry: conflict
        };
      }
    }
    
    return null;
  }, [semesterData, activeTab]);

  const handleAddEntry = useCallback((week: number, day: string, period: string) => {
    // Simple implementation - add a placeholder entry
    const newEntry: SemesterEntry = {
      id: `new-${Date.now()}`,
      timeSlot: {
        week,
        date: '2025-10-07', // Calculate actual date
        dayOfWeek: day,
        period
      },
      subjectId: 's1',
      subjectName: '新しい授業',
      teacherId: 't1',
      teacherName: '未指定',
      classroomId: 'c1',
      classroomName: '未指定'
    };

    setSemesterData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      const groupData = newData.groups[activeTab];
      
      newData.groups[activeTab] = {
        ...groupData,
        schedule: [...groupData.schedule, newEntry]
      };
      
      // Mark as incomplete
      setGroupStatuses(prevStatuses => ({
        ...prevStatuses,
        [activeTab]: 'incomplete'
      }));
      
      return newData;
    });
  }, [activeTab]);

  // コンビ授業を完成させる関数
  const completeComboClasses = useCallback(() => {
    if (!semesterData) return;

    // まず、第17週（1/22）の既存のコンビ授業を削除
    setSemesterData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      
      // 各グループから第17週のコンビ授業を削除
      for (const groupKey of Object.keys(newData.groups)) {
        const groupData = newData.groups[groupKey];
        groupData.schedule = groupData.schedule.filter(entry => {
          // 第17週のコンビ授業を削除
          if ((entry.timeSlot?.week || entry.week) === 17 && 
              (entry.subjectName.includes('Essential English') || 
               entry.subjectName.includes('ビジネス日本語'))) {
            return false;
          }
          return true;
        });
      }
      
      // 1/22（木曜日、第17週）に追加
      // 1年生は1限、2年生は2限
      const week = 17;
      const day = '木';
      
      // すべてのグループに同時に追加
      for (const groupKey of Object.keys(newData.groups)) {
        const groupData = newData.groups[groupKey];
        const isFirstYear = groupKey.includes('1');
        
        // 1年生は1限、2年生は2限に追加
        const targetPeriod = isFirstYear ? '1限' : '2限';
        
        // Essential English側を追加
        const essentialSubject = _subjects.find(s => 
          s.name === (isFirstYear ? 'Essential English I' : 'Essential English II')
        );
        const essentialTeacher = teachers.find(t => t.id === essentialSubject?.teacherIds[0]);
        
        const essentialEntry: SemesterEntry = {
          id: `combo-e-${groupKey}-w${week}-${targetPeriod}-${Date.now()}`,
          timeSlot: {
            week,
            date: '2026-01-22',
            dayOfWeek: day,
            period: targetPeriod
          },
          subjectId: essentialSubject?.id || (isFirstYear ? 's5' : 's6'),
          subjectName: `${essentialSubject?.name || (isFirstYear ? 'Essential English I' : 'Essential English II')} [コンビ]`,
          teacherId: essentialTeacher?.id || 't4',
          teacherName: essentialTeacher?.name || '夏井美果',
          classroomId: groupKey.includes('it') ? 'c4' : 'c5', // IT -> ICT1, Design -> ICT2
          classroomName: groupKey.includes('it') ? 'ICT1' : 'ICT2'
        };
        groupData.schedule.push(essentialEntry);
        
        // ビジネス日本語側を追加
        const businessSubject = _subjects.find(s => 
          s.name === (isFirstYear ? 'ビジネス日本語 I' : 'ビジネス日本語 II')
        );
        const businessTeacher = teachers.find(t => t.id === businessSubject?.teacherIds[0]);
        
        const businessEntry: SemesterEntry = {
          id: `combo-b-${groupKey}-w${week}-${targetPeriod}-${Date.now()}`,
          timeSlot: {
            week,
            date: '2026-01-22',
            dayOfWeek: day,
            period: targetPeriod
          },
          subjectId: businessSubject?.id || (isFirstYear ? 's7' : 's8'),
          subjectName: `${businessSubject?.name || (isFirstYear ? 'ビジネス日本語 I' : 'ビジネス日本語 II')} [コンビ]`,
          teacherId: businessTeacher?.id || (isFirstYear ? 't5' : 't6'),
          teacherName: businessTeacher?.name || (isFirstYear ? '松永祐一' : '副島小春'),
          classroomId: groupKey.includes('it') ? 'c2' : 'c3', // IT -> しらかわ, Design -> なか
          classroomName: groupKey.includes('it') ? 'しらかわ' : 'なか'
        };
        groupData.schedule.push(businessEntry);
      }
      
      // LocalStorageも更新
      localStorage.setItem('generatedSemesterData', JSON.stringify(newData));
      
      onValidationError('✅ コンビ授業を1/22に追加しました（16/16完成）');
      return newData;
    });
  }, [semesterData, _subjects, teachers, onValidationError]);

  if (!semesterData) {
    return (
      <div className="semester-loading">
        <Calendar size={48} />
        <p>半年分の時間割データを読み込み中...</p>
      </div>
    );
  }

  const days = ['月', '火', '水', '木', '金'];
  const periods = [
    { name: '1限', time: '9:00-10:30' },
    { name: '2限', time: '10:40-12:10' },
    { name: '3限', time: '13:00-14:30' },
    { name: '4限', time: '14:40-16:10' }
  ];
  const currentGroup = semesterData.groups[activeTab];

  // 基本設定と同じ週数計算ロジック
  const calculateActualWeeks = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const actualWeeks = calculateActualWeeks();

  // 日付が休日かどうかチェックするヘルパー関数
  const isHoliday = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return holidays.includes(dateString);
  };

  // 日付と時限がスケジュール調整要求（除外日）かどうかチェックするヘルパー関数
  const isScheduleRequest = (date: Date, period?: string) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const request = scheduleRequests.find(req => req.date === dateString);
    
    if (request) {
      // 時限が指定されている場合は、その時限が除外対象かチェック
      if (period) {
        const isPeriodExcluded = request.periods.includes(period);
        return isPeriodExcluded ? request : null;
      }
      // 時限が指定されていない場合は、その日に除外時限があるかチェック（日付ヘッダー用）
      return request;
    }
    return null;
  };

  // 日付計算のヘルパー関数
  const getWeekDates = (weekNumber: number) => {
    const semesterStartDate = new Date(startDate || semesterData?.startDate || '2025-09-29');
    
    // 開始日が月曜日でない場合、最初の月曜日を見つける
    const startDayOfWeek = semesterStartDate.getDay(); // 0:日曜 1:月曜 ... 6:土曜
    const daysToMonday = startDayOfWeek === 0 ? 1 : (8 - startDayOfWeek) % 7;
    
    const firstMonday = new Date(semesterStartDate);
    if (startDayOfWeek !== 1) { // 月曜日でない場合
      firstMonday.setDate(semesterStartDate.getDate() + daysToMonday);
    }
    
    // 指定週の月曜日を計算
    const weekStartDate = new Date(firstMonday);
    weekStartDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    
    return days.map((_, dayIndex) => {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + dayIndex);
      const scheduleRequest = isScheduleRequest(date);
      return {
        date: date,
        formatted: `${date.getMonth() + 1}/${date.getDate()}`,
        isHoliday: isHoliday(date),
        scheduleRequest: scheduleRequest
      };
    });
  };

  // グループ名のマッピングを作成
  const groupNames = semesterData ? Object.keys(semesterData.groups).reduce((acc, key) => {
    acc[key] = semesterData.groups[key].name;
    return acc;
  }, {} as {[key: string]: string}) : {};

  // 各グループの総授業数を計算
  const getGroupTotalClasses = (groupKey: string) => {
    if (!semesterData || !semesterData.groups[groupKey]) return 0;
    return semesterData.groups[groupKey].schedule.length;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="semester-timetable">
        {/* Tab Navigation */}
        <div className="semester-tabs">
          {Object.keys(semesterData.groups).map(groupKey => {
            const group = semesterData.groups[groupKey];
            const status = groupStatuses[groupKey];
            return (
              <button
                key={groupKey}
                className={`semester-tab ${activeTab === groupKey ? 'active' : ''}`}
                onClick={() => setActiveTab(groupKey)}
              >
                <span className="tab-name">{group.name}</span>
                <span className={`tab-status ${status}`}>
                  {status === 'complete' ? (
                    <><CheckCircle size={16} /> 完璧</>
                  ) : (
                    <><AlertCircle size={16} /> 未完成</>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Group Schedule */}
        {currentGroup && (
          <div className="semester-schedule">
            <div className="calendar-header">
              <div className="header-left">
                <h3>{currentGroup.name} - 半年分時間割</h3>
                <p>週数: {actualWeeks}週 ({startDate} 〜 {endDate})</p>
              </div>
              <div className="header-right">
                <div className="semester-title-display">
                  {semesterTitle}
                </div>
              </div>
          </div>

          {/* Instructions Panel */}
          <div className="instructions-panel">
            <div className="instruction-item">
              <UserCheck size={16} />
              <span>ドラッグ＆ドロップで授業を移動</span>
            </div>
            <div className="instruction-item">
              <Calendar size={16} />
              <span>🎌は祝日</span>
            </div>
            <div className="instruction-item">
              <AlertCircle size={16} />
              <span>赤い背景は制約エラー</span>
            </div>
          </div>

          {/* Weekly Schedules */}
          <div className="weeks-container">
          {Array.from({ length: actualWeeks }, (_, weekIndex) => {
            const weekNumber = weekIndex + 1;
            const weekDates = getWeekDates(weekNumber);
            
            // Get entries for this week
            const weekEntries = currentGroup.schedule.filter(entry => 
              (entry.timeSlot?.week || entry.week) === weekNumber
            );

            // Calculate progress for each entry
            const entriesWithProgress = weekEntries.map(entry => {
              const subject = _subjects.find(s => s.id === entry.subjectId);
              const allEntries = currentGroup.schedule.filter(e => e.subjectId === entry.subjectId);
              const currentIndex = allEntries.findIndex(e => e.id === entry.id);
              
              return {
                entry,
                progressInfo: {
                  current: currentIndex + 1,
                  total: subject?.totalClasses || 16
                }
              };
            });

            return (
              <div key={weekNumber} className="calendar-week">
                <div className="week-header">
                  <span className="week-title">第{weekNumber}週 ({weekDates[0].formatted} - {weekDates[4].formatted})</span>
                </div>
                <div className="week-grid">
                  {/* Days header */}
                  <div className="grid-corner"></div>
                  {days.map((day, dayIndex) => {
                    const dayData = weekDates[dayIndex];
                    return (
                      <div key={day} className={`grid-day-header ${dayData.isHoliday ? 'holiday-header' : ''} ${dayData.scheduleRequest ? 'schedule-request-header' : ''}`}>
                        <div>{day}曜日</div>
                        <div className="day-date">{dayData.formatted}</div>
                        {dayData.isHoliday && <div className="holiday-label">🎌 休日</div>}
                        {dayData.scheduleRequest && !dayData.isHoliday && (
                          <div className="schedule-request-label" style={{ color: '#ec4899', fontSize: '11px' }}>
                            {dayData.scheduleRequest.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Periods */}
                  {periods.map(period => (
                    <React.Fragment key={period.name}>
                      <div className="grid-period-header">
                        <div>{period.name}</div>
                        <div className="period-time">{period.time}</div>
                      </div>
                      {days.map((day, dayIndex) => {
                        const dayData = weekDates[dayIndex];
                        const cellEntries = entriesWithProgress.filter(({ entry }) =>
                          (entry.timeSlot?.dayOfWeek || entry.dayOfWeek) === day &&
                          (entry.timeSlot?.period || entry.period) === period.name
                        );
                        const scheduleRequest = isScheduleRequest(dayData.date, period.name);
                        
                        return (
                          <DroppableCell
                            key={`${day}-${period.name}`}
                            week={weekNumber}
                            day={day}
                            period={period.name}
                            entries={cellEntries.map(e => e.entry)}
                            entriesWithProgress={cellEntries}
                            onDrop={handleDrop}
                            onAdd={handleAddEntry}
                            isHoliday={dayData.isHoliday}
                            scheduleRequest={scheduleRequest}
                            subjects={_subjects}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
          </div>

          {/* Footer Section */}
          <div className="semester-footer">
            <div className="footer-left">
              <span className="total-classes">総授業数: {getGroupTotalClasses(activeTab)}コマ</span>
            </div>
            <div className="footer-right">
              <SemesterExportButtons groupStatuses={groupStatuses} groupNames={groupNames} />
            </div>
          </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default SemesterTimetable;
