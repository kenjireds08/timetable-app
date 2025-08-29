import { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Calendar, Users, Book, Home, Play, AlertCircle, Settings } from 'lucide-react';
import TimetableGrid from './components/TimetableGrid';
import AdvancedTeacherManager from './components/AdvancedTeacherManager';
import SubjectManager from './components/SubjectManager';
import LoadingAnimation from './components/LoadingAnimation';
import ExportButtons from './components/ExportButtons';
import SemesterTimetable from './components/SemesterTimetable';
import BasicSettings from './components/BasicSettings';
import ClassroomManager from './components/ClassroomManager';
import type { 
  Teacher, 
  Subject, 
  Classroom, 
  ScheduleEntry, 
  DayOfWeek, 
  TimeSlotPeriod,
  ScheduleRequest
} from './types';
import { mockTeachers, mockSubjects, mockClassrooms } from './data/mockData';
import { TimetableGenerator } from './utils/timetableGenerator';
import { AutoScheduleGenerator } from './utils/autoScheduleGenerator';
import './App.css';

type TabType = 'basic' | 'semester' | 'teachers' | 'subjects' | 'classrooms';
type ViewType = 'department' | 'teacher' | 'classroom';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [selectedView, setSelectedView] = useState<ViewType>('department');
  const [selectedFilter, setSelectedFilter] = useState<string>('ITソリューション-1年');
  
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('teachers');
      return saved ? JSON.parse(saved) : mockTeachers;
    } catch {
      return mockTeachers;
    }
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('subjects');
      return saved ? JSON.parse(saved) : mockSubjects;
    } catch {
      return mockSubjects;
    }
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    try {
      const saved = localStorage.getItem('classrooms');
      return saved ? JSON.parse(saved) : mockClassrooms;
    } catch {
      return mockClassrooms;
    }
  });
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // 基本設定の状態（LocalStorageから復元）
  const [semesterTitle, setSemesterTitle] = useState(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).title || '2025年度 後期' : '2025年度 後期';
  });
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).startDate || '2025-09-29' : '2025-09-29';
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).endDate || '2026-03-20' : '2026-03-20';
  });
  const [mondayAvoid, setMondayAvoid] = useState(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).mondayAvoid !== false : true;
  });
  const [remarks, setRemarks] = useState(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).remarks || '' : '';
  });
  const [holidays, setHolidays] = useState<string[]>(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).holidays || [] : [];
  });
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>(() => {
    const saved = localStorage.getItem('basicSettings');
    return saved ? JSON.parse(saved).scheduleRequests || [] : [];
  });

  // バリデーションエラーを5秒後に自動的にクリア
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError(null);
      }, 5000); // 5秒後にクリア

      // クリーンアップ関数
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  // 各タブの完成状況チェック
  const checkTabCompletion = () => {
    // 教師管理：最低1人の教師が登録されていて、名前があること
    const teachersComplete = teachers.length >= 1 && teachers.every(t => 
      t.name && t.name.trim().length > 0
    );
    
    // 科目管理：最低1科目が登録されていて、名前があること
    const subjectsComplete = subjects.length >= 1 && subjects.every(s => 
      s.name && s.name.trim().length > 0
    );
    
    // 教室管理：最低1教室が登録されていて、名前があること
    const classroomsComplete = classrooms.length >= 1 && classrooms.every(c => 
      c.name && c.name.trim().length > 0
    );
    
    // 基本設定：タイトル、開始日、終了日が入力されていること
    const basicSettingsComplete = semesterTitle && semesterTitle.trim().length > 0 && 
                                  startDate && endDate;
    
    return {
      teachers: teachersComplete,
      subjects: subjectsComplete, 
      classrooms: classroomsComplete,
      basicSettings: basicSettingsComplete,
      allComplete: teachersComplete && subjectsComplete && classroomsComplete && basicSettingsComplete
    };
  };

  const tabStatus = checkTabCompletion();


  const handleGenerateTimetable = useCallback(async () => {
    // すべてのタブが完成していない場合は生成を拒否
    if (!tabStatus.allComplete) {
      const incompleteDetails = [];
      if (!tabStatus.teachers) {
        const teacherCount = teachers.length;
        const invalidTeachers = teachers.filter(t => !t.name || t.name.trim().length === 0).length;
        incompleteDetails.push(`教師管理 (${teacherCount > 0 ? `${invalidTeachers}人の教師に名前が未入力` : '教師が1人も登録されていません'})`);
      }
      if (!tabStatus.subjects) {
        const subjectCount = subjects.length;
        const invalidSubjects = subjects.filter(s => !s.name || s.name.trim().length === 0).length;
        incompleteDetails.push(`科目管理 (${subjectCount > 0 ? `${invalidSubjects}科目に名前が未入力` : '科目が1つも登録されていません'})`);
      }
      if (!tabStatus.classrooms) {
        const classroomCount = classrooms.length;
        const invalidClassrooms = classrooms.filter(c => !c.name || c.name.trim().length === 0).length;
        incompleteDetails.push(`教室管理 (${classroomCount > 0 ? `${invalidClassrooms}教室に名前が未入力` : '教室が1つも登録されていません'})`);
      }
      if (!tabStatus.basicSettings) {
        const missingBasic = [];
        if (!semesterTitle || semesterTitle.trim().length === 0) missingBasic.push('タイトル');
        if (!startDate) missingBasic.push('開始日');
        if (!endDate) missingBasic.push('終了日');
        incompleteDetails.push(`基本設定 (${missingBasic.join('、')}が未入力)`);
      }
      
      alert(`時間割を生成する前に、以下を完成させてください：\n\n${incompleteDetails.map(item => `・${item}`).join('\n')}\n\n最低条件：\n・教師1人以上（名前入力必須）\n・科目1つ以上（名前入力必須）\n・教室1つ以上（名前入力必須）\n・基本設定すべて入力`);
      return;
    }

    setIsGenerating(true);
    setValidationError(null);
    
    try {
      // 3秒間のローディング演出
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 自動スケジュール生成器を初期化
      const generator = new AutoScheduleGenerator(teachers, subjects, classrooms);
      
      // スケジュールを生成
      const generatedSchedules = generator.generateSchedule({
        startDate,
        endDate,
        avoidMonday: mondayAvoid,
        departments: ['ITソリューション', '地域観光デザイン'],
        holidays: holidays, // 休日情報を追加
        scheduleRequests: scheduleRequests // スケジュール調整要求を追加
      });

      // 生成されたデータを構築
      const weeks = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7));
      const groups: { [key: string]: any } = {};
      
      generatedSchedules.forEach((schedule, groupId) => {
        const groupNames = {
          'it-1': 'ITソリューション 1年',
          'it-2': 'ITソリューション 2年', 
          'design-1': '地域観光デザイン 1年',
          'design-2': '地域観光デザイン 2年'
        };
        
        groups[groupId] = {
          name: groupNames[groupId] || groupId,
          department: groupId.includes('it') ? 'ITソリューション' : '地域観光デザイン',
          grade: groupId.includes('1') ? '1年' : '2年',
          status: 'complete',
          schedule: schedule
        };
      });

      const updatedSemesterData = {
        groups,
        weeks,
        startDate,
        endDate,
        title: semesterTitle,
        mondayAvoid,
        remarks,
        generatedAt: new Date().toISOString()
      };
      
      // LocalStorageに更新されたデータを保存
      localStorage.setItem('generatedSemesterData', JSON.stringify(updatedSemesterData));
      localStorage.setItem('lastGeneratedSettings', JSON.stringify({
        title: semesterTitle,
        startDate,
        endDate,
        mondayAvoid,
        remarks,
        generatedAt: new Date().toISOString()
      }));
      
      // 半年分時間割タブに自動切り替え
      setActiveTab('semester');
      setIsGenerating(false);
      
      // 成功メッセージ
      const totalClasses = Object.values(groups).reduce((sum, group: any) => sum + group.schedule.length, 0);
      alert(`${semesterTitle}の時間割が生成されました！\n期間: ${startDate} 〜 ${endDate}\n総授業数: ${totalClasses}コマ\n月曜日使用: ${mondayAvoid ? '無し（予備日）' : '有り'}\n\n「半年分時間割」タブで内容を確認し、必要に応じて手動調整を行ってから、すべてのグループが完璧な状態になったらExcel出力を行ってください。`);
      
    } catch (error) {
      console.error('時間割生成エラー:', error);
      setValidationError('時間割の生成中にエラーが発生しました。');
      setIsGenerating(false);
    }
  }, [semesterTitle, startDate, endDate, tabStatus]);

  const handleCellDrop = useCallback((entry: ScheduleEntry, day: DayOfWeek, period: TimeSlotPeriod) => {
    const generator = new TimetableGenerator({
      teachers,
      subjects,
      classrooms,
      startDate: '2025-10-01',
      weeks: 16
    });

    const newSlot = {
      date: entry.timeSlot.date,
      dayOfWeek: day,
      period: period
    };

    const validation = generator.validateConstraints(entry, newSlot);
    
    if (validation.valid) {
      setSchedule(prev => prev.map(e => 
        e.id === entry.id 
          ? { ...e, timeSlot: newSlot }
          : e
      ));
      setValidationError(null);
    } else {
      setValidationError(validation.message || '移動できません');
      setTimeout(() => setValidationError(null), 3000);
    }
  }, [teachers, subjects, classrooms]);

  const getSubjectInfo = useCallback((subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return null;
    
    const teacher = teachers.find(t => t.id === subject.teacherIds[0]);
    const classroom = classrooms.find(c => subject.availableClassroomIds.includes(c.id));
    
    return {
      name: subject.name,
      teacherName: teacher?.name || '',
      classroomName: classroom?.name || ''
    };
  }, [subjects, teachers, classrooms]);

  // 基本設定の保存処理
  const saveBasicSettings = (title: string, start: string, end: string, monday: boolean, rem: string, hols: string[] = holidays, reqs: ScheduleRequest[] = scheduleRequests) => {
    const settings = {
      title,
      startDate: start,
      endDate: end,
      mondayAvoid: monday,
      remarks: rem,
      holidays: hols,
      scheduleRequests: reqs
    };
    localStorage.setItem('basicSettings', JSON.stringify(settings));
  };

  // 基本設定のハンドラー（即座保存）
  const handleTitleChange = (newTitle: string) => {
    setSemesterTitle(newTitle);
    saveBasicSettings(newTitle, startDate, endDate, mondayAvoid, remarks, holidays, scheduleRequests);
  };

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    saveBasicSettings(semesterTitle, newDate, endDate, mondayAvoid, remarks, holidays, scheduleRequests);
  };

  const handleEndDateChange = (newDate: string) => {
    setEndDate(newDate);
    saveBasicSettings(semesterTitle, startDate, newDate, mondayAvoid, remarks, holidays, scheduleRequests);
  };

  const handleMondayAvoidChange = (avoid: boolean) => {
    setMondayAvoid(avoid);
    saveBasicSettings(semesterTitle, startDate, endDate, avoid, remarks, holidays, scheduleRequests);
  };

  const handleRemarksChange = (newRemarks: string) => {
    setRemarks(newRemarks);
    saveBasicSettings(semesterTitle, startDate, endDate, mondayAvoid, newRemarks, holidays, scheduleRequests);
  };

  const handleHolidaysChange = (newHolidays: string[]) => {
    setHolidays(newHolidays);
    saveBasicSettings(semesterTitle, startDate, endDate, mondayAvoid, remarks, newHolidays, scheduleRequests);
  };

  const handleScheduleRequestsChange = (newRequests: ScheduleRequest[]) => {
    setScheduleRequests(newRequests);
    saveBasicSettings(semesterTitle, startDate, endDate, mondayAvoid, remarks, holidays, newRequests);
  };

  // CRUD handlers
  const handleAddTeacher = (teacher: Teacher) => setTeachers([...teachers, teacher]);
  const handleUpdateTeacher = (teacher: Teacher) => 
    setTeachers(teachers.map(t => t.id === teacher.id ? teacher : t));
  const handleDeleteTeacher = (id: string) => 
    setTeachers(teachers.filter(t => t.id !== id));

  const handleAddSubject = (subject: Subject) => setSubjects([...subjects, subject]);
  const handleUpdateSubject = (subject: Subject) => 
    setSubjects(subjects.map(s => s.id === subject.id ? subject : s));
  const handleDeleteSubject = (id: string) => 
    setSubjects(subjects.filter(s => s.id !== id));

  const handleAddClassroom = (classroom: Classroom) => setClassrooms([...classrooms, classroom]);
  const handleUpdateClassroom = (classroom: Classroom) => 
    setClassrooms(classrooms.map(c => c.id === classroom.id ? classroom : c));
  const handleDeleteClassroom = (id: string) => 
    setClassrooms(classrooms.filter(c => c.id !== id));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="app-title">
              <h1>アイデアITカレッジ阿蘇</h1>
              <h2>AI時間割自動生成システム</h2>
            </div>
            <div className="header-actions">
              <div className="generation-status">
                <div className="status-indicators">
                  <span className={`status-indicator ${tabStatus.teachers ? 'complete' : 'incomplete'}`}>
                    教師管理 {tabStatus.teachers ? '✓' : '✗'}
                  </span>
                  <span className={`status-indicator ${tabStatus.subjects ? 'complete' : 'incomplete'}`}>
                    科目管理 {tabStatus.subjects ? '✓' : '✗'}
                  </span>
                  <span className={`status-indicator ${tabStatus.classrooms ? 'complete' : 'incomplete'}`}>
                    教室管理 {tabStatus.classrooms ? '✓' : '✗'}
                  </span>
                  <span className={`status-indicator ${tabStatus.basicSettings ? 'complete' : 'incomplete'}`}>
                    基本設定 {tabStatus.basicSettings ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              <button 
                className={`btn-generate ${tabStatus.allComplete ? '' : 'disabled'}`}
                onClick={handleGenerateTimetable}
                disabled={isGenerating || !tabStatus.allComplete}
                title={tabStatus.allComplete ? '時間割を生成' : 'すべてのタブを完成させてから生成してください'}
              >
                <Play size={20} />
                {isGenerating ? '生成中...' : '時間割を生成'}
              </button>
              
              {schedule.length > 0 && (
                <ExportButtons
                  schedule={schedule}
                  teachers={teachers}
                  subjects={subjects}
                  classrooms={classrooms}
                />
              )}
            </div>
          </div>
        </header>

        {validationError && (
          <div className="validation-error">
            <AlertCircle size={20} />
            {validationError}
          </div>
        )}

        <nav className="app-nav">
          <div className="app-nav-inner">
            <button 
              className={`nav-tab ${activeTab === 'semester' ? 'active' : ''}`}
              onClick={() => setActiveTab('semester')}
            >
              <Calendar size={20} />
              半年分時間割
            </button>
            <button 
              className={`nav-tab ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <Users size={20} />
              教師管理
            </button>
            <button 
              className={`nav-tab ${activeTab === 'subjects' ? 'active' : ''}`}
              onClick={() => setActiveTab('subjects')}
            >
              <Book size={20} />
              科目管理
            </button>
            <button 
              className={`nav-tab ${activeTab === 'classrooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('classrooms')}
            >
              <Home size={20} />
              教室管理
            </button>
            <button 
              className={`nav-tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <Settings size={20} />
              基本設定
            </button>
          </div>
        </nav>

        <main className="app-main">

          {activeTab === 'semester' && (
            <SemesterTimetable
              teachers={teachers}
              subjects={subjects}
              classrooms={classrooms}
              onValidationError={setValidationError}
              semesterTitle={semesterTitle}
              startDate={startDate}
              endDate={endDate}
              holidays={holidays}
              scheduleRequests={scheduleRequests.map(req => ({ 
                date: req.date, 
                description: req.description,
                periods: req.periods 
              }))}
            />
          )}

          {activeTab === 'teachers' && (
            <div className="manager-container wide-layout">
              <AdvancedTeacherManager
                teachers={teachers}
                subjects={subjects}
                onAdd={handleAddTeacher}
                onUpdate={handleUpdateTeacher}
                onDelete={handleDeleteTeacher}
              />
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="manager-container wide-layout">
              <SubjectManager
                subjects={subjects}
                teachers={teachers}
                classrooms={classrooms}
                onAdd={handleAddSubject}
                onUpdate={handleUpdateSubject}
                onDelete={handleDeleteSubject}
              />
            </div>
          )}

          {activeTab === 'classrooms' && (
            <div className="manager-container wide-layout">
              <ClassroomManager
                classrooms={classrooms}
                onAdd={handleAddClassroom}
                onUpdate={handleUpdateClassroom}
                onDelete={handleDeleteClassroom}
              />
            </div>
          )}

          {activeTab === 'basic' && (
            <BasicSettings
              onTitleChange={handleTitleChange}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onMondayAvoidChange={handleMondayAvoidChange}
              onRemarksChange={handleRemarksChange}
              onHolidaysChange={handleHolidaysChange}
              onScheduleRequestsChange={handleScheduleRequestsChange}
              initialTitle={semesterTitle}
              initialStartDate={startDate}
              initialEndDate={endDate}
              initialMondayAvoid={mondayAvoid}
              initialRemarks={remarks}
              initialHolidays={holidays}
              initialScheduleRequests={scheduleRequests}
            />
          )}
        </main>
        
        <LoadingAnimation isVisible={isGenerating} />
      </div>
    </DndProvider>
  );
}

export default App
