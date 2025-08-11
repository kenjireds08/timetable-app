import { useState } from 'react';
import type { Teacher, TeacherType, DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface TeacherManagerProps {
  teachers: Teacher[];
  onAdd: (teacher: Teacher) => void;
  onUpdate: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
}

const TeacherManager = ({ teachers, onAdd, onUpdate, onDelete }: TeacherManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    type: '常勤' as TeacherType,
    constraints: {}
  });

  const handleSubmit = () => {
    if (formData.name) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as Teacher);
        setEditingId(null);
      } else {
        onAdd({
          ...formData,
          id: `t${Date.now()}`,
        } as Teacher);
        setIsAdding(false);
      }
      setFormData({ name: '', type: '常勤', constraints: {} });
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData(teacher);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', type: '常勤', constraints: {} });
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h2>教師管理</h2>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          新規追加
        </button>
      </div>

      {isAdding && (
        <div className="form-card">
          <h3>新規教師登録</h3>
          <div className="form-group">
            <label>教師名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: 山田 太郎"
            />
          </div>
          <div className="form-group">
            <label>雇用形態</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TeacherType })}
            >
              <option value="常勤">常勤</option>
              <option value="非常勤">非常勤</option>
            </select>
          </div>
          <div className="form-group">
            <label>利用不可曜日</label>
            <div className="checkbox-group">
              {DAYS_OF_WEEK.map(day => (
                <label key={day} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.constraints?.unavailableDays?.includes(day) || false}
                    onChange={(e) => {
                      const unavailableDays = formData.constraints?.unavailableDays || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          constraints: {
                            ...formData.constraints,
                            unavailableDays: [...unavailableDays, day]
                          }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          constraints: {
                            ...formData.constraints,
                            unavailableDays: unavailableDays.filter(d => d !== day)
                          }
                        });
                      }
                    }}
                  />
                  {day}曜日
                </label>
              ))}
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

      <div className="teacher-list">
        {teachers.map(teacher => (
          <div key={teacher.id} className="teacher-card">
            {editingId === teacher.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TeacherType })}
                >
                  <option value="常勤">常勤</option>
                  <option value="非常勤">非常勤</option>
                </select>
                <button className="btn-icon" onClick={handleSubmit}>
                  <Save size={16} />
                </button>
                <button className="btn-icon" onClick={handleCancel}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="teacher-info">
                  <h3>{teacher.name}</h3>
                  <span className="badge">{teacher.type}</span>
                  {teacher.constraints?.unavailableDays && (
                    <div className="constraints">
                      NG: {teacher.constraints.unavailableDays.join(', ')}
                    </div>
                  )}
                </div>
                <div className="teacher-actions">
                  <button className="btn-icon" onClick={() => handleEdit(teacher)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon delete" onClick={() => onDelete(teacher.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherManager;