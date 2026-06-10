import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminQuestionPreview from './AdminQuestionPreview';
import { fetchAllQuizzes, updateQuiz, createQuiz, deleteQuiz } from '../services/quizService';
import { sanitizeHtml, HtmlInline } from '../utils/htmlRenderer.jsx';

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [loading, setLoading] = useState(false);

  const isImageUrl = (url) => {
    return typeof url === 'string' && (
      url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp|ico)$/i) != null ||
      url.startsWith('http') ||
      url.startsWith('data:image/')
    );
  };

  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({ title: '', category: '', summary: '', duration: 45 });
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(getInitialState('multiple_choice'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Các state mới thêm cho tính năng sửa/xóa bài thi, nhập xuất JSON và tìm kiếm câu hỏi
  const [isEditingQuizMeta, setIsEditingQuizMeta] = useState(false);
  const [quizMetaInput, setQuizMetaInput] = useState({ title: '', category: '', summary: '', duration: 45 });
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');

  useEffect(() => {
    async function loadQuizzes() {
      const data = await fetchAllQuizzes();
      setQuizzes(data);
      if (data.length > 0) setSelectedQuizId(data[0].id);
    }
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      const quiz = quizzes.find(q => q.id === selectedQuizId);
      setCurrentQuizQuestions(quiz ? quiz.questions : []);
    } else {
      setCurrentQuizQuestions([]);
    }
  }, [selectedQuizId, quizzes]);

  const handleCreateNewQuiz = async () => {
    if (!newQuizData.title || !newQuizData.category) return alert('Vui lòng nhập Tiêu đề và Cấp độ!');
    try {
      await createQuiz(newQuizData);
      alert('Tạo bài thi mới thành công!');
      const data = await fetchAllQuizzes();
      setQuizzes(data);
      setShowCreateQuiz(false);
    } catch (e) { alert('Lỗi khi tạo bài thi'); }
  };

  function getInitialState(type) {
    const common = {
      id: `q_${Date.now()}`,
      type,
      text: '',
      image: '',
      explanation: '',
    };

    switch (type) {
      case 'multiple_choice':
        return { ...common, choices: ['Lựa chọn 1', 'Lựa chọn 2'], answer: 0 };
      case 'multiple_select':
        return { ...common, choices: ['Lựa chọn 1', 'Lựa chọn 2'], correctAnswers: [] };
      case 'TRUE_FALSE_MATRIX':
      case 'matrix_radio':
        return {
          ...common,
          rows: [{ id: 'r1', text: 'Nội dung hàng 1' }],
          columns: type === 'TRUE_FALSE_MATRIX' ? ['Đúng', 'Sai', 'Không xác định'] : ['Cột 1', 'Cột 2'],
          answer: { 'r1': 0 }
        };
      case 'fill_blank':
        return { ...common, answer: '' };
      case 'questionBox':
      case 'matching':
        return { ...common, leftItems: ['Mục A'], rightItems: ['Mục 1'], correctPairs: [{ l: 0, r: 0 }] };
      case 'drag_drop':
        return { ...common, items: ['Mục 1', 'Mục 2'], correctOrder: [0, 1] };
      case 'hotspot':
        return {
          ...common,
          image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800',
          hotspots: [{ x: 10, y: 10, width: 10, height: 10 }],
          correctAnswers: [0]
        };
      default:
        return common;
    }
  }

  // Thêm cặp mới cho QuestionBox: Thêm cùng lúc text, ảnh và tạo liên kết 1-1
  const handleAddPair = () => {
    if (editingQuestion.type === 'questionBox') {
      const nextLeft = [...(editingQuestion.leftItems || []), ''];
      const nextRight = [...(editingQuestion.rightItems || []), ''];
      const newIdx = nextLeft.length - 1;
      const nextPairs = [...(editingQuestion.correctPairs || []), { l: newIdx, r: newIdx }];
      setEditingQuestion({
        ...editingQuestion,
        leftItems: nextLeft,
        rightItems: nextRight,
        correctPairs: nextPairs
      });
    } else {
      // Cho matching thông thường
      updateField('leftItems', [...(editingQuestion.leftItems || []), 'Mục mới']);
    }
  };

  // Xóa cặp: Xóa text, ảnh tương ứng và cập nhật lại toàn bộ chỉ số correctPairs
  const handleRemovePair = (lIdx) => {
    const currentPairs = editingQuestion.correctPairs || [];
    const pair = currentPairs.find(p => p.l === lIdx);
    if (!pair && editingQuestion.type === 'questionBox') return;

    const rIdx = pair ? pair.r : -1;

    const nextLeft = (editingQuestion.leftItems || []).filter((_, i) => i !== lIdx);
    const nextRight = (editingQuestion.rightItems || []).filter((_, i) => i !== rIdx);

    const nextPairs = (editingQuestion.correctPairs || [])
      .filter(p => p.l !== lIdx && p.r !== rIdx)
      .map(p => ({
        l: p.l > lIdx ? p.l - 1 : p.l,
        r: p.r > rIdx ? p.r - 1 : p.r
      }));

    setEditingQuestion({
      ...editingQuestion,
      leftItems: nextLeft,
      rightItems: nextRight,
      correctPairs: nextPairs
    });
  };

  // Thêm vùng hotspot mới với giá trị mặc định
  const handleAddHotspot = () => {
    const currentHotspots = editingQuestion.hotspots || [];
    const newHotspot = { x: 10, y: 10, width: 15, height: 15 };
    updateField('hotspots', [...currentHotspots, newHotspot]);
  };

  // Xóa vùng hotspot theo index
  const handleRemoveHotspot = (idx) => {
    const next = (editingQuestion.hotspots || []).filter((_, i) => i !== idx);
    updateField('hotspots', next);

    // Cập nhật lại danh sách chỉ số các vùng đúng
    const nextCorrect = (editingQuestion.correctAnswers || [])
      .filter(id => id !== idx)
      .map(id => id > idx ? id - 1 : id);
    updateField('correctAnswers', nextCorrect);
  };

  const handleTypeChange = (type) => {
    const newState = getInitialState(type);
    if (isEditingQuestion) {
      const commonFieldsToPreserve = {
        id: editingQuestion.id,
        text: editingQuestion.text || '',
        image: editingQuestion.image || '',
        explanation: editingQuestion.explanation || ''
      };
      setEditingQuestion({
        ...newState, // Reset các trường đặc thù theo loại mới
        ...commonFieldsToPreserve // Giữ lại nội dung chung
      });
    } else {
      setEditingQuestion(newState);
    }
  };

  const updateField = (field, value) => {
    setEditingQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedQuizId) return alert('Vui lòng chọn bài thi!');
    setLoading(true);

    // Loại bỏ mọi giá trị undefined trước khi gửi lên Firestore
    const safeCleanQuestion = JSON.parse(JSON.stringify(editingQuestion, (k, v) => v === undefined ? null : v));

    try {
      const targetQuiz = quizzes.find(q => q.id === selectedQuizId);
      let updatedQuestions;

      if (!targetQuiz) {
        console.error("Lỗi: Không tìm thấy bài thi với ID đã chọn để cập nhật.", selectedQuizId);
        alert('Lỗi: Không tìm thấy bài thi để cập nhật. Vui lòng chọn lại bài thi.');
        setLoading(false);
        return;
      }

      if (isEditingQuestion) {
        // Cập nhật câu hỏi hiện có
        updatedQuestions = (targetQuiz.questions || []).map(q =>
          q.id === safeCleanQuestion.id ? safeCleanQuestion : q
        );
      } else {
        // Thêm câu hỏi mới
        updatedQuestions = [...(targetQuiz.questions || []), safeCleanQuestion];
      }

      await updateQuiz(selectedQuizId, { questions: updatedQuestions });

      // Quan trọng: Tải lại toàn bộ dữ liệu để đồng bộ hóa UI với DB
      const data = await fetchAllQuizzes();
      setQuizzes(data);

      alert(isEditingQuestion ? 'Đã cập nhật câu hỏi thành công!' : 'Đã thêm câu hỏi thành công!');

      // Reset form
      setEditingQuestion(getInitialState(safeCleanQuestion.type));
      setIsEditingQuestion(false);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question) => {
    // Đảm bảo câu hỏi cũ luôn có đầy đủ các trường dữ liệu cần thiết
    const safeQuestion = {
      ...getInitialState(question.type),
      ...question,
      text: question.text || '',
      image: question.image || '',
      explanation: question.explanation || ''
    };
    
    setEditingQuestion(safeQuestion);
    setIsEditingQuestion(true);
    setIsDrawerOpen(false); // Đóng Drawer khi nhấn sửa
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu form
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedQuizId || !window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    setLoading(true);
    try {
      const targetQuiz = quizzes.find(q => q.id === selectedQuizId);
      const updatedQuestions = (targetQuiz.questions || []).filter(q => q.id !== questionId);
      await updateQuiz(selectedQuizId, { questions: updatedQuestions });
      alert('Đã xóa câu hỏi thành công!');

      setQuizzes(prevQuizzes => prevQuizzes.map(q =>
        q.id === selectedQuizId ? { ...q, questions: updatedQuestions } : q
      ));
      // Nếu câu hỏi đang được chỉnh sửa bị xóa, reset form
      if (editingQuestion.id === questionId) {
        setEditingQuestion(getInitialState(editingQuestion.type));
        setIsEditingQuestion(false);
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xóa dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelectedQuiz = async () => {
    if (!selectedQuizId) return;
    const currentQuiz = quizzes.find(q => q.id === selectedQuizId);
    if (!currentQuiz) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ bài thi "${currentQuiz.title}" và toàn bộ ${currentQuiz.questions?.length || 0} câu hỏi đi kèm không?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteQuiz(selectedQuizId);
      alert('Xóa bài thi thành công!');
      const data = await fetchAllQuizzes();
      setQuizzes(data);
      if (data.length > 0) {
        setSelectedQuizId(data[0].id);
      } else {
        setSelectedQuizId('');
      }
      setIsEditingQuizMeta(false);
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xóa bài thi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuizMeta = async () => {
    if (!selectedQuizId) return;
    if (!quizMetaInput.title || !quizMetaInput.category) {
      return alert('Vui lòng nhập đầy đủ Tiêu đề và Cấp độ!');
    }
    setLoading(true);
    try {
      await updateQuiz(selectedQuizId, quizMetaInput);
      alert('Cập nhật thông tin bài thi thành công!');
      const data = await fetchAllQuizzes();
      setQuizzes(data);
      setIsEditingQuizMeta(false);
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu thông tin bài thi');
    } finally {
      setLoading(false);
    }
  };

  const handleExportQuiz = (quiz) => {
    const exportData = {
      title: quiz.title,
      category: quiz.category,
      duration: quiz.duration,
      summary: quiz.summary,
      questions: quiz.questions || []
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quiz.category.replace(/\s+/g, '_')}_${quiz.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportQuiz = async (e, quizId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData.questions || !Array.isArray(importedData.questions)) {
          return alert('File JSON không hợp lệ! Thiếu danh sách câu hỏi (questions).');
        }

        const option = window.confirm(
          `Bạn đã chọn file chứa ${importedData.questions.length} câu hỏi.\n\n` +
          `Bấm OK để GHI ĐÈ toàn bộ câu hỏi cũ trong bài thi hiện tại bằng dữ liệu mới.\n` +
          `Bấm CANCEL để THÊM TIẾP số câu hỏi này vào cuối danh sách hiện tại.`
        );

        setLoading(true);
        const targetQuiz = quizzes.find(q => q.id === quizId);
        let finalQuestions = [];

        // Tạo IDs mới cho các câu hỏi được import để tránh bị trùng ID
        const processedImportedQuestions = importedData.questions.map((q, idx) => ({
          ...q,
          id: q.id && !q.id.startsWith('q_') ? q.id : `q_${Date.now()}_${idx}`
        }));

        if (option) {
          finalQuestions = processedImportedQuestions;
        } else {
          finalQuestions = [...(targetQuiz.questions || []), ...processedImportedQuestions];
        }

        await updateQuiz(quizId, { questions: finalQuestions });
        alert(`Đã nhập thành công ${processedImportedQuestions.length} câu hỏi!`);

        const data = await fetchAllQuizzes();
        setQuizzes(data);
      } catch (err) {
        console.error(err);
        alert('Lỗi khi đọc file JSON: ' + err.message);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (

    <div className="flex flex-col lg:flex-row gap-8 p-8 bg-slate-50 min-h-screen font-sans">
      {/* Cột trái: Form nhập liệu */}
      <div className="flex-1 bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
              title="Danh sách câu hỏi"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình câu hỏi</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-slate-800 text-white rounded-full text-xs font-bold hover:bg-slate-700 transition shadow-lg"
            >
              ← Trang chủ
            </button>
            <button
              onClick={() => setShowCreateQuiz(!showCreateQuiz)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase"
            >
              {showCreateQuiz ? 'Đóng' : '+ Tạo bài thi/Phần mới'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Form tạo Quiz mới (Phần) */}
          {showCreateQuiz && (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4 mb-6 text-base">
              <h3 className="font-bold text-emerald-800 text-base italic">Tạo bài thi mới (Ví dụ: GS6 LV1 - GM1)</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Cấp độ (vd: GS6 LV1)"
                  className="p-2 border rounded-lg text-base"
                  value={newQuizData.category}
                  onChange={e => setNewQuizData({ ...newQuizData, category: e.target.value })}
                />
                <input
                  placeholder="Tên phần (vd: GM1)"
                  className="p-2 border rounded-lg text-base"
                  value={newQuizData.title}
                  onChange={e => setNewQuizData({ ...newQuizData, title: e.target.value })}
                />
              </div>
              <button onClick={handleCreateNewQuiz} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold text-xs uppercase">Xác nhận tạo</button>
            </div>
          )}

          {/* Chọn Quiz */}
          <div>
            <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Chọn Bài thi / Phần để thêm câu</label>
            <select
              value={selectedQuizId}
              onChange={(e) => {
                setSelectedQuizId(e.target.value);
                setIsEditingQuizMeta(false);
              }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base"
            >
              {quizzes.map(q => <option key={q.id} value={q.id}>[{q.category}] - {q.title}</option>)}
            </select>
          </div>

          {selectedQuizId && (() => {
            const currentQuiz = quizzes.find(q => q.id === selectedQuizId);
            if (!currentQuiz) return null;
            return (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <h4 className="font-black uppercase text-slate-400 tracking-widest">Thông tin bài thi</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingQuizMeta(!isEditingQuizMeta);
                        setQuizMetaInput({
                          title: currentQuiz.title || '',
                          category: currentQuiz.category || '',
                          duration: currentQuiz.duration || 45,
                          summary: currentQuiz.summary || ''
                        });
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-600 hover:text-white transition"
                    >
                      {isEditingQuizMeta ? 'Hủy' : 'Sửa'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelectedQuiz}
                      className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-600 rounded border border-rose-200 hover:bg-rose-600 hover:text-white transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {isEditingQuizMeta ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-sm">
                        <label className="font-bold text-slate-500">Cấp độ</label>
                        <input
                          value={quizMetaInput.category}
                          onChange={e => setQuizMetaInput({ ...quizMetaInput, category: e.target.value })}
                          className="w-full p-2 border rounded-lg text-sm"
                          placeholder="vd: GS6 LV1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">Tên phần</label>
                        <input
                          value={quizMetaInput.title}
                          onChange={e => setQuizMetaInput({ ...quizMetaInput, title: e.target.value })}
                          className="w-full p-2 border rounded-lg text-sm"
                          placeholder="vd: GM1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">Thời gian (phút)</label>
                        <input
                          type="number"
                          value={quizMetaInput.duration}
                          onChange={e => setQuizMetaInput({ ...quizMetaInput, duration: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">Tóm tắt</label>
                        <input
                          value={quizMetaInput.summary}
                          onChange={e => setQuizMetaInput({ ...quizMetaInput, summary: e.target.value })}
                          className="w-full p-2 border rounded-lg text-sm"
                          placeholder="Mô tả..."
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveQuizMeta}
                      className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                ) : (
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p><span className="font-semibold text-slate-700">Tên:</span> {currentQuiz.title}</p>
                    <p><span className="font-semibold text-slate-700">Danh mục:</span> {currentQuiz.category}</p>
                    <p><span className="font-semibold text-slate-700">Thời gian:</span> {currentQuiz.duration} phút</p>
                    {currentQuiz.summary && <p><span className="font-semibold text-slate-700">Mô tả:</span> {currentQuiz.summary}</p>}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleExportQuiz(currentQuiz)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-center"
                  >
                    Xuất JSON
                  </button>
                  <label className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-center cursor-pointer">
                    Nhập JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleImportQuiz(e, currentQuiz.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            );
          })()}

          {/* Loại câu hỏi */}
          <div>
            <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Loại câu hỏi (Type)</label>
            <select
              value={editingQuestion.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 outline-none text-sm"
            >
              <option value="multiple_choice">Trắc nghiệm đơn</option>
              <option value="multiple_select">Chọn nhiều đáp án</option>
              <option value="TRUE_FALSE_MATRIX">Ma trận Đúng/Sai</option>
              <option value="fill_blank">Điền vào chỗ trống</option>
              <option value="questionBox">Ghép nối Văn bản - Hình ảnh (QuestionBox)</option>
              <option value="matching">Nối cặp (Matching)</option>
              <option value="drag_drop">Sắp xếp (Drag & Drop)</option>
              <option value="hotspot">Điểm nóng (Hotspot)</option>
            </select>
          </div>

          {/* Nội dung câu hỏi */}
          <div>
            <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Câu hỏi (Text)</label>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 focus:bg-white transition-all outline-none text-base"
              value={editingQuestion.text}
              onChange={(e) => updateField('text', e.target.value)}
              placeholder="Nhập nội dung câu hỏi tại đây..."
            />
          </div>

          {/* URL Hình ảnh */}
          <div>
            <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Ảnh minh họa (URL)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base"
                value={editingQuestion.image || ''}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://example.com/image.jpg hoặc data:image/..."
              />
              {editingQuestion.image && isImageUrl(editingQuestion.image) && (
                <div className="w-12 h-12 shrink-0 border border-slate-200 rounded-xl bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src={editingQuestion.image} className="max-w-full max-h-full object-contain" alt="preview" />
                </div>
              )}
            </div>
          </div>

          {/* Logic Form Động cho từng loại */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            {editingQuestion.type === 'multiple_choice' && (
              <div className="space-y-3">
                <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Danh sách lựa chọn</label>
                {editingQuestion.choices.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="radio"
                      checked={editingQuestion.answer === i}
                      onChange={() => updateField('answer', i)}
                      className="mt-3"
                    />
                    <input
                      className="flex-1 p-2 border rounded-lg text-base"
                      value={c}
                      onChange={(e) => {
                        const newChoices = [...editingQuestion.choices];
                        newChoices[i] = e.target.value;
                        updateField('choices', newChoices);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => updateField('choices', [...editingQuestion.choices, 'Lựa chọn mới'])}
                  className="text-base text-blue-600 font-bold"
                >+ Thêm lựa chọn</button>
              </div>
            )}

            {editingQuestion.type === 'multiple_select' && (
              <div className="space-y-3 text-base">
                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Lựa chọn (Chọn nhiều đáp án đúng)</label>
                {editingQuestion.choices.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={editingQuestion.correctAnswers?.includes(i)}
                      onChange={(e) => {
                        const current = editingQuestion.correctAnswers || [];
                        const next = e.target.checked ? [...current, i] : current.filter(x => x !== i);
                        updateField('correctAnswers', next);
                      }}
                      className="mt-3"
                    />
                    <input
                      className="flex-1 p-2 border rounded-lg text-base"
                      value={c}
                      onChange={(e) => {
                        const newChoices = [...editingQuestion.choices];
                        newChoices[i] = e.target.value;
                        updateField('choices', newChoices);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => updateField('choices', [...editingQuestion.choices, 'Lựa chọn mới'])}
                  className="text-base text-blue-600 font-bold"
                >+ Thêm lựa chọn</button>
              </div>
            )}

            {editingQuestion.type === 'TRUE_FALSE_MATRIX' && (
              <div className="space-y-4 text-base">
                <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Các hàng (Rows)</label>
                {editingQuestion.rows.map((row, i) => (
                  <div key={row.id} className="flex gap-2 items-center">
                    <input
                      className="flex-1 p-2 border rounded-lg text-base"
                      value={row.text}
                      onChange={(e) => {
                        const newRows = [...editingQuestion.rows];
                        newRows[i].text = e.target.value;
                        updateField('rows', newRows);
                      }}
                    />
                    <select
                      value={editingQuestion.answer[row.id]}
                      onChange={(e) => updateField('answer', { ...editingQuestion.answer, [row.id]: parseInt(e.target.value) })}
                      className="p-2 bg-white border rounded-lg text-sm font-bold"
                    >
                      {(editingQuestion.columns || []).map((colName, colIdx) => (
                        <option key={colIdx} value={colIdx}>{colName}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const currentRows = editingQuestion.rows || [];
                    const nextNum = currentRows.length > 0 ? parseInt(currentRows[currentRows.length - 1].id.replace('r', '')) + 1 : 1;
                    const newId = `r${nextNum}`;
                    updateField('rows', [...currentRows, { id: newId, text: 'Nội dung hàng mới...' }]);
                    updateField('answer', { ...editingQuestion.answer, [newId]: 0 });
                  }}
                  className="text-base text-blue-600 font-bold"
                >+ Thêm hàng</button>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-sm font-black uppercase text-slate-500 tracking-widest mb-2">Cấu hình tiêu đề các cột</label>
                  {(editingQuestion.columns || []).map((col, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-slate-300 w-4">{i + 1}.</span>
                      <input
                        className="flex-1 p-2 border rounded-lg text-sm"
                        value={col}
                        onChange={(e) => {
                          const newColumns = [...editingQuestion.columns];
                          newColumns[i] = e.target.value;
                          updateField('columns', newColumns);
                        }}
                        placeholder={`Tên cột ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newColumns = editingQuestion.columns.filter((_, idx) => idx !== i);
                          updateField('columns', newColumns);
                          // Cập nhật lại answer để tránh lỗi index khi xóa cột
                          const newAnswer = {};
                          for (const rowId in editingQuestion.answer) {
                            const currentVal = editingQuestion.answer[rowId];
                            if (currentVal !== i) {
                              newAnswer[rowId] = currentVal > i ? currentVal - 1 : currentVal;
                            } else {
                              newAnswer[rowId] = 0; // Reset về cột đầu nếu cột đang chọn bị xóa
                            }
                          }
                          updateField('answer', newAnswer);
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1"
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateField('columns', [...(editingQuestion.columns || []), 'Cột mới'])}
                    className="text-base text-blue-600 font-bold"
                  >+ Thêm cột</button>
                </div>
              </div>
            )}

            {editingQuestion.type === 'matching' && (
              <div className="space-y-6 text-base">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400">Cột A (Trái)</label>
                    {(editingQuestion.leftItems || []).map((item, i) => (
                      <div key={i} className="flex gap-1 items-center">
                        <input className="flex-1 p-2 border rounded-lg text-sm" value={item} onChange={(e) => {
                          const next = [...editingQuestion.leftItems];
                          next[i] = e.target.value;
                          updateField('leftItems', next);
                        }} />
                        <button
                          type="button"
                          onClick={() => {
                            const next = editingQuestion.leftItems.filter((_, idx) => idx !== i);
                            updateField('leftItems', next);
                            // Cập nhật lại correctPairs để xóa các cặp liên quan đến mục bị xóa
                            const filteredPairs = (editingQuestion.correctPairs || [])
                              .filter(p => p.l !== i)
                              .map(p => ({ l: p.l > i ? p.l - 1 : p.l, r: p.r }));
                            updateField('correctPairs', filteredPairs);
                          }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1"
                        >✕</button>
                      </div>
                    ))}
                    {editingQuestion.type === 'matching' && (
                      <button type="button" onClick={() => updateField('leftItems', [...(editingQuestion.leftItems || []), 'Mục mới'])} className="text-xs text-blue-600 font-bold">
                        + Thêm mục Cột A
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400">
                      {editingQuestion.type === 'questionBox' ? 'Cột Hình ảnh (Phải - URL)' : 'Cột B (Phải)'}
                    </label>
                    {(editingQuestion.rightItems || []).map((item, i) => (
                      <div key={i} className="flex gap-1 items-center">
                        <div className="flex-1 flex flex-col gap-1">
                          <input className="w-full p-2 border rounded-lg text-base" value={item} onChange={(e) => {
                            const next = [...editingQuestion.rightItems];
                            next[i] = e.target.value;
                            updateField('rightItems', next);
                          }} />
                          {item && isImageUrl(item) && (
                            <img src={item} className="h-10 w-10 object-contain rounded border bg-white shadow-sm" alt="Preview" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = editingQuestion.rightItems.filter((_, idx) => idx !== i);
                            updateField('rightItems', next);
                            // Cập nhật lại correctPairs để xóa các cặp liên quan đến mục bị xóa
                            const filteredPairs = (editingQuestion.correctPairs || [])
                              .filter(p => p.r !== i)
                              .map(p => ({ l: p.l, r: p.r > i ? p.r - 1 : p.r }));
                            updateField('correctPairs', filteredPairs);
                          }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1"
                        >✕</button>
                      </div>
                    ))}
                    {editingQuestion.type === 'matching' && (
                      <button type="button" onClick={() => updateField('rightItems', [...(editingQuestion.rightItems || []), 'Mục mới'])} className="text-xs text-blue-600 font-bold">
                        + Thêm mục Cột B
                      </button>
                    )}
                  </div>
                </div>

                {editingQuestion.type === 'questionBox' && (
                  <button
                    type="button"
                    onClick={handleAddPair}
                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl border-2 border-dashed border-blue-200 font-bold text-sm uppercase hover:bg-blue-100 transition-all"
                  >
                    + Thêm cặp (Văn bản & Hình ảnh) mới
                  </button>
                )}

                {/* Giao diện trực quan cấu hình đáp án nối cặp */}
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 space-y-3 text-sm">
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                    {editingQuestion.type === 'questionBox' ? 'Cấu hình ghép nối Văn bản - Hình ảnh' : 'Cấu hình liên kết đáp án đúng'}
                  </label>
                  {(editingQuestion.leftItems || []).map((leftItem, lIdx) => {
                    const pair = (editingQuestion.correctPairs || []).find(p => p.l === lIdx);
                    const selectedVal = pair ? pair.r : '';
                    const rightItemValue = editingQuestion.rightItems?.[pair?.r];

                    return (
                      <div key={lIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-bold text-slate-400 w-4">{lIdx + 1}.</span>
                          <input
                            className="flex-1 p-2 border rounded bg-slate-50 text-xs focus:bg-white transition-colors"
                            value={leftItem}
                            onChange={(e) => {
                              const next = [...editingQuestion.leftItems];
                              next[lIdx] = e.target.value;
                              updateField('leftItems', next);
                            }}
                            placeholder="Nội dung văn bản..."
                          />
                        </div>

                        <span className="text-slate-400 text-[10px] font-bold uppercase shrink-0">
                          {editingQuestion.type === 'questionBox' ? 'Ghép với' : 'Nối với'}
                        </span>

                        <div className="flex items-center gap-2 flex-1">
                          {editingQuestion.type === 'questionBox' ? (
                            <input
                              className="flex-1 p-2 border rounded bg-slate-50 text-sm focus:bg-white transition-all transition-colors"
                              value={rightItemValue || ''}
                              onChange={(e) => {
                                const next = [...editingQuestion.rightItems];
                                const rIdx = pair ? pair.r : lIdx;
                                // Đảm bảo mảng đủ độ dài
                                while (next.length <= rIdx) next.push('');
                                next[rIdx] = e.target.value;

                                updateField('rightItems', next);
                                if (!pair) {
                                  const nextPairs = [...(editingQuestion.correctPairs || []), { l: lIdx, r: rIdx }];
                                  updateField('correctPairs', nextPairs);
                                }
                              }}
                            />
                          ) : (
                            <select
                              value={selectedVal}
                              onChange={(e) => {
                                const rIdx = parseInt(e.target.value, 10);
                                const currentPairs = editingQuestion.correctPairs || [];
                                const filtered = currentPairs.filter(p => p.l !== lIdx);
                                const nextPairs = isNaN(rIdx) ? filtered : [...filtered, { l: lIdx, r: rIdx }];
                                updateField('correctPairs', nextPairs);
                              }}
                              className="flex-1 p-2 border rounded bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                            >
                              <option value="">-- {editingQuestion.type === 'questionBox' ? 'Chọn ảnh' : 'Chọn mục'} --</option>
                              {(editingQuestion.rightItems || []).map((rightItem, rIdx) => (
                                <option key={rIdx} value={rIdx}>
                                  {rIdx + 1}. {typeof rightItem === 'string' ? rightItem.substring(0, 35) : rightItem}{rightItem.length > 35 ? '...' : ''}
                                </option>
                              ))}
                            </select>
                          )}
                          {rightItemValue && isImageUrl(rightItemValue) && (
                            <div className="w-10 h-10 shrink-0 border rounded bg-white flex items-center justify-center p-0.5 shadow-sm">
                              <img src={rightItemValue} className="max-w-full max-h-full object-contain" alt="Preview" />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePair(lIdx)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm"
                          title="Xóa cặp này"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {editingQuestion.type === 'questionBox' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-black uppercase text-slate-500 tracking-wider">
                    Quản lý danh sách Cặp (Văn bản - Hình ảnh)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPair}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-700 transition-all shadow-sm"
                  >
                    + Thêm cặp mới
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingQuestion.leftItems || []).map((leftItem, idx) => {
                    const pair = (editingQuestion.correctPairs || []).find(p => p.l === idx);
                    const rIdx = pair ? pair.r : idx;
                    const rightItemValue = editingQuestion.rightItems?.[rIdx] || '';

                    return (
                      <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 group relative text-base">
                        <div className="flex-1 w-full space-y-1">
                          <span className="text-xs font-bold text-slate-400 uppercase">Văn bản {idx + 1}</span>
                          <input
                            className="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-all"
                            value={leftItem}
                            onChange={(e) => {
                              const next = [...editingQuestion.leftItems];
                              next[idx] = e.target.value;
                              updateField('leftItems', next);
                            }}
                            placeholder="Nhập nội dung chữ..."
                          />
                        </div>

                        <div className="hidden md:block text-slate-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>

                        <div className="flex-[1.5] w-full space-y-1 text-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">URL Hình ảnh</span>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-all"
                              value={rightItemValue}
                              onChange={(e) => {
                                const next = [...editingQuestion.rightItems];
                                while (next.length <= rIdx) next.push('');
                                next[rIdx] = e.target.value;
                                updateField('rightItems', next);
                                // Cập nhật lại correctPairs nếu chưa có liên kết
                                if (!pair) {
                                  const nextPairs = [...(editingQuestion.correctPairs || []), { l: idx, r: idx }];
                                  updateField('correctPairs', nextPairs);
                                }
                              }}
                              placeholder="https://..."
                            />
                            {rightItemValue && isImageUrl(rightItemValue) && (
                              <div className="w-10 h-10 shrink-0 border rounded-lg bg-white p-0.5 shadow-sm">
                                <img src={rightItemValue} className="w-full h-full object-contain" alt="preview" />
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePair(idx)}
                          className="absolute -top-2 -right-2 md:relative md:top-0 md:right-0 p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors text-sm"
                          title="Xóa cặp này"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {(!editingQuestion.leftItems || editingQuestion.leftItems.length === 0) && (
                  <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-base">Chưa có cặp nào. Hãy nhấn "Thêm cặp mới"</p>
                  </div>
                )}
              </div>
            )}

            {editingQuestion.type === 'drag_drop' && (
              <div className="space-y-3">
                <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Danh sách mục (Theo thứ tự đúng)</label>
                {editingQuestion.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2 text-sm font-bold text-slate-400">{i + 1}.</span>
                    <input
                      className="flex-1 p-2 border rounded-lg"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...editingQuestion.items];
                        newItems[i] = e.target.value;
                        updateField('items', newItems);
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const nextItems = [...editingQuestion.items, 'Mục mới'];
                    updateField('items', nextItems);
                    updateField('correctOrder', nextItems.map((_, idx) => idx));
                  }}
                  className="text-base text-blue-600 font-bold"
                >+ Thêm mục</button>
              </div>
            )}

            {editingQuestion.type === 'hotspot' && (
              <div className="space-y-4 text-base">
                <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2">
                  🎯 Bộ vẽ vùng Hotspot trực quan
                </label>
                <p className="text-xs text-slate-500 italic">
                  Nhấn và kéo chuột trên ảnh để vẽ vùng chọn. Chọn đáp án đúng bằng nút tròn bên dưới.
                </p>

                {/* Khu vực ảnh + vẽ vùng */}
                {editingQuestion.image && isImageUrl(editingQuestion.image) ? (
                  <div
                    className="relative inline-block border-4 border-slate-200 rounded-2xl overflow-hidden cursor-crosshair select-none"
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const startX = ((e.clientX - rect.left) / rect.width) * 100;
                      const startY = ((e.clientY - rect.top) / rect.height) * 100;

                      // Tạo overlay tạm khi kéo
                      const overlay = document.createElement('div');
                      overlay.style.cssText = `position:absolute;border:2px dashed #3b82f6;background:rgba(59,130,246,0.15);pointer-events:none;z-index:50;border-radius:6px;`;
                      e.currentTarget.appendChild(overlay);
                      const container = e.currentTarget;

                      const onMouseMove = (ev) => {
                        const curX = ((ev.clientX - rect.left) / rect.width) * 100;
                        const curY = ((ev.clientY - rect.top) / rect.height) * 100;
                        const x = Math.min(startX, curX);
                        const y = Math.min(startY, curY);
                        const w = Math.abs(curX - startX);
                        const h = Math.abs(curY - startY);
                        overlay.style.left = `${x}%`;
                        overlay.style.top = `${y}%`;
                        overlay.style.width = `${w}%`;
                        overlay.style.height = `${h}%`;
                      };

                      const onMouseUp = (ev) => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);

                        const endX = ((ev.clientX - rect.left) / rect.width) * 100;
                        const endY = ((ev.clientY - rect.top) / rect.height) * 100;
                        const x = Math.max(0, Math.min(startX, endX));
                        const y = Math.max(0, Math.min(startY, endY));
                        const w = Math.min(100 - x, Math.abs(endX - startX));
                        const h = Math.min(100 - y, Math.abs(endY - startY));

                        // Chỉ thêm nếu vùng đủ lớn (>2%)
                        if (w > 2 && h > 2) {
                          const newHotspot = {
                            x: Math.round(x * 10) / 10,
                            y: Math.round(y * 10) / 10,
                            width: Math.round(w * 10) / 10,
                            height: Math.round(h * 10) / 10,
                          };
                          const currentHotspots = editingQuestion.hotspots || [];
                          updateField('hotspots', [...currentHotspots, newHotspot]);
                        }
                      };

                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                    }}
                  >
                    <img
                      src={editingQuestion.image}
                      alt="Hotspot preview"
                      className="block max-w-full"
                      draggable={false}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    />

                    {/* Hiển thị các vùng đã vẽ */}
                    {(editingQuestion.hotspots || []).map((hs, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${hs.x}%`,
                          top: `${hs.y}%`,
                          width: `${hs.width}%`,
                          height: `${hs.height}%`,
                          border: (editingQuestion.correctAnswers || []).includes(idx)
                            ? '3px solid #22c55e'
                            : '2px dashed #3b82f6',
                          backgroundColor: (editingQuestion.correctAnswers || []).includes(idx)
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '8px',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '-10px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#fff',
                          backgroundColor: (editingQuestion.correctAnswers || []).includes(idx) ? '#22c55e' : '#3b82f6',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        }}>
                          {idx + 1}
                        </span>
                        {(editingQuestion.correctAnswers || []).includes(idx) && (
                          <span style={{ fontSize: '20px', color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl text-center text-slate-400 text-sm">
                    ⬆️ Vui lòng nhập URL ảnh ở mục "Ảnh minh họa" phía trên để bắt đầu vẽ vùng hotspot
                  </div>
                )}

                {/* Danh sách vùng + chọn đáp án đúng */}
                {(editingQuestion.hotspots || []).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <label className="block text-sm font-black uppercase text-slate-500 tracking-wider">
                      Danh sách vùng ({(editingQuestion.hotspots || []).length} vùng) — Chọn các đáp án đúng:
                    </label>
                    {(editingQuestion.hotspots || []).map((hs, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${(editingQuestion.correctAnswers || []).includes(idx)
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                        } text-sm`}>
                        <input
                          type="checkbox"
                          name="hotspot_correct"
                          checked={(editingQuestion.correctAnswers || []).includes(idx)}
                          onChange={(e) => {
                            const current = editingQuestion.correctAnswers || [];
                            const next = e.target.checked ? [...current, idx] : current.filter(x => x !== idx);
                            updateField('correctAnswers', next);
                          }}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <span className={`font-bold ${(editingQuestion.correctAnswers || []).includes(idx) ? 'text-emerald-700' : 'text-slate-500'
                          }`}>
                          Vùng #{idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-1">
                          X:{Math.round(hs.x)}% Y:{Math.round(hs.y)}% | {Math.round(hs.width)}×{Math.round(hs.height)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHotspot(idx)}
                          className="text-xs text-rose-400 hover:text-rose-600 font-bold px-2 py-1 rounded hover:bg-rose-50 transition"
                        >
                          ✕ Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nút thêm vùng thủ công */}
                <button
                  type="button"
                  onClick={handleAddHotspot}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition border border-blue-200"
                >
                  + Thêm vùng thủ công
                </button>
              </div>
            )}

            {editingQuestion.type === 'fill_blank' && (
              <div className="text-base">
                <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Đáp án chính xác</label>
                <input
                  className="w-full p-3 border rounded-xl font-bold text-emerald-600 text-sm"
                  value={editingQuestion.answer}
                  onChange={(e) => updateField('answer', e.target.value)}
                  placeholder="Ví dụ: WAN"
                />
              </div>
            )}
          </div>

          {/* Giải thích */}
          <div>
            <label className="block text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Giải thích (Explanation)</label>
            <textarea
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm italic text-sm"
              value={editingQuestion.explanation}
              onChange={(e) => updateField('explanation', e.target.value)}
              placeholder="Giải thích tại sao đáp án này đúng..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg text-sm ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200'
              }`}
          >
            {loading ? 'Đang xử lý...' : (isEditingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi vào hệ thống')}
          </button>
          {isEditingQuestion && (
            <button
              onClick={() => {
                setEditingQuestion(getInitialState(editingQuestion.type));
                setIsEditingQuestion(false);
              }}
              className="w-full py-3 rounded-2xl font-bold uppercase tracking-widest transition-all text-slate-600 hover:bg-slate-100"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Drawer Danh sách câu hỏi (Slide-out) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="relative w-screen max-w-md animate-in slide-in-from-left duration-300">
              <div className="h-full flex flex-col bg-white shadow-2xl rounded-r-[40px] overflow-hidden border-r border-slate-200">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Danh sách câu hỏi</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {currentQuizQuestions.length} câu hỏi hiện có
                    </p>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi..."
                    value={questionSearchTerm}
                    onChange={(e) => setQuestionSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 text-base border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {currentQuizQuestions.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 italic text-base">Trống</div>
                  ) : (
                    (() => {
                      const filtered = currentQuizQuestions.filter(q =>
                        !questionSearchTerm || (q.text || '').toLowerCase().includes(questionSearchTerm.toLowerCase())
                      );
                      if (filtered.length === 0) {
                        return <div className="text-center py-20 text-slate-400 italic">Không tìm thấy câu hỏi tương thích</div>;
                      }
                      return filtered.map((q) => {
                        const originalIndex = currentQuizQuestions.findIndex(x => x.id === q.id);
                        return (
                          <div key={q.id} className="p-5 border border-slate-100 rounded-[24px] bg-white shadow-sm hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                            <p className="text-base text-slate-700 font-medium leading-relaxed truncate">
                              <span className="text-blue-500 font-bold mr-2">{originalIndex + 1}.</span> {q.text ? <HtmlInline content={q.text} /> : <span className="italic text-slate-400">Chưa có nội dung</span>}
                            </p>
                            <div className="mt-4 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => handleEditQuestion(q)} className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all">
                                Sửa
                              </button>
                              <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all">
                                Xóa
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cột phải: Live Preview */}
      <div className="flex-1 hidden lg:block">
        <div className="sticky top-8">
          <div className="flex items-center gap-2 mb-4 px-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Bản xem trước thực tế</h2>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden">
            <AdminQuestionPreview rawJson={editingQuestion} />
          </div>
          <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              <strong>Lưu ý:</strong> Giao diện xem trước sử dụng đúng các Component Renderer mà học viên sẽ thấy. Hãy kiểm tra kỹ định dạng hiển thị trước khi lưu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
