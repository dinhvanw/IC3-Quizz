import React, { useEffect, useMemo, useState, useCallback } from 'react'
import Results from './Results.jsx'
import QuestionRenderer from './QuestionRenderer.jsx'
import { checkAnswer } from '../utils/quizUtils.js'
import { sanitizeHtml } from '../utils/htmlRenderer.jsx'

const modeLabels = {
  practice: 'Luyện tập',
  exam: 'Kiểm tra'
}

const LOCAL_HISTORY_KEY = 'ic3-quizz-history'

function getStoredHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(entry) {
  const current = getStoredHistory()
  current.unshift(entry)
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(current.slice(0, 10)))
}

export default function Quiz({ quiz, mode, onExit }) {
  const questions = quiz?.questions || [];
  
  const [index, setIndex] = useState(0)
  const [maxIndex, setMaxIndex] = useState(0)
  const [answers, setAnswers] = useState(Array(questions.length).fill(null))
  const [marked, setMarked] = useState(Array(questions.length).fill(false))
  const [finished, setFinished] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [locked, setLocked] = useState(Array(questions.length).fill(false))
  const [remaining, setRemaining] = useState(quiz.duration * 60)
  const [timedOut, setTimedOut] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)

  // Các state tiện ích mới
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [fontSizeClass, setFontSizeClass] = useState('text-lg')

  // Hook useMemo phải được đặt TRƯỚC mọi câu lệnh return có điều kiện
  const timerLabel = useMemo(() => {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
    const seconds = String(remaining % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [remaining]);

  useEffect(() => {
    if (index > maxIndex) {
      setMaxIndex(index)
    }
  }, [index, maxIndex])

  useEffect(() => {
    if (mode !== 'exam' || finished) return undefined
    const id = window.setInterval(() => {
      setRemaining(cur => {
        if (cur <= 1) {
          window.clearInterval(id)
          setTimedOut(true)
          setFinished(true)
          return 0
        }
        return cur - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [mode, finished])

  useEffect(() => {
    if (!finished) return
    const correctCount = questions.reduce((acc, q, idx) => acc + (checkAnswer(answers[idx], q) ? 1 : 0), 0)
    const score = Math.round((correctCount / questions.length) * 100)
    saveHistory({
      quizId: quiz.id,
      quizTitle: quiz.title,
      mode,
      score,
      correctCount,
      total: questions.length,
      date: new Date().toISOString(),
      timedOut,
      answers, // Lưu mảng đáp án phục vụ Review Mode
      questions, // Lưu snapshot câu hỏi phục vụ Review Mode
    })
  }, [finished, answers, mode, questions, quiz.id, quiz.title, timedOut])

  function selectChoice(value) {
    // Ngăn chặn sửa đáp án của các câu đã trả lời trong chế độ kiểm tra
    if (locked[index]) return
    const q = questions[index]

    setAnswers(prev => {
      const next = [...prev]
      if (q.type === 'multiple_select' || q.type === 'hotspot') {
        const current = Array.isArray(next[index]) ? next[index] : []
        if (current.includes(value)) {
          next[index] = current.filter(v => v !== value)
        } else {
          // Hỗ trợ giới hạn số lượng lựa chọn (maxChoices)
          if (!q.maxChoices || current.length < q.maxChoices) {
            next[index] = [...current, value]
          }
        }
      } else {
        next[index] = value
      }
      return next
    })

    if (mode === 'practice') {
      setShowFeedback(false)
    }
  }

  // Hàm hỗ trợ kiểm tra nếu một câu hỏi có thể được quay lại trong exam mode
  function canGoBack() {
    return mode === 'practice'
  }

  function resetQuestion() {
    if (locked[index]) return

    const next = [...answers]
    next[index] = null
    setAnswers(next)
    setShowFeedback(false)
  }

  function toggleMark() {
    if (locked[index]) return

    const next = [...marked]
    next[index] = !next[index]
    setMarked(next)
  }

  function next() {
    const hasSelection = answers[index] !== null
    const isLast = index === questions.length - 1

    if (mode === 'practice') {
      if (!hasSelection) return
      if (!showFeedback && !locked[index]) {
        setShowFeedback(true)
        return
      }
      if (!isLast) {
        // lock this question if it was answered
        if (answers[index] !== null) {
          setLocked(prev => { const n = [...prev]; n[index] = true; return n })
        }
        setIndex(i => i + 1)
        setShowFeedback(false)
      } else {
        setFinished(true)
      }
      return
    }

    if (!isLast) {
      setLocked(prev => { const n = [...prev]; n[index] = true; return n })
      setIndex(i => i + 1)
      setShowFeedback(false)
    } else {
      setFinished(true)
    }
  }

  function prev() {
    // Trong chế độ kiểm tra, không cho phép quay lại câu trước đó
    if (!canGoBack()) return
    
    if (index > 0) {
      setIndex(i => i - 1)
      setShowFeedback(false)
    }
  }

  function skip() {
    if (index < questions.length - 1) {
      if (mode === 'exam') {
        setLocked(prev => { const n = [...prev]; n[index] = true; return n })
      }
      setIndex(i => i + 1)
      setShowFeedback(false)
    } else {
      setFinished(true)
    }
  }

  function submit() {
    setFinished(true)
    // lock all answered questions so they become read-only
    setLocked(prev => prev.map((v, idx) => answers[idx] !== null ? true : v))
  }

  const handleToggleFontSize = () => {
    setFontSizeClass(curr => {
      if (curr === 'text-base') return 'text-lg';
      if (curr === 'text-lg') return 'text-xl';
      return 'text-base';
    });
  };



  if (finished) {
    return (
      <Results
        quiz={quiz}
        answers={answers}
        mode={mode}
        timedOut={timedOut}
        onRetry={() => {
          setAnswers(Array(questions.length).fill(null));
          setIndex(0);
          setMaxIndex(0);
          setFinished(false);
          setShowFeedback(false);
          setRemaining(quiz.duration * 60);
          setTimedOut(false)
        }}
        onExit={onExit}
      />
    )
  }

  // Early exit if no questions are available
  if (!quiz || questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen md:min-h-[600px] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden items-center justify-center">
        <p className="text-slate-500 font-medium text-lg mb-4">Không tìm thấy câu hỏi nào để hiển thị.</p>
        <button onClick={onExit} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">Quay lại</button>
      </div>
    );
  }

  // Now we are sure that 'questions' array is not empty and 'quiz' is defined
  const q = questions[index]
  const selected = answers[index]
  const isPractice = mode === 'practice'
  const hasSelection = selected !== null && selected !== undefined && (Array.isArray(selected) ? selected.length > 0 : selected !== '')
  const isCorrect = hasSelection && checkAnswer(selected, q)
  const showCorrect = isPractice && (showFeedback || locked[index])

  return (
    <div className="flex flex-col min-h-screen md:min-h-[600px] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Top Navigation Bar - Chứa các nút Trước, Đặt lại, List... */}
      <header className="bg-white text-slate-900 py-2 sm:py-3 px-[20px] flex flex-wrap items-center justify-between gap-2 sm:gap-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={index === 0 || !canGoBack()}
            title={mode === 'exam' ? 'Không thể quay lại trong chế độ kiểm tra' : ''}
            className={`px-2 sm:px-4 py-1.5 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition ${(index > 0 && canGoBack()) ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 hover:bg-slate-700'
              }`}
          >
            Trước
          </button>
          <button
            onClick={resetQuestion}
            disabled={locked[index]}
            className="px-2 sm:px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition"
          >
            Đặt lại
          </button>
          <div className="ml-4 text-sm tabular-nums">
            {index + 1} / {questions.length}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setIsMapOpen(true)}
            className="flex items-center justify-center p-2 rounded hover:bg-slate-100 text-slate-600 transition"
            title="Bản đồ câu hỏi"
          >
            <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <button
            onClick={handleToggleFontSize}
            className="flex items-center justify-center p-2 rounded hover:bg-slate-100 text-slate-600 transition"
            title="Cỡ chữ"
          >
            <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center justify-center p-2 rounded hover:bg-slate-100 text-slate-600 transition"
            title="Trợ giúp"
          >
            <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <label className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded text-slate-600 cursor-pointer select-none hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={marked[index]}
              onChange={toggleMark}
              className="h-4 w-4 rounded bg-white border-slate-300 text-sky-500"
            />
            <span className="text-xs font-medium">Mark For Review</span>
          </label>
          <button
            onClick={skip} // "Skip" button is now separate
            disabled={index === questions.length - 1} // Disable skip on last question
             className="px-2 sm:px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs sm:text-sm font-medium transition shadow-lg shadow-sky-900/20" // Changed color for clarity
          >
            Bỏ qua
          </button>
          <button
            onClick={() => {
              if (mode === 'exam' && index === questions.length - 1) {
                setShowSubmitConfirmation(true);
              } else {
                next();
              }
            }}
            // The "Tiếp" button is now the outermost on the right
            // It will display "Nộp bài" if it's the last question in exam mode
            className="px-2 sm:px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition"
          >
            {mode === 'exam' && index === questions.length - 1 ? 'Nộp bài' : 'Tiếp'}
          </button>
        </div>
      </header>

      {/* Main Content Area - Trải rộng 2 bên với margin 20px, nhích lên gần header */}
      <div className="flex-1 overflow-y-auto pt-2 pb-6 px-[20px]">
        <div className="w-full">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-700 ease-in-out"
                style={{ width: `${((maxIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            {mode === 'exam' && (
              <span className="text-sm font-bold text-rose-600 min-w-[50px]">{timerLabel}</span>
            )}
          </div>

          {/* Question Text */}
          <div className="mx-[-20px] px-[20px] pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-200">
            <h2
              className={`text-slate-900 font-normal leading-relaxed text-justify ${fontSizeClass}`}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }}
            />
          </div>

          {/* Question Image (minh họa) */}
          {q.image && q.type !== 'hotspot' && (
            <div className="mb-6 flex justify-center px-4">
              <img src={q.image} alt="Minh họa câu hỏi" className="max-h-64 rounded-2xl border border-slate-200 shadow-sm object-contain bg-white" />
            </div>
          )}

          {/* Question Renderer */}
          <div className="mb-0">
            <QuestionRenderer
              question={q}
              selected={selected}
              onSelect={selectChoice}
              isLocked={locked[index]}
              showCorrect={showCorrect}
            />
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 p-4 text-center">
        <div className="text-xs text-slate-400 font-medium tracking-widest">
          Copyright by Mr. Tran Dinh Van
        </div>
      </footer>

      {/* Drawer Bản đồ câu hỏi */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsMapOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-sm animate-in slide-in-from-right duration-300">
              <div className="h-full flex flex-col bg-white shadow-2xl rounded-l-[32px] overflow-hidden border-l border-slate-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Bản đồ câu hỏi</h3>
                    <p className="text-xs text-slate-500">Nhấp vào câu hỏi để chuyển nhanh</p>
                  </div>
                  <button
                    onClick={() => setIsMapOpen(false)}
                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  <div className="grid grid-cols-3 gap-2 mb-6 text-[10px] font-bold text-center">
                    <div className="p-2 rounded bg-sky-100 text-sky-700">Đã trả lời</div>
                    <div className="p-2 rounded bg-amber-100 text-amber-700">Xem lại</div>
                    <div className="p-2 rounded bg-slate-200 text-slate-700">Chưa làm</div>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {questions.map((_, qIdx) => {
                      const isAnswered = answers[qIdx] !== null && answers[qIdx] !== undefined && answers[qIdx] !== '';
                      const isMarked = marked[qIdx];
                      const isCurrent = index === qIdx;
                      const isPreviousQuestion = mode === 'exam' && qIdx < index;

                      let bgClass = "bg-slate-100 border-slate-200 text-slate-700";
                      if (isAnswered) bgClass = "bg-sky-500 border-sky-600 text-white shadow-sm";
                      if (isMarked) bgClass = "bg-amber-500 border-amber-600 text-white shadow-sm";
                      if (isPreviousQuestion) bgClass = "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed";

                      return (
                        <button
                          key={qIdx}
                          disabled={isPreviousQuestion}
                          onClick={() => {
                            if (isPreviousQuestion) return;
                            setIndex(qIdx);
                            setIsMapOpen(false);
                          }}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm transition-all hover:scale-105 active:scale-95 ${bgClass} ${isCurrent ? 'ring-4 ring-offset-2 ring-blue-500' : ''
                            }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Trợ giúp */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-2xl max-w-lg w-full mx-4 space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                💡
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hướng dẫn làm bài thi</h3>
                <p className="text-xs text-slate-500">Mẹo và luật thi trắc nghiệm IC3</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 overflow-y-auto max-h-96 pr-2">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">1. Hai chế độ học tập</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>Chế độ Luyện tập:</strong> Cho phép kiểm tra kết quả ngay lập tức bằng nút "Tiếp". Khi trả lời sai, bạn sẽ thấy đáp án đúng và phần giải thích chi tiết.</li>
                  <li><strong>Chế độ Kiểm tra:</strong> Thực hiện làm bài dưới áp lực thời gian đếm ngược. Điểm số chỉ được chấm sau khi bạn bấm "Nộp bài" hoặc hết giờ.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">2. Thanh điều hướng và Phím chức năng</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>Trước / Tiếp:</strong> Di chuyển giữa các câu hỏi liền kề.</li>
                  <li><strong>Đặt lại:</strong> Xóa câu trả lời hiện tại để chọn lại từ đầu (chỉ khi câu hỏi chưa bị khóa).</li>
                  <li><strong>Bỏ qua:</strong> Nhảy qua câu hỏi tiếp theo mà không lưu đáp án tạm thời.</li>
                  <li><strong>Mark For Review:</strong> Đánh dấu câu hỏi cần xem xét lại. Câu hỏi bị đánh dấu sẽ hiển thị màu cam trong Bản đồ câu hỏi để dễ tìm kiếm.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">3. Các nút tiện ích ở Header</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>Bản đồ câu hỏi (Lưới):</strong> Mở danh sách câu hỏi dạng lưới để chuyển nhanh đến bất kỳ câu nào.</li>
                  <li><strong>Cỡ chữ (Chữ A):</strong> Thay đổi kích thước chữ câu hỏi giữa 3 mức để phù hợp tầm mắt.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Nộp bài */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-2xl max-w-md w-full mx-4 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900">
                Bạn đã hoàn thành tất cả các câu hỏi. Bấm "Xác nhận" để nộp bài thi và xem điểm số.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirmation(false);
                  submit();
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-500 transition"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
