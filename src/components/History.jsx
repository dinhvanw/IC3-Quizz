import React, { useEffect, useState } from 'react'

const LOCAL_HISTORY_KEY = 'ic3-quizz-history'

function getStoredHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export default function History({ onReviewAttempt }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    setHistory(getStoredHistory())
  }, [])

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử làm bài không?')) {
      localStorage.removeItem(LOCAL_HISTORY_KEY)
      setHistory([])
    }
  }

  if (history.length === 0) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Chưa có lịch sử làm bài</h2>
        <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">Hãy thực hiện luyện tập hoặc kiểm tra các bài thi. Kết quả bài thi của bạn sẽ xuất hiện tại đây.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch sử làm bài</h2>
          <p className="text-sm text-slate-400 font-medium">Lưu tối đa 10 lượt làm bài gần nhất của bạn</p>
        </div>
        <button
          onClick={handleClearHistory}
          className="px-3 py-1.5 border border-rose-200 text-rose-600 bg-rose-50 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition"
        >
          Xóa lịch sử
        </button>
      </div>

      <div className="space-y-4">
        {history.map((item, index) => {
          const isPassed = item.score >= 70;
          return (
            <div
              key={`${item.quizId}-${item.date}-${index}`}
              className="rounded-2xl border border-slate-150 bg-slate-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
            >
              <div className="space-y-1.5 text-base">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                  {item.mode === 'practice' ? 'Luyện tập' : 'Kiểm tra'}
                </span>
                <h3 className="font-bold text-slate-800 text-base">{item.quizTitle}</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Đúng {item.correctCount} / {item.total} câu · {new Date(item.date).toLocaleString('vi-VN')}
                  {item.timedOut && <span className="text-rose-600 font-bold ml-1">· Hết giờ</span>}
                </p>
              </div>

              <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                <div className="text-right">
                  <p className="text-sm text-slate-400 font-bold uppercase">Điểm số</p>
                  <p className={`text-2xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.score}%
                  </p>
                </div>
                {item.answers && (
                  <button
                    onClick={() => onReviewAttempt(item)}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition shadow-sm"
                  >
                    Xem bài làm
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
