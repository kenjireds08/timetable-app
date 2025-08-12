import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Calendar, CheckCircle, AlertCircle, Edit3, Trash2, Plus } from 'lucide-react';
import type { Teacher, Subject, Classroom } from '../types';
import SemesterExportButtons from './SemesterExportButtons';

interface SemesterEntry {
  id: string;
  timeSlot: {
    week: number;
    date: string;
    dayOfWeek: string;
    period: string;
  };
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
}

const DraggableEntry = ({ 
  entry, 
  onDelete, 
  progressInfo 
}: { 
  entry: SemesterEntry; 
  onDelete: (id: string) => void;
  progressInfo?: { current: number; total: number; };
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

  const isComboClass = entry.subjectName.includes('[コンビ]');
  
  return (
    <div
      ref={drag}
      className={`semester-entry ${isDragging ? 'dragging' : ''} ${isComboClass ? 'combo-class' : ''}`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="entry-header">
        <div className="entry-subject">
          {isComboClass && <span className="combo-indicator">🤝</span>}
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
  isHoliday = false
}: { 
  week: number;
  day: string;
  period: string;
  entries: SemesterEntry[];
  entriesWithProgress: { entry: SemesterEntry; progressInfo: { current: number; total: number; } }[];
  onDrop: (entry: SemesterEntry, week: number, day: string, period: string) => void;
  onAdd: (week: number, day: string, period: string) => void;
  isHoliday?: boolean;
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
      console.log('❓ ドロップ可能チェック:', item?.entry?.subjectName, `→ ${day}曜日${period}`, isHoliday ? '(休日)' : '');
      // 休日の場合はドロップ不可
      if (isHoliday) {
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
      className={`semester-cell ${isHoliday ? 'holiday-cell' : ''} ${isOver ? 'drag-over' : ''} ${entries.length > 0 ? 'has-entries' : ''} ${isOver && canDrop ? 'can-drop' : ''} ${isOver && !canDrop ? 'cannot-drop' : ''}`}
      style={{
        minHeight: '80px',
        backgroundColor: isHoliday 
          ? 'rgba(229, 231, 235, 0.5)' // グレー - 休日
          : isOver 
            ? canDrop 
              ? 'rgba(34, 197, 94, 0.1)' // 緑色 - ドロップ可能
              : 'rgba(239, 68, 68, 0.1)'  // 赤色 - ドロップ不可
            : 'transparent'
      }}
    >
      {entriesWithProgress.map(({ entry, progressInfo }) => (
        <DraggableEntry 
          key={entry.id} 
          entry={entry}
          progressInfo={progressInfo}
          onDelete={() => {}} 
        />
      ))}
      {entries.length === 0 && !isHoliday && (
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
  holidays = []
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
          item.timeSlot.week === entry.timeSlot.week &&
          item.timeSlot.dayOfWeek === entry.timeSlot.dayOfWeek &&
          item.timeSlot.period === entry.timeSlot.period
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
            item.timeSlot.week === entry.timeSlot.week &&
            item.timeSlot.dayOfWeek === entry.timeSlot.dayOfWeek &&
            item.timeSlot.period === entry.timeSlot.period
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
      return {
        date: date,
        formatted: `${date.getMonth() + 1}/${date.getDate()}`,
        isHoliday: isHoliday(date)
      };
    });
  };

  // グループ名のマッピングを作成
  const groupNames = Object.keys(semesterData.groups).reduce((acc, key) => {
    acc[key] = semesterData.groups[key].name;
    return acc;
  }, {} as {[key: string]: string});

  // 各グループの総授業数を計算
  const getGroupTotalClasses = (groupKey: string) => {
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

        {/* Calendar Grid */}
        <div className="semester-calendar">
          <div className="calendar-header">
            <div className="calendar-title-section">
              <h3>{currentGroup.name} - 半年分時間割</h3>
              <p>週数: {actualWeeks}週 ({startDate} 〜 {endDate})</p>
            </div>
            <div className="semester-title-display">
              {semesterTitle}
            </div>
          </div>

          <div className="calendar-grid-container">
            {/* 各週を独立したテーブルとして表示 */}
            {Array.from({ length: actualWeeks }, (_, weekIndex) => {
              const weekNumber = weekIndex + 1;
              const weekDates = getWeekDates(weekNumber);
              
              return (
                <div key={weekNumber} className="week-container">
                  <div className="week-header">
                    <h4>第{weekNumber}週 ({weekDates[0].formatted} 〜 {weekDates[4].formatted})</h4>
                  </div>
                  
                  <div className="week-grid">
                    {/* 曜日ヘッダー（日付付き） */}
                    <div className="time-column-header"></div>
                    {days.map((day, dayIndex) => (
                      <div key={day} className={`day-header-with-date ${weekDates[dayIndex].isHoliday ? 'holiday' : ''}`}>
                        <div className="day-name">{day}</div>
                        <div className="day-date">
                          {weekDates[dayIndex].formatted}
                          {weekDates[dayIndex].isHoliday && <span className="holiday-indicator">🎌</span>}
                        </div>
                      </div>
                    ))}
                    
                    {/* 各時限の行 */}
                    {periods.map((period) => (
                      <React.Fragment key={period.name}>
                        <div className="time-column">
                          <div className="period-name">{period.name}</div>
                          <div className="period-time">{period.time}</div>
                        </div>
                        {days.map(day => {
                          const entries = currentGroup.schedule.filter(entry =>
                            entry.timeSlot.week === weekNumber &&
                            entry.timeSlot.dayOfWeek === day &&
                            entry.timeSlot.period === period.name
                          );

                          // 各エントリーの進捗情報を計算
                          const entriesWithProgress = entries.map(entry => {
                            const sameSubjectEntries = currentGroup.schedule
                              .filter(e => e.subjectName === entry.subjectName && e.teacherName === entry.teacherName)
                              .sort((a, b) => {
                                if (a.timeSlot.week !== b.timeSlot.week) {
                                  return a.timeSlot.week - b.timeSlot.week;
                                }
                                const dayOrder = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5 };
                                return dayOrder[a.timeSlot.dayOfWeek] - dayOrder[b.timeSlot.dayOfWeek];
                              });

                            // 科目管理から正しい総コマ数を取得
                            const matchingSubject = _subjects.find(s => {
                              // 科目名の完全一致または、コンビ授業の場合の部分一致
                              const cleanSubjectName = entry.subjectName.replace(' [コンビ]', '');
                              return s.name === cleanSubjectName || s.name === entry.subjectName;
                            });
                            
                            const totalClasses = matchingSubject ? matchingSubject.totalClasses : sameSubjectEntries.length;
                            const currentIndex = sameSubjectEntries.findIndex(e => e.id === entry.id);
                            const progressInfo = {
                              current: currentIndex + 1,
                              total: totalClasses
                            };

                            return { entry, progressInfo };
                          });
                          
                          const dayIndex = days.indexOf(day);
                          const isHolidayCell = weekDates[dayIndex]?.isHoliday || false;

                          return (
                            <DroppableCell
                              key={`${day}-${period.name}`}
                              week={weekNumber}
                              day={day}
                              period={period.name}
                              entries={entries}
                              entriesWithProgress={entriesWithProgress}
                              onDrop={handleDrop}
                              onAdd={handleAddEntry}
                              isHoliday={isHolidayCell}
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

          {/* Current Tab Summary */}
          <div className="semester-summary">
            <div className="current-tab-summary">
              <span className="total-classes-text">総授業数: {getGroupTotalClasses(activeTab)}コマ</span>
            </div>
          </div>

          {/* Export Controls */}
          <SemesterExportButtons
            groupStatuses={groupStatuses}
            groupNames={groupNames}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default SemesterTimetable;