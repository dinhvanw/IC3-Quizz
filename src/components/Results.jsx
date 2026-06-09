import React from 'react';
import { checkAnswer, formatAnswer } from '../utils/quizUtils.js';
import { sanitizeHtml } from '../utils/htmlRenderer.jsx';

export default function Results({ quiz, answers, mode, onRetry, onExit, timedOut }) {
  // Hàm bổ trợ để hiển thị đáp án đúng cho mọi loại câu hỏi
  const getCorrectAnswerDisplay = (q) => {
    const choices = q.choices || q.options || [];
    const columns = q.columns || q.labels || [];
    const rows = q.rows || q.devices || [];

    switch (q.type) {
      case 'multiple_choice':
      case 'single':
        return choices[q.answer] || q.answer;
      case 'multiple_select':
      case 'multiple':
        if (q.correctAnswers) return q.correctAnswers.map(i => choices[i]).join(', ');
        return Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
      case 'fill_blank':
        return q.answer;
      case 'TRUE_FALSE_MATRIX':
      case 'matrix_radio':
      case 'table':
        if (Array.isArray(q.answer)) {
          return rows.map((row, i) => `${row.text || row}: ${q.answer[i]}`).join(' | ');
        }
        return rows?.map(row => {
          const correctColIdx = q.answer?.[row.id];
          const colName = columns[correctColIdx];
          return `${row.text || row}: ${colName}`;
        }).join(' | ');
      case 'matching':
      case 'questionBox':
        if (typeof q.answer === 'object' && !Array.isArray(q.answer)) {
          return Object.entries(q.answer).map(([k, v]) => `${k} ↔ ${v}`).join(', ');
        }
        return (q.correctPairs || []).map(p => {
          const left = q.leftItems[p.l];
          const right = q.rightItems[p.r];
          const rightText = (typeof right === 'string' && (right.startsWith('http') || right.startsWith('data:image'))) ? `[Ảnh ${p.r + 1}]` : right;
          return `${left} ↔ ${rightText}`;
        }).join(', ');
      case 'drag_drop':
      case 'reorder':
        const items = q.items || q.options || [];
        if (q.correctOrder) return q.correctOrder.map(idx => items[idx]).join(' → ');
        return Array.isArray(q.answer) ? q.answer.join(' → ') : q.answer;
      case 'hotspot':
        const count = q.correctAnswers?.length || q.spots?.filter(s => s.correct).length || 0;
        return `Cần chọn đúng ${count} vùng mục tiêu trên hình ảnh`;
      default:
        return 'Vui lòng xem phần giải thích bên dưới.';
    }
  };

  const questions = quiz?.questions || [];
  
  // Tính toán số câu đúng an toàn hơn
  const correctCount = React.useMemo(() => {
    return questions.reduce((acc, q, idx) => {
      const ans = answers && answers[idx] !== undefined ? answers[idx] : null;
      return acc + (checkAnswer(ans, q) ? 1 : 0);
    }, 0);
  }, [questions, answers]);

  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const isPassed = score >= 70;

  // Tránh return null sớm để đảm bảo tính nhất quán của React Tree
  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center bg-white shadow-xl rounded-2xl my-10 border border-slate-200">
        <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu kết quả bài thi.</p>
        <button onClick={onExit} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl my-10 border border-slate-200">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Kết quả bài thi</h1>
        <p className="text-slate-500 uppercase tracking-widest text-sm font-semibold">{quiz?.title || 'Kết quả'}</p>
        {timedOut && (
          <div className="mt-4 p-2 bg-rose-100 text-rose-700 rounded-lg font-bold">
            ⚠️ Hết thời gian làm bài!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Điểm số</p>
          <p className={`text-4xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>{score}%</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Số câu đúng</p>
          <p className="text-4xl font-black text-slate-800">{correctCount} / {questions.length}</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Trạng thái</p>
          <p className={`text-xl font-bold mt-2 ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPassed ? 'PASS' : 'FAIL'}
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <h3 className="font-bold text-slate-800 border-b pb-2">Chi tiết câu trả lời</h3>
        {questions.map((q, idx) => {
          // Thêm kiểm tra an toàn cho mảng answers
          const isCorrect = checkAnswer(answers ? answers[idx] : null, q);
          return (
            <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-lg font-medium text-slate-800 mb-2">
                    <span className="font-bold">Câu {idx + 1}:</span> <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }} />
                  </p>
                </div>
                {q.image && (
                  <div className="w-full md:w-48 h-32 flex-shrink-0 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <img src={q.image} alt="Question" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="text-sm flex flex-wrap gap-4">
                <p><span className="font-bold text-slate-500">Bạn chọn:</span> {formatAnswer(answers ? answers[idx] : null, q)}</p>
                {!isCorrect && (
                  <div className="w-full">
                    <span className="font-bold text-emerald-600">Đáp án đúng:</span>{' '}
                    <span className="text-slate-700 italic text-sm">
                      {getCorrectAnswerDisplay(q)}
                    </span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg text-base"
          >
            Làm lại bài thi
          </button>
        )}
        <button
          onClick={onExit}
          className="px-8 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition"
        >
          {onRetry ? 'Thoát ra ngoài' : 'Quay lại lịch sử'}
        </button>
      </div>
    </div>
  );
}