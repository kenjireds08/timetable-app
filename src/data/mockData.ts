import type { Teacher, Subject, Classroom, ScheduleEntry, DayOfWeek, BiweeklyType } from '../types';

export const mockTeachers: Teacher[] = [
  // === 共通科目担当 ===
  {
    id: 't1',
    name: '鈴木俊良',
    type: '非常勤',
    constraints: {
      fixed: [
        // デザインとプレゼンテーション（単独授業）の確定日程
        { date: '2025-10-15', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-10-22', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-10-29', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-11-05', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-11-12', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-11-19', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-11-26', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-12-03', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-12-10', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-12-17', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2025-12-24', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2026-01-07', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2026-01-14', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2026-01-19', dayOfWeek: '月', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' },
        { date: '2026-01-21', dayOfWeek: '水', periods: ['3限', '4限'], subjectNote: 'デザインとプレゼンテーション' }
      ],
      wish: {
        preferredContinuous: true, // 水曜14-15コマ目は連続希望
        preferredDays: ['木', '金'] as DayOfWeek[], // クリエイティブコミュニケーションラボ用（宮嵜さんに合わせる）
      }
    }
  },
  {
    id: 't2',
    name: '宮嵜真由美',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '木', periods: ['1限', '2限', '3限', '4限'] },
        { dayOfWeek: '金', periods: ['1限', '2限', '3限', '4限'] }
      ],
      ng: {
        days: ['月', '火', '水'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't3',
    name: '井手修身',
    type: '非常勤',
    constraints: {
      fixed: [
        { date: '2025-11-28', dayOfWeek: '金', periods: ['3限'] }
      ]
    }
  },
  {
    id: 't4',
    name: '夏井美果',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '木', periods: ['1限', '2限'] }
      ],
      ng: {
        days: ['月', '火', '水', '金'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't5',
    name: '松永祐一',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '木', periods: ['1限'] }
      ],
      ng: {
        days: ['月', '火', '水', '金'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't6',
    name: '副島小春',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '木', periods: ['2限'] }
      ],
      ng: {
        days: ['月', '火', '水', '金'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't7',
    name: '木下俊和',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '月', periods: ['1限', '2限', '3限', '4限'] },
        { dayOfWeek: '金', periods: ['1限', '2限', '3限', '4限'] }
      ],
      ng: {
        days: ['火', '木'] as DayOfWeek[]
      },
      wish: {
        preferredContinuous: true,
        preferredPeriods: [1, 2] // 1-2限または2-3限の連続希望
      }
    }
  },
  {
    id: 't8',
    name: '田上寛美',
    type: '非常勤',
    constraints: {
      fixed: [
        { date: '2025-10-22', dayOfWeek: '水', periods: ['3限', '4限'] }
      ],
      ng: {
        days: ['月', '金'] as DayOfWeek[]
      },
      wish: {
        preferredDays: ['火', '木', '水'] as DayOfWeek[],
        preferredPeriods: [3, 4]
      }
    }
  },

  // === IT専門科目担当 ===
  {
    id: 't9',
    name: '小山善文',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '月', periods: ['3限', '4限'] },
        { dayOfWeek: '木', periods: ['2限', '3限', '4限'] }
      ],
      ng: {
        days: ['火', '水', '金'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't10',
    name: '西川徹',
    type: '非常勤',
    constraints: {
      wish: {
        preferredDays: ['水', '木'] as DayOfWeek[],
        preferredContinuous: true,
        preferredPeriods: [1, 2] // 1-2限または2-3限の連続
      }
    }
  },
  {
    id: 't11',
    name: '岩木健',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '水', periods: ['1限', '2限', '3限', '4限'] }
      ],
      ng: {
        days: ['月', '火', '木', '金'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't12',
    name: '孫寧平',
    type: '非常勤',
    constraints: {
      fixed: [
        // データベース概論：10-11月の木曜3,4限
        { dayOfWeek: '木', periods: ['3限', '4限'], startWeek: 1, endWeek: 8, subjectNote: 'データベース概論' },
        // データベース設計：12-1月の木曜3,4限
        { dayOfWeek: '木', periods: ['3限', '4限'], startWeek: 13, endWeek: 19, subjectNote: 'データベース設計' }
      ],
      ng: {
        days: ['月', '金'] as DayOfWeek[]
      },
      wish: {
        // オブジェクト指向とWebアプリは火曜または水曜の3,4限で同じ日に実施
        preferredDays: ['火', '水'] as DayOfWeek[],
        preferredPeriods: [3, 4],
        preferredContinuous: true // 同じ日に連続で実施
      }
    }
  },
  {
    id: 't13',
    name: '森田典子',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '火', periods: ['2限', '3限', '4限'] },
        { dayOfWeek: '水', periods: ['2限', '3限', '4限'] }
      ],
      ng: {
        periods: [1] // 月木金の1時間目NG
      },
      wish: {
        preferredContinuous: true // 進級制作と卒業制作を同じ日程で連続
      }
    }
  },
  {
    id: 't14',
    name: '村上大輔',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '火', periods: ['1限', '2限'] },
        { dayOfWeek: '木', periods: ['1限', '2限'] }
      ],
      ng: {
        days: ['水', '金'] as DayOfWeek[]
      },
      wish: {
        preferredContinuous: true
      }
    }
  },
  {
    id: 't15',
    name: '吉井幸宗',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '金', periods: ['3限', '4限'], biweekly: 'odd' as BiweeklyType }
      ],
      ng: {
        days: ['火', '水', '木'] as DayOfWeek[]
      },
      wish: {
        preferredDays: ['月'] as DayOfWeek[],
        preferredPeriods: [1, 2]
      }
    }
  },

  // === TD専門科目担当 ===
  {
    id: 't16',
    name: 'Fiona',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '木', periods: ['3限', '4限'], specialNote: '13:15開始' }
      ],
      ng: {
        days: ['火', '水', '金'] as DayOfWeek[]
      },
      specialRequirement: {
        mondayMakeup: {
          totalMinutes: 240, // 15分×16週
          suggestedPattern: [
            { day1: { periods: ['3限', '4限'], minutes: 165 } }, // 1日目：3限+4限
            { day2: { periods: ['3限'], minutes: 75 } }  // 2日目：3限のみ
          ]
        }
      }
    }
  },
  {
    id: 't17',
    name: 'Lee',
    type: '非常勤',
    constraints: {
      fixed: [
        { dayOfWeek: '木', periods: ['4限'] },
        { dayOfWeek: '金', periods: ['3限', '4限'] }
      ],
      ng: {
        days: ['月', '火', '水'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't18',
    name: '廣瀬実華',
    type: '非常勤',
    constraints: {
      fixed: [
        { date: '2025-09-30', dayOfWeek: '火', periods: ['4限'] }
      ],
      ng: {
        days: ['月'] as DayOfWeek[], // 月曜は使用しない
        dates: ['2025-10-17', '2025-12-02']
      },
      wish: {
        preferredDays: ['火', '木', '金'] as DayOfWeek[]
      }
    }
  },
  {
    id: 't19',
    name: '久保尭之',
    type: '非常勤',
    constraints: {
      // 確認中 ※一旦[条件なし]
      wish: {
        preferredDays: ['月'] as DayOfWeek[] // 観光地域づくり実践（FW）は月曜予定
      }
    }
  }
];;;

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