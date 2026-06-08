import React from 'react';

export default function MultipleChoiceRenderer({ question, selected, onSelect, isLocked, showCorrect, displayTitle }) {
  const { type, choices, correctAnswers, answer: correctAnswer } = question;
  console.log('[MultipleChoiceRenderer] received question:', question);
  const qType = type || 'multiple_choice';

  const handleChoiceClick = (index) => {
    if (isLocked) return;
    onSelect(index);
  };

  const isImageUrl = (url) => {
    return typeof url === 'string' && (url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null || url.startsWith('http'));
  };

  return (
    <div className="grid grid-cols-1 w-full sm:w-fit mx-auto gap-2 mb-6 px-2 sm:px-4">
      {choices?.map((choice, i) => {
        const isItemSelected = qType === 'multiple_select'
          ? (Array.isArray(selected) && selected.includes(i))
          : selected === i;

        const isItemCorrect = qType === 'multiple_select'
          ? correctAnswers?.includes(i)
          : correctAnswer === i;

        let buttonClass = 'bg-gradient-to-b from-gray-50 to-gray-200 border-slate-200 text-gray-800';

        if (isItemSelected && !showCorrect) {
          buttonClass = 'bg-gradient-to-b from-blue-500 to-blue-600 border-blue-700 text-white shadow-inner';
        } else if (showCorrect && isItemCorrect) {
          buttonClass = 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-700 text-white shadow-inner';
        } else if (showCorrect && isItemSelected && !isItemCorrect) {
          buttonClass = 'bg-gradient-to-b from-rose-500 to-rose-600 border-rose-700 text-white shadow-inner';
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleChoiceClick(i)}
            disabled={isLocked}
            className={`relative rounded-3xl border px-6 sm:px-[50px] py-2.5 transition-all duration-150 shadow-sm text-center w-full sm:min-w-[400px] ${buttonClass} ${isLocked ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <div className="flex flex-col items-center justify-center min-h-[1.5rem] gap-2">
              {isItemSelected && (
                <div className="absolute left-3 w-5 h-5 border-2 border-white flex items-center justify-center rounded-full transition-all shadow-sm">
                  <div className="w-3 h-3 bg-white rounded-full animate-in zoom-in-50 duration-200" />
                </div>
              )}
              {isImageUrl(choice) ? (
                <img src={choice} alt={`Lựa chọn ${i + 1}`} className="max-h-32 rounded-lg object-contain bg-white/50 p-1" />
              ) : (
                <span className="text-base md:text-lg font-normal tracking-wide sm:whitespace-nowrap">{choice}</span>
              )}
          </div> 
          </button>
        );
      })}
    </div>
  );
}