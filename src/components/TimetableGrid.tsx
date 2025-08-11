import { useDrop } from 'react-dnd';
import { DAYS_OF_WEEK, PERIODS } from '../types';
import type { ScheduleEntry, TimeSlotPeriod, DayOfWeek } from '../types';

interface TimetableGridProps {
  schedule: ScheduleEntry[];
  selectedView: 'department' | 'teacher' | 'classroom';
  selectedFilter: string;
  onCellDrop: (entry: ScheduleEntry, day: DayOfWeek, period: TimeSlotPeriod) => void;
  getSubjectInfo: (subjectId: string) => { name: string; teacherName: string; classroomName: string } | null;
}

interface CellProps {
  day: DayOfWeek;
  period: TimeSlotPeriod;
  entry?: ScheduleEntry;
  onDrop: (entry: ScheduleEntry, day: DayOfWeek, period: TimeSlotPeriod) => void;
  getSubjectInfo: (subjectId: string) => { name: string; teacherName: string; classroomName: string } | null;
}

const TimetableCell = ({ day, period, entry, onDrop, getSubjectInfo }: CellProps) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'schedule-entry',
    drop: (item: ScheduleEntry) => {
      onDrop(item, day, period);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const subjectInfo = entry ? getSubjectInfo(entry.subjectId) : null;

  return (
    <td
      ref={drop as any}
      className={`timetable-cell ${isOver ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''} ${entry ? 'has-entry' : ''}`}
    >
      {subjectInfo && (
        <div className="cell-content">
          <div className="subject-name">{subjectInfo.name}</div>
          <div className="teacher-name">{subjectInfo.teacherName}</div>
          <div className="classroom-name">{subjectInfo.classroomName}</div>
        </div>
      )}
    </td>
  );
};

const TimetableGrid = ({ 
  schedule, 
  selectedView, 
  selectedFilter,
  onCellDrop,
  getSubjectInfo 
}: TimetableGridProps) => {
  const getEntryForCell = (day: DayOfWeek, period: TimeSlotPeriod): ScheduleEntry | undefined => {
    return schedule.find(entry => 
      entry.timeSlot.dayOfWeek === day && 
      entry.timeSlot.period === period
    );
  };

  return (
    <div className="timetable-container">
      <table className="timetable-grid">
        <thead>
          <tr>
            <th className="corner-cell">時限</th>
            {DAYS_OF_WEEK.map(day => (
              <th key={day} className="day-header">{day}曜日</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map(period => (
            <tr key={period}>
              <td className="period-header">{period}</td>
              {DAYS_OF_WEEK.map(day => (
                <TimetableCell
                  key={`${day}-${period}`}
                  day={day}
                  period={period}
                  entry={getEntryForCell(day, period)}
                  onDrop={onCellDrop}
                  getSubjectInfo={getSubjectInfo}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;