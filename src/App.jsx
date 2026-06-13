import React, { useState, useEffect, useMemo } from 'react'
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
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Hệ thống IC3 Quizz</p>
                  <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900">Chọn phương thức học</h1>
                  <p className="mt-4 text-sm text-slate-600 sm:text-base">Chọn chế độ phù hợp nhất với mục tiêu của bạn: học từng bước hay thi thử theo đúng thời gian.</p>
                </div>

                {/* Tabs chuyển đổi */}
                <div className="flex justify-center gap-4 mt-10 border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                      activeTab === 'quizzes'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Danh sách bài tập
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                      activeTab === 'history'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Lịch sử học tập
                  </button>
                </div>

                {activeTab === 'history' ? (
                  <div className="mt-10">
                    <History onReviewAttempt={setReviewingAttempt} userId={currentUser.uid} />
                  </div>
                ) : (
                  <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2">
                    {modeOptions.map(mode => (
                      <button
                        key={mode.key}
                        disabled={loading}
                        onClick={() => { setSelectedMode(mode.key); setQuizSearchTerm(''); }}
                        className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-6 sm:p-8 text-left text-white shadow-[0_20px_40px_rgba(15,23,42,0.14)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.18)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
                        <div className="relative">
                          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-slate-200">{mode.key === 'practice' ? 'Tự học' : 'Thử thách'}</span>
                          <p className="mt-6 text-3xl font-semibold text-white sm:text-4xl">{mode.label}</p>
                          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{mode.description}</p>
                          <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                            <span className="block h-2.5 w-2.5 rounded-full bg-blue-400" />
                            Bắt đầu ngay
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* BƯỚC 2: CHỌN CẤP ĐỘ VÀ BÀI THI */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-blue-600">{selectedMode === 'practice' ? 'Luyện tập' : 'Kiểm tra'}</p>
                      <h2 className="mt-3 text-3xl font-bold text-slate-900">Danh sách bài tập</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Xem nhanh các đề theo chuyên đề. Nhấn vào bài để mở đề và bắt đầu làm ngay.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span>{Object.values(groupedQuizzes).flat().length} bài</span>
                      </div>
                      <button
                        onClick={() => { setSelectedMode(null); setQuizSearchTerm(''); }}
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                      >
                        ← Đổi chế độ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Tìm kiếm nhanh</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Lọc theo tên hoặc chuyên đề</h3>
                      </div>
                      <div className="w-full sm:max-w-sm">
                        <input
                          type="text"
                          placeholder="Tìm bài thi..."
                          value={quizSearchTerm}
                          onChange={(e) => setQuizSearchTerm(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  {Object.keys(groupedQuizzes).sort().map(cat => (
                    <div key={cat} className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Chuyên đề</p>
                          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{cat}</h3>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">{groupedQuizzes[cat].length} đề</span>
                      </div>
                              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                          {groupedQuizzes[cat].map(quiz => (
                            <button
                              key={quiz.id}
                              onClick={() => setSelectedQuiz(quiz)}
                              className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                            >
                              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
                              <div className="relative space-y-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{quiz.category || 'Chuyên đề'}</span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{quiz.questions?.length || 0} câu</span>
                                </div>
                                <h4 className="text-lg font-semibold text-slate-900">{quiz.title}</h4>
                                <p className="min-h-[3rem] text-sm leading-6 text-slate-600">{quiz.summary || 'Luyện tập với bộ câu hỏi chuyên sâu.'}</p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    {quiz.duration || 0} phút
                                  </span>
                                  <span className="inline-flex items-center gap-2 font-semibold text-blue-600">Bắt đầu →</span>
                                </div>
                              </div>
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
                    className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-10 py-4 text-sm font-semibold text-white shadow-xl transition hover:bg-blue-700 sm:w-auto"
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
