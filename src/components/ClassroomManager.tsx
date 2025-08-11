import { useState } from 'react';
import type { Classroom } from '../types';
import { Plus, Edit2, Trash2, Save, X, Home } from 'lucide-react';

interface ClassroomManagerProps {
  classrooms: Classroom[];
  onAdd: (classroom: Classroom) => void;
  onUpdate: (classroom: Classroom) => void;
  onDelete: (id: string) => void;
}

const ClassroomManager = ({ 
  classrooms, 
  onAdd, 
  onUpdate, 
  onDelete 
}: ClassroomManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Classroom>>({
    name: '',
    capacity: undefined,
    equipment: []
  });

  const handleSubmit = () => {
    if (formData.name) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as Classroom);
        setEditingId(null);
      } else {
        onAdd({
          ...formData,
          id: `c${Date.now()}`,
        } as Classroom);
        setIsAdding(false);
      }
      setFormData({
        name: '',
        capacity: undefined,
        equipment: []
      });
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setFormData(classroom);
    setEditingId(classroom.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      capacity: undefined,
      equipment: []
    });
  };

  const updateEquipment = (equipment: string) => {
    const equipmentList = equipment.split(',').map(item => item.trim()).filter(Boolean);
    setFormData({ ...formData, equipment: equipmentList });
  };

  const availableEquipment = [
    'プロジェクター', 'ホワイトボード', 'PC', 'Wi-Fi', 'エアコン', 
    '机', '椅子', 'スクリーン', 'マイク', 'スピーカー'
  ];

  return (
    <div>
      <div className="manager-header">
        <h2><Home size={24} /> 教室管理</h2>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          教室を追加
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="form-card">
          <h3>{editingId ? '教室情報編集' : '新規教室登録'}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>教室名 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="教室名を入力（例: たかねこ、ICT1）"
              />
            </div>

            <div className="form-group">
              <label>定員</label>
              <input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || undefined})}
                placeholder="定員数（例: 30）"
                min="1"
                max="100"
              />
            </div>
          </div>

          <div className="form-group">
            <label>設備・機器</label>
            <input
              type="text"
              value={formData.equipment?.join(', ') || ''}
              onChange={(e) => updateEquipment(e.target.value)}
              placeholder="設備をカンマ区切りで入力（例: プロジェクター, ホワイトボード, PC）"
            />
            <small>
              使用可能な設備: {availableEquipment.join(', ')}
            </small>
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>
              <Save size={20} />
              {editingId ? '更新' : '追加'}
            </button>
            <button className="btn-secondary" onClick={handleCancel}>
              <X size={20} />
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="classroom-list wide-layout">
        {classrooms.map(classroom => (
          <div key={classroom.id} className="classroom-card">
            <div className="classroom-info">
              <h3>{classroom.name}</h3>
              
              {classroom.capacity && (
                <div className="capacity-info">
                  <strong>定員:</strong> {classroom.capacity}名
                </div>
              )}
              
              {classroom.equipment && classroom.equipment.length > 0 && (
                <div className="equipment">
                  <strong>設備:</strong>
                  <div className="equipment-tags">
                    {classroom.equipment.map(eq => (
                      <span key={eq} className="badge">{eq}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {(!classroom.equipment || classroom.equipment.length === 0) && (
                <div className="no-equipment">
                  設備情報なし
                </div>
              )}
            </div>

            <div className="classroom-actions">
              <button 
                className="btn-icon" 
                onClick={() => handleEdit(classroom)}
                title="編集"
              >
                <Edit2 size={18} />
              </button>
              <button 
                className="btn-icon delete" 
                onClick={() => {
                  if (confirm(`${classroom.name}を削除してもよろしいですか？`)) {
                    onDelete(classroom.id);
                  }
                }}
                title="削除"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {classrooms.length === 0 && (
          <div className="empty-state">
            <Home size={48} />
            <p>登録されている教室がありません</p>
            <p>「教室を追加」ボタンから新しい教室を登録してください</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomManager;