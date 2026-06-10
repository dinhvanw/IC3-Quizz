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

  const groupedQuizzes = quizzes.reduce((groups, quiz) => {
    const category = quiz.category || 'Khác'
    if (!groups[category]) groups[category] = []
    groups[category].push(quiz)
    return groups
  }, {})

  const categoryKeys = Object.keys(groupedQuizzes).sort((a, b) => a.localeCompare(b, 'vi'))

  return (
    <section className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl shadow-slate-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Danh sách bài thi</p>
            <h2 className="mt-3 text-3xl font-bold">Chọn bài luyện tập theo danh mục</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Hiển thị các bài thi theo từng danh mục, giúp bạn dễ so sánh số câu, thời lượng và chọn nhanh bài phù hợp.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 ring-1 ring-white/10">
            <span className={`inline-flex h-3.5 w-3.5 rounded-full ${selectedMode === 'practice' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {modeLabel[selectedMode]}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-sm">
          <p className="text-slate-600 text-base">Đang tải dữ liệu từ Firebase...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600 text-base">Chưa có bài thi. Vui lòng tạo dữ liệu trong Firestore.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {categoryKeys.map(category => (
            <div key={category} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{category}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{category}</h3>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {groupedQuizzes[category].length} bài thi
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedQuizzes[category].map(quiz => (
                  <article key={quiz.id} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-5 text-white">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{quiz.category || 'Khác'}</p>
                      <h4 className="mt-3 text-xl font-semibold tracking-tight">{quiz.title}</h4>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{quiz.summary}</p>
                    </div>
                    <div className="p-5">
                      <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                          {quiz.questions?.length || 0} câu
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          {quiz.duration} phút
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => onSelect(quiz)}
                          className="min-w-[140px] rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Bắt đầu
                        </button>
                        <span className="text-xs uppercase tracking-[0.28em] text-slate-500">{selectedMode === 'practice' ? 'Luyện tập' : 'Kiểm tra'}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
