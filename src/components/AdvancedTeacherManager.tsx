import { useState } from 'react';
import type { Teacher, TeacherType, DayOfWeek, Subject } from '../types';
import { DAYS_OF_WEEK } from '../types';
import { Plus, Edit2, Trash2, Save, X, Settings, Clock, Users, Calendar } from 'lucide-react';

interface AdvancedTeacherManagerProps {
  teachers: Teacher[];
  subjects: Subject[];
  onAdd: (teacher: Teacher) => void;
  onUpdate: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
}

const AdvancedTeacherManager = ({ teachers, subjects, onAdd, onUpdate, onDelete }: AdvancedTeacherManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedConstraints, setExpandedConstraints] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    type: '常勤' as TeacherType,
    constraints: {}
  });

  const toggleConstraints = (teacherId: string) => {
    const newExpanded = new Set(expandedConstraints);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedConstraints(newExpanded);
  };

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

  const updateConstraints = (key: string, value: any) => {
    setFormData({
      ...formData,
      constraints: {
        ...formData.constraints,
        [key]: value
      }
    });
  };

  const getAvailableSubjects = () => {
    return subjects.map(s => ({ id: s.name, name: s.name }));
  };

  const renderConstraintForm = () => (
    <div className="constraint-form">
      <h4>🎯 制約条件設定</h4>
      
      {/* 基本制約 */}
      <div className="constraint-section">
        <h5><Calendar size={16} /> 基本制約</h5>
        
        <div className="form-group">
          <label>利用可能曜日</label>
          <div className="checkbox-group">
            {DAYS_OF_WEEK.map(day => (
              <label key={day} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.constraints?.availableDays?.includes(day) || false}
                  onChange={(e) => {
                    const availableDays = formData.constraints?.availableDays || [];
                    if (e.target.checked) {
                      updateConstraints('availableDays', [...availableDays, day]);
                    } else {
                      updateConstraints('availableDays', availableDays.filter(d => d !== day));
                    }
                  }}
                />
                {day}曜日
              </label>
            ))}
          </div>
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
                      updateConstraints('unavailableDays', [...unavailableDays, day]);
                    } else {
                      updateConstraints('unavailableDays', unavailableDays.filter(d => d !== day));
                    }
                  }}
                />
                {day}曜日
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 時間制約 */}
      <div className="constraint-section">
        <h5><Clock size={16} /> 時間制約</h5>
        
        <div className="form-row">
          <div className="form-group">
            <label>1日最大コマ数</label>
            <input
              type="number"
              value={formData.constraints?.maxClassesPerDay || ''}
              onChange={(e) => updateConstraints('maxClassesPerDay', parseInt(e.target.value))}
              min="1"
              max="4"
            />
          </div>
          
          <div className="form-group">
            <label>週最大コマ数</label>
            <input
              type="number"
              value={formData.constraints?.maxClassesPerWeek || ''}
              onChange={(e) => updateConstraints('maxClassesPerWeek', parseInt(e.target.value))}
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>特殊開始時刻</label>
          <input
            type="time"
            value={formData.constraints?.specialTimeStart || ''}
            onChange={(e) => updateConstraints('specialTimeStart', e.target.value)}
            placeholder="例: 13:15"
          />
        </div>
      </div>

      {/* 順序制約 */}
      <div className="constraint-section">
        <h5><Users size={16} /> 順序制約（連続授業）</h5>
        
        <div className="form-group">
          <label>連続実施科目</label>
          <textarea
            value={formData.constraints?.sequentialSubjects?.description || ''}
            onChange={(e) => updateConstraints('sequentialSubjects', {
              ...formData.constraints?.sequentialSubjects,
              description: e.target.value
            })}
            placeholder="例: ドローン座学→ドローンプログラミング→オンライン講座→撮影・まとめの順序で連続4日間実施"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.constraints?.sequentialSubjects?.mustBeConsecutiveDays || false}
              onChange={(e) => updateConstraints('sequentialSubjects', {
                ...formData.constraints?.sequentialSubjects,
                mustBeConsecutiveDays: e.target.checked
              })}
            />
            連続した日程で実施する必要がある
          </label>
        </div>
      </div>

      {/* その他制約 */}
      <div className="constraint-section">
        <h5><Settings size={16} /> その他の制約</h5>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.constraints?.preferConsecutiveClasses || false}
              onChange={(e) => updateConstraints('preferConsecutiveClasses', e.target.checked)}
            />
            連続コマを優先する
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.constraints?.prioritizeGapMinimization || false}
              onChange={(e) => updateConstraints('prioritizeGapMinimization', e.target.checked)}
            />
            空きコマ最小化を優先する
          </label>
        </div>

        <div className="form-group">
          <label>特記事項</label>
          <textarea
            value={formData.constraints?.specialNotes || ''}
            onChange={(e) => updateConstraints('specialNotes', e.target.value)}
            placeholder="その他の特殊な制約や要望があれば記述"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="manager-header">
        <h2>📚 高度な教師管理</h2>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          教師を追加
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="form-card advanced-form wide-layout">
          <h3>{editingId ? '教師情報編集' : '新規教師登録'}</h3>
          
          <div className="teacher-add-form">
            {/* 左側：基本情報 */}
            <div className="teacher-form-left">
              <div className="basic-info-section">
                <h4>👤 基本情報</h4>
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

            {/* 右側：制約条件 */}
            <div className="teacher-form-right">
              {renderConstraintForm()}
            </div>
          </div>
        </div>
      )}

      {/* 教師一覧 */}
      <div className="teacher-list wide-layout">
        {teachers.map(teacher => (
          <div key={teacher.id} className="teacher-card advanced-card">
            <div className="teacher-info">
              <div className="teacher-header">
                <h3>{teacher.name}</h3>
                <div className="teacher-badges">
                  <span className="badge">{teacher.type}</span>
                  {teacher.constraints?.specialTimeStart && (
                    <span className="badge special">特殊時刻</span>
                  )}
                  {teacher.constraints?.sequentialSubjects && (
                    <span className="badge sequence">連続授業</span>
                  )}
                </div>
              </div>

              {teacher.constraints?.specialNotes && (
                <div className="special-notes">
                  💡 {teacher.constraints.specialNotes}
                </div>
              )}

              {/* 制約の概要表示 */}
              <div className="constraints-summary">
                {teacher.constraints?.unavailableDays && (
                  <div className="constraint-item">
                    <strong>NG:</strong> {teacher.constraints.unavailableDays.join(', ')}
                  </div>
                )}
                {teacher.constraints?.availableDays && (
                  <div className="constraint-item">
                    <strong>利用可能:</strong> {teacher.constraints.availableDays.join(', ')}
                  </div>
                )}
                {teacher.constraints?.maxClassesPerWeek && (
                  <div className="constraint-item">
                    <strong>週最大:</strong> {teacher.constraints.maxClassesPerWeek}コマ
                  </div>
                )}
              </div>

              {/* 詳細表示ボタン */}
              <button 
                className="toggle-details"
                onClick={() => toggleConstraints(teacher.id)}
              >
                {expandedConstraints.has(teacher.id) ? '詳細を隠す' : '詳細を表示'}
              </button>

              {/* 詳細制約情報 */}
              {expandedConstraints.has(teacher.id) && (
                <div className="constraints-detail">
                  {teacher.constraints?.sequentialSubjects && (
                    <div className="constraint-detail">
                      <strong>連続授業:</strong> {teacher.constraints.sequentialSubjects.description}
                    </div>
                  )}
                  {teacher.constraints?.monthlyExceptions?.map((exception, idx) => (
                    <div key={idx} className="constraint-detail">
                      <strong>月次例外:</strong> {exception.description}
                    </div>
                  ))}
                  {teacher.constraints?.specialTimeStart && (
                    <div className="constraint-detail">
                      <strong>特殊開始時刻:</strong> {teacher.constraints.specialTimeStart}
                    </div>
                  )}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedTeacherManager;