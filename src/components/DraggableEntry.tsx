import { useDrag } from 'react-dnd';
import type { ScheduleEntry } from '../types';

interface DraggableEntryProps {
  entry: ScheduleEntry;
  subjectName: string;
  teacherName: string;
  classroomName: string;
}

const DraggableEntry = ({ 
  entry, 
  subjectName, 
  teacherName, 
  classroomName 
}: DraggableEntryProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'schedule-entry',
    item: entry,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 科目名からタイプを判定して色を決定
  const getEntryColor = () => {
    // 全学年合同授業（紫）
    if (subjectName.includes('[全学年合同]') || 
        subjectName.includes('クリエイティブコミュニケーションラボ') ||
        subjectName.includes('Creative Communication Lab')) {
      return '#9b59b6'; // 紫
    }
    
    // コンビ授業（黄）
    if (subjectName.includes('[コンビ]') || 
        subjectName.includes('Essential English') ||
        subjectName.includes('ビジネス日本語') ||
        subjectName.includes('Business English')) {
      return '#f39c12'; // 黄
    }
    
    // 共通科目（青）
    if (subjectName.includes('[共通]') || 
        subjectName.includes('デザインとプレゼンテーション') ||
        subjectName.includes('ビジネス実務') ||
        subjectName.includes('Active Communication')) {
      return '#3498db'; // 青
    }
    
    // 専門科目（緑） - デフォルト
    return '#27ae60'; // 緑
  };

  const backgroundColor = getEntryColor();

  return (
    <div
      ref={drag as any}
      className={`draggable-entry ${isDragging ? 'dragging' : ''}`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        backgroundColor,
        color: '#fff',
        padding: '4px',
        borderRadius: '4px',
        fontSize: '11px',
        lineHeight: '1.3',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div className="entry-subject" style={{ fontWeight: 'bold', marginBottom: '2px' }}>
        {subjectName}
      </div>
      <div className="entry-details" style={{ fontSize: '10px' }}>
        <div className="entry-teacher">{teacherName}</div>
        <div className="entry-classroom" style={{ opacity: 0.9 }}>
          {classroomName}
        </div>
      </div>
    </div>
  );
};

export default DraggableEntry;