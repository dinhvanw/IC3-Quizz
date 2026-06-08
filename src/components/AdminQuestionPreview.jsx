import React from 'react';
import QuestionRenderer from './QuestionRenderer';

/**
 * Component xem trước dành cho Admin
 * Chuyển đổi cấu trúc JSON của bạn sang định dạng Renderer yêu cầu
 */
export default function AdminQuestionPreview({ rawJson }) {
  if (!rawJson) return null;

  // Chuyển đổi logic 'correct: true/false' trong rows sang object 'answer' cho Renderer
  let previewAnswer = rawJson.answer;
  if (rawJson.type === 'TRUE_FALSE_MATRIX' && rawJson.rows && !rawJson.answer) {
    previewAnswer = {};
    rawJson.rows.forEach(row => {
      previewAnswer[row.id] = row.correct ? 0 : 1;
    });
  }

  let selectedValue = (rawJson.type === 'multiple_select' || rawJson.type === 'hotspot') ? (rawJson.correctAnswers || []) : previewAnswer;

  // Đối với matching và questionBox, sử dụng correctPairs để hiển thị đáp án đúng trong preview
  if (rawJson.type === 'matching' || rawJson.type === 'questionBox') {
    selectedValue = rawJson.correctPairs || [];
  }

  const previewQuestion = {
    ...rawJson,
    text: rawJson.questionText || rawJson.text, // Đồng bộ tên trường
    columns: rawJson.columns || (rawJson.type === 'TRUE_FALSE_MATRIX' ? ['Đúng', 'Sai', 'Không xác định'] : undefined), // Updated default columns
    answer: previewAnswer
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="bg-slate-900 text-white px-6 py-3 rounded-t-2xl flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
          <h3 className="text-sm font-bold uppercase tracking-widest">Giao diện xem trước (Admin)</h3>
        </div>
        <span className="text-[10px] bg-slate-700 px-2 py-1 rounded border border-slate-600 font-mono">TYPE: {rawJson.type}</span>
      </div>

      <div className="bg-white border-x border-b border-slate-200 p-8 rounded-b-2xl shadow-xl">
        {/* Question Image Preview */}
        {rawJson.image && rawJson.type !== 'hotspot' && (
          <div className="mb-6 flex justify-center">
            <img src={rawJson.image} alt="Preview" className="max-h-64 rounded-xl border shadow-sm" />
          </div>
        )}

        {/* Render câu hỏi ở chế độ hiển thị sẵn đáp án để Admin kiểm tra */}
        <QuestionRenderer
          question={previewQuestion}
          selected={selectedValue}
          showCorrect={true}
          isLocked={true}
        />
      </div>
    </div>
  );
}