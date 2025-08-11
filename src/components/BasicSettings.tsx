import { useState, useEffect } from 'react';
import { Calendar, Save, Settings, Plus, X, Clock } from 'lucide-react';
import { getHolidaysInPeriod } from '../utils/holidayCalculator';
import type { ScheduleRequest, ScheduleRequestType, TimeSlotPeriod } from '../types';

interface BasicSettingsProps {
  onTitleChange: (title: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onMondayAvoidChange?: (avoid: boolean) => void;
  onRemarksChange?: (remarks: string) => void;
  onHolidaysChange?: (holidays: string[]) => void;
  onScheduleRequestsChange?: (requests: ScheduleRequest[]) => void;
  initialTitle?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialMondayAvoid?: boolean;
  initialRemarks?: string;
  initialHolidays?: string[];
  initialScheduleRequests?: ScheduleRequest[];
}

const BasicSettings = ({ 
  onTitleChange, 
  onStartDateChange, 
  onEndDateChange,
  onMondayAvoidChange,
  onRemarksChange,
  onHolidaysChange,
  onScheduleRequestsChange,
  initialTitle = '2025年度 後期',
  initialStartDate = '2025-09-29',
  initialEndDate = '2026-03-20',
  initialMondayAvoid = true,
  initialRemarks = '',
  initialHolidays = [],
  initialScheduleRequests = []
}: BasicSettingsProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [mondayAvoid, setMondayAvoid] = useState(initialMondayAvoid);
  const [remarks, setRemarks] = useState(initialRemarks);
  const [holidays, setHolidays] = useState<string[]>(initialHolidays);
  const [newHoliday, setNewHoliday] = useState('');
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>(initialScheduleRequests);
  const [saved, setSaved] = useState(false);
  
  // 新規スケジュール要求の入力フォーム
  const [newRequestDate, setNewRequestDate] = useState('');
  const [newRequestType, setNewRequestType] = useState<ScheduleRequestType>('periods-only');
  const [newRequestPeriods, setNewRequestPeriods] = useState<TimeSlotPeriod[]>(['1限']);
  const [newRequestDescription, setNewRequestDescription] = useState('');

  useEffect(() => {
    // 初期値を親コンポーネントに通知
    onTitleChange(title);
    onStartDateChange(startDate);
    onEndDateChange(endDate);
    onMondayAvoidChange?.(mondayAvoid);
    onRemarksChange?.(remarks);
    onHolidaysChange?.(holidays);
    onScheduleRequestsChange?.(scheduleRequests);
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    onStartDateChange(newDate);
  };

  const handleEndDateChange = (newDate: string) => {
    setEndDate(newDate);
    onEndDateChange(newDate);
  };

  const handleMondayAvoidChange = (avoid: boolean) => {
    setMondayAvoid(avoid);
    onMondayAvoidChange?.(avoid);
  };

  const handleRemarksChange = (newRemarks: string) => {
    setRemarks(newRemarks);
    onRemarksChange?.(newRemarks);
  };

  const handleHolidaysChange = (newHolidays: string[]) => {
    setHolidays(newHolidays);
    onHolidaysChange?.(newHolidays);
  };

  const addHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      const updatedHolidays = [...holidays, newHoliday].sort();
      handleHolidaysChange(updatedHolidays);
      setNewHoliday('');
    }
  };

  const removeHoliday = (holidayToRemove: string) => {
    const updatedHolidays = holidays.filter(h => h !== holidayToRemove);
    handleHolidaysChange(updatedHolidays);
  };

  const addDefaultHolidays = () => {
    // 動的に期間内の祝日を計算
    const periodHolidays = getHolidaysInPeriod(startDate, endDate);
    
    // まだ追加されていない祝日のみフィルタリング
    const newHolidays = periodHolidays.filter(date => !holidays.includes(date));
    
    if (newHolidays.length > 0) {
      const updatedHolidays = [...holidays, ...newHolidays].sort();
      handleHolidaysChange(updatedHolidays);
    }
  };

  // スケジュール調整要求の処理関数
  const addScheduleRequest = () => {
    if (!newRequestDate || newRequestPeriods.length === 0) {
      return;
    }

    const newRequest: ScheduleRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: newRequestDate,
      type: newRequestType,
      periods: [...newRequestPeriods],
      description: newRequestDescription || generateDescription()
    };

    const updatedRequests = [...scheduleRequests, newRequest];
    setScheduleRequests(updatedRequests);
    onScheduleRequestsChange?.(updatedRequests);
    
    // フォームをリセット
    setNewRequestDate('');
    setNewRequestType('periods-only');
    setNewRequestPeriods(['1限']);
    setNewRequestDescription('');
  };

  const removeScheduleRequest = (id: string) => {
    const updatedRequests = scheduleRequests.filter(req => req.id !== id);
    setScheduleRequests(updatedRequests);
    onScheduleRequestsChange?.(updatedRequests);
  };

  const generateDescription = () => {
    const periodsStr = newRequestPeriods.join('・');
    switch (newRequestType) {
      case 'periods-only':
        return `${periodsStr}のみで授業を実施`;
      case 'start-from':
        return `${newRequestPeriods[0]}から授業開始`;
      case 'end-until':
        return `${newRequestPeriods[newRequestPeriods.length - 1]}まで授業実施`;
      case 'exclude-periods':
        return `${periodsStr}は授業なし`;
      default:
        return 'スケジュール調整';
    }
  };

  const togglePeriodSelection = (period: TimeSlotPeriod) => {
    if (newRequestPeriods.includes(period)) {
      setNewRequestPeriods(newRequestPeriods.filter(p => p !== period));
    } else {
      setNewRequestPeriods([...newRequestPeriods, period].sort());
    }
  };

  const handleSave = () => {
    onTitleChange(title);
    onStartDateChange(startDate);
    onEndDateChange(endDate);
    onMondayAvoidChange?.(mondayAvoid);
    onRemarksChange?.(remarks);
    onHolidaysChange?.(holidays);
    onScheduleRequestsChange?.(scheduleRequests);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const calculateWeeks = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  return (
    <div className="basic-settings-container">
      <div className="settings-header">
        <div className="header-icon">
          <Settings size={32} />
        </div>
        <div>
          <h2>基本設定</h2>
          <p>時間割の基本情報を設定してください。「時間割を生成」ボタンでこの情報をもとに半年分の時間割が作成されます。</p>
        </div>
      </div>

      <div className="settings-form">
        <div className="setting-section">
          <h3><Calendar size={20} /> スケジュール情報</h3>
          
          <div className="form-group">
            <label htmlFor="timetable-title">
              時間割タイトル *
            </label>
            <input
              id="timetable-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="例: 2025年度 後期"
              className="title-input"
            />
            <small>この名前が時間割の上部と出力ファイルに表示されます</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">
                開始日 *
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-date">
                終了日 *
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="schedule-preview">
              <div className="preview-item">
                <strong>期間:</strong> {startDate} 〜 {endDate}
              </div>
              <div className="preview-item">
                <strong>予想週数:</strong> 約{calculateWeeks()}週間
              </div>
            </div>
          )}
        </div>

        <div className="setting-section">
          <h3>⚙️ スケジュール設定</h3>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mondayAvoid}
                onChange={(e) => handleMondayAvoidChange(e.target.checked)}
              />
              <span>月曜日を予備日として使用しない（火〜金でスケジュール作成）</span>
            </label>
            <small>
              月曜日は緊急授業や健康診断等のために空けておきます。
              チェックを外すと月曜日も通常の授業日として使用されます。
            </small>
          </div>
        </div>

        <div className="setting-section">
          <h3>📄 備考・メモ</h3>
          
          <div className="form-group">
            <label htmlFor="remarks">
              備考（出力ファイルに表示されます）
            </label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => handleRemarksChange(e.target.value)}
              placeholder="例: 特別行事、注意事項、変更点など..."
              rows={4}
              className="remarks-textarea"
            />
            <small>ここに入力した内容はExcel・PDF出力時に表示されます</small>
          </div>
        </div>

        <div className="setting-section">
          <h3>📅 休日設定</h3>
          
          <div className="form-group">
            <label htmlFor="new-holiday">
              休日を追加
            </label>
            <div className="holiday-input-group">
              <input
                id="new-holiday"
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                min={startDate}
                max={endDate}
              />
              <button 
                type="button" 
                className="btn-add-holiday"
                onClick={addHoliday}
                disabled={!newHoliday}
              >
                追加
              </button>
            </div>
            <small>時間割期間内の休日を指定してください</small>
          </div>

          <div className="form-group">
            <button 
              type="button" 
              className="btn-default-holidays"
              onClick={addDefaultHolidays}
            >
              日本の祝日を一括追加
            </button>
            <small>体育の日、文化の日、年末年始等の祝日が追加されます</small>
          </div>

          {holidays.length > 0 && (
            <div className="form-group">
              <label>設定済み休日 ({holidays.length}日)</label>
              <div className="holidays-list">
                {holidays.map((holiday) => (
                  <div key={holiday} className="holiday-item">
                    <span className="holiday-date">{holiday}</span>
                    <button
                      type="button"
                      className="btn-remove-holiday"
                      onClick={() => removeHoliday(holiday)}
                      title="この休日を削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="setting-section">
          <h3>🕐 スケジュール調整要求</h3>
          
          <div className="form-group">
            <label>特定日の時限制限</label>
            <small>健康診断、特別行事等で特定の日に時限制限がある場合に設定してください</small>
            
            <div className="schedule-request-form">
              <div className="request-inputs">
                <div className="input-group">
                  <label>日付</label>
                  <input
                    type="date"
                    value={newRequestDate}
                    onChange={(e) => setNewRequestDate(e.target.value)}
                    min={startDate}
                    max={endDate}
                  />
                </div>

                <div className="input-group">
                  <label>制限タイプ</label>
                  <select
                    value={newRequestType}
                    onChange={(e) => setNewRequestType(e.target.value as ScheduleRequestType)}
                  >
                    <option value="periods-only">指定時限のみ</option>
                    <option value="start-from">指定時限から開始</option>
                    <option value="end-until">指定時限まで</option>
                    <option value="exclude-periods">指定時限を除外</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>対象時限</label>
                  <div className="periods-selector">
                    {(['1限', '2限', '3限', '4限'] as TimeSlotPeriod[]).map(period => (
                      <button
                        key={period}
                        type="button"
                        className={`period-btn ${newRequestPeriods.includes(period) ? 'selected' : ''}`}
                        onClick={() => togglePeriodSelection(period)}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>説明（任意）</label>
                  <input
                    type="text"
                    value={newRequestDescription}
                    onChange={(e) => setNewRequestDescription(e.target.value)}
                    placeholder="例: 健康診断のため"
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn-add-request"
                onClick={addScheduleRequest}
                disabled={!newRequestDate || newRequestPeriods.length === 0}
              >
                <Plus size={16} />
                要求を追加
              </button>
            </div>
          </div>

          {scheduleRequests.length > 0 && (
            <div className="form-group">
              <label>設定済み調整要求 ({scheduleRequests.length}件)</label>
              <div className="schedule-requests-list">
                {scheduleRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <div className="request-date">
                        <Clock size={14} />
                        {request.date}
                      </div>
                      <div className="request-details">
                        <span className="request-type-badge">
                          {request.type === 'periods-only' && '指定時限のみ'}
                          {request.type === 'start-from' && '指定時限から開始'}
                          {request.type === 'end-until' && '指定時限まで'}
                          {request.type === 'exclude-periods' && '指定時限を除外'}
                        </span>
                        <span className="request-periods">
                          {request.periods.join('・')}
                        </span>
                      </div>
                      <div className="request-description">
                        {request.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-request"
                      onClick={() => removeScheduleRequest(request.id)}
                      title="この要求を削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="setting-section">
          <h3>📝 使用方法</h3>
          <div className="usage-guide">
            <ol>
              <li>上記の基本設定情報を入力してください</li>
              <li><strong>時間割を生成ボタンを押す前に</strong>、必ず<strong>教師管理、科目管理、教室管理</strong>のすべての項目をしっかりと入力・完成させてください</li>
              <li>すべてのタブが完成したら、画面上部の<strong>「時間割を生成」</strong>ボタンをクリック</li>
              <li>「半年分時間割」タブで結果を確認し、必要であれば手動で変更してください</li>
              <li>すべてのグループの内容をチェックし、完璧な状態にしてからExcel出力を行ってください</li>
            </ol>
          </div>
        </div>

        <div className="form-actions">
          <button
            className={`btn-save ${saved ? 'saved' : ''}`}
            onClick={handleSave}
          >
            <Save size={20} />
            {saved ? '保存完了！' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicSettings;