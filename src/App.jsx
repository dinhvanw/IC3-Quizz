import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Quiz from './components/Quiz'
import History from './components/History'
import Results from './components/Results'
import { prepareQuizForMode } from './utils/quizUtils'
import { fetchAllQuizzes } from './services/quizService'

const modeOptions = [
  { key: 'practice', label: 'Luyện tập', description: 'Xem ngay phản hồi câu trả lời và chỉnh sửa từng câu.' },
  { key: 'exam', label: 'Kiểm tra', description: 'Làm bài theo định dạng kiểm tra, chỉ chấm sau khi nộp.' }
]

export default function App(){
  const navigate = useNavigate()
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [preparedQuiz, setPreparedQuiz] = useState(null) // New state for the quiz after shuffling
  const [userAnswers, setUserAnswers] = useState([]) // New state for user answers
  const [selectedMode, setSelectedMode] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('quizzes')
  const [reviewingAttempt, setReviewingAttempt] = useState(null)
  const [quizSearchTerm, setQuizSearchTerm] = useState('')
  // Tạo user giả vì hệ thống không dùng đăng nhập nhưng Component History vẫn yêu cầu userId
  const currentUser = { uid: 'guest_user' };

  // Nhóm các bài thi theo Category (GS6 LV1, GS6 LV2...) và lọc theo từ khóa tìm kiếm
  const groupedQuizzes = useMemo(() => {
    const groups = {};
    const filtered = quizzes.filter(q => 
      !quizSearchTerm || 
      (q.title || '').toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
      (q.category || '').toLowerCase().includes(quizSearchTerm.toLowerCase())
    );
    filtered.forEach(q => {
      const cat = q.category || 'Khác';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    });
    return groups;
  }, [quizzes, quizSearchTerm]);

  // Load quizzes ngay lập tức (không cần đăng nhập)
  useEffect(() => {
    async function loadQuizzes() {
      const data = await fetchAllQuizzes()
      setQuizzes(data)
      setLoading(false)
    }
    loadQuizzes()
  }, [])

  // Effect to prepare the quiz for the selected mode
  useEffect(() => {
    if (selectedQuiz && selectedMode) {
      const { newQuiz, reorderedAnswers } = prepareQuizForMode(selectedQuiz, selectedMode, userAnswers);
      setPreparedQuiz(newQuiz);
      setUserAnswers(reorderedAnswers);
    }
  }, [selectedQuiz, selectedMode]); // Only re-prepare when quiz or mode changes

  function handleStartPractice() {
    if (quizzes.length === 0) return

    const allQuestions = quizzes.flatMap(q => q.questions || [])
    const combinedQuiz = {
      id: 'combined-practice',
      title: 'Luyện tập Tổng hợp',
      category: 'IC3 All-in-one',
      summary: 'Tất cả câu hỏi từ hệ thống được gộp lại để luyện tập.',
      duration: quizzes.reduce((acc, q) => acc + (q.duration || 0), 0),
      questions: allQuestions
    }
    setSelectedMode('practice');
    setSelectedQuiz(combinedQuiz); // This will trigger the useEffect above
  }

  function handleStartExam() {
    if (quizzes.length === 0) return

    const allQuestions = quizzes.flatMap(q => q.questions || [])
    const combinedQuiz = {
      id: 'combined-exam',
      title: 'Kiểm tra Tổng hợp',
      category: 'IC3 Exam All-in-one',
      summary: 'Bài thi tổng hợp từ tất cả các phần kiến thức.',
      duration: quizzes.reduce((acc, q) => acc + (q.duration || 0), 0),
      questions: allQuestions
    }
    setSelectedMode('exam');
    setSelectedQuiz(combinedQuiz); // This will trigger the useEffect above
  }

  function resetSelection(){
    setSelectedQuiz(null)
    setPreparedQuiz(null) // Reset prepared quiz
    setSelectedMode(null)
  }

    // User Header Component (simplified - không cần login)
  const UserHeaderBar = () => (
    <div className="user-header">
      <div className="user-avatar">IC</div>
      <div className="user-info">
        <span className="user-name">IC3 Quiz System</span>
        <span className="user-email">Tracacng bài kiểm tra trực tuyến</span>
      </div>
    </div>
  )

  // Nếu đang ở chế độ Admin, hiển thị Dashboard
  // Chuyển hướng đến /admin bằng route instead of view state

  if (reviewingAttempt) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <main className="max-w-6xl mx-auto px-4 py-10">
          <Results
            quiz={{
              id: reviewingAttempt.quizId,
              title: reviewingAttempt.quizTitle,
              questions: reviewingAttempt.questions || []
            }}
            answers={reviewingAttempt.answers}
            mode={reviewingAttempt.mode}
            timedOut={reviewingAttempt.timedOut}
            onExit={() => setReviewingAttempt(null)}
            onRetry={null}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-10">
        {!selectedQuiz ? (
          <section className="rounded-2xl sm:rounded-[40px] border border-slate-200 bg-white p-6 sm:p-10 shadow-[0_40px_80px_rgba(15,23,42,0.08)]">
            {!selectedMode ? (
              /* BƯỚC 1: CHỌN CHẾ ĐỘ */
              <>
                {/* Header bar with user info and admin button */}
                <div className="flex items-center justify-between mb-6">
                  <UserHeaderBar />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition text-xs font-bold"
                      title="Quản lý câu hỏi (Admin)"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      Quản trị
                    </button>
                  </div>
                </div>

                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Hệ thống IC3 Quizz</p>
                  <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900">Chọn phương thức học</h1>
                </div>

                {/* Tabs chuyển đổi */}
                <div className="flex justify-center gap-4 mt-8 border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
                      activeTab === 'quizzes' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Danh sách bài tập
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
                      activeTab === 'history' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Lịch sử học tập
                  </button>
                </div>

                {activeTab === 'history' ? (
                  <div className="mt-8">
                    <History onReviewAttempt={setReviewingAttempt} userId={currentUser.uid} />
                  </div>
                ) : (
                  <div className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-2">
                    {modeOptions.map(mode => (
                      <button
                        key={mode.key}
                        disabled={loading}
                        onClick={() => { setSelectedMode(mode.key); setQuizSearchTerm(''); }}
                        className={`group rounded-[28px] border border-slate-200 bg-slate-950 px-8 py-10 text-left text-white shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.18)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{mode.key === 'practice' ? 'Tự học' : 'Thử thách'}</p>
                        <p className="mt-4 text-4xl font-semibold text-white">{mode.label}</p>
                        <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">{mode.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* BƯỚC 2: CHỌN CẤP ĐỘ VÀ BÀI THI */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Danh sách bài tập</h2>
                    <p className="text-slate-500 text-sm">Chế độ đang chọn: <span className="font-bold text-blue-600 uppercase">{selectedMode === 'practice' ? 'Luyện tập' : 'Kiểm tra'}</span></p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Tìm bài thi..."
                      value={quizSearchTerm}
                      onChange={(e) => setQuizSearchTerm(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-48"
                    />
                    <button 
                      onClick={() => { setSelectedMode(null); setQuizSearchTerm(''); }}
                      className="px-4 py-2 bg-slate-150 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition whitespace-nowrap"
                    >
                      ← Đổi chế độ
                    </button>
                  </div>
                </div>

                <div className="space-y-10">
                  {Object.keys(groupedQuizzes).sort().map(cat => (
                    <div key={cat} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">{cat}</h3>
                        <div className="flex-1 h-px bg-slate-200"></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {groupedQuizzes[cat].map(quiz => (
                          <button
                            key={quiz.id}
                            onClick={() => setSelectedQuiz(quiz)}
                            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all text-center group"
                          >
                            <span className="block text-xl font-bold text-slate-900 group-hover:text-blue-600">{quiz.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{quiz.questions?.length || 0} CÂU HỎI</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tùy chọn làm bài tổng hợp nếu cần */}
                <div className="pt-8 text-center">
                  <button 
                    onClick={selectedMode === 'practice' ? handleStartPractice : handleStartExam}
                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                  >
                    Làm bài TỔNG HỢP tất cả các phần
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : preparedQuiz ? ( // Render Quiz only if preparedQuiz is available
          <Quiz 
            quiz={preparedQuiz} 
            mode={selectedMode} 
            onExit={resetSelection}
            initialAnswers={userAnswers} // Pass reordered answers
            onAnswerChange={setUserAnswers} // Pass a setter for answers
          />
        ) : (
          <div className="text-center p-10">Đang tải câu hỏi...</div> // Loading state
        )}
      </main>
    </div>
  )
}
