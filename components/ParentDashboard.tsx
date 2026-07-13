import React, { useState, useEffect } from 'react';
import { Student, Topic, Exam, Question, Result, Subject, Grade, GiftConfig, GiftRedemption } from '../types';
import { api } from '../services/api';
import { StudentAvatar } from './StudentAvatar';
import {
  Users,
  BookOpen,
  Zap,
  Cpu,
  History,
  Plus,
  Trash2,
  Copy,
  Edit3,
  LogOut,
  Save,
  Check,
  FileText,
  AlertCircle,
  HelpCircle,
  Search,
  Upload,
  Sparkles,
  Award,
  Settings
} from 'lucide-react';

interface ParentDashboardProps {
  onLogout: () => void;
}

const AVATAR_OPTIONS = ['👧', '👦', '🦊', '🐻', '🦁', '🐱', '🐶', '🦄', '🐼', '🦖'];

export default function ParentDashboard({ onLogout }: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'exams' | 'quick-import' | 'ai-import' | 'logs' | 'auto-generate' | 'grades-subjects' | 'gifts'>('students');

  // State data list
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [selectedStudentStatId, setSelectedStudentStatId] = useState<string>('all');
  const [statSubTab, setStatSubTab] = useState<'dashboard' | 'history'>('dashboard');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  // Gifts & Redemptions management states
  const [gifts, setGifts] = useState<GiftConfig[]>([]);
  const [redemptions, setRedemptions] = useState<GiftRedemption[]>([]);
  const [newGiftForm, setNewGiftForm] = useState({ name: '', pointsCost: 100, icon: '🎁' });
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [editGiftForm, setEditGiftForm] = useState({ name: '', pointsCost: 100, icon: '🎁' });

  // Forms states
  const [newStudent, setNewStudent] = useState({ name: '', grade: 1, avatar: '👧', password: '' });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({ name: '', grade: 1, avatar: '👧', password: '' });
  const [dragActive, setDragActive] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', subjectId: 'sub_math', icon: 'BookOpen', grade: 1 });
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Dynamic Grade & Subject management form state
  const [newGradeForm, setNewGradeForm] = useState({ level: '', name: '' });
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editGradeForm, setEditGradeForm] = useState({ level: '', name: '' });

  const [newSubjectForm, setNewSubjectForm] = useState({ name: '', icon: 'BookOpen' });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ name: '', icon: 'BookOpen' });

  // Auto-generation state
  const [autoGenForm, setAutoGenForm] = useState({
    name: 'Đề ôn tập tổng hợp ngẫu nhiên',
    topicIds: [] as string[],
    questionCount: 5,
    difficulties: ['easy', 'medium', 'hard'] as ('easy' | 'medium' | 'hard')[],
    assignedStudentId: '',
    deadline: '',
  });
  const [isGeneratingAuto, setIsGeneratingAuto] = useState(false);
  const [autoGenGradeFilter, setAutoGenGradeFilter] = useState<'all' | number>('all');
  const [autoGenSubjectFilter, setAutoGenSubjectFilter] = useState<'all' | string>('all');

  // Exam Creator form
  const [showExamCreator, setShowExamCreator] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    name: '',
    topicId: '',
    description: '',
    grade: 1,
    questions: [] as any[],
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    assignedStudentId: '',
    deadline: '',
    questionCount: 5,
  });

  // Quick import state
  const [quickImportText, setQuickImportText] = useState(
    `5+8=?\nA.12\nB.13\nC.14\nD.15\nĐáp án:B\n\n15+7=22\n18+5=23`
  );
  const [quickImportForm, setQuickImportForm] = useState({
    name: 'Đề Toán ôn luyện nhanh',
    topicId: '',
    grade: 1 as 1 | 2,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    assignedStudentId: '',
    deadline: '',
  });

  // AI generator state
  const [aiPrompt, setAiPrompt] = useState('Tự động tạo bộ đề tiếng Việt lớp 2 về phân biệt "ch" hay "tr" có ví dụ sinh động và các từ vui vẻ.');
  const [aiForm, setAiForm] = useState({
    name: 'Đề Tiếng Việt sinh bởi AI',
    topicId: '',
    grade: 2 as 1 | 2,
    questionCount: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    assignedStudentId: '',
    deadline: '',
  });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // General message feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, tData, eData, rData, subjData, grData, giftsData, redemptionsData] = await Promise.all([
        api.getStudents(),
        api.getTopics(),
        api.getExams(),
        api.getAllResults(),
        api.getSubjects(),
        api.getGrades(),
        api.getGifts(),
        api.getRedemptions(),
      ]);
      setStudents(sData);
      setTopics(tData);
      setExams(eData);
      setResults(rData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSubjects(subjData);
      setGrades(grData);
      setGifts(giftsData);
      setRedemptions(redemptionsData.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
      
      if (tData.length > 0) {
        setSelectedTopicId(tData[0].id);
        setQuickImportForm((prev) => ({ ...prev, topicId: tData[0].id }));
        setAiForm((prev) => ({ ...prev, topicId: tData[0].id }));
      }
      
      // Update form default values if they are loaded
      if (subjData.length > 0) {
        setNewTopic(prev => ({ ...prev, subjectId: subjData[0].id }));
      }
      if (grData.length > 0) {
        setNewTopic(prev => ({ ...prev, grade: grData[0].level }));
        setNewStudent(prev => ({ ...prev, grade: grData[0].level }));
      }
    } catch (err: any) {
      showMsg('error', err.message || 'Không thể lấy dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Student Actions
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim()) return;
    try {
      await api.createStudent(newStudent);
      setNewStudent({ name: '', grade: 1, avatar: '👧', password: '' });
      setShowAddStudentForm(false);
      showMsg('success', 'Đã thêm học sinh mới thành công!');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId || !editStudentForm.name.trim()) return;
    try {
      await api.updateStudent(editingStudentId, editStudentForm);
      setEditingStudentId(null);
      showMsg('success', 'Đã cập nhật thông tin học sinh thành công!');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // === GIFT & REDEMPTION ACTIONS ===
  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftForm.name.trim() || newGiftForm.pointsCost <= 0) return;
    try {
      await api.createGift(newGiftForm);
      setNewGiftForm({ name: '', pointsCost: 100, icon: '🎁' });
      showMsg('success', 'Đã thêm phần quà mới thành công!');
      const updated = await api.getGifts();
      setGifts(updated);
    } catch (err: any) {
      showMsg('error', err.message || 'Không thể tạo phần quà.');
    }
  };

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGiftId || !editGiftForm.name.trim() || editGiftForm.pointsCost <= 0) return;
    try {
      await api.updateGift(editingGiftId, editGiftForm);
      setEditingGiftId(null);
      showMsg('success', 'Cập nhật quà tặng thành công!');
      const updated = await api.getGifts();
      setGifts(updated);
    } catch (err: any) {
      showMsg('error', err.message || 'Không thể cập nhật quà tặng.');
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phần quà này không?')) return;
    try {
      await api.deleteGift(id);
      showMsg('success', 'Đã xóa phần quà thành công!');
      const updated = await api.getGifts();
      setGifts(updated);
    } catch (err: any) {
      showMsg('error', err.message || 'Không thể xóa quà.');
    }
  };

  const handleProcessRedemption = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.processRedemption(id, status);
      showMsg('success', status === 'approved' ? 'Đã duyệt phê duyệt quà thành công!' : 'Đã từ chối và hoàn điểm cho bé!');
      const [updatedRedemptions, updatedStudents] = await Promise.all([
        api.getRedemptions(),
        api.getStudents(),
      ]);
      setRedemptions(updatedRedemptions.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
      setStudents(updatedStudents);
    } catch (err: any) {
      showMsg('error', err.message || 'Lỗi khi xử lý yêu cầu đổi quà.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isEdit: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0], isEdit);
    }
  };

  const handleImageFile = (file: File, isEdit: boolean) => {
    if (!file.type.startsWith('image/')) {
      showMsg('error', 'Vui lòng tải tệp tin định dạng hình ảnh!');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (isEdit) {
        setEditStudentForm(prev => ({ ...prev, avatar: base64 }));
      } else {
        setNewStudent(prev => ({ ...prev, avatar: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này và toàn bộ dữ liệu lịch sử thi của bé?')) return;
    try {
      await api.deleteStudent(id);
      showMsg('success', 'Đã xóa học sinh thành công.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Grade Actions
  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeForm.level || !newGradeForm.name.trim()) {
      showMsg('error', 'Vui lòng điền đầy đủ cấp lớp và tên lớp.');
      return;
    }
    try {
      await api.createGrade({
        level: Number(newGradeForm.level),
        name: newGradeForm.name.trim()
      });
      setNewGradeForm({ level: '', name: '' });
      showMsg('success', 'Đã thêm lớp học mới thành công!');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGradeId) return;
    if (!editGradeForm.level || !editGradeForm.name.trim()) {
      showMsg('error', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    try {
      await api.updateGrade(editingGradeId, {
        level: Number(editGradeForm.level),
        name: editGradeForm.name.trim()
      });
      setEditingGradeId(null);
      showMsg('success', 'Đã cập nhật lớp học thành công!');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học này? Tất cả học sinh thuộc lớp này sẽ không đổi lớp trừ khi bạn chỉnh sửa thủ công.')) return;
    try {
      await api.deleteGrade(id);
      showMsg('success', 'Đã xóa lớp học thành công.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Subject Actions
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectForm.name.trim()) {
      showMsg('error', 'Vui lòng điền tên môn học.');
      return;
    }
    try {
      await api.createSubject({
        name: newSubjectForm.name.trim(),
        icon: newSubjectForm.icon
      });
      setNewSubjectForm({ name: '', icon: 'BookOpen' });
      showMsg('success', 'Đã thêm môn học mới thành công!');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubjectId) return;
    if (!editSubjectForm.name.trim()) {
      showMsg('error', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    try {
      await api.updateSubject(editingSubjectId, {
        name: editSubjectForm.name.trim(),
        icon: editSubjectForm.icon
      });
      setEditingSubjectId(null);
      showMsg('success', 'Đã cập nhật môn học thành công!');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('CẢNH BÁO: Xóa môn học này sẽ xóa toàn bộ các chuyên đề, đề thi và câu hỏi thuộc môn học này! Bạn có chắc chắn muốn xóa?')) return;
    try {
      await api.deleteSubject(id);
      showMsg('success', 'Đã xóa môn học thành công.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Topic Actions
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.name.trim()) return;
    try {
      await api.createTopic(newTopic);
      setNewTopic({ name: '', subjectId: 'sub_math', icon: 'BookOpen', grade: 1 });
      showMsg('success', 'Đã tạo chuyên đề mới.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!window.confirm('Xóa chuyên đề sẽ xóa sạch các đề thi và câu hỏi bên trong chuyên đề đó. Bạn có chắc chắn?')) return;
    try {
      await api.deleteTopic(id);
      showMsg('success', 'Đã xóa chuyên đề.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Exam creation & question editor actions
  const openExamCreator = async (examToEdit?: Exam) => {
    if (examToEdit) {
      try {
        const fullExam = await api.getExamById(examToEdit.id);
        setEditingExamId(examToEdit.id);
        setExamForm({
          name: fullExam.name,
          topicId: fullExam.topicId,
          description: fullExam.description,
          grade: fullExam.grade,
          questions: fullExam.questions,
          difficulty: fullExam.difficulty || 'medium',
          assignedStudentId: fullExam.assignedStudentId || '',
          deadline: fullExam.deadline || '',
          questionCount: fullExam.questionCount || fullExam.questions.length,
        });
      } catch (err: any) {
        showMsg('error', 'Không thể mở trình sửa đề.');
        return;
      }
    } else {
      setEditingExamId(null);
      setExamForm({
        name: '',
        topicId: topics[0]?.id || '',
        description: '',
        grade: 1,
        questions: [
          {
            type: 'multiple-choice',
            content: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            explanation: '',
          },
        ],
        difficulty: 'medium',
        assignedStudentId: '',
        deadline: '',
        questionCount: 5,
      });
    }
    setShowExamCreator(true);
  };

  const handleAddQuestionToForm = () => {
    setExamForm({
      ...examForm,
      questions: [
        ...examForm.questions,
        {
          type: 'multiple-choice',
          content: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          explanation: '',
        },
      ],
    });
  };

  const handleRemoveQuestionFromForm = (idx: number) => {
    const list = [...examForm.questions];
    list.splice(idx, 1);
    setExamForm({ ...examForm, questions: list });
  };

  const handleQuestionChange = (idx: number, field: string, val: any) => {
    const list = [...examForm.questions];
    list[idx] = { ...list[idx], [field]: val };
    setExamForm({ ...examForm, questions: list });
  };

  const handleSaveExam = async () => {
    if (!examForm.name.trim() || !examForm.topicId) {
      alert('Vui lòng điền tên bộ đề và chọn chuyên đề.');
      return;
    }
    try {
      if (editingExamId) {
        await api.updateExam(editingExamId, examForm);
        showMsg('success', 'Đã cập nhật đề thi thành công!');
      } else {
        await api.createExam(examForm);
        showMsg('success', 'Đã tạo đề thi mới thành công!');
      }
      setShowExamCreator(false);
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ đề thi này?')) return;
    try {
      await api.deleteExam(id);
      showMsg('success', 'Đã xóa bộ đề thi.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleDuplicateExam = async (id: string) => {
    try {
      await api.duplicateExam(id);
      showMsg('success', 'Đã nhân bản bộ đề thi thành công.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Quick import action
  const handleQuickImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickImportForm.topicId || !quickImportText.trim()) return;
    try {
      await api.importQuick({
        ...quickImportForm,
        text: quickImportText,
      });
      showMsg('success', 'Đã nhận diện cú pháp và nhập đề thi thành công!');
      setQuickImportText('');
      setActiveTab('exams');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // AI builder generator action
  const handleAiImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiForm.topicId || !aiPrompt.trim()) return;
    
    setIsAiGenerating(true);
    setAiSuccessMessage(null);
    try {
      const res = await api.importAI({
        name: aiForm.name,
        topicId: aiForm.topicId,
        grade: aiForm.grade,
        sourceText: aiPrompt,
        questionCount: aiForm.questionCount,
        difficulty: aiForm.difficulty,
        assignedStudentId: aiForm.assignedStudentId,
        deadline: aiForm.deadline,
      });
      
      setAiSuccessMessage(`Đã sinh bộ đề thi "${res.exam.name}" thành công với ${res.exam.questions.length} câu hỏi đạt chuẩn giáo dục tiểu học!`);
      showMsg('success', 'AI đã sinh đề thi thành công.');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Auto-generate action
  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (autoGenForm.topicIds.length === 0) {
      alert('Vui lòng chọn ít nhất một chuyên đề học tập để lấy câu hỏi.');
      return;
    }
    if (autoGenForm.difficulties.length === 0) {
      alert('Vui lòng chọn ít nhất một mức độ khó.');
      return;
    }
    
    setIsGeneratingAuto(true);
    try {
      const res = await api.autoGenerate({
        name: autoGenForm.name,
        topicIds: autoGenForm.topicIds,
        questionCount: autoGenForm.questionCount,
        difficulties: autoGenForm.difficulties,
        assignedStudentId: autoGenForm.assignedStudentId || undefined,
        deadline: autoGenForm.deadline || undefined,
      });
      
      showMsg('success', `Đã tự động soạn đề "${res.exam.name}" thành công với ${res.exam.questionCount || res.exam.questions?.length} câu hỏi ngẫu nhiên!`);
      setAutoGenForm({
        name: 'Đề ôn tập tổng hợp ngẫu nhiên',
        topicIds: [],
        questionCount: 5,
        difficulties: ['easy', 'medium', 'hard'],
        assignedStudentId: '',
        deadline: '',
      });
      setActiveTab('exams');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message || 'Có lỗi xảy ra khi tự động soạn đề.');
    } finally {
      setIsGeneratingAuto(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      
      {/* Top Banner Dashboard header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 rounded-3xl p-6 text-white mb-8 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
            <Cpu className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-display font-black tracking-tight">CỔNG BỐ MẸ QUẢN TRỊ 🔐</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cơ sở dữ liệu & Quản lý đề ôn hè</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" /> Khóa cổng & Đăng xuất
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-sm font-bold text-center mb-6 border animate-pop ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? '✅ ' : '⚠️ '} {statusMsg.text}
        </div>
      )}

      {/* Main Grid: Tabs Sidebar & Working Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => { setActiveTab('students'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> Học sinh trong gia đình 👧
          </button>

          <button
            onClick={() => { setActiveTab('exams'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Đề thi & Chuyên đề 📝
          </button>

          <button
            onClick={() => { setActiveTab('auto-generate'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'auto-generate' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> Soạn đề tự động 🎲
          </button>

          <button
            onClick={() => { setActiveTab('quick-import'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'quick-import' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" /> Nhập đề cực nhanh ⚡
          </button>

          <button
            onClick={() => { setActiveTab('ai-import'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'ai-import' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-500 animate-bounce" /> AI Tự thiết kế đề thi 🤖
          </button>

          <button
            onClick={() => { setActiveTab('logs'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'logs' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <History className="w-4 h-4" /> Nhật ký & Thống kê 📈
          </button>

          <button
            onClick={() => { setActiveTab('grades-subjects'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'grades-subjects' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" /> Lớp & Môn học 🏫
          </button>

          <button
            onClick={() => { setActiveTab('gifts'); setShowExamCreator(false); }}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left ${
              activeTab === 'gifts' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-500" /> Quản lý đổi quà ⭐
            {redemptions.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse ml-auto">
                {redemptions.filter(r => r.status === 'pending').length} Yêu cầu
              </span>
            )}
          </button>
        </div>

        {/* Working Arena */}
        <div className="lg:col-span-9 bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-xs">
          
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-400 mx-auto mb-4" />
              Đang đồng bộ cơ sở dữ liệu...
            </div>
          ) : (
            <>
              {/* TAB 1: STUDENTS MANAGEMENT */}
              {activeTab === 'students' && (
                <div className="space-y-8 animate-pop">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-slate-800">Quản lý học sinh gia đình</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Thêm, sửa đổi hoặc xóa thông tin các con</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddStudentForm(!showAddStudentForm);
                          setEditingStudentId(null);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all ${
                          showAddStudentForm
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {showAddStudentForm ? (
                          <>✕ Đóng lại</>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Thêm bé ngay
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {students.map((student) => (
                        <div key={student.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all">
                          <div className="flex items-center gap-3">
                            <StudentAvatar avatar={student.avatar} className="w-14 h-14" />
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-800 text-base">{student.name}</h4>
                                {student.password && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    🔑 Khóa
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-bold">
                                Lớp {student.grade} ôn hè • ⭐ {student.points}đ • 🔥 {student.streak} ngày
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingStudentId(student.id);
                                setEditStudentForm({
                                  name: student.name,
                                  grade: student.grade as 1 | 2,
                                  avatar: student.avatar,
                                  password: student.password || '',
                                });
                                setShowAddStudentForm(false);
                              }}
                              className="text-slate-400 hover:text-blue-600 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin bé"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Xóa bé"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit Student Form */}
                  {editingStudentId && (
                    <div className="bg-amber-50/40 p-6 rounded-2xl border-2 border-amber-200/60 text-left animate-pop">
                      <h3 className="text-base font-bold text-amber-900 mb-4 flex items-center gap-1.5">
                        <span>📝</span> Chỉnh sửa thông tin bé: <span className="font-extrabold text-slate-800">{editStudentForm.name}</span>
                      </h3>
                      <form onSubmit={handleUpdateStudent} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tên của con:</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Bé An, Bé Na"
                              value={editStudentForm.name}
                              onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-sm font-semibold focus:outline-hidden"
                            />
                          </div>

                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Lớp học hè:</label>
                            <select
                              value={editStudentForm.grade}
                              onChange={(e) => setEditStudentForm({ ...editStudentForm, grade: Number(e.target.value) as 1 | 2 })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-sm font-semibold focus:outline-hidden"
                            >
                              {grades.map(g => (
                                <option key={g.id} value={g.level}>{g.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mật khẩu của bé (Tùy chọn):</label>
                            <input
                              type="text"
                              placeholder="Để trống nếu không muốn đặt mật khẩu"
                              value={editStudentForm.password}
                              onChange={(e) => setEditStudentForm({ ...editStudentForm, password: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-sm font-semibold focus:outline-hidden"
                            />
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Con sẽ cần nhập mật khẩu này để đăng nhập vào làm bài thi.</p>
                          </div>

                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Chọn Avatar Emoji:</label>
                            <div className="grid grid-cols-5 gap-1 bg-white p-2 rounded-xl border border-slate-200">
                              {AVATAR_OPTIONS.map((av) => (
                                <button
                                  key={av}
                                  type="button"
                                  onClick={() => setEditStudentForm({ ...editStudentForm, avatar: av })}
                                  className={`text-xl p-1 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${
                                    editStudentForm.avatar === av ? 'bg-amber-100 scale-105 border border-amber-300' : ''
                                  }`}
                                >
                                  {av}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Drag and Drop File Upload Area */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Hoặc tải lên ảnh đại diện riêng của con:</label>
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={(e) => handleDrop(e, true)}
                            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                              dragActive ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-blue-400 bg-white'
                            }`}
                            onClick={() => document.getElementById('edit-avatar-upload')?.click()}
                          >
                            <input
                              type="file"
                              id="edit-avatar-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageFile(file, true);
                              }}
                            />
                            <Upload className="w-6 h-6 text-slate-400" />
                            <p className="text-xs font-bold text-slate-600">Kéo thả ảnh hoặc click để chọn tệp tin</p>
                            <p className="text-[10px] text-slate-400 font-medium">Hỗ trợ định dạng hình ảnh PNG, JPG, GIF</p>
                            
                            {/* Preview current base64 avatar */}
                            {editStudentForm.avatar.startsWith('data:') && (
                              <div className="mt-2 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <img src={editStudentForm.avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                                <span className="text-[10px] font-black text-blue-600 uppercase">Đã chọn ảnh đại diện tùy chỉnh</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditStudentForm({ ...editStudentForm, avatar: '👧' });
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold text-xs ml-2 cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Save className="w-4 h-4" /> Lưu thông tin
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Add Student inline form */}
                  {showAddStudentForm && (
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 text-left animate-pop">
                      <h3 className="text-base font-bold text-slate-800 mb-4">Tạo tài khoản học sinh mới</h3>
                      <form onSubmit={handleAddStudent} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tên của con:</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Bé An, Bé Na"
                              value={newStudent.name}
                              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-sm font-semibold focus:outline-hidden"
                            />
                          </div>

                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Lớp học hè:</label>
                            <select
                              value={newStudent.grade}
                              onChange={(e) => setNewStudent({ ...newStudent, grade: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-sm font-semibold focus:outline-hidden"
                            >
                              {grades.map(g => (
                                <option key={g.id} value={g.level}>{g.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mật khẩu của bé (Tùy chọn):</label>
                            <input
                              type="text"
                              placeholder="Để trống nếu không muốn đặt mật khẩu"
                              value={newStudent.password}
                              onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 text-sm font-semibold focus:outline-hidden"
                            />
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Con sẽ cần nhập mật khẩu này để đăng nhập vào làm bài thi.</p>
                          </div>

                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Chọn Avatar Emoji:</label>
                            <div className="grid grid-cols-5 gap-1 bg-white p-2 rounded-xl border border-slate-200">
                              {AVATAR_OPTIONS.map((av) => (
                                <button
                                  key={av}
                                  type="button"
                                  onClick={() => setNewStudent({ ...newStudent, avatar: av })}
                                  className={`text-xl p-1 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${
                                    newStudent.avatar === av ? 'bg-amber-100 scale-105 border border-amber-300' : ''
                                  }`}
                                >
                                  {av}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Drag and Drop File Upload Area */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Hoặc tải lên ảnh đại diện riêng của con:</label>
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={(e) => handleDrop(e, false)}
                            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                              dragActive ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-blue-400 bg-white'
                            }`}
                            onClick={() => document.getElementById('new-avatar-upload')?.click()}
                          >
                            <input
                              type="file"
                              id="new-avatar-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageFile(file, false);
                              }}
                            />
                            <Upload className="w-6 h-6 text-slate-400" />
                            <p className="text-xs font-bold text-slate-600">Kéo thả ảnh hoặc click để chọn tệp tin</p>
                            <p className="text-[10px] text-slate-400 font-medium">Hỗ trợ định dạng hình ảnh PNG, JPG, GIF</p>
                            
                            {/* Preview current base64 avatar */}
                            {newStudent.avatar.startsWith('data:') && (
                              <div className="mt-2 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <img src={newStudent.avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                                <span className="text-[10px] font-black text-blue-600 uppercase">Đã chọn ảnh đại diện tùy chỉnh</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewStudent({ ...newStudent, avatar: '👧' });
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold text-xs ml-2 cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-12 flex justify-end">
                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer">
                            <Plus className="w-4 h-4" /> Xác nhận thêm
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXAMS & TOPICS MASTER CRUD */}
              {activeTab === 'exams' && !showExamCreator && (
                <div className="space-y-8 animate-pop">
                  {/* Topics CRUD header */}
                  <div className="border-b border-slate-100 pb-6 text-left">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Quản lý chuyên đề học tập</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Phần học lớn Toán & Tiếng Việt</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {topics.map((t) => (
                        <div key={t.id} className="inline-flex items-center bg-slate-100 text-slate-800 px-3.5 py-1.5 rounded-full text-xs font-bold gap-1.5 border border-slate-200">
                          <span>{t.subjectId === 'sub_math' ? '🔢' : '📖'} {t.name} (Lớp {t.grade})</span>
                          <button onClick={() => handleDeleteTopic(t.id)} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Quick Add Topic */}
                    <form onSubmit={handleAddTopic} className="bg-slate-50 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Tên chuyên đề mới..."
                          value={newTopic.name}
                          onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={newTopic.subjectId}
                          onChange={(e) => setNewTopic({ ...newTopic, subjectId: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="sub_math">Toán</option>
                          <option value="sub_viet">Tiếng Việt</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={newTopic.grade}
                          onChange={(e) => setNewTopic({ ...newTopic, grade: Number(e.target.value) as 1 | 2 })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                        >
                          <option value={1}>Lớp 1</option>
                          <option value={2}>Lớp 2</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 rounded-lg text-xs cursor-pointer">
                          + Chuyên đề
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Exams CRUD List */}
                  <div className="text-left">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Bộ Đề Thi Hiện Có</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Biên soạn, nhân bản và sửa câu hỏi đề thi</p>
                      </div>
                      <button
                        onClick={() => openExamCreator()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" /> Soạn Đề Thủ Công
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {exams.map((exam) => {
                        const t = topics.find(tp => tp.id === exam.topicId);
                        return (
                          <div key={exam.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                  Lớp {exam.grade}
                                </span>
                                <h4 className="font-extrabold text-slate-800 text-base">{exam.name}</h4>
                              </div>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">Chuyên đề: {t?.name || 'Không rõ'}</p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => openExamCreator(exam)}
                                className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 p-2 rounded-xl text-xs flex items-center gap-1 font-bold"
                                title="Sửa đề"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDuplicateExam(exam.id)}
                                className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 p-2 rounded-xl text-xs flex items-center gap-1 font-bold"
                                title="Nhân bản"
                              >
                                <Copy className="w-3.5 h-3.5" /> Sao chép
                              </button>
                              <button
                                onClick={() => handleDeleteExam(exam.id)}
                                className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 p-2 rounded-xl text-xs"
                                title="Xóa đề"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2 EDIT OR CREATE WORKSPACE (Exam Creator Panel) */}
              {activeTab === 'exams' && showExamCreator && (
                <div className="space-y-6 text-left animate-pop">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800">
                      {editingExamId ? `✏️ Đang sửa đề: ${examForm.name}` : '🚀 Tạo bộ đề thi mới'}
                    </h2>
                    <button
                      onClick={() => setShowExamCreator(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                    >
                      ✕ Hủy bỏ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tên bộ đề ôn luyện:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Ôn tập phép cộng có nhớ"
                        value={examForm.name}
                        onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-semibold">Thuộc chuyên đề học:</label>
                      <select
                        value={examForm.topicId}
                        onChange={(e) => setExamForm({ ...examForm, topicId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold"
                      >
                        <option value="">-- Chọn chuyên đề --</option>
                        {topics.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Lớp {t.grade})</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-semibold">Mô tả ngắn đề thi:</label>
                      <input
                        type="text"
                        placeholder="Hãy khích lệ con bằng câu nói ngắn gọn tại đây..."
                        value={examForm.description}
                        onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-semibold">Độ tuổi / Khối học:</label>
                      <select
                        value={examForm.grade}
                        onChange={(e) => setExamForm({ ...examForm, grade: Number(e.target.value) as 1 | 2 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold"
                      >
                        <option value={1}>Lớp 1</option>
                        <option value={2}>Lớp 2</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-semibold">Mức độ khó:</label>
                      <select
                        value={examForm.difficulty || 'medium'}
                        onChange={(e) => setExamForm({ ...examForm, difficulty: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-hidden"
                      >
                        <option value="easy">🟢 Dễ</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="hard">🔴 Khó</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-semibold">Chọn bé sẽ giao bài:</label>
                      <select
                        value={examForm.assignedStudentId || ''}
                        onChange={(e) => setExamForm({ ...examForm, assignedStudentId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-hidden"
                      >
                        <option value="">👨‍👩‍👧‍👦 Giao cho tất cả các bé</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.avatar} {s.name} (Lớp {s.grade})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-semibold">Thời hạn hoàn thành:</label>
                      <input
                        type="date"
                        value={examForm.deadline || ''}
                        onChange={(e) => setExamForm({ ...examForm, deadline: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Question items lists */}
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 text-lg">Danh sách câu hỏi ({examForm.questions.length})</h3>
                      <button
                        type="button"
                        onClick={handleAddQuestionToForm}
                        className="bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Thêm câu hỏi
                      </button>
                    </div>

                    {examForm.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-4 relative animate-pop">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionFromForm(qIdx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-xs font-semibold"
                        >
                          ✕ Gỡ câu hỏi
                        </button>

                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                          Câu {qIdx + 1}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                          <div className="sm:col-span-8">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nội dung câu hỏi cho bé:</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: 12 + 5 bằng bao nhiêu?"
                              value={q.content}
                              onChange={(e) => handleQuestionChange(qIdx, 'content', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Dạng tương tác:</label>
                            <select
                              value={q.type}
                              onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold"
                            >
                              <option value="multiple-choice">Trắc nghiệm (4 lựa chọn)</option>
                              <option value="text-input">Điền ô trống (Chữ/Số)</option>
                              <option value="true-false">Đúng / Sai</option>
                              <option value="spelling">Điền vần (Chính tả)</option>
                              <option value="word-match">Chọn từ ghép / Đáp án từ ngữ</option>
                              <option value="image-choice">Chọn hình vẽ (Biểu tượng)</option>
                              <option value="word-order">Sắp xếp từ thành câu</option>
                              <option value="drag-drop">Kéo thả ghép chữ</option>
                              <option value="matching">Nối cột hình ảnh/từ ngữ</option>
                              <option value="reading-comprehension">Đọc hiểu đoạn văn</option>
                            </select>
                          </div>

                          {/* Reading passage if Reading Comprehension */}
                          {q.type === 'reading-comprehension' && (
                            <div className="sm:col-span-12">
                              <label className="block text-xs font-bold text-amber-600 mb-1">Đoạn văn / Truyện nhỏ tập đọc cho con:</label>
                              <textarea
                                required
                                rows={3}
                                placeholder="Nhập câu chuyện nhỏ để bé đọc trước khi trả lời câu hỏi bên trên..."
                                value={q.readingText || ''}
                                onChange={(e) => handleQuestionChange(qIdx, 'readingText', e.target.value)}
                                className="w-full bg-amber-50/30 border border-amber-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                          )}

                          {/* Options grid if multiple-choice, spelling, word-match, image-choice, word-order, drag-drop, matching */}
                          {(q.type === 'multiple-choice' || 
                            q.type === 'spelling' || 
                            q.type === 'word-match' || 
                            q.type === 'image-choice' || 
                            q.type === 'word-order' || 
                            q.type === 'drag-drop' || 
                            q.type === 'matching') && (
                            <div className="sm:col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[0, 1, 2, 3].map((optIdx) => (
                                <div key={optIdx}>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                                    {q.type === 'image-choice' 
                                      ? `Hình/Emoji ${optIdx + 1}:` 
                                      : q.type === 'matching'
                                      ? `Giá trị Cột Trái ${optIdx + 1}:`
                                      : `Từ lựa chọn ${optIdx + 1}:`}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={
                                      q.type === 'image-choice' 
                                        ? 'Ví dụ: 🍎' 
                                        : q.type === 'matching'
                                        ? 'Ví dụ: apple'
                                        : `Lựa chọn ${optIdx + 1}`
                                    }
                                    value={q.options?.[optIdx] || ''}
                                    onChange={(e) => {
                                      const opts = [...(q.options || ['', '', '', ''])];
                                      opts[optIdx] = e.target.value;
                                      handleQuestionChange(qIdx, 'options', opts);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                                  />
                                </div>
                              ))}
                              
                              {/* Extra guide text depending on type */}
                              <p className="col-span-full text-[10px] text-slate-400 font-medium italic mt-1">
                                {q.type === 'image-choice' && '* Gợi ý: Ba mẹ nên nhập các Emoji ngộ nghĩnh (ví dụ: 🐯, 🍉, 🎈, 🚗) để con dễ lựa chọn.'}
                                {q.type === 'word-order' && '* Gợi ý: Ba mẹ có thể nhập các từ riêng lẻ ở các ô trên, hoặc để trống để hệ thống tự động tách từ nội dung câu hỏi.'}
                                {q.type === 'matching' && '* Gợi ý: Với dạng nối, các ô trên là cột trái. Hãy nhập thêm các cặp nối tương ứng (Cột Trái - Cột Phải) ở phần Đáp án bên dưới.'}
                              </p>
                            </div>
                          )}

                          <div className="sm:col-span-6">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Đáp án đúng tuyệt đối (Viết hoa khớp chữ):</label>
                            <input
                              type="text"
                              required
                              placeholder="Nhập chữ cái của đáp án hoặc từ cụ thể"
                              value={q.correctAnswer}
                              onChange={(e) => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold"
                            />
                          </div>

                          <div className="sm:col-span-6">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Giải thích ngộ nghĩnh cho con:</label>
                            <input
                              type="text"
                              placeholder="Chúc mừng bé! 5 cộng 3 bằng 8 búp bê..."
                              value={q.explanation || ''}
                              onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Creator operations bottom */}
                  <div className="flex gap-4 pt-6 border-t border-slate-100 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowExamCreator(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-6 py-3 rounded-xl text-xs cursor-pointer"
                    >
                      Hủy bỏ thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveExam}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-md"
                    >
                      <Save className="w-4 h-4" /> Lưu và phát hành đề ôn
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: QUICK TEXT IMPORT */}
              {activeTab === 'quick-import' && (
                <div className="space-y-6 text-left animate-pop">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Nhập đề cực nhanh bằng văn bản ⚡</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Tiết kiệm thời gian gõ bằng cú pháp nhận diện tự động
                    </p>
                  </div>

                  <form onSubmit={handleQuickImport} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tên đề thi:</label>
                        <input
                          type="text"
                          required
                          value={quickImportForm.name}
                          onChange={(e) => setQuickImportForm({ ...quickImportForm, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Chọn chuyên đề:</label>
                        <select
                          value={quickImportForm.topicId}
                          onChange={(e) => setQuickImportForm({ ...quickImportForm, topicId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        >
                          <option value="">-- Chọn chuyên đề --</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Lớp {t.grade})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Khối lớp học:</label>
                        <select
                          value={quickImportForm.grade}
                          onChange={(e) => setQuickImportForm({ ...quickImportForm, grade: Number(e.target.value) as 1 | 2 })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        >
                          <option value={1}>Lớp 1</option>
                          <option value={2}>Lớp 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mức độ khó:</label>
                        <select
                          value={quickImportForm.difficulty}
                          onChange={(e) => setQuickImportForm({ ...quickImportForm, difficulty: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="easy">🟢 Dễ</option>
                          <option value="medium">🟡 Trung bình</option>
                          <option value="hard">🔴 Khó</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Chọn bé sẽ giao bài:</label>
                        <select
                          value={quickImportForm.assignedStudentId}
                          onChange={(e) => setQuickImportForm({ ...quickImportForm, assignedStudentId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="">👨‍👩‍👧‍👦 Giao cho tất cả các bé</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.avatar} {s.name} (Lớp {s.grade})</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Thời hạn hoàn thành:</label>
                        <input
                          type="date"
                          value={quickImportForm.deadline}
                          onChange={(e) => setQuickImportForm({ ...quickImportForm, deadline: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dán văn bản đề thi:</label>
                      <textarea
                        rows={10}
                        required
                        placeholder="Dán các dòng tự nhiên tại đây..."
                        value={quickImportText}
                        onChange={(e) => setQuickImportText(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-mono focus:outline-hidden focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    {/* Syntax instruction guidelines */}
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs space-y-2 text-slate-600">
                      <p className="font-bold text-slate-800 flex items-center gap-1">💡 Hướng dẫn định dạng hỗ trợ:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Dạng Toán tự luận/điền số:</strong> <code>15+7=22</code> (Hệ thống tự động chuyển thành câu đố điền số trống).</li>
                        <li><strong>Dạng trắc nghiệm:</strong> Viết câu hỏi kết thúc bằng dấu chấm hỏi (?), theo sau là các đáp án A., B., C., D. và dòng Đáp án.</li>
                      </ul>
                      <pre className="bg-slate-950 text-slate-200 p-3 rounded-xl mt-2 overflow-x-auto text-[10px] font-mono leading-relaxed">
{`Ví dụ trắc nghiệm:
5+8=?
A.12
B.13
C.14
D.15
Đáp án:B`}
                      </pre>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1">
                        <Zap className="w-4 h-4" /> Nhận Diện & Import Đề Thi Ngay
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: AI EXAM GENERATOR (Gemini API Integration) */}
              {activeTab === 'ai-import' && (
                <div className="space-y-6 text-left animate-pop">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Cpu className="w-6 h-6 text-amber-500 animate-pulse" /> AI Tự Động Biên Soạn Đề Thi 🤖
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Sử dụng trí tuệ nhân tạo Gemini để sinh câu hỏi bám sát chương trình học
                    </p>
                  </div>

                  {aiSuccessMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 flex items-center gap-3">
                      <Check className="w-6 h-6 text-emerald-500" />
                      <div>
                        <p className="font-extrabold">{aiSuccessMessage}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Con đã có thể bắt đầu ôn luyện bộ đề thi này ở ngoài màn hình chính của bé!</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleAiImport} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tên đề thi muốn tạo:</label>
                        <input
                          type="text"
                          required
                          value={aiForm.name}
                          onChange={(e) => setAiForm({ ...aiForm, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Chọn chuyên đề đích:</label>
                        <select
                          value={aiForm.topicId}
                          onChange={(e) => setAiForm({ ...aiForm, topicId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        >
                          <option value="">-- Chọn chuyên đề --</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Lớp {t.grade})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Khối lớp học tập:</label>
                        <select
                          value={aiForm.grade}
                          onChange={(e) => setAiForm({ ...aiForm, grade: Number(e.target.value) as 1 | 2 })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        >
                          <option value={1}>Lớp 1</option>
                          <option value={2}>Lớp 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Số lượng câu:</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={aiForm.questionCount}
                          onChange={(e) => setAiForm({ ...aiForm, questionCount: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          placeholder="Nhập số câu (ví dụ: 5)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mức độ khó:</label>
                        <select
                          value={aiForm.difficulty}
                          onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        >
                          <option value="easy">🟢 Dễ</option>
                          <option value="medium">🟡 Trung bình</option>
                          <option value="hard">🔴 Khó</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Giao bài cho bé:</label>
                        <select
                          value={aiForm.assignedStudentId}
                          onChange={(e) => setAiForm({ ...aiForm, assignedStudentId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        >
                          <option value="">👨‍👩‍👧‍👦 Giao cho tất cả các bé</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.avatar} {s.name} (Lớp {s.grade})</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Thời hạn hoàn thành:</label>
                        <input
                          type="date"
                          value={aiForm.deadline}
                          onChange={(e) => setAiForm({ ...aiForm, deadline: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mô tả chủ đề hoặc ý tưởng đề thi (AI sẽ soạn bài bám sát yêu cầu này):</label>
                      <textarea
                        rows={6}
                        required
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-medium focus:outline-hidden focus:border-blue-500 leading-relaxed"
                        placeholder="Hãy tạo một bộ đề toán ôn hè ngẫu nhiên lớp 2 về bảng cửu chương nhân 5..."
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed">
                      <p className="font-bold text-amber-800 flex items-center gap-1">🌟 Tính năng thông minh từ Gemini:</p>
                      <p className="mt-1">
                        Hệ thống tự động biên soạn các dạng câu hỏi bám sát chương trình giáo dục phổ thông mới của Việt Nam, bao gồm câu hỏi trắc nghiệm, điền số trống, đúng sai, chính tả vui tươi có lời khen ngộ nghĩnh đi kèm.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isAiGenerating}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold px-6 py-3.5 rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                        {isAiGenerating ? 'AI Đang Biên Soạn Đề Thi (Chờ một lát)...' : 'AI Thiết Kế Bộ Đề Ngay'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: AUTO-GENERATE */}
              {activeTab === 'auto-generate' && (
                <div className="space-y-6 text-left animate-pop">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Tự Động Soạn Đề Ngẫu Nhiên 🎲</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Hệ thống tự động chọn ngẫu nhiên các câu hỏi từ các chuyên đề được lựa chọn
                    </p>
                  </div>

                  <form onSubmit={handleAutoGenerate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Settings */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tên đề thi tự động:</label>
                          <input
                            type="text"
                            required
                            value={autoGenForm.name}
                            onChange={(e) => setAutoGenForm({ ...autoGenForm, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-blue-500"
                            placeholder="Ví dụ: Đề tổng hợp ôn luyện cuối tuần"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Số lượng câu hỏi:</label>
                            <input
                              type="number"
                              required
                              min={1}
                              max={30}
                              value={autoGenForm.questionCount}
                              onChange={(e) => setAutoGenForm({ ...autoGenForm, questionCount: Math.max(1, Number(e.target.value)) })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-blue-500"
                              placeholder="Nhập số câu (ví dụ: 10)"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mức độ khó (Chọn nhiều):</label>
                            <div className="flex gap-2">
                              {[
                                { val: 'easy', label: '🟢 Dễ' },
                                { val: 'medium', label: '🟡 T.Bình' },
                                { val: 'hard', label: '🔴 Khó' }
                              ].map((item) => {
                                const isChecked = autoGenForm.difficulties.includes(item.val as any);
                                return (
                                  <button
                                    key={item.val}
                                    type="button"
                                    onClick={() => {
                                      let updated = [...autoGenForm.difficulties];
                                      if (isChecked) {
                                        if (updated.length > 1) {
                                          updated = updated.filter(d => d !== item.val);
                                        } else {
                                          alert('Vui lòng chọn ít nhất một mức độ khó!');
                                          return;
                                        }
                                      } else {
                                        updated.push(item.val as any);
                                      }
                                      setAutoGenForm({ ...autoGenForm, difficulties: updated });
                                    }}
                                    className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                      isChecked
                                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-extrabold shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Giao bài cho con:</label>
                          <select
                            value={autoGenForm.assignedStudentId}
                            onChange={(e) => setAutoGenForm({ ...autoGenForm, assignedStudentId: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-blue-500"
                          >
                            <option value="">👨‍👩‍👧‍👦 Tất cả các bé (Không giới hạn)</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.avatar} {s.name} (Lớp {s.grade})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Thời hạn hoàn thành:</label>
                          <input
                            type="date"
                            value={autoGenForm.deadline}
                            onChange={(e) => setAutoGenForm({ ...autoGenForm, deadline: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Right: Topic Selectors */}
                      <div className="flex flex-col space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            Lọc Chuyên Đề:
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Lớp:</label>
                              <select
                                value={autoGenGradeFilter}
                                onChange={(e) => {
                                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                  setAutoGenGradeFilter(val);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                              >
                                <option value="all">📚 Tất cả các lớp</option>
                                {grades.map(g => (
                                  <option key={g.id} value={g.level}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Môn học:</label>
                              <select
                                value={autoGenSubjectFilter}
                                onChange={(e) => setAutoGenSubjectFilter(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                              >
                                <option value="all">🎨 Tất cả các môn</option>
                                {subjects.map(s => (
                                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Chọn chuyên đề ({
                                topics.filter((t) => {
                                  const matchesGrade = autoGenGradeFilter === 'all' || t.grade === Number(autoGenGradeFilter);
                                  const matchesSubject = autoGenSubjectFilter === 'all' || t.subjectId === autoGenSubjectFilter;
                                  return matchesGrade && matchesSubject;
                                }).length
                              } chuyên đề hiển thị):
                            </label>
                            {topics.filter((t) => {
                              const matchesGrade = autoGenGradeFilter === 'all' || t.grade === Number(autoGenGradeFilter);
                              const matchesSubject = autoGenSubjectFilter === 'all' || t.subjectId === autoGenSubjectFilter;
                              return matchesGrade && matchesSubject;
                            }).length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = topics.filter((t) => {
                                    const matchesGrade = autoGenGradeFilter === 'all' || t.grade === Number(autoGenGradeFilter);
                                    const matchesSubject = autoGenSubjectFilter === 'all' || t.subjectId === autoGenSubjectFilter;
                                    return matchesGrade && matchesSubject;
                                  });
                                  const filteredIds = filtered.map(t => t.id);
                                  const allChecked = filteredIds.every(id => autoGenForm.topicIds.includes(id));
                                  
                                  if (allChecked) {
                                    // Deselect all filtered
                                    setAutoGenForm({
                                      ...autoGenForm,
                                      topicIds: autoGenForm.topicIds.filter(id => !filteredIds.includes(id))
                                    });
                                  } else {
                                    // Select all filtered (union)
                                    const combined = Array.from(new Set([...autoGenForm.topicIds, ...filteredIds]));
                                    setAutoGenForm({
                                      ...autoGenForm,
                                      topicIds: combined
                                    });
                                  }
                                }}
                                className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-tight flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {(() => {
                                  const filtered = topics.filter((t) => {
                                    const matchesGrade = autoGenGradeFilter === 'all' || t.grade === Number(autoGenGradeFilter);
                                    const matchesSubject = autoGenSubjectFilter === 'all' || t.subjectId === autoGenSubjectFilter;
                                    return matchesGrade && matchesSubject;
                                  });
                                  const filteredIds = filtered.map(t => t.id);
                                  const allChecked = filteredIds.every(id => autoGenForm.topicIds.includes(id));
                                  return allChecked ? '❌ Bỏ chọn tất cả' : '✅ Chọn tất cả';
                                })()}
                              </button>
                            )}
                          </div>

                          <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex-1 overflow-y-auto max-h-[250px] space-y-2">
                            {(() => {
                              const filtered = topics.filter((t) => {
                                const matchesGrade = autoGenGradeFilter === 'all' || t.grade === Number(autoGenGradeFilter);
                                const matchesSubject = autoGenSubjectFilter === 'all' || t.subjectId === autoGenSubjectFilter;
                                return matchesGrade && matchesSubject;
                              });

                              if (filtered.length === 0) {
                                return (
                                  <p className="text-xs text-slate-400 font-bold text-center py-10">
                                    Không tìm thấy chuyên đề học tập phù hợp với bộ lọc đã chọn.
                                  </p>
                                );
                              }

                              return filtered.map((t) => {
                                const isChecked = autoGenForm.topicIds.includes(t.id);
                                return (
                                  <label
                                    key={t.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-blue-50/55 border-blue-400 shadow-xs'
                                        : 'bg-white border-slate-200/60 hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const updatedIds = e.target.checked
                                          ? [...autoGenForm.topicIds, t.id]
                                          : autoGenForm.topicIds.filter(id => id !== t.id);
                                        setAutoGenForm({ ...autoGenForm, topicIds: updatedIds });
                                      }}
                                      className="mt-1 accent-blue-600 rounded cursor-pointer"
                                    />
                                    <div className="text-left">
                                      <p className="text-xs font-bold text-slate-800 leading-tight">
                                        {t.name}
                                      </p>
                                      <div className="flex gap-1.5 mt-1.5">
                                        <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                          Lớp {t.grade}
                                        </span>
                                        {(() => {
                                          const subj = subjects.find(s => s.id === t.subjectId);
                                          return (
                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-600">
                                              {subj ? `${subj.icon} ${subj.name}` : 'Môn học'}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Submit Section */}
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed flex items-center gap-3">
                      <span className="text-2xl">🎲</span>
                      <div>
                        <p className="font-extrabold text-blue-800">Cơ chế hoạt động của thuật toán ngẫu nhiên:</p>
                        <p className="mt-0.5">
                          Hệ thống sẽ lấy tất cả câu hỏi thuộc các chuyên đề bạn chọn, trộn ngẫu nhiên chúng bằng thuật toán Fisher-Yates, và tự động tạo thành một bộ đề thi mới có số lượng câu như bạn yêu cầu.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isGeneratingAuto}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-6 py-3.5 rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className={`w-4 h-4 ${isGeneratingAuto ? 'animate-spin' : ''}`} />
                        {isGeneratingAuto ? 'Đang tạo đề ôn tập ngẫu nhiên...' : 'Tạo Đề Thi Ngẫu Nhiên Ngay'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 5: HISTORY LOGS & STATS DASHBOARD */}
              {activeTab === 'logs' && (
                <div className="space-y-6 text-left animate-pop">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Nhật ký & Bảng vàng thành tích ôn hè</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Theo dõi chi tiết tiến trình rèn luyện và thành tích đạt được</p>
                  </div>

                  {/* Sub-Tabs: Dashboard vs History List */}
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setStatSubTab('dashboard')}
                      className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                        statSubTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      🏆 Thống Kê Thành Tích Từng Bé
                    </button>
                    <button
                      onClick={() => setStatSubTab('history')}
                      className={`ml-6 pb-3 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                        statSubTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      📋 Nhật Ký Luyện Tập
                    </button>
                  </div>

                  {/* Student Selector (Visible in both, or just dashboard) */}
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Chọn học sinh xem báo cáo:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedStudentStatId('all')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                            selectedStudentStatId === 'all'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          🌟 Tất cả các bé
                        </button>
                        {students.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => setSelectedStudentStatId(st.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                              selectedStudentStatId === st.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span>{st.avatar}</span>
                            <span>{st.name}</span>
                            <span className="text-[10px] font-extrabold opacity-80 bg-black/5 px-1 py-0.2 rounded">Lớp {st.grade}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50/55 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-blue-950">Phân tích thực tế hè</p>
                        <p className="text-[10px] text-blue-800/80 font-semibold leading-normal">Hệ thống phân tích điểm số để đưa ra khuyến nghị ôn hè tối ưu.</p>
                      </div>
                    </div>
                  </div>

                  {statSubTab === 'dashboard' ? (
                    (() => {
                      const filteredResultsForStats = selectedStudentStatId === 'all'
                        ? results
                        : results.filter(r => r.studentId === selectedStudentStatId);

                      const totalTests = filteredResultsForStats.length;
                      const averageScore = totalTests > 0
                        ? Math.round(filteredResultsForStats.reduce((acc, r) => acc + r.score, 0) / totalTests)
                        : 0;

                      const totalCorrect = filteredResultsForStats.reduce((acc, r) => acc + (r.correctCount || 0), 0);
                      const totalWrong = filteredResultsForStats.reduce((acc, r) => acc + (r.wrongCount || 0), 0);
                      const totalQuestionsAnswered = totalCorrect + totalWrong;
                      const correctPercent = totalQuestionsAnswered > 0
                        ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
                        : 0;

                      // Subject statistics
                      const subStatsMap: Record<string, { count: number; sum: number; avg: number; icon: string }> = {};
                      filteredResultsForStats.forEach(r => {
                        const sName = r.subjectName || 'Khác';
                        const foundSubj = subjects.find(s => s.name === sName);
                        const sIcon = foundSubj ? foundSubj.icon : '📚';

                        if (!subStatsMap[sName]) {
                          subStatsMap[sName] = { count: 0, sum: 0, avg: 0, icon: sIcon };
                        }
                        subStatsMap[sName].count += 1;
                        subStatsMap[sName].sum += r.score;
                      });

                      Object.keys(subStatsMap).forEach(k => {
                        subStatsMap[k].avg = Math.round(subStatsMap[k].sum / subStatsMap[k].count);
                      });

                      // Badges unlocked for this filter
                      const hasBeginnerBadge = totalTests >= 1;
                      const hasScholarBadge = totalTests >= 5;
                      const hasPerfectBadge = filteredResultsForStats.some(r => r.score === 100);
                      const hasMathBadge = ((subStatsMap['Toán']?.count || 0) >= 2) && ((subStatsMap['Toán']?.avg || 0) >= 80);
                      const hasVnBadge = ((subStatsMap['Tiếng Việt']?.count || 0) >= 2) && ((subStatsMap['Tiếng Việt']?.avg || 0) >= 80);
                      const hasChallengerBadge = filteredResultsForStats.some(r => {
                        const origExam = exams.find(e => e.id === r.examId);
                        return origExam?.difficulty === 'hard';
                      });

                      // Unique days
                      const uniqueDates = Array.from(new Set(filteredResultsForStats.map(r => new Date(r.date).toDateString())));
                      const activeDays = uniqueDates.length;

                      // Topics needing focus
                      const topicScoresMap: Record<string, { topicId: string; sum: number; count: number; avg: number }> = {};
                      filteredResultsForStats.forEach(r => {
                        const origExam = exams.find(e => e.id === r.examId);
                        if (origExam && origExam.topicId) {
                          if (!topicScoresMap[origExam.topicId]) {
                            topicScoresMap[origExam.topicId] = { topicId: origExam.topicId, sum: 0, count: 0, avg: 0 };
                          }
                          topicScoresMap[origExam.topicId].sum += r.score;
                          topicScoresMap[origExam.topicId].count += 1;
                        }
                      });

                      const improvementTopics: { topicId: string; name: string; score: number; subjectIcon: string }[] = [];
                      Object.keys(topicScoresMap).forEach(tId => {
                        const item = topicScoresMap[tId];
                        const avg = Math.round(item.sum / item.count);
                        const foundTopic = topics.find(t => t.id === tId);
                        if (foundTopic && avg < 80) {
                          const sObj = subjects.find(s => s.id === foundTopic.subjectId);
                          improvementTopics.push({
                            topicId: tId,
                            name: foundTopic.name,
                            score: avg,
                            subjectIcon: sObj ? sObj.icon : '📚'
                          });
                        }
                      });

                      improvementTopics.sort((a, b) => a.score - b.score);

                      return (
                        <div className="space-y-6">
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Avg Score */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
                              <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600 text-2xl font-bold">
                                🏆
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Điểm Trung Bình</span>
                                <span className="text-xl font-black text-slate-800 leading-none">
                                  {averageScore} <span className="text-xs text-slate-400 font-bold">/100đ</span>
                                </span>
                                <div className="mt-1">
                                  {totalTests === 0 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">Chưa xếp hạng</span>
                                  ) : averageScore >= 90 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-green-50 text-green-700">Xuất sắc 🌟</span>
                                  ) : averageScore >= 80 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Giỏi Giang ✨</span>
                                  ) : averageScore >= 70 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">Khá giỏi 📚</span>
                                  ) : (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700">Cố gắng thêm 🌱</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Completed tests */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
                              <div className="p-3.5 bg-purple-50 rounded-xl text-purple-600 text-2xl font-bold">
                                📝
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Đề Thi Đã Hoàn Thành</span>
                                <span className="text-xl font-black text-slate-800 leading-none">{totalTests}</span>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tích cực ôn hè vượt mục tiêu</p>
                              </div>
                            </div>

                            {/* Card 3: Accuracy percent */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
                              <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600 text-2xl font-bold">
                                🎯
                              </div>
                              <div className="text-left w-full">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tỷ Lệ Trả Lời Đúng</span>
                                <span className="text-xl font-black text-slate-800 leading-none">{correctPercent}%</span>
                                <div className="mt-1.5 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${correctPercent}%` }} />
                                </div>
                              </div>
                            </div>

                            {/* Card 4: Study days streak */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
                              <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600 text-2xl font-bold">
                                📅
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Số Ngày Rèn Luyện</span>
                                <span className="text-xl font-black text-slate-800 leading-none">{activeDays} ngày</span>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Duy trì thói quen ôn hè tốt</p>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Custom SVG Graph */}
                          {(() => {
                            const chartResults = [...filteredResultsForStats].reverse(); // Oldest to newest
                            const N = chartResults.length;
                            if (N === 0) {
                              return (
                                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-2">
                                  <span className="text-4xl">📈</span>
                                  <h4 className="font-bold text-slate-700 text-sm">Chưa có đủ dữ liệu biểu đồ</h4>
                                  <p className="text-xs text-slate-400 max-w-sm">Con cần hoàn thành ít nhất một đề thi để hệ thống bắt đầu vẽ biểu đồ phân tích thành tích.</p>
                                </div>
                              );
                            }

                            const width = 600;
                            const height = 180;
                            const paddingX = 40;
                            const paddingY = 30;
                            const innerWidth = width - paddingX * 2;
                            const innerHeight = height - paddingY * 2;

                            // Compute points
                            const points = chartResults.map((res, idx) => {
                              const x = N > 1 ? paddingX + (idx * innerWidth) / (N - 1) : width / 2;
                              const y = height - paddingY - (res.score * innerHeight) / 100;
                              return { x, y, score: res.score, label: res.examName, date: new Date(res.date).toLocaleDateString('vi-VN') };
                            });

                            // SVG Line path string
                            let lineD = '';
                            let areaD = '';
                            if (N > 1) {
                              lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                              areaD = `${lineD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
                            }

                            return (
                              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                    <span>📈</span> Biểu đồ xu hướng điểm số (Càng về bên phải càng mới)
                                  </h4>
                                  <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-50 px-2.5 py-1 rounded">Điểm (0 - 100)</span>
                                </div>

                                <div className="relative">
                                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                                    <defs>
                                      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                      </linearGradient>
                                    </defs>

                                    {/* Grid lines */}
                                    {[0, 25, 50, 75, 100].map((v) => {
                                      const y = height - paddingY - (v * innerHeight) / 100;
                                      return (
                                        <g key={v} className="opacity-40">
                                          <line
                                            x1={paddingX}
                                            y1={y}
                                            x2={width - paddingX}
                                            y2={y}
                                            stroke="#cbd5e1"
                                            strokeWidth="1"
                                            strokeDasharray="4 4"
                                          />
                                          <text
                                            x={paddingX - 8}
                                            y={y + 3}
                                            textAnchor="end"
                                            className="fill-slate-400 font-extrabold text-[8px] select-none"
                                          >
                                            {v}đ
                                          </text>
                                        </g>
                                      );
                                    })}

                                    {/* Render Area & Line if N > 1 */}
                                    {N > 1 && (
                                      <>
                                        <path d={areaD} fill="url(#area-grad)" />
                                        <path d={lineD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                      </>
                                    )}

                                    {/* Single Point State if N === 1 */}
                                    {N === 1 && (
                                      <line
                                        x1={paddingX}
                                        y1={points[0].y}
                                        x2={width - paddingX}
                                        y2={points[0].y}
                                        stroke="#93c5fd"
                                        strokeWidth="2"
                                        strokeDasharray="2 2"
                                      />
                                    )}

                                    {/* Render Dots & Tooltips */}
                                    {points.map((p, idx) => (
                                      <g key={idx} className="group cursor-pointer">
                                        <title>{`${p.label}\nNgày làm: ${p.date}\nĐiểm số: ${p.score} điểm`}</title>
                                        {/* Highlight Circle on Hover */}
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r="12"
                                          className="fill-blue-500 opacity-0 group-hover:opacity-15 transition-all duration-150"
                                        />
                                        {/* Core Point */}
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r="5"
                                          className="fill-white stroke-blue-600 stroke-3 transition-all duration-150"
                                        />
                                        {/* Score label above point */}
                                        <text
                                          x={p.x}
                                          y={p.y - 12}
                                          textAnchor="middle"
                                          className="fill-blue-800 font-extrabold text-[10px] select-none filter drop-shadow-2xs"
                                        >
                                          {p.score}đ
                                        </text>
                                        {/* Horizontal / Vertical Axis labels for dates */}
                                        <text
                                          x={p.x}
                                          y={height - paddingY + 16}
                                          textAnchor="middle"
                                          className="fill-slate-400 font-bold text-[8px] select-none"
                                        >
                                          {p.date}
                                        </text>
                                      </g>
                                    ))}
                                  </svg>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Two-Column Details: Subject Breakdown & Badges */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Subject Breakdown card */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                                <span>📚</span> Phân tích năng lực theo Môn học
                              </h4>
                              
                              <div className="space-y-4 text-left">
                                {subjects.length === 0 ? (
                                  <p className="text-xs text-slate-400 text-center py-6 font-bold">Chưa có môn học nào.</p>
                                ) : (
                                  subjects.map(subj => {
                                    const stat = subStatsMap[subj.name] || { count: 0, avg: 0 };
                                    return (
                                      <div key={subj.id} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-base">{subj.icon}</span>
                                            <span className="text-xs font-extrabold text-slate-700">{subj.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">({stat.count} đề)</span>
                                          </div>
                                          <span className={`text-xs font-black ${
                                            stat.count === 0 ? 'text-slate-350' : stat.avg >= 90 ? 'text-emerald-600' : stat.avg >= 75 ? 'text-blue-600' : 'text-amber-500'
                                          }`}>
                                            {stat.count > 0 ? `${stat.avg} điểm trung bình` : 'Chưa làm bài'}
                                          </span>
                                        </div>
                                        
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                              subj.name === 'Toán' ? 'bg-blue-500' : subj.name === 'Tiếng Việt' ? 'bg-emerald-500' : 'bg-indigo-500'
                                            }`}
                                            style={{ width: `${stat.count > 0 ? stat.avg : 0}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Badge collection card */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                                <span>🏅</span> Thành quả & Huy chương của bé
                              </h4>
                              
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { id: 'beginner', icon: '🌱', name: 'Khởi động hè', desc: 'Giải đề đầu tiên', active: hasBeginnerBadge, color: 'border-green-200 bg-green-50/20 text-green-700' },
                                  { id: 'scholar', icon: '🚀', name: 'Chăm học hè', desc: 'Làm từ 5 đề', active: hasScholarBadge, color: 'border-purple-200 bg-purple-50/20 text-purple-700' },
                                  { id: 'perfect', icon: '👑', name: 'Tuyệt đối 100', desc: 'Đạt điểm 100đ', active: hasPerfectBadge, color: 'border-amber-200 bg-amber-50/20 text-amber-700 font-bold' },
                                  { id: 'math', icon: '🧮', name: 'Thần đồng Toán', desc: 'Toán học TB >=80đ', active: hasMathBadge, color: 'border-blue-200 bg-blue-50/20 text-blue-700' },
                                  { id: 'vn', icon: '📖', name: 'Mỹ từ nhí', desc: 'Tiếng Việt TB >=80đ', active: hasVnBadge, color: 'border-rose-200 bg-rose-50/20 text-rose-700' },
                                  { id: 'challenger', icon: '🔥', name: 'Vượt khó', desc: 'Đã giải được đề Khó', active: hasChallengerBadge, color: 'border-orange-200 bg-orange-50/20 text-orange-700' }
                                ].map(badge => (
                                  <div
                                    key={badge.id}
                                    className={`border rounded-xl p-2.5 flex flex-col items-center justify-center text-center transition-all ${
                                      badge.active
                                        ? `${badge.color} border-2 border-dashed border-current scale-[1.02] shadow-3xs`
                                        : 'border-slate-150 bg-slate-50/50 text-slate-300 opacity-50 filter grayscale'
                                    }`}
                                  >
                                    <span className="text-2xl mb-1.5">{badge.icon}</span>
                                    <span className="text-[10px] font-black leading-tight block truncate w-full">{badge.name}</span>
                                    <span className="text-[8px] text-slate-400 font-semibold block leading-tight mt-0.5">{badge.desc}</span>
                                    {badge.active && (
                                      <span className="text-[8px] uppercase font-black tracking-widest text-emerald-600 mt-1">Đạt được 🏅</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* AI recommendations / weakness highlights */}
                          {improvementTopics.length > 0 && (
                            <div className="bg-amber-50/55 border border-amber-200/50 p-4.5 rounded-2xl text-left space-y-2.5 animate-pop">
                              <div className="flex items-center gap-2 text-amber-800">
                                <span className="text-xl">💡</span>
                                <h4 className="font-extrabold text-xs uppercase tracking-wider">Khuyên học từ hệ thống thuật toán hè:</h4>
                              </div>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Bé đang gặp khó khăn (kết quả trung bình dưới 80 điểm) ở các chuyên đề sau. Ba mẹ nên tạo thêm một đề ôn tập ngẫu nhiên hoặc giao bài luyện tập nhanh để bé củng cố lại kiến thức:
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {improvementTopics.slice(0, 3).map((topic) => (
                                  <div
                                    key={topic.topicId}
                                    onClick={() => {
                                      // Pre-fill autogenerate and redirect
                                      setAutoGenForm({
                                        ...autoGenForm,
                                        topicIds: [topic.topicId],
                                        difficulties: ['easy', 'medium', 'hard']
                                      });
                                      setActiveTab('auto-generate');
                                    }}
                                    className="bg-white hover:bg-amber-50/50 border border-amber-200 hover:border-amber-400 px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-3xs"
                                  >
                                    <span className="text-xs">{topic.subjectIcon}</span>
                                    <span className="text-xs font-bold text-amber-950">{topic.name}</span>
                                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                                      TB: {topic.score}đ
                                    </span>
                                    <span className="text-[9px] font-extrabold text-blue-600 hover:underline ml-1">Soạn đề ôn ngay ➔</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    /* ORIGINAL LOGS HISTORY LIST */
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4">Ngày làm</th>
                            <th className="py-3 px-4">Tên bé</th>
                            <th className="py-3 px-4">Môn học</th>
                            <th className="py-3 px-4">Bộ đề thi</th>
                            <th className="py-3 px-4 text-center">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
                          {(() => {
                            const filteredLogs = selectedStudentStatId === 'all'
                              ? results
                              : results.filter(r => r.studentId === selectedStudentStatId);

                            if (filteredLogs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                                    Bé chưa tham gia làm bài thi thử nghiệm nào gần đây.
                                  </td>
                                </tr>
                              );
                            }

                            return filteredLogs.map((res) => {
                              const kid = students.find(s => s.id === res.studentId);
                              return (
                                <tr key={res.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-4 font-semibold text-slate-400">
                                    {new Date(res.date).toLocaleString('vi-VN')}
                                  </td>
                                  <td className="py-3 px-4 font-black text-slate-800 flex items-center gap-1.5">
                                    <span className="text-sm">{kid?.avatar}</span>
                                    <span>{kid?.name || 'Học sinh ẩn'}</span>
                                  </td>
                                  <td className="py-3 px-4 font-bold">
                                    <span className={`px-2 py-0.5 rounded-full ${
                                      res.subjectName === 'Toán' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {res.subjectName}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-700">{res.examName}</td>
                                  <td className="py-3 px-4 text-center font-black text-sm text-emerald-600">
                                    {res.score} / 100 điểm
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: GRADES AND SUBJECTS MANAGEMENT */}
              {activeTab === 'grades-subjects' && (
                <div className="space-y-8 text-left animate-pop">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Quản lý Lớp & Môn học</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Thêm, sửa đổi hoặc xóa các cấp lớp học và các môn học chính</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SECTION A: GRADES MANAGEMENT */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col space-y-6">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-1 flex items-center gap-2">
                          <span>🏫</span> Cấp lớp học ({grades.length})
                        </h3>
                        <p className="text-xs text-slate-400">Thiết lập các khối lớp học để giao bài tập phù hợp</p>
                      </div>

                      {/* Grade Creation Form */}
                      {!editingGradeId ? (
                        <form onSubmit={handleAddGrade} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-blue-600 tracking-wider">Thêm khối lớp mới</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">CẤP LỚP (SỐ):</label>
                              <input
                                type="number"
                                required
                                min="1"
                                max="12"
                                placeholder="Ví dụ: 3"
                                value={newGradeForm.level}
                                onChange={(e) => setNewGradeForm({ ...newGradeForm, level: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN HIỂN THỊ:</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: Lớp 3"
                                value={newGradeForm.name}
                                onChange={(e) => setNewGradeForm({ ...newGradeForm, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm lớp
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleUpdateGrade} className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Chỉnh sửa lớp học</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">CẤP LỚP (SỐ):</label>
                              <input
                                type="number"
                                required
                                min="1"
                                max="12"
                                placeholder="Ví dụ: 3"
                                value={editGradeForm.level}
                                onChange={(e) => setEditGradeForm({ ...editGradeForm, level: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN HIỂN THỊ:</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: Lớp 3"
                                value={editGradeForm.name}
                                onChange={(e) => setEditGradeForm({ ...editGradeForm, name: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingGradeId(null)}
                              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" /> Lưu lại
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Grades list */}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {grades.map((g) => (
                          <div key={g.id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-slate-300 transition-all">
                            <div className="text-left">
                              <p className="font-extrabold text-slate-800 text-sm">{g.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Cấp độ hệ thống: Khối {g.level}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingGradeId(g.id);
                                  setEditGradeForm({ level: String(g.level), name: g.name });
                                }}
                                className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(g.id)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION B: SUBJECTS MANAGEMENT */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col space-y-6">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-1 flex items-center gap-2">
                          <span>🎨</span> Môn học đào tạo ({subjects.length})
                        </h3>
                        <p className="text-xs text-slate-400">Danh mục các môn học ôn hè (VD: Toán, Tiếng Việt, Tiếng Anh)</p>
                      </div>

                      {/* Subject Creation Form */}
                      {!editingSubjectId ? (
                        <form onSubmit={handleAddSubject} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-blue-600 tracking-wider">Thêm môn học mới</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN MÔN HỌC:</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: Tiếng Anh"
                                value={newSubjectForm.name}
                                onChange={(e) => setNewSubjectForm({ ...newSubjectForm, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">BIỂU TƯỢNG (ICON/EMOJI):</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: 🔠"
                                value={newSubjectForm.icon}
                                onChange={(e) => setNewSubjectForm({ ...newSubjectForm, icon: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm môn học
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleUpdateSubject} className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Chỉnh sửa môn học</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN MÔN HỌC:</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: Tiếng Anh"
                                value={editSubjectForm.name}
                                onChange={(e) => setEditSubjectForm({ ...editSubjectForm, name: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">BIỂU TƯỢNG (ICON/EMOJI):</label>
                              <input
                                type="text"
                                required
                                placeholder="Ví dụ: 🔠"
                                value={editSubjectForm.icon}
                                onChange={(e) => setEditSubjectForm({ ...editSubjectForm, icon: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSubjectId(null)}
                              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" /> Lưu lại
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Subjects list */}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {subjects.map((s) => (
                          <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-slate-300 transition-all">
                            <div className="flex items-center gap-2.5 text-left">
                              <span className="text-2xl p-1.5 bg-slate-100 rounded-lg">{s.icon || '📖'}</span>
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm">{s.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">Mã hệ thống: {s.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingSubjectId(s.id);
                                  setEditSubjectForm({ name: s.name, icon: s.icon || '' });
                                }}
                                className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(s.id)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GIFTS & REWARDS MANAGEMENT */}
              {activeTab === 'gifts' && (
                <div className="space-y-8 animate-pop text-left">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Cửa Hàng Quà Tặng & Duyệt Đổi Sao ⭐</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Cài đặt phần quà đổi điểm và duyệt các yêu cầu nhận quà của các con
                    </p>
                  </div>

                  {/* SECTION 1: REDEMPTION REQUESTS */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                    <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
                      <span>⏱️</span> Đang chờ duyệt đổi quà ({redemptions.filter(r => r.status === 'pending').length})
                    </h3>

                    {redemptions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic font-bold text-center py-6 bg-white rounded-xl border">
                        Chưa có yêu cầu đổi quà nào từ các con.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {redemptions.map((red) => {
                          const kid = students.find(s => s.id === red.studentId);
                          return (
                            <div
                              key={red.id}
                              className={`p-4 bg-white rounded-xl border border-slate-200/85 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                                red.status === 'pending' ? 'border-amber-300 shadow-3xs' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 text-left">
                                <span className="text-3xl p-1.5 bg-slate-50 rounded-xl">{red.icon || '🎁'}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-800 text-sm">{red.giftName}</p>
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                      ⭐ {red.pointsCost} Điểm
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                                    Người đổi: {kid ? `${kid.avatar} ${kid.name}` : red.studentName} • {new Date(red.requestedAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                {red.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleProcessRedemption(red.id, 'approved')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      ✓ Đồng ý & Trao quà
                                    </button>
                                    <button
                                      onClick={() => handleProcessRedemption(red.id, 'rejected')}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                                    >
                                      Từ chối (Hoàn sao)
                                    </button>
                                  </>
                                ) : (
                                  <div>
                                    {red.status === 'approved' && (
                                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-3 py-1.5 rounded-full inline-block">
                                        🎉 Đã duyệt & trao quà
                                      </span>
                                    )}
                                    {red.status === 'rejected' && (
                                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-black px-3 py-1.5 rounded-full inline-block">
                                        ↩️ Từ chối & Đã hoàn sao
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: GIFT CONFIGURATION */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
                    {/* Form block */}
                    <div className="md:col-span-5">
                      {!editingGiftId ? (
                        <form onSubmit={handleCreateGift} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-3xs space-y-4">
                          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-2 text-blue-600">Thêm Quà Đổi Điểm Mới</h3>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN MÓN QUÀ:</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: 30 phút xem Youtube, Thổi bong bóng..."
                              value={newGiftForm.name}
                              onChange={(e) => setNewGiftForm({ ...newGiftForm, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">MỨC ĐIỂM SAO ⭐:</label>
                              <input
                                type="number"
                                required
                                min={5}
                                max={5000}
                                placeholder="Ví dụ: 100"
                                value={newGiftForm.pointsCost}
                                onChange={(e) => setNewGiftForm({ ...newGiftForm, pointsCost: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">BIỂU TƯỢNG (EMOJI):</label>
                              <select
                                value={newGiftForm.icon}
                                onChange={(e) => setNewGiftForm({ ...newGiftForm, icon: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                              >
                                {['🎁', '🧸', '🎮', '🍬', '🍕', '🍦', '🎨', '🍿', '🚗', '📚', '⚡', '🌟', '🍫', '🥤', '🚲'].map(em => (
                                  <option key={em} value={em}>{em}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Plus className="w-4 h-4" /> Lưu phần quà mới
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleUpdateGift} className="bg-amber-50/40 p-6 rounded-2xl border-2 border-amber-300 shadow-3xs space-y-4">
                          <h3 className="font-extrabold text-amber-800 text-sm uppercase tracking-wider mb-2">Chỉnh Sửa Phần Quà</h3>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN MÓN QUÀ:</label>
                            <input
                              type="text"
                              required
                              value={editGiftForm.name}
                              onChange={(e) => setEditGiftForm({ ...editGiftForm, name: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">MỨC ĐIỂM SAO ⭐:</label>
                              <input
                                type="number"
                                required
                                min={5}
                                max={5000}
                                value={editGiftForm.pointsCost}
                                onChange={(e) => setEditGiftForm({ ...editGiftForm, pointsCost: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">BIỂU TƯỢNG (EMOJI):</label>
                              <select
                                value={editGiftForm.icon}
                                onChange={(e) => setEditGiftForm({ ...editGiftForm, icon: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-hidden"
                              >
                                {['🎁', '🧸', '🎮', '🍬', '🍕', '🍦', '🎨', '🍿', '🚗', '📚', '⚡', '🌟', '🍫', '🥤', '🚲'].map(em => (
                                  <option key={em} value={em}>{em}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingGiftId(null)}
                              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" /> Lưu cập nhật
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Gifts configured list */}
                    <div className="md:col-span-7 space-y-3">
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-2">Danh Sách Quà Đổi Điểm Hiện Tại ({gifts.length})</h3>

                      {gifts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic font-bold py-8 text-center bg-white rounded-2xl border border-dashed">
                          Chưa thiết lập phần quà nào. Ba mẹ hãy tạo những món quà ngộ nghĩnh bên trái để bé có động lực học nhé!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                          {gifts.map((g) => (
                            <div key={g.id} className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all">
                              <div className="flex items-center gap-3 text-left">
                                <span className="text-3xl p-1 bg-slate-50 rounded-lg">{g.icon}</span>
                                <div>
                                  <p className="font-extrabold text-slate-800 text-sm">{g.name}</p>
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                                    ⭐ {g.pointsCost} Điểm sao
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingGiftId(g.id);
                                    setEditGiftForm({ name: g.name, pointsCost: g.pointsCost, icon: g.icon });
                                  }}
                                  className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGift(g.id)}
                                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}
