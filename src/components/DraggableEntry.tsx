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

  return (
    <div
      ref={drag as any}
      className={`draggable-entry ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="entry-subject">{subjectName}</div>
      <div className="entry-details">
        <span className="entry-teacher">{teacherName}</span>
        <span className="entry-classroom">{classroomName}</span>
      </div>
    </div>
  );
};

export default DraggableEntry;