import type { Teacher, Subject, Classroom, ScheduleEntry } from '../types';

export const mockTeachers: Teacher[] = [
  // 共通科目担当
  {
    id: 't1',
    name: '鈴木 俊良',
    type: '常勤',
    constraints: {
      specialNotes: 'クリエイティブコミュニケーションラボ、デザインとプレゼンテーション担当'
    }
  },
  {
    id: 't2',
    name: '宮嵜 真由美',
    type: '常勤',
    constraints: {
      preferredDays: ['thursday', 'friday'], // 希望曜日
      unavailableDays: ['wednesday'], // 水曜日は絶対NG
      priorityOrder: ['thursday', 'friday', 'tuesday', 'monday'], // 優先順位（水曜除く）
      specialNotes: '木曜日最優先、金曜日次優先、水曜日は絶対NG。ビジネス実務担当'
    }
  },
  {
    id: 't3',
    name: '井手 修身',
    type: '非常勤',
    constraints: {
      specialNotes: '次世代地域リーダー学担当。11/28(金)に全学年1コマ確定'
    }
  },
  {
    id: 't4',
    name: '夏井 美果',
    type: '非常勤',
    constraints: {
      requiredPeriods: ['1限', '2限'],
      availableDays: ['thursday'],
      specialNotes: '木曜1,2時間目。Essential English I & II担当（コンビ授業）'
    }
  },
  {
    id: 't5',
    name: '松永 祐一',
    type: '非常勤',
    constraints: {
      changeUnavailable: true,
      specialNotes: 'ビジネス日本語 I担当（コンビ授業）、変更対応困難'
    }
  },
  {
    id: 't6',
    name: '副島 小春',
    type: '非常勤',
    constraints: {
      requiredPeriods: ['1限'],
      availableDays: ['thursday'],
      changeUnavailable: true,
      specialNotes: '木曜1時間目。ビジネス日本語 II担当（コンビ授業）、変更対応困難'
    }
  },
  {
    id: 't7',
    name: '木下 俊和',
    type: '非常勤',
    constraints: {
      preferredDays: ['friday', 'monday'], // 金曜日を最優先、月曜日を次優先
      preferConsecutiveClasses: true,
      maxClassesPerDay: 2,
      priorityOrder: ['friday', 'monday'], // 金曜日→月曜日の順
      flexibleScheduling: true, // 金曜日が埋まったら月曜日使用OK
      specialNotes: '金曜日最優先、満杯なら月曜日も利用、2コマ連続希望'
    }
  },
  {
    id: 't8',
    name: '田上 寛美',
    type: '常勤',
    constraints: {
      unavailableDays: ['friday'],
      availablePeriods: {
        tuesday: ['3限', '4限'],
        thursday: ['3限', '4限']
      },
      monthlyExceptions: [{ day: 'wednesday', periods: ['1限', '2限'], frequency: 1 }],
      specialNotes: '火木は3,4限のみ、水曜は終日OKだが月1回午前NG、金曜終日NG'
    }
  },
  
  // IT専門科目担当
  {
    id: 't9',
    name: '小山 善文',
    type: '非常勤',
    constraints: {
      availableDays: ['thursday'],
      specialNotes: '木曜日。地域課題×IT、セキュリティ基礎担当'
    }
  },
  {
    id: 't10',
    name: '西川 徹',
    type: '非常勤',
    constraints: {
      specialNotes: 'IoTとデータ活用 I & II担当'
    }
  },
  {
    id: 't11',
    name: '岩木 健',
    type: '非常勤',
    constraints: {
      availableDays: ['wednesday'],
      weeklyGrouping: true,
      specialNotes: '後期は水曜に変更希望、週1日にまとめて。生成AI開発、情報視覚化担当'
    }
  },
  {
    id: 't12',
    name: '孫 寧平',
    type: '非常勤',
    constraints: {
      availableDays: ['tuesday', 'wednesday', 'thursday'],
      changeUnavailable: true,
      specialNotes: '火水木のみ、変更対応困難。1年ITはたかねこ実施要望'
    }
  },
  {
    id: 't13',
    name: '森田 典子',
    type: '非常勤',
    constraints: {
      availableDays: ['wednesday', 'friday'],
      maxClassesPerWeek: 3,
      weeklyGrouping: true,
      unavailablePeriods: ['1限'],
      specialNotes: '水・金で週3コマ（卒業制作2＋進級制作1）まとめて、1限以外、1日集約希望'
    }
  },
  {
    id: 't14',
    name: '村上 大輔',
    type: '非常勤',
    constraints: {
      specialNotes: '情報視覚化担当（岩木と共同）'
    }
  },
  {
    id: 't15',
    name: '吉井 幸宗',
    type: '非常勤',
    constraints: {
      changeUnavailable: true,
      specialNotes: 'セキュリティ診断担当、変更対応困難'
    }
  },
  
  // TD専門科目担当
  {
    id: 't16',
    name: 'Fiona',
    type: '非常勤',
    constraints: {
      requiredPeriods: ['3限'],
      availableDays: ['monday'],
      specialTimeStart: '13:15',
      changeUnavailable: true,
      specialNotes: '月曜3限固定（13:15-14:45）、4限必ず空ける、変更対応困難'
    }
  },
  {
    id: 't17',
    name: 'Lee',
    type: '非常勤',
    constraints: {
      requiredPeriods: ['3限', '4限'],
      availableDays: ['thursday', 'friday'],
      changeUnavailable: true,
      specialNotes: '木曜4限、金曜3,4限、変更対応困難'
    }
  },
  {
    id: 't18',
    name: '廣瀬 実華',
    type: '常勤',
    constraints: {
      unavailableDays: ['wednesday'],
      specialNotes: '水曜日は商工会個別相談のためNG。SNS/PR実践、Webデザイン担当。9/30(火)Webデザイン1コマ確定'
    }
  },
  {
    id: 't19',
    name: '久保 尭之',
    type: '常勤',
    constraints: {
      specialNotes: '地域課題実践プロジェクト、ビジネス&マーケティング、観光関連、卒業プロジェクト担当'
    }
  }
];

export const mockSubjects: Subject[] = [
  // 共通科目
  {
    id: 's1',
    name: 'クリエイティブコミュニケーションラボ I/II',
    teacherIds: ['t1', 't2'],  // 鈴木俊良、宮嵜真由美
    department: '共通',
    grade: '全学年（合同）',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '全学年合同授業（39人）、たかねこ限定'
  },
  {
    id: 's2',
    name: '次世代地域リーダー学 I/II（合同）',
    teacherIds: ['t3'],  // 井手修身
    department: '共通',
    grade: '全学年（合同）',
    totalClasses: 4,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '全学年合同、たかねこ限定。11/28(金)1コマ確定'
  },
  {
    id: 's3',
    name: '次世代地域リーダー学 I',
    teacherIds: ['t3'],  // 井手修身
    department: '共通',
    grade: '1年',
    totalClasses: 4,
    lessonType: '通常',
    availableClassroomIds: ['c1', 'c4', 'c5'],  // たかねこ、ICT1、ICT2
    specialRequirements: '1年生向け'
  },
  {
    id: 's4',
    name: '次世代地域リーダー学 II',
    teacherIds: ['t3'],  // 井手修身
    department: '共通',
    grade: '2年',
    totalClasses: 4,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '2年生向け'
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
    name: 'キャリア実践I',
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
  {
    id: 's32',
    name: 'SNS/PR実践 I/II',
    teacherIds: ['t18'],  // 廣瀬実華
    department: '共通',
    grade: '全学年（合同）',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '全学年合同、水曜NG'
  },
  {
    id: 's33',
    name: '地域課題実践プロジェクト I/II',
    teacherIds: ['t19'],  // 久保尭之
    department: '共通',
    grade: '全学年（合同）',
    totalClasses: 16,
    lessonType: '通常',
    availableClassroomIds: ['c1'],  // たかねこのみ
    specialRequirements: '全学年合同'
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
    name: '観光ビジネスDX',
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
    totalClasses: 48,
    lessonType: '通常',
    availableClassroomIds: ['c2', 'c3', 'c4', 'c5'],  // しらかわ、なか、ICT1、ICT2
    specialRequirements: '週3コマ程度'
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
    specialRequirements: ''
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