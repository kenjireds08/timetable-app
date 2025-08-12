import { useState, useEffect } from 'react';
import type { Subject, Department, Grade, LessonType, Teacher, Classroom } from '../types';
import { Plus, Edit2, Trash2, Save, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SubjectProgressInfo {
  subjectId: string;
  totalRequired: number;
  scheduledCount: number;
  completionRate: number;
  missingFromGroups: string[];
}

interface SubjectManagerProps {
  subjects: Subject[];
  teachers: Teacher[];
  classrooms: Classroom[];
  onAdd: (subject: Subject) => void;
  onUpdate: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

const SubjectManager = ({ 
  subjects, 
  teachers, 
  classrooms,
  onAdd, 
  onUpdate, 
  onDelete 
}: SubjectManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [semesterData, setSemesterData] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<Map<string, SubjectProgressInfo>>(new Map());
  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    teacherIds: [],
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: []
  });

  // 半年分時間割データを読み込み
  useEffect(() => {
    const loadSemesterData = async () => {
      try {
        const generatedData = localStorage.getItem('generatedSemesterData');
        let data;
        
        if (generatedData) {
          data = JSON.parse(generatedData);
        } else {
          const response = await fetch('/semester_schedule.json');
          data = await response.json();
        }
        
        setSemesterData(data);
      } catch (error) {
        console.error('Failed to load semester data:', error);
      }
    };

    loadSemesterData();
  }, []);

  // 科目の進捗状況を計算
  useEffect(() => {
    if (!semesterData) return;

    const progressMap = new Map<string, SubjectProgressInfo>();

    subjects.forEach(subject => {
      const progress = calculateSubjectProgress(subject, semesterData);
      progressMap.set(subject.id, progress);
    });

    setSubjectProgress(progressMap);
  }, [subjects, semesterData]);

  // 科目の進捗状況を計算する関数
  const calculateSubjectProgress = (subject: Subject, semesterData: any): SubjectProgressInfo => {
    if (!semesterData?.groups) {
      return {
        subjectId: subject.id,
        totalRequired: subject.totalClasses,
        scheduledCount: 0,
        completionRate: 0,
        missingFromGroups: []
      };
    }

    const targetGroups = getTargetGroups(subject);
    let totalScheduled = 0;
    const missingFromGroups: string[] = [];

    // 各グループでのスケジュール数を収集
    const groupScheduleCounts: number[] = [];
    
    targetGroups.forEach(groupKey => {
      const group = semesterData.groups[groupKey];
      if (group) {
        const scheduledInGroup = group.schedule.filter((entry: any) => {
          // 科目名の正確なマッチング（コンビ授業の表記違いを考慮）
          const cleanEntryName = entry.subjectName.replace(' [コンビ]', '');
          const cleanSubjectName = subject.name.replace(' [コンビ]', '');
          return cleanEntryName === cleanSubjectName || 
                 entry.subjectName === subject.name || 
                 entry.subjectId === subject.id;
        }).length;
        
        if (scheduledInGroup === 0) {
          missingFromGroups.push(group.name);
        }
        
        groupScheduleCounts.push(scheduledInGroup);
      }
    });

    // 科目の種類に応じて総スケジュール数を計算
    if (subject.department === '共通' && subject.lessonType === '合同') {
      // 全学年合同の場合、すべてのグループで同じ授業が実施されるので、最大値を取る
      totalScheduled = Math.max(...groupScheduleCounts, 0);
    } else if (subject.department === '共通') {
      // 共通科目の場合、同学年の複数学科で同じ授業が実施されるので、最大値を取る
      totalScheduled = Math.max(...groupScheduleCounts, 0);
    } else {
      // 学科別科目の場合、単純に合計
      totalScheduled = groupScheduleCounts.reduce((sum, count) => sum + count, 0);
    }

    const completionRate = subject.totalClasses > 0 ? (totalScheduled / subject.totalClasses) * 100 : 0;

    return {
      subjectId: subject.id,
      totalRequired: subject.totalClasses,
      scheduledCount: totalScheduled,
      completionRate: Math.min(completionRate, 100),
      missingFromGroups
    };
  };

  // 対象となるグループを取得
  const getTargetGroups = (subject: Subject): string[] => {
    if (subject.department === '共通' && subject.lessonType === '合同') {
      // 全学年合同の場合、すべてのグループ
      return ['it-1', 'it-2', 'tourism-1', 'tourism-2'];
    } else if (subject.department === '共通') {
      // 共通科目の場合、同学年の両学科
      if (subject.grade === '1年') {
        return ['it-1', 'tourism-1'];
      } else {
        return ['it-2', 'tourism-2'];
      }
    } else {
      // 学科別科目の場合
      if (subject.department === 'ITソリューション') {
        return subject.grade === '1年' ? ['it-1'] : ['it-2'];
      } else {
        return subject.grade === '1年' ? ['tourism-1'] : ['tourism-2'];
      }
    }
  };

  const handleSubmit = () => {
    if (formData.name && formData.teacherIds?.length && formData.availableClassroomIds?.length) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as Subject);
        setEditingId(null);
      } else {
        onAdd({
          ...formData,
          id: `s${Date.now()}`,
        } as Subject);
        setIsAdding(false);
      }
      setFormData({
        name: '',
        teacherIds: [],
        department: 'ITソリューション',
        grade: '1年',
        totalClasses: 16,
        lessonType: '通常',
        availableClassroomIds: []
      });
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData(subject);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      teacherIds: [],
      department: 'ITソリューション',
      grade: '1年',
      totalClasses: 16,
      lessonType: '通常',
      availableClassroomIds: []
    });
  };

  return (
    <div>
      <div className="manager-header">
        <h2>科目管理</h2>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          新規追加
        </button>
      </div>

      {isAdding && (
        <div className="form-card">
          <h3>新規科目登録</h3>
          <div className="form-row">
            <div className="form-group">
              <label>科目名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: プログラミング基礎"
              />
            </div>
            <div className="form-group">
              <label>総コマ数</label>
              <input
                type="number"
                value={formData.totalClasses}
                onChange={(e) => setFormData({ ...formData, totalClasses: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>学科</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
              >
                <option value="ITソリューション">ITソリューション</option>
                <option value="地域観光デザイン">地域観光デザイン</option>
                <option value="共通">共通</option>
              </select>
            </div>
            <div className="form-group">
              <label>対象学年</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value as Grade })}
              >
                <option value="1年">1年</option>
                <option value="2年">2年</option>
                <option value="全学年">全学年</option>
              </select>
            </div>
            <div className="form-group">
              <label>授業形態</label>
              <select
                value={formData.lessonType}
                onChange={(e) => setFormData({ ...formData, lessonType: e.target.value as LessonType })}
              >
                <option value="通常">通常</option>
                <option value="コンビ授業">コンビ授業</option>
                <option value="合同">合同</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>担当教師</label>
              <select
                multiple
                value={formData.teacherIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, teacherIds: selected });
                }}
              >
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>利用可能教室</label>
              <select
                multiple
                value={formData.availableClassroomIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, availableClassroomIds: selected });
                }}
              >
                {classrooms.map(classroom => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              <X size={20} />
              キャンセル
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              <Save size={20} />
              保存
            </button>
          </div>
        </div>
      )}

      <div className="subject-list wide-layout">
        {subjects.map(subject => {
          const teacherNames = subject.teacherIds
            .map(id => teachers.find(t => t.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          const classroomNames = subject.availableClassroomIds
            .map(id => classrooms.find(c => c.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          
          const progress = subjectProgress.get(subject.id);
          const isComplete = progress && progress.completionRate >= 100;
          const isPartial = progress && progress.completionRate > 0 && progress.completionRate < 100;
          const isEmpty = !progress || progress.scheduledCount === 0;

          return (
            <div key={subject.id} className={`subject-card ${isComplete ? 'complete' : isPartial ? 'partial' : 'empty'}`}>
              <div className="subject-info">
                <div className="subject-header">
                  <h3>{subject.name}</h3>
                  <div className="progress-indicator">
                    {isComplete && <CheckCircle size={20} className="status-complete" />}
                    {isPartial && <Clock size={20} className="status-partial" />}
                    {isEmpty && <AlertCircle size={20} className="status-empty" />}
                  </div>
                </div>
                
                <div className="subject-meta">
                  <span className="badge">{subject.department}</span>
                  <span className="badge">{subject.grade}</span>
                  <span className="badge">{subject.lessonType}</span>
                  <span className="badge">全{subject.totalClasses}コマ</span>
                </div>

                {/* 進捗表示 */}
                {progress && (
                  <div className="progress-section">
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress.completionRate}%` }}
                        />
                      </div>
                      <div className="progress-text">
                        {progress.scheduledCount}/{progress.totalRequired}コマ ({Math.round(progress.completionRate)}%)
                      </div>
                    </div>
                    
                    {progress.missingFromGroups.length > 0 && (
                      <div className="missing-groups">
                        <span className="missing-label">未反映:</span>
                        <span className="missing-list">{progress.missingFromGroups.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="subject-details">
                  <div>教師: {teacherNames}</div>
                  <div>教室: {classroomNames}</div>
                </div>
              </div>
              <div className="subject-actions">
                <button className="btn-icon" onClick={() => handleEdit(subject)}>
                  <Edit2 size={16} />
                </button>
                <button className="btn-icon delete" onClick={() => onDelete(subject.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectManager;