import { useState, useEffect } from 'react';
import type { Teacher, TeacherType, DayOfWeek, Subject } from '../types';
import { DAYS_OF_WEEK } from '../types';
import { Plus, Edit2, Trash2, Save, X, Settings, Clock, Users, Calendar, CheckCircle, XCircle, Heart } from 'lucide-react';

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
  const [formData, setFormData] = useState<Partial<Teacher>>({
    name: '',
    type: '常勤' as TeacherType,
    constraints: {
      confirmed: [],
      ng: { days: [], periods: [], dates: [], notes: '' },
      wish: { preferDays: [], preferConsecutive: false, preferPackedDay: false, biweekly: null, periods: [], notes: '' }
    }
  });
  const [constraintsData, setConstraintsData] = useState<any>(null);

  // 制約データをロード
  useEffect(() => {
    // LocalStorageから読み込みを試みる
    const savedData = localStorage.getItem('teachers_constraints_2025H2');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setConstraintsData(parsedData);
        return;
      } catch (err) {
        console.error('LocalStorageデータの解析に失敗:', err);
      }
    }
    
    // LocalStorageにない場合はファイルから読み込み
    fetch('/config/teachers_constraints_2025H2.json')
      .then(res => res.json())
      .then(data => {
        setConstraintsData(data);
        // LocalStorageに保存
        localStorage.setItem('teachers_constraints_2025H2', JSON.stringify(data));
      })
      .catch(err => console.error('制約データの読み込みに失敗:', err));
  }, []);

  // 教師の制約データを取得
  const getTeacherConstraints = (teacherName: string) => {
    if (!constraintsData) {
      return null;
    }
    const found = constraintsData.teachers.find((t: any) => t.name === teacherName);
    return found;
  };

  const handleSubmit = () => {
    if (formData.name) {
      // JSONデータも更新
      if (constraintsData) {
        const teacherIndex = constraintsData.teachers.findIndex((t: any) => t.name === formData.name);
        if (teacherIndex >= 0) {
          // 既存教師の更新
          constraintsData.teachers[teacherIndex] = {
            ...constraintsData.teachers[teacherIndex],
            confirmed: formData.constraints?.confirmed || [],
            ng: formData.constraints?.ng || {},
            wish: formData.constraints?.wish || {},
            notes: formData.constraints?.specialNotes || '',
            subjects: (formData.constraints as any)?.subjects || []
          };
        } else {
          // 新規教師の追加
          constraintsData.teachers.push({
            id: formData.name.toLowerCase().replace(/\s/g, '_'),
            name: formData.name,
            department: '未設定',
            confirmed: formData.constraints?.confirmed || [],
            ng: formData.constraints?.ng || {},
            wish: formData.constraints?.wish || {},
            subjects: (formData.constraints as any)?.subjects || [],
            notes: formData.constraints?.specialNotes || ''
          });
        }
        // LocalStorageに保存
        localStorage.setItem('teachers_constraints_2025H2', JSON.stringify(constraintsData));
      }

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
      setFormData({ 
        name: '', 
        type: '常勤', 
        constraints: {
          confirmed: [],
          ng: { days: [], periods: [], dates: [], notes: '' },
          wish: { preferDays: [], preferConsecutive: false, preferPackedDay: false, biweekly: null, periods: [], notes: '' }
        }
      });
    }
  };

  const handleEdit = (teacher: Teacher) => {
    const constraintData = getTeacherConstraints(teacher.name);
    setEditingId(teacher.id);
    setFormData({
      ...teacher,
      constraints: {
        ...teacher.constraints,
        confirmed: constraintData?.confirmed || [],
        ng: constraintData?.ng || { days: [], periods: [], dates: [], notes: '' },
        wish: constraintData?.wish || { preferDays: [], preferConsecutive: false, preferPackedDay: false, biweekly: null, periods: [], notes: '' },
        specialNotes: constraintData?.notes || '',
        subjects: constraintData?.subjects || []
      } as any
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      type: '常勤', 
      constraints: {
        confirmed: [],
        ng: { days: [], periods: [], dates: [], notes: '' },
        wish: { preferDays: [], preferConsecutive: false, preferPackedDay: false, biweekly: null, periods: [], notes: '' }
      }
    });
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
      
      {/* 確定事項 */}
      <div className="constraint-section">
        <h5 style={{ color: '#10b981' }}>✅ 確定事項</h5>
        <div className="form-group">
          <label>確定している条件を改行区切りで入力</label>
          <textarea
            value={(formData.constraints?.confirmed || []).join('\n')}
            onChange={(e) => {
              const confirmed = e.target.value.split('\n').filter(line => line.trim());
              updateConstraints('confirmed', confirmed);
            }}
            placeholder="例: 木曜1限・2限&#10;金曜3-4限（隔週：奇数週）&#10;不足分は月曜で補填"
            rows={4}
          />
        </div>
      </div>

      {/* NG条件 */}
      <div className="constraint-section">
        <h5 style={{ color: '#ef4444' }}>❌ NG条件</h5>
        
        <div className="form-group">
          <label>NG曜日</label>
          <div className="checkbox-group">
            {['月', '火', '水', '木', '金'].map(day => (
              <label key={day} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.constraints?.ng?.days?.includes(day) || false}
                  onChange={(e) => {
                    const ngDays = formData.constraints?.ng?.days || [];
                    const newNg = { ...formData.constraints?.ng };
                    if (e.target.checked) {
                      newNg.days = [...ngDays, day];
                    } else {
                      newNg.days = ngDays.filter(d => d !== day);
                    }
                    updateConstraints('ng', newNg);
                  }}
                />
                {day}曜日
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>NG時限</label>
          <div className="checkbox-group">
            {[1, 2, 3, 4].map(period => (
              <label key={period} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.constraints?.ng?.periods?.includes(period) || false}
                  onChange={(e) => {
                    const ngPeriods = formData.constraints?.ng?.periods || [];
                    const newNg = { ...formData.constraints?.ng };
                    if (e.target.checked) {
                      newNg.periods = [...ngPeriods, period];
                    } else {
                      newNg.periods = ngPeriods.filter(p => p !== period);
                    }
                    updateConstraints('ng', newNg);
                  }}
                />
                {period}限
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>NG日付（YYYY-MM-DD形式、改行区切り）</label>
          <textarea
            value={(formData.constraints?.ng?.dates || []).join('\n')}
            onChange={(e) => {
              const dates = e.target.value.split('\n').filter(line => line.trim());
              const newNg = { ...formData.constraints?.ng, dates };
              updateConstraints('ng', newNg);
            }}
            placeholder="2025-09-18&#10;2025-10-17&#10;2025-12-01"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>NG備考</label>
          <input
            type="text"
            value={formData.constraints?.ng?.notes || ''}
            onChange={(e) => {
              const newNg = { ...formData.constraints?.ng, notes: e.target.value };
              updateConstraints('ng', newNg);
            }}
            placeholder="例: 水曜日は商工会個別相談"
          />
        </div>
      </div>

      {/* 希望条件 */}
      <div className="constraint-section">
        <h5 style={{ color: '#3b82f6' }}>💙 希望条件</h5>
        
        <div className="form-group">
          <label>希望曜日</label>
          <div className="checkbox-group">
            {['月', '火', '水', '木', '金'].map(day => (
              <label key={day} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.constraints?.wish?.preferDays?.includes(day) || false}
                  onChange={(e) => {
                    const wishDays = formData.constraints?.wish?.preferDays || [];
                    const newWish = { ...formData.constraints?.wish };
                    if (e.target.checked) {
                      newWish.preferDays = [...wishDays, day];
                    } else {
                      newWish.preferDays = wishDays.filter(d => d !== day);
                    }
                    updateConstraints('wish', newWish);
                  }}
                />
                {day}曜日
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>希望オプション</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.constraints?.wish?.preferConsecutive || false}
                onChange={(e) => {
                  const newWish = { ...formData.constraints?.wish, preferConsecutive: e.target.checked };
                  updateConstraints('wish', newWish);
                }}
              />
              連続コマ希望
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.constraints?.wish?.preferPackedDay || false}
                onChange={(e) => {
                  const newWish = { ...formData.constraints?.wish, preferPackedDay: e.target.checked };
                  updateConstraints('wish', newWish);
                }}
              />
              1日集約希望
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>隔週設定</label>
          <select
            value={formData.constraints?.wish?.biweekly || ''}
            onChange={(e) => {
              const newWish = { ...formData.constraints?.wish, biweekly: e.target.value || null };
              updateConstraints('wish', newWish);
            }}
          >
            <option value="">なし</option>
            <option value="odd">奇数週</option>
            <option value="even">偶数週</option>
          </select>
        </div>

        <div className="form-group">
          <label>希望備考</label>
          <input
            type="text"
            value={formData.constraints?.wish?.notes || ''}
            onChange={(e) => {
              const newWish = { ...formData.constraints?.wish, notes: e.target.value };
              updateConstraints('wish', newWish);
            }}
            placeholder="例: 木曜最優先、金曜次優先"
          />
        </div>
      </div>

      {/* 詳細 */}
      <div className="constraint-section">
        <h5 style={{ color: '#6b7280' }}>💡 詳細</h5>
        <div className="form-group">
          <label>担当科目（カンマ区切りで入力）</label>
          <input
            type="text"
            value={(formData.constraints as any)?.subjects?.join(', ') || ''}
            onChange={(e) => {
              const subjects = e.target.value.split(',').map(s => s.trim()).filter(s => s);
              updateConstraints('subjects', subjects);
            }}
            placeholder="例: ビジネス実務, ビジネス実務I, ビジネス実務II"
          />
        </div>
        <div className="form-group">
          <label>補足説明・備考</label>
          <textarea
            value={formData.constraints?.specialNotes || ''}
            onChange={(e) => updateConstraints('specialNotes', e.target.value)}
            placeholder="例: 鈴木さんとセット&#10;前期と同じスケジュール希望&#10;変更対応困難"
            rows={4}
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
          
          {/* 基本情報 */}
          <div className="basic-info-section">
            <div className="form-row">
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
          </div>

          {/* 制約条件フォーム */}
          {renderConstraintForm()}

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

      {/* 教師一覧 */}
      <div className="teacher-list wide-layout">
        {teachers.map(teacher => {
          const constraintData = getTeacherConstraints(teacher.name);
          
          return (
            <div key={teacher.id} className="teacher-card advanced-card">
              <div className="teacher-info">
                <div className="teacher-header">
                  <h3>{teacher.name}</h3>
                  <div className="teacher-badges">
                    <span className="badge">{teacher.type}</span>
                  </div>
                </div>

                {/* 確定/NG/希望/詳細の4区分表示 */}
                {constraintData && (
                  <div className="constraints-three-categories">
                    {/* 確定事項 - 常時表示 */}
                    <div className="constraint-category confirmed">
                      <div className="category-header">
                        <CheckCircle size={14} style={{ color: '#10b981' }} />
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>確定</span>
                      </div>
                      <div className="category-items">
                        {constraintData.confirmed && Array.isArray(constraintData.confirmed) && constraintData.confirmed.length > 0 ? (
                          constraintData.confirmed.map((item: string, idx: number) => (
                            <span key={idx} className="constraint-tag confirmed-tag">{item}</span>
                          ))
                        ) : (
                          <span className="category-empty">— 未入力</span>
                        )}
                      </div>
                    </div>

                    {/* NG条件 - 常時表示 */}
                    <div className="constraint-category ng">
                      <div className="category-header">
                        <XCircle size={14} style={{ color: '#ef4444' }} />
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>NG</span>
                      </div>
                      <div className="category-items">
                        {(() => {
                          const hasNgData = constraintData.ng && (
                            (constraintData.ng.days && constraintData.ng.days.length > 0) ||
                            (constraintData.ng.periods && (
                              Array.isArray(constraintData.ng.periods) ? constraintData.ng.periods.length > 0 :
                              Object.keys(constraintData.ng.periods).length > 0
                            )) ||
                            (constraintData.ng.dates && constraintData.ng.dates.length > 0) ||
                            constraintData.ng.notes
                          );

                          if (hasNgData) {
                            return (
                              <>
                                {constraintData.ng.days && constraintData.ng.days.map((day: string, idx: number) => (
                                  <span key={`day-${idx}`} className="constraint-tag ng-tag">{day}曜NG</span>
                                ))}
                                {constraintData.ng.periods && Array.isArray(constraintData.ng.periods) && constraintData.ng.periods.map((period: number, idx: number) => (
                                  <span key={`period-${idx}`} className="constraint-tag ng-tag">{period}限NG</span>
                                ))}
                                {constraintData.ng.periods && typeof constraintData.ng.periods === 'object' && !Array.isArray(constraintData.ng.periods) && 
                                  Object.entries(constraintData.ng.periods).map(([day, periods]: [string, any], idx: number) => (
                                    <span key={`period-obj-${idx}`} className="constraint-tag ng-tag">
                                      {day}曜{Array.isArray(periods) ? periods.join('・') : periods}限NG
                                    </span>
                                  ))
                                }
                                {constraintData.ng.dates && constraintData.ng.dates.length > 0 && (
                                  <span className="constraint-tag ng-tag">特定日NG×{constraintData.ng.dates.length}</span>
                                )}
                                {constraintData.ng.notes && (
                                  <span className="constraint-tag ng-tag">{constraintData.ng.notes}</span>
                                )}
                              </>
                            );
                          } else {
                            return <span className="category-empty">— 未入力</span>;
                          }
                        })()}
                      </div>
                    </div>

                    {/* 希望条件 - 常時表示 */}
                    <div className="constraint-category wish">
                      <div className="category-header">
                        <Heart size={14} style={{ color: '#3b82f6' }} />
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>希望</span>
                      </div>
                      <div className="category-items">
                        {(() => {
                          const hasWishData = constraintData.wish && (
                            (constraintData.wish.preferDays && constraintData.wish.preferDays.length > 0) ||
                            (constraintData.wish.periods && (
                              Array.isArray(constraintData.wish.periods) ? constraintData.wish.periods.length > 0 :
                              Object.keys(constraintData.wish.periods).length > 0
                            )) ||
                            constraintData.wish.preferConsecutive ||
                            constraintData.wish.preferPackedDay ||
                            constraintData.wish.biweekly ||
                            constraintData.wish.notes
                          );

                          if (hasWishData) {
                            return (
                              <>
                                {constraintData.wish.preferDays && constraintData.wish.preferDays.map((day: string, idx: number) => (
                                  <span key={`pday-${idx}`} className="constraint-tag wish-tag">{day}曜希望</span>
                                ))}
                                {constraintData.wish.periods && Array.isArray(constraintData.wish.periods) && constraintData.wish.periods.map((period: number, idx: number) => (
                                  <span key={`period-${idx}`} className="constraint-tag wish-tag">{period}限希望</span>
                                ))}
                                {constraintData.wish.periods && typeof constraintData.wish.periods === 'object' && !Array.isArray(constraintData.wish.periods) &&
                                  Object.entries(constraintData.wish.periods).map(([day, periods]: [string, any], idx: number) => (
                                    <span key={`wish-period-${idx}`} className="constraint-tag wish-tag">
                                      {day}曜{Array.isArray(periods) ? periods.join('・') : periods}限希望
                                    </span>
                                  ))
                                }
                                {constraintData.wish.preferConsecutive && (
                                  <span className="constraint-tag wish-tag">連続コマ希望</span>
                                )}
                                {constraintData.wish.preferPackedDay && (
                                  <span className="constraint-tag wish-tag">1日集約希望</span>
                                )}
                                {constraintData.wish.biweekly && (
                                  <span className="constraint-tag wish-tag">
                                    {constraintData.wish.biweekly === 'odd' ? '奇数週' : '偶数週'}
                                  </span>
                                )}
                                {constraintData.wish.notes && (
                                  <span className="constraint-tag wish-tag">{constraintData.wish.notes}</span>
                                )}
                              </>
                            );
                          } else {
                            return <span className="category-empty">— 未入力</span>;
                          }
                        })()}
                      </div>
                    </div>

                    {/* 詳細説明 - 常時表示 */}
                    <div className="constraint-details">
                      <div className="details-header">
                        💡 <span style={{ color: '#6b7280', fontWeight: 'bold' }}>詳細</span>
                      </div>
                      <div className="details-content">
                        {(constraintData.notes || (constraintData.subjects && constraintData.subjects.length > 0)) ? (
                          <>
                            {constraintData.subjects && constraintData.subjects.length > 0 && (
                              <div className="detail-item">
                                <strong>担当科目：</strong>{constraintData.subjects.join('、')}
                              </div>
                            )}
                            {constraintData.notes && (
                              <div className="detail-item">{constraintData.notes}</div>
                            )}
                          </>
                        ) : (
                          <span className="category-empty">— 未入力</span>
                        )}
                      </div>
                    </div>
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
          );
        })}
      </div>
    </div>
  );
};

export default AdvancedTeacherManager;