import React from 'react';

export default function FillBlankRenderer({ question, selected, onSelect, isLocked, showCorrect, displayTitle }) {
  const { answer: correctAnswer, explanation } = question;
  const isCorrect = selected?.trim().toLowerCase() === correctAnswer?.trim().toLowerCase();

  return (
    <div className="mb-6">
      <input
        type="text"
        value={selected || ''}
        onChange={(e) => !isLocked && onSelect(e.target.value)}
        disabled={isLocked}
        placeholder="Nhập đáp án của bạn..."
        className={`w-full p-6 rounded-[28px] border text-xl ${showCorrect ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50') : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all`}
      />
      {showCorrect && (
        <p className="mt-3 text-sm font-medium text-emerald-700 ml-4">
          Đáp án đúng: <span className="underline font-bold uppercase">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
}