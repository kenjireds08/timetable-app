import type { Teacher, Subject, Classroom, ScheduleEntry } from '../types';

export const mockTeachers: Teacher[] = [
  // 共通科目担当
  {
    id: 't1',
    name: '鈴木 俊良',
    type: '常勤',
    constraints: {
      confirmed: {
        days: ['水'],
        specialSchedule: [
          { date: '2025-10-15', subject: 'デザインとプレゼンテーション' },
          { date: '2025-10-22', subject: 'デザインとプレゼンテーション' },
          { date: '2025-10-29', subject: 'デザインとプレゼンテーション' },
          { date: '2025-11-05', subject: 'デザインとプレゼンテーション' },
          { date: '2025-11-12', subject: 'デザインとプレゼンテーション' },
          { date: '2025-11-19', subject: 'デザインとプレゼンテーション' },
          { date: '2025-11-26', subject: 'デザインとプレゼンテーション' },
          { date: '2025-12-03', subject: 'デザインとプレゼンテーション' },
          { date: '2025-12-10', subject: 'デザインとプレゼンテーション' },
          { date: '2025-12-17', subject: 'デザインとプレゼンテーション' },
          { date: '2025-12-24', subject: 'デザインとプレゼンテーション' },
          { date: '2026-01-07', subject: 'デザインとプレゼンテーション' },
          { date: '2026-01-14', subject: 'デザインとプレゼンテーション' },
          { date: '2026-01-19', subject: '成果発表会プレゼン', periods: ['3限', '4限'] },
          { date: '2026-01-21', subject: 'ふりかえり' }
        ]
      },
      preferred: {
        consecutivePeriods: [['3限', '4限']],
        notes: '水曜14-15コマ目は連続希望'
      },
      specialNotes: 'クリエイティブコミュニケーションラボ、デザインとプレゼンテーション担当。宮嵜さんとセット'
    }
  },
  {
    id: 't2',
    name: '宮嵜 真由美',
    type: '常勤',
    constraints: {
      confirmed: {
        days: ['木', '金']
      },
      unavailable: {
        days: ['月', '火', '水'],
        allDay: true
      },
      specialNotes: '木曜、金曜確定。月曜、火曜、水曜終日NG。鈴木さんとセット。ビジネス実務担当'
    }
  },
  {
    id: 't3',
    name: '井手 修身',
    type: '非常勤',
    constraints: {
      confirmed: {
        specialSchedule: [
          { date: '2025-11-28', periods: ['3限'], subject: '次世代地域リーダー学（全学年合同）' }
        ]
      },
      specialNotes: '11/28(金)1コマ全学年確定。その他条件なし（確認中）'
    }
  },
  {
    id: 't4',
    name: '夏井 美果',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['木'],
        periods: ['1限', '2限']
      },
      unavailable: {
        days: ['月', '火', '水', '金'],
        allDay: true
      },
      specialNotes: '木曜1,2時間目確定。Essential English I & II担当（コンビ授業）。夏井さん、松永さんセット（1年）、夏井さん、副島さんセット（2年）'
    }
  },
  {
    id: 't5',
    name: '松永 祐一',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['木'],
        periods: ['1限']
      },
      unavailable: {
        days: ['月', '火', '水', '金'],
        allDay: true
      },
      specialNotes: '木曜1時間目確定。ビジネス日本語I担当（コンビ授業）。夏井さん、松永さんセット'
    }
  },
  {
    id: 't6',
    name: '副島 小春',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['木'],
        periods: ['2限']
      },
      unavailable: {
        days: ['月', '火', '水', '金'],
        allDay: true
      },
      specialNotes: '木曜2時間目確定。ビジネス日本語II担当（コンビ授業）。夏井さん、副島さんセット'
    }
  },
  {
    id: 't7',
    name: '木下 俊和',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['月', '金'],
        classesPerDay: 2
      },
      unavailable: {
        days: ['火', '木'],
        allDay: true
      },
      preferred: {
        days: ['月', '水', '金'],
        consecutivePeriods: [['1限', '2限'], ['2限', '3限']],
        notes: '1、2限の連続、または2、3限の連続希望'
      },
      specialNotes: '月曜、金曜1日2コマ×2日確定。火曜、木曜終日NG。調整の余地あり'
    }
  },
  {
    id: 't8',
    name: '田上 寛美',
    type: '常勤',
    constraints: {
      confirmed: {
        specialSchedule: [
          { date: '2025-10-22', periods: ['3限', '4限'], subject: 'キャリア実践I' }
        ]
      },
      unavailable: {
        days: ['月', '金'],
        allDay: true,
        periods: {
          火: ['1限', '2限'],
          木: ['1限', '2限']
        }
      },
      preferred: {
        periods: {
          火: ['3限', '4限'],
          木: ['3限', '4限']
        },
        days: ['水'],
        notes: '火曜、木曜3,4時間目、水曜希望'
      },
      specialNotes: '10/22(水)3,4時間目2コマ確定。月曜はすでに予定アリ(NG）の日もあり（不規則のため現行NGとする）'
    }
  },
  
  // IT専門科目担当
  {
    id: 't9',
    name: '小山 善文',
    type: '非常勤',
    constraints: {
      confirmed: {
        periods: {
          月: ['3限', '4限'],
          木: ['2限', '3限', '4限']
        }
      },
      unavailable: {
        days: ['火', '水', '金'],
        allDay: true
      },
      specialNotes: '月曜3,4時間目、木曜2,3,4時間目確定。地域課題×IT、セキュリティ基礎担当'
    }
  },
  {
    id: 't10',
    name: '西川 徹',
    type: '非常勤',
    constraints: {
      preferred: {
        days: ['水', '木'],
        consecutivePeriods: [['1限', '2限'], ['2限', '3限']],
        notes: '週1日、I（1年生）とII（2年生）2コマ続き'
      },
      specialNotes: 'IoTとデータ活用I & II担当。週1日で1年と2年を連続授業'
    }
  },
  {
    id: 't11',
    name: '岩木 健',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['水']
      },
      unavailable: {
        days: ['月', '火', '木', '金'],
        allDay: true
      },
      specialNotes: '生成AI開発担当。水曜日のみ、他曜日終日NG'
    }
  },
  {
    id: 't12',
    name: '孫 寧平',
    type: '非常勤',
    constraints: {
      confirmed: {
        subjectSchedules: {
          'データベース概論': {
            period: '10-11月（後期前半）',
            days: ['木'],
            periods: ['3限', '4限']
          },
          'オブジェクト指向プログラミング': {
            days: ['火', '水'],
            periods: ['3限', '4限'],
            notes: '[Webアプリ開発]と同じ日程(連続コマ)'
          },
          'データベース設計': {
            period: '12-1月（後期後半）',
            days: ['木'],
            periods: ['3限', '4限']
          },
          'Webアプリ開発': {
            days: ['火', '水'],
            periods: ['3限', '4限'],
            notes: '[オブジェクト指向プログラミング]と同じ日程(連続コマ)'
          }
        }
      },
      unavailable: {
        days: ['月', '金']
      },
      specialNotes: '月曜、金曜NG。1年ITは「たかねこ」実施要望'
    }
  },
  {
    id: 't13',
    name: '森田 典子',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['火', '水']
      },
      unavailable: {
        periods: ['1限'],
        days: ['月', '木', '金']
      },
      preferred: {
        sameSchedule: ['卒業制作', '進級制作'],
        notes: '[卒業制作]と[進級制作]を同じ日程(連続コマ)'
      },
      specialNotes: '火曜、水曜確定。月曜、木曜、金曜の1時間目NG'
    }
  },
  {
    id: 't14',
    name: '村上 大輔',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['火', '木']
      },
      unavailable: {
        days: ['水', '金']
      },
      preferred: {
        periods: {
          火: [['1限', '2限']],
          木: [['1限', '2限']]
        },
        notes: '火曜の午前中1・2コマ連続、木曜の午前中1・2コマ連続'
      },
      specialNotes: '情報視覚化担当（単独）。火曜・木曜の1-2限連続、水曜・金曜NG'
    }
  },
  {
    id: 't15',
    name: '吉井 幸宗',
    type: '非常勤',
    constraints: {
      confirmed: {
        frequency: '隔週',
        days: ['金'],
        periods: ['3限', '4限']
      },
      unavailable: {
        days: ['火', '水', '木'],
        allDay: true
      },
      preferred: {
        alternativePeriods: {
          月: ['1限', '2限']
        },
        notes: '月曜1,2時間目も可能'
      },
      specialNotes: 'セキュリティ診断担当。隔週の金曜3,4時間目確定'
    }
  },
  
  // TD専門科目担当
  {
    id: 't16',
    name: 'Fiona',
    type: '非常勤',
    constraints: {
      confirmed: {
        days: ['木'],
        periods: ['3限', '4限'],
        specialTimeStart: '13:15',
        makeupSchedule: {
          totalDelayMinutes: 240, // 16コマ×15分遅れ
          makeupLocation: '月',
          makeupClasses: 3,
          notes: '後期16コマ×遅れ15分＝240分を月曜3コマで補填'
        }
      },
      unavailable: {
        days: ['火', '水', '金'],
        allDay: true
      },
      specialNotes: '木曜3,4時間目確定（3限は13:15開始で15分遅れ）。不足分240分を月曜で補填する必要あり'
    }
  },
  {
    id: 't17',
    name: 'Lee',
    type: '非常勤',
    constraints: {
      confirmed: {
        periods: {
          木: ['4限'],
          金: ['3限', '4限']
        }
      },
      unavailable: {
        days: ['月', '火', '水'],
        allDay: true
      },
      specialNotes: '木曜4時間目、金曜3,4時間目確定。Business English I & II担当'
    }
  },
  {
    id: 't18',
    name: '廣瀬 実華',
    type: '常勤',
    constraints: {
      confirmed: {
        days: ['月', '火', '木', '金'],
        specialSchedule: [
          { date: '2025-09-30', periods: ['1限'], subject: 'Webデザイン（ノーコード）' }
        ]
      },
      unavailable: {
        specificDates: ['2025-10-17', '2025-12-01', '2025-12-02'],
        recurringTime: {
          day: '月',
          time: '10:00-11:00',
          notes: '毎週月曜10:00-11:00NG'
        }
      },
      specialNotes: '月曜、火曜、木曜、金曜確定。10/17(金)、12/1(月)、12/2(火)NG。毎週月曜10:00-11:00NG。SNS/PR実践、Webデザイン担当'
    }
  },
  {
    id: 't19',
    name: '久保 尭之',
    type: '常勤',
    constraints: {
      specialNotes: '条件なし（確認中）。観光地域づくり実践（黒川温泉FW）は基本月曜設定科目。地域課題実践プロジェクト、ビジネス&マーケティング、観光関連、卒業プロジェクト担当'
    }
  }
];;

export const mockSubjects: Subject[] = [
  // 共通科目
  // クリエイティブコミュニケーションラボ I/II（全学年合同）
  {
    id: 's1',
    name: 'クリエイティブコミュニケーションラボ I/II',
    teacherIds: ['t1', 't2'],  // 鈴木俊良、宮嵜真由美
    department: '共通',
    grade: '全学年',
    totalClasses: 16,
    lessonType: '合同',
    availableClassroomIds: ['c1'],  // たかねこ限定（全学年合同）
    specialRequirements: '共通科目・全4グループ合同（IT1年+IT2年+TD1年+TD2年）、たかねこ限定'
  },
  // 次世代地域リーダー学 - 3パターン（I/II合同、I単独、II単独）
  {
    id: 's2',
    name: '次世代地域リーダー学 I/II',
    teacherIds: ['t3'],  // 井手修身
    department: '共通',
    grade: '全学年',
    totalClasses: 4,
    lessonType: '合同',
    availableClassroomIds: ['c1'],  // たかねこのみ（全学年合同）,
    specialRequirements: '共通科目・全4グループ合同版、11/28(金)全学年1コマ確定（午前でも午後でも）'
  },
  {
    id: 's3',
    name: '次世代地域リーダー学 I',
    teacherIds: ['t3'],  // 井手修身
    department: '共通',
    grade: '1年',
    totalClasses: 4,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2,
    specialRequirements: '1年生のみ版'
  },
  {
    id: 's4',
    name: '次世代地域リーダー学 II',
    teacherIds: ['t3'],  // 井手修身
    department: '共通',
    grade: '2年',
    totalClasses: 4,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2,
    specialRequirements: '2年生のみ版'
  },
  {
    id: 's5',
    name: 'Essential English I',
    teacherIds: ['t4'],  // 夏井美果
    department: '共通',
    grade: '1年',
    totalClasses: 16,
    lessonType: 'コンビ授業',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    comboSubjectId: 's7',
    comboSubjectName: 'ビジネス日本語 I',
    comboPairId: 'combo-EE1-BJ1',
    comboRole: 'A',
    specialRequirements: '※裏表の授業（コンビ授業）、木曜1,2限'
  },
  {
    id: 's6',
    name: 'Essential English II',
    teacherIds: ['t4'],  // 夏井美果
    department: '共通',
    grade: '2年',
    totalClasses: 16,
    lessonType: 'コンビ授業',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    comboSubjectId: 's8',
    comboSubjectName: 'ビジネス日本語 II',
    comboPairId: 'combo-EE2-BJ2',
    comboRole: 'A',
    specialRequirements: '※裏表の授業（コンビ授業）、木曜1,2限'
  },
  {
    id: 's7',
    name: 'ビジネス日本語 I',
    teacherIds: ['t5'],  // 松永祐一
    department: '共通',
    grade: '1年',
    totalClasses: 16,
    lessonType: 'コンビ授業',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    comboSubjectId: 's5',
    comboSubjectName: 'Essential English I',
    comboPairId: 'combo-EE1-BJ1',
    comboRole: 'B',
    specialRequirements: '※裏表の授業（コンビ授業）'
  },
  {
    id: 's8',
    name: 'ビジネス日本語 II',
    teacherIds: ['t6'],  // 副島小春
    department: '共通',
    grade: '2年',
    totalClasses: 16,
    lessonType: 'コンビ授業',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    comboPairId: 'combo-EE2-BJ2',
    comboRole: 'B',
    comboSubjectId: 's6',
    comboSubjectName: 'Essential English II',
    specialRequirements: '※裏表の授業（コンビ授業）、木曜1限'
  },
  {
    id: 's9',
    name: 'グローバルスタディーズ I',
    teacherIds: ['t7'],  // 木下俊和
    department: '共通',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '月・金のみ、2コマ連続希望'
  },
  {
    id: 's10',
    name: 'グローバルスタディーズ II',
    teacherIds: ['t7'],  // 木下俊和
    department: '共通',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '月・金のみ、2コマ連続希望'
  },
  {
    id: 's11',
    name: 'ビジネス実務 I',
    teacherIds: ['t2'],  // 宮嵜真由美
    department: '共通',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '木・金希望、水曜NG'
  },
  {
    id: 's12',
    name: 'ビジネス実務 II',
    teacherIds: ['t2'],  // 宮嵜真由美
    department: '共通',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '木・金希望、水曜NG'
  },
  {
    id: 's13',
    name: 'キャリア実践 I',
    teacherIds: ['t8'],  // 田上寛美
    department: '共通',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '火木3,4限のみ、金曜NG'
  },
  {
    id: 's14',
    name: 'デザインとプレゼンテーション',
    teacherIds: ['t1'],  // 鈴木俊良
    department: '共通',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: ''
  },
  
  // IT専門科目
  {
    id: 's15',
    name: '地域課題×IT I',
    teacherIds: ['t9'],  // 小山善文
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '木曜日'
  },
  {
    id: 's16',
    name: 'IoTとデータ活用 I',
    teacherIds: ['t10'],  // 西川徹
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: ''
  },
  {
    id: 's17',
    name: 'IoTとデータ活用 II',
    teacherIds: ['t10'],  // 西川徹
    department: 'ITソリューション',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: ''
  },
  {
    id: 's18',
    name: '生成AI開発',
    teacherIds: ['t11'],  // 岩木健
    department: 'ITソリューション',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '水曜に集約希望'
  },
  {
    id: 's19',
    name: 'データベース概論',
    teacherIds: ['t12'],  // 孫寧平
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '火水木のみ、1年ITはたかねこ実施要望'
  },
  {
    id: 's20',
    name: 'オブジェクト指向プログラミング',
    teacherIds: ['t12'],  // 孫寧平
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '火水木のみ、1年ITはたかねこ実施要望'
  },
  {
    id: 's21',
    name: 'データベース設計',
    teacherIds: ['t12'],  // 孫寧平
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '火水木のみ、1年ITはたかねこ実施要望'
  },
  {
    id: 's22',
    name: 'セキュリティ基礎',
    teacherIds: ['t9'],  // 小山善文
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '木曜日'
  },
  {
    id: 's23',
    name: '進級制作',
    teacherIds: ['t13'],  // 森田典子
    department: 'ITソリューション',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '水・金で週3コマの一部（週1コマ）、1限以外'
  },
  {
    id: 's24',
    name: '情報視覚化',
    teacherIds: ['t14', 't11'],  // 村上大輔、岩木健
    department: 'ITソリューション',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '岩木先生は水曜希望'
  },
  {
    id: 's25',
    name: 'Webアプリ開発',
    teacherIds: ['t12'],  // 孫寧平
    department: 'ITソリューション',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '火水木のみ'
  },
  {
    id: 's26',
    name: 'セキュリティ診断',
    teacherIds: ['t15'],  // 吉井幸宗
    department: 'ITソリューション',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '変更対応困難'
  },
  {
    id: 's27',
    name: '卒業制作',
    teacherIds: ['t13'],  // 森田典子
    department: 'ITソリューション',
    grade: '2年',
    totalClasses: 32,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '水・金で週3コマの一部（週2コマ）、1限以外、1日集約希望'
  },
  
  // TD専門科目
  {
    id: 's28',
    name: 'Active Communication in English I',
    teacherIds: ['t16'],  // Fiona
    department: '地域観光デザイン',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '月曜3限固定（13:15-14:45）、4限必ず空ける'
  },
  {
    id: 's29',
    name: 'Active Communication in English II',
    teacherIds: ['t16'],  // Fiona
    department: '地域観光デザイン',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '月曜3限固定（13:15-14:45）、4限必ず空ける'
  },
  {
    id: 's30',
    name: 'Business English I',
    teacherIds: ['t17'],  // Lee
    department: '地域観光デザイン',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '木曜4限、金曜3,4限'
  },
  {
    id: 's31',
    name: 'Business English II',
    teacherIds: ['t17'],  // Lee
    department: '地域観光デザイン',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '木曜4限、金曜3,4限'
  },
  // SNS/PR実践 I/II（全学年合同）
  {
    id: 's32',
    name: 'SNS/PR実践 I/II',
    teacherIds: ['t18'],  // 廣瀬実華
    department: '地域観光デザイン',
    grade: '全学年',
    totalClasses: 16,
    lessonType: '合同',
    availableClassroomIds: ['c1'],  // たかねこのみ（TD全学年合同）
    specialRequirements: 'TD専門全学年合同（TD1年+TD2年のみ）、水曜NG'
  },
  // 地域課題実践プロジェクト I/II（全学年合同）
  {
    id: 's33',
    name: '地域課題実践プロジェクト I/II',
    teacherIds: ['t19'],  // 久保尭之
    department: '地域観光デザイン',
    grade: '全学年',
    totalClasses: 16,
    lessonType: '合同',
    availableClassroomIds: ['c1'],  // たかねこのみ（TD全学年合同）
    specialRequirements: 'TD専門全学年合同（TD1年+TD2年のみ）'
  },
  {
    id: 's34',
    name: 'ビジネス&マーケティング応用',
    teacherIds: ['t19'],  // 久保尭之
    department: '地域観光デザイン',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: ''
  },
  {
    id: 's35',
    name: 'ビジネス開発演習',
    teacherIds: ['t7'],  // 木下俊和
    department: '地域観光デザイン',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '月・金のみ、2コマ連続希望'
  },
  {
    id: 's36',
    name: '観光地域づくり実践（黒川温泉FW）',
    teacherIds: ['t19'],  // 久保尭之
    department: '地域観光デザイン',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: ''
  },
  {
    id: 's37',
    name: 'Webデザイン（ノーコード）',
    teacherIds: ['t18'],  // 廣瀬実華
    department: '地域観光デザイン',
    grade: '1年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '水曜NG、9/30(火)1コマ確定'
  },
  {
    id: 's38',
    name: '地域観光マーケティング',
    teacherIds: ['t7'],  // 木下俊和
    department: '地域観光デザイン',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '月・金のみ、2コマ連続希望'
  },
  {
    id: 's39',
    name: '観光地域マネジメント',
    teacherIds: ['t19'],  // 久保尭之
    department: '地域観光デザイン',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: ''
  },
  {
    id: 's40',
    name: '卒業プロジェクト',
    teacherIds: ['t19'],  // 久保尭之
    department: '地域観光デザイン',
    grade: '2年',
    totalClasses: 32,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: ''
  },
  {
    id: 's41',
    name: '地域商品開発',
    teacherIds: ['t19'],  // 久保尭之
    department: '地域観光デザイン',
    grade: '2年',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: 'TD2年専門科目'
  }
];

export const mockClassrooms: Classroom[] = [
  { id: 'c1', name: 'たかねこ', capacity: 40 },  // 全学年合同（39人）対応
  { id: 'c2', name: 'しらかわ', capacity: 30 },
  { id: 'c3', name: 'なか', capacity: 30 },
  { id: 'c4', name: 'ICT1', capacity: 30, equipment: ['プロジェクター', 'PC'] },
  { id: 'c5', name: 'ICT2', capacity: 30, equipment: ['プロジェクター', 'PC'] }
];

export const mockSchedule: ScheduleEntry[] = [];