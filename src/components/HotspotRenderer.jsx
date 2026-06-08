import React, { useRef } from 'react';

/**
 * HotspotRenderer - Hiển thị câu hỏi dạng Điểm nóng (Hotspot)
 * 
 * Props:
 * - question: { image, hotspots: [{x, y, width, height}], answer: number }
 * - selected: number[] | null (danh sách chỉ số các vùng được chọn)
 * - onSelect: (index: number) => void (logic toggle xử lý tại Quiz.jsx)
 * - isLocked: boolean (đã nộp bài / khóa chọn)
 * - showCorrect: boolean (hiện đáp án đúng/sai)
 */
export default function HotspotRenderer({ question, selected, onSelect, isLocked, showCorrect }) {
  const { image, hotspots = [], answer, correctAnswers } = question;
  const containerRef = useRef(null);

  // Hỗ trợ cả dữ liệu cũ (answer là number) và mới (correctAnswers là array)
  const targetCorrect = correctAnswers || (answer !== undefined ? [answer] : []);
  const currentSelected = Array.isArray(selected) ? selected : (selected !== null && selected !== undefined ? [selected] : []);

  const handleClickZone = (idx) => {
    if (isLocked) return;
    // Quiz.jsx sẽ nhận idx và toggle trong mảng answers[index]
    onSelect(idx);
  };

  // Xác định style cho mỗi vùng hotspot
  const getZoneStyle = (hs, idx) => {
    const base = {
      position: 'absolute',
      left: `${hs.x}%`,
      top: `${hs.y}%`,
      width: `${hs.width}%`,
      height: `${hs.height}%`,
      cursor: isLocked ? 'default' : 'pointer',
      transition: 'all 0.25s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      boxSizing: 'border-box',
      zIndex: 10,
    };

    if (showCorrect) {
      // Chế độ xem kết quả
      const isCorrectZone = targetCorrect.includes(idx);
      const isUserSelected = currentSelected.includes(idx);

      if (isCorrectZone) {
        return {
          ...base,
          border: '3px solid #22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.25)',
          boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)',
        };
      }
      if (isUserSelected && !isCorrectZone) {
        return {
          ...base,
          border: '3px solid #ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.25)',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
        };
      }
      // Vùng không liên quan
      return {
        ...base,
        border: '2px dashed rgba(148, 163, 184, 0.4)',
        backgroundColor: 'transparent',
      };
    }

    // Chế độ làm bài
    const isSelected = currentSelected.includes(idx);
    if (isSelected) {
      return {
        ...base,
        border: '3px solid #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
      };
    }
    return {
      ...base,
      border: '2px dashed rgba(59, 130, 246, 0.45)',
      backgroundColor: 'rgba(59, 130, 246, 0.06)',
    };
  };

  return (
    <div className="mb-6 space-y-3">
      <div
        ref={containerRef}
        className="relative inline-block rounded-2xl overflow-hidden shadow-lg"
        style={{ border: '4px solid #e2e8f0' }}
      >
        <img
          src={image}
          alt="Hotspot"
          className="block max-w-full"
          draggable={false}
          style={{ userSelect: 'none' }}
        />

        {/* Các vùng hotspot overlay */}
        {hotspots.map((hs, idx) => {
          const isCorrectZone = targetCorrect.includes(idx);
          const isUserSelected = currentSelected.includes(idx);

          return (
            <div
              key={idx}
              style={getZoneStyle(hs, idx)}
              onClick={() => handleClickZone(idx)}
              title={`Vùng #${idx + 1}`}
            >
              {/* Hover effect khi chưa lock */}
              {!isLocked && !showCorrect && !isUserSelected && (
                <style>{`
                [data-hotspot-idx="${idx}"]:hover {
                  background-color: rgba(59, 130, 246, 0.15) !important;
                  border-color: rgba(59, 130, 246, 0.7) !important;
                }
              `}</style>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}