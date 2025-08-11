import { useState } from 'react';
import type { Subject, Department, Grade, LessonType, Teacher, Classroom } from '../types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

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
  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    teacherIds: [],
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: []
  });

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

          return (
            <div key={subject.id} className="subject-card">
              <div className="subject-info">
                <h3>{subject.name}</h3>
                <div className="subject-meta">
                  <span className="badge">{subject.department}</span>
                  <span className="badge">{subject.grade}</span>
                  <span className="badge">{subject.lessonType}</span>
                  <span className="badge">全{subject.totalClasses}コマ</span>
                </div>
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