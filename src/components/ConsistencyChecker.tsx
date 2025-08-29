import React, { useState } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import type { Teacher, Subject } from '../types';

// SemesterTimetableで使用するScheduleEntry型
interface SemesterScheduleEntry {
  id: string;
  timeSlot: {
    week: number;
    dayOfWeek: string;
    period: string;
  };
  subjectId: string;
  teacherId: string;
  classroomId: string;
}

interface ConsistencyCheckerProps {
  teachers: Teacher[];
  subjects: Subject[];
  semesterData: any;
}

interface ConsistencyError {
  type: 'error' | 'warning';
  message: string;
  week?: number;
  day?: string;
  period?: string;
  groupId?: string;
}

export const ConsistencyChecker: React.FC<ConsistencyCheckerProps> = ({
  teachers,
  subjects,
  semesterData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<ConsistencyError[]>([]);

  const checkConsistency = () => {
    const newErrors: ConsistencyError[] = [];

    if (!semesterData || !semesterData.groups) {
      newErrors.push({
        type: 'error',
        message: '時間割データが見つかりません',
      });
      setErrors(newErrors);
      setIsModalOpen(true);
      return;
    }

    // コンビ授業のペアチェック
    const comboSlots = new Map<string, { subjectId: string; groupId: string }[]>();
    
    Object.entries(semesterData.groups).forEach(([groupId, groupData]: [string, any]) => {
      if (!groupData.schedule) return;
      
      groupData.schedule.forEach((entry: SemesterScheduleEntry) => {
        const subject = subjects.find(s => s.id === entry.subjectId);
        if (!subject) return;

        // コンビ授業のチェック
        if (subject.comboPairId) {
          const slotKey = `${entry.timeSlot.week}-${entry.timeSlot.dayOfWeek}-${entry.timeSlot.period}`;
          if (!comboSlots.has(slotKey)) {
            comboSlots.set(slotKey, []);
          }
          comboSlots.get(slotKey)!.push({ subjectId: subject.id, groupId });
        }

        // 合同科目の教室チェック
        if (subject.isJointAllGrades && subject.fixedClassroomId) {
          if (entry.classroomId !== subject.fixedClassroomId) {
            newErrors.push({
              type: 'error',
              message: `${subject.name}がc1（たかねこ）以外で配置されています`,
              week: entry.timeSlot.week,
              day: entry.timeSlot.dayOfWeek,
              period: entry.timeSlot.period,
              groupId,
            });
          }
        }
      });
    });

    // コンビ授業の片方のみ配置チェック
    comboSlots.forEach((entries, slotKey) => {
      const [week, day, period] = slotKey.split('-');
      const uniqueSubjects = new Set(entries.map(e => e.subjectId));
      
      // 同じ時限に複数のコンビ科目があるかチェック
      const comboSubjects = subjects.filter(s => 
        s.comboPairId && entries.some(e => e.subjectId === s.id)
      );
      
      const comboPairs = new Map<string, string[]>();
      comboSubjects.forEach(s => {
        if (!comboPairs.has(s.comboPairId!)) {
          comboPairs.set(s.comboPairId!, []);
        }
        comboPairs.get(s.comboPairId!)!.push(s.id);
      });

      comboPairs.forEach((pairSubjectIds, pairId) => {
        const foundSubjects = pairSubjectIds.filter(id => uniqueSubjects.has(id));
        if (foundSubjects.length === 1) {
          const subject = subjects.find(s => s.id === foundSubjects[0]);
          const pairSubject = subjects.find(s => 
            s.comboPairId === pairId && s.id !== foundSubjects[0]
          );
          newErrors.push({
            type: 'error',
            message: `コンビ授業の片方のみ配置: ${subject?.name} (ペア: ${pairSubject?.name})`,
            week: parseInt(week),
            day,
            period,
          });
        }
      });
    });

    // 鈴木先生の固定スケジュールチェック
    const suzukiTeacher = teachers.find(t => t.name === '鈴木俊良');
    if (suzukiTeacher && (suzukiTeacher as any).requireConfirmed) {
      const fixedSchedule = (suzukiTeacher as any).fixedSchedule || [];
      const foundFixed = new Set<string>();
      
      Object.values(semesterData.groups).forEach((groupData: any) => {
        if (!groupData.schedule) return;
        groupData.schedule.forEach((entry: SemesterScheduleEntry) => {
          if (entry.teacherId === suzukiTeacher.id) {
            const key = `${entry.timeSlot.week}-${entry.timeSlot.dayOfWeek}-${entry.timeSlot.period}`;
            foundFixed.add(key);
          }
        });
      });

      // 1/19(月)と1/21(水)のチェック
      const jan19Expected = '15-月-14-15';
      const jan21Expected = '15-水-1';
      
      if (!Array.from(foundFixed).some(key => key.includes(jan19Expected))) {
        newErrors.push({
          type: 'error',
          message: '鈴木先生の1/19(月)14-15連続授業が欠落しています',
        });
      }
      
      if (!Array.from(foundFixed).some(key => key.includes(jan21Expected))) {
        newErrors.push({
          type: 'error',
          message: '鈴木先生の1/21(水)ふりかえり授業が欠落しています',
        });
      }
    }

    // 教師の制約確認状態チェック
    const needsConfirmation = ['Fiona', '吉井幸宗', '夏井美果', '松永祐一', '副島小春', '岩木健'];
    needsConfirmation.forEach(name => {
      const teacher = teachers.find(t => t.name === name);
      if (teacher && teacher.constraints) {
        const constraints = teacher.constraints;
        if (!constraints.confirmed?.day && !constraints.ng?.day && !constraints.wish?.day) {
          newErrors.push({
            type: 'warning',
            message: `${name}先生の制約が未確認です（confirmed/ng/wish全て空）`,
          });
        } else if (!constraints.confirmed?.day) {
          newErrors.push({
            type: 'warning',
            message: `${name}先生のconfirmed（確定可能日）が空です`,
          });
        }
      }
    });

    setErrors(newErrors);
    setIsModalOpen(true);
  };

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  return (
    <>
      <button
        onClick={checkConsistency}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        整合性チェック
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">整合性チェック結果</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>すべての整合性チェックに合格しました</span>
              </div>
            ) : (
              <>
                <div className="mb-4 flex gap-4">
                  <span className="text-red-600">
                    エラー: {errorCount}件
                  </span>
                  <span className="text-yellow-600">
                    警告: {warningCount}件
                  </span>
                </div>

                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded flex items-start gap-2 ${
                        error.type === 'error'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-grow">
                        <div>{error.message}</div>
                        {error.week && (
                          <div className="text-sm mt-1">
                            第{error.week}週 {error.day} {error.period}
                            {error.groupId && ` (${error.groupId})`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};