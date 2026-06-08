import React, { useState, useEffect } from 'react'
import { fetchAllQuizzes } from '../services/quizService'

const modeLabel = {
  practice: 'Luyện tập',
  exam: 'Kiểm tra'
}

export default function QuizList({ selectedMode, onSelect }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuizzes() {
      const data = await fetchAllQuizzes()
      setQuizzes(data.length > 0 ? data : [])
      setLoading(false)
    }
    loadQuizzes()
  }, [])

  return (
    <section className="space-y-8">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${selectedMode === 'practice' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <span className="font-semibold text-slate-700">
            Đang hiển thị bài thi cho chế độ: {modeLabel[selectedMode]}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">
          <p className="text-slate-600 text-base">Đang tải dữ liệu từ Firebase...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-600 text-base">Chưa có bài thi. Vui lòng tạo dữ liệu trong Firestore.</p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-4">
          {quizzes.map(quiz => (
            <article key={quiz.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{quiz.category}</p>
                <h3 className="mt-3 text-xl font-semibold">{quiz.title}</h3>
                <p className="mt-2 text-base text-slate-300">{quiz.summary}</p>
              </div>
              <div className="p-5 space-y-4 text-base">
                <div className="flex items-center justify-between text-base text-slate-600">
                  <span>{quiz.questions.length} câu hỏi</span>
                  <span>{quiz.duration} phút</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onSelect(quiz)}
                    className="w-full rounded-2xl py-3 bg-slate-900 text-white font-semibold text-base hover:bg-slate-800 transition"
                  >
                    Bắt đầu bài thi {modeLabel[selectedMode]}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Phù hợp cho chế độ {selectedMode === 'practice' ? 'Luyện tập' : 'Kiểm tra'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
