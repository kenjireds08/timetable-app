/**
 * 共通フォームヘルパー関数
 * TeacherManager, AdvancedTeacherManager, SubjectManager などで使用される
 * 共通のフォーム処理ロジックを集約
 */

import { Teacher, Subject, TeacherType, TeacherConstraints } from '../types';

/**
 * 教師追加・更新用の共通ハンドラー
 */
export const createTeacherHandlers = <T extends Teacher>(
  setTeachers: React.Dispatch<React.SetStateAction<T[]>>
) => {
  const handleAddTeacher = (
    newTeacher: Omit<T, 'id'>,
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    initialFormData: any
  ) => {
    const teacherWithId = {
      ...newTeacher,
      id: `t${Date.now()}`
    } as T;
    
    setTeachers((prev: T[]) => [...prev, teacherWithId]);
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditTeacher = (teacher: T, setFormData: React.Dispatch<React.SetStateAction<any>>, setIsEditing: React.Dispatch<React.SetStateAction<boolean>>, setEditingId: React.Dispatch<React.SetStateAction<string | null>>) => {
    setFormData(teacher);
    setIsEditing(true);
    setEditingId(teacher.id);
  };

  const handleUpdateTeacher = (
    id: string,
    updatedData: Omit<T, 'id'>,
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    initialFormData: any
  ) => {
    setTeachers((prev: T[]) =>
      prev.map((teacher) =>
        teacher.id === id ? { ...teacher, ...updatedData } : teacher
      )
    );
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev: T[]) => prev.filter((teacher) => teacher.id !== id));
  };

  const handleCancelEdit = (
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    initialFormData: any
  ) => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  return {
    handleAddTeacher,
    handleEditTeacher,
    handleUpdateTeacher,
    handleDeleteTeacher,
    handleCancelEdit
  };
};

/**
 * 科目追加・更新用の共通ハンドラー
 */
export const createSubjectHandlers = (
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>
) => {
  const handleAddSubject = (
    newSubject: Omit<Subject, 'id'>,
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    initialFormData: any
  ) => {
    const subjectWithId: Subject = {
      ...newSubject,
      id: `s${Date.now()}`
    };
    
    setSubjects((prev) => [...prev, subjectWithId]);
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditSubject = (
    subject: Subject,
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setFormData(subject);
    setIsEditing(true);
    setEditingId(subject.id);
  };

  const handleUpdateSubject = (
    id: string,
    updatedData: Omit<Subject, 'id'>,
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    initialFormData: any
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, ...updatedData } : subject
      )
    );
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
  };

  const handleCancelEdit = (
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    initialFormData: any
  ) => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
  };

  return {
    handleAddSubject,
    handleEditSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    handleCancelEdit
  };
};

/**
 * 共通テーブルコンポーネントProps
 */
export interface CommonTableProps<T> {
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  renderRow: (item: T) => React.ReactNode;
  headers: string[];
}