import React from 'react';
import { HtmlInline } from '../utils/htmlRenderer.jsx';

export default function MatrixRenderer({ question, selected, onSelect, isLocked, showCorrect, displayTitle }) {
  const { type, rows, devices, columns, answer: correctAnswer } = question; // `devices` là alias cho `rows`
  // console.log('[MatrixRenderer] received question:', question); // Giữ lại để debug nếu cần
  const qType = type;
  const rowData = rows || devices || [];
  const colData = columns || (qType === 'TRUE_FALSE_MATRIX' ? ['Đúng', 'Sai', 'Không xác định'] : ['Nhập', 'Xuất']);
  const currentAnswers = selected || {};

  // Helper để hiển thị ô radio tùy chỉnh với phản hồi Đúng/Sai theo yêu cầu
  const renderCell = (rowId, colIdx, isGrid = true) => {
    const isChecked = currentAnswers[rowId] === colIdx;
    const isCorrectChoice = showCorrect && correctAnswer?.[rowId] === colIdx;
    const isWrongSelection = showCorrect && isChecked && correctAnswer?.[rowId] !== colIdx;

    // Màu nền cho cả ô dựa trên phản hồi (Xanh lá / Đỏ)
    let cellBgClass = "";
    if (showCorrect) {
      if (isCorrectChoice) cellBgClass = "bg-[rgb(0,91,0)] text-white";
      else if (isWrongSelection) cellBgClass = "bg-[rgb(221,102,66)] text-white";
    }

    // Style cho vòng tròn radio tùy chỉnh
    let radioClass = "";
    let icon = null;

    if (!showCorrect) {
      // Chế độ đang làm bài
      radioClass = isChecked ? "bg-white border-blue-600 shadow-sm" : "bg-white border-slate-300";
      if (isChecked) icon = <div className="w-4 h-4 bg-blue-600 rounded-full animate-in zoom-in-10 duration-200" />;
    } else {
      // Chế độ xem kết quả (Practice Mode)
      if (isCorrectChoice || isWrongSelection) {
        radioClass = "bg-transparent border-white shadow-sm";
        icon = isCorrectChoice ? "✓" : "✕";
      } else {
        radioClass = "bg-slate-100 border-slate-200 opacity-40";
      }
    }

    const radioContent = (
      <div
        onClick={() => !isLocked && onSelect({ ...currentAnswers, [rowId]: colIdx })}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${radioClass} ${!isLocked ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="text-base font-black leading-none select-none">{icon}</span>
      </div>
    );

    if (isGrid) {
      return (
        <div className={`w-16 sm:w-24 flex-shrink-0 flex justify-center py-5 border-l border-slate-200 transition-colors ${cellBgClass}`}>
          {radioContent}
        </div>
      );
    }
    return (
      <td className={`p-4 border-b border-slate-200 transition-colors ${cellBgClass}`}>
        <div className="flex justify-center">
          {radioContent}
        </div>
      </td>
    );
  };

  // --- Logic cho Ma trận (TRUE_FALSE_MATRIX & matrix_radio) sử dụng Grid Layout ---
  if (qType === 'TRUE_FALSE_MATRIX' || qType === 'matrix_radio') {

    return (
      <div className="mb-6 w-full border border-gray-300 shadow-sm rounded-md overflow-hidden">
        <div className="flex bg-slate-100 text-slate-700 border-b border-gray-200 items-stretch">
          <div className="flex-1 p-3 flex items-center px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {displayTitle ? "Nội dung câu hỏi" : ""}
          </div>
          {colData.map((col, idx) => (
            <div key={idx} className="w-16 sm:w-24 flex-shrink-0 p-2 text-center border-l border-slate-200 bg-[rgb(2,132,199)] text-white flex items-center justify-center font-bold text-base uppercase tracking-tighter leading-tight">
              {col}
            </div>
          ))}
        </div>

        {rowData.map((row) => (
          <div key={row.id} className="flex items-stretch border-b border-gray-200 transition-colors hover:bg-slate-50">
            <div className="flex-1 p-4 text-gray-700 text-lg font-medium leading-relaxed">
              <HtmlInline content={row.name || row.text} />
            </div>
            {colData.map((_, colIdx) => renderCell(row.id, colIdx, true))}
          </div>
        ))}
      </div>
    );
  }

  return null;
}