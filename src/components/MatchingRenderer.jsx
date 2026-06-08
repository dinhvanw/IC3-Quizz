import React, { useState } from 'react';

export default function MatchingRenderer({ question, selected, onSelect, isLocked, showCorrect, displayTitle }) {
  const { leftItems, rightItems, type } = question;
  console.log('[MatchingRenderer] received question:', question);

  const isImageUrl = (url) => {
    return typeof url === 'string' && (
      url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp|ico)$/i) != null ||
      url.startsWith('http') ||
      url.startsWith('data:image/')
    );
  };

  const [activeLeft, setActiveLeft] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const pairs = Array.isArray(selected) ? selected : [];

  // Logic Click-to-connect (cho matching thông thường)
  const handleItemClick = (side, index) => {
    if (isLocked) return;
    if (side === 'left') {
      setActiveLeft(index);
    } else if (side === 'right' && activeLeft !== null) {
      const filtered = pairs.filter(p => p.l !== activeLeft);
      onSelect([...filtered, { l: activeLeft, r: index }]);
      setActiveLeft(null);
    }
  };

  // Logic Drag & Drop (cho questionBox - Ghép văn bản và hình ảnh)
  const handleDragStart = (e, leftIdx) => {
    if (isLocked) return;
    e.dataTransfer.setData('text/plain', leftIdx.toString());
  };

  const handleDragOver = (e, rightIdx) => {
    if (isLocked) return;
    e.preventDefault();
    if (dragOverIdx !== rightIdx) {
      setDragOverIdx(rightIdx);
    }
  };

  const handleDragLeave = (e, rightIdx) => {
    if (isLocked) return;
    if (dragOverIdx === rightIdx) {
      setDragOverIdx(null);
    }
  };

  const handleDropZoneDrop = (e, rightIdx) => {
    if (isLocked) return;
    e.preventDefault();
    setDragOverIdx(null);
    const leftIdxStr = e.dataTransfer.getData('text/plain');
    const leftIdx = parseInt(leftIdxStr, 10);
    if (isNaN(leftIdx)) return;

    // Gỡ các liên kết cũ của text này hoặc của ô đích này
    const filtered = pairs.filter(p => p.l !== leftIdx && p.r !== rightIdx);
    onSelect([...filtered, { l: leftIdx, r: rightIdx }]);
  };

  const handleRemovePairByRightIndex = (rightIdx) => {
    if (isLocked) return;
    const filtered = pairs.filter(p => p.r !== rightIdx);
    onSelect(filtered);
  };

  const handleDropBack = (e) => {
    if (isLocked) return;
    e.preventDefault();
    const leftIdxStr = e.dataTransfer.getData('text/plain');
    const leftIdx = parseInt(leftIdxStr, 10);
    if (isNaN(leftIdx)) return;

    const filtered = pairs.filter(p => p.l !== leftIdx);
    onSelect(filtered);
  };

  // Giao diện kéo thả 3 cột phong cách GMetrix/IC3 (cho matching thông thường)
  return (
    <div className="space-y-6">
      {/* Chế độ làm bài (Test Mode) */}
      {!showCorrect && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Cột 1 (Lựa chọn bên trái) - Chiếm 3/12 cột */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em] mb-2 pb-1 border-b border-slate-100">
              Lựa chọn
            </h4>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropBack}
              className="space-y-2 p-3 bg-slate-50 border border-slate-200 min-h-[300px] transition-colors hover:bg-slate-100/30"
            >
              {leftItems?.map((textItem, lIdx) => {
                const isPlaced = pairs.some(p => p.l === lIdx);

                if (isPlaced) {
                  return (
                    <div
                      key={lIdx}
                      className="p-3 border border-dashed border-slate-300 bg-slate-100/50 text-lg font-semibold text-center rounded-none select-none opacity-50 relative overflow-hidden"
                    >
                      <span className="line-clamp-2">{textItem}</span>
                      <span className="absolute bottom-1 right-2 text-[8px] uppercase tracking-wider font-black text-slate-400">Đã đặt</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={lIdx}
                    draggable={!isLocked}
                    onDragStart={(e) => handleDragStart(e, lIdx)}
                    className={`flex items-center justify-between p-3 bg-[#E0E0E0] text-slate-800 font-semibold text-base rounded-none border border-slate-300 shadow-sm transition-all select-none ${isLocked
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-grab active:cursor-grabbing hover:bg-[#D0D0D0] hover:shadow-md'
                      }`}
                  >
                    <span className="flex-1 pr-2 break-words line-clamp-2">{textItem}</span>
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V20M12 4L9 7M12 4L15 7M12 20L9 17M12 20L15 17M4 12H20M4 12L7 9M4 12L7 15M20 12L17 9M20 12L17 15" />
                    </svg>
                  </div>
                );
              })}

              {leftItems && pairs.length === leftItems.length && (
                <div className="flex items-center justify-center h-48 text-slate-400 italic text-xs text-center p-4">
                  Đã kéo hết các lựa chọn!
                </div>
              )}
            </div>
          </div>

          {/* Cột 2 & 3 (Ô thả & Mô tả ở giữa và bên phải) - Chiếm 9/12 cột */}
          <div className="lg:col-span-9 space-y-3">
            <div className="grid grid-cols-2 gap-4 pb-1 border-b border-slate-100 font-black uppercase text-slate-400 tracking-[0.2em] text-[10px]">
              <div className="text-sm">Ô thả (Drop Zone)</div>
              <div>Mô tả cố định (Target)</div>
            </div>

            <div className="space-y-3">
              {rightItems?.map((targetItem, rIdx) => {
                const matchedLeftIndices = pairs.filter(p => p.r === rIdx).map(p => p.l);
                const isOver = dragOverIdx === rIdx;

                return (
                  <div key={rIdx} className="flex items-stretch gap-4">
                    {/* Cột 2: Ô thả */}
                    <div
                      onDragOver={(e) => handleDragOver(e, rIdx)}
                      onDragLeave={(e) => handleDragLeave(e, rIdx)}
                      onDrop={(e) => handleDropZoneDrop(e, rIdx)}
                      className={`flex-1 flex flex-col justify-center p-2 border transition-all ${matchedLeftIndices.length > 0
                        ? 'border-blue-400 bg-blue-50/10 gap-2'
                        : (isOver ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50')
                        }`}
                      style={{ minHeight: '64px' }}
                    >
                      {matchedLeftIndices.length > 0 ? (
                        matchedLeftIndices.map(lIdx => {
                          const text = leftItems[lIdx];
                          return (
                            <div
                              key={lIdx}
                              draggable={!isLocked}
                              onDragStart={(e) => handleDragStart(e, lIdx)}
                              className="flex items-center justify-between p-2.5 bg-[#0B72B9] text-white font-semibold text-base rounded-none border border-blue-600 shadow-sm relative group cursor-grab active:cursor-grabbing hover:bg-[#09609c] transition-all"
                            >
                              <span className="flex-1 pr-6 break-words">{text}</span>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isLocked && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelect(pairs.filter(p => p.l !== lIdx));
                                    }}
                                    className="text-white hover:text-red-200 text-xs font-bold px-1"
                                    title="Gỡ bỏ"
                                  >
                                    ✕
                                  </button>
                                )}
                                <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V20M12 4L9 7M12 4L15 7M12 20L9 17M12 20L15 17M4 12H20M4 12L7 9M4 12L7 15M20 12L17 9M20 12L17 15" />
                                </svg>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none text-sm font-bold uppercase tracking-wider h-full py-4">
                          Kéo thả vào đây
                        </div>
                      )}
                    </div>

                    {/* Cột 3: Mô tả cố định */}
                    <div className="flex-1 flex items-center p-3 bg-slate-50 text-slate-800 font-semibold text-xs rounded-none shadow-sm min-h-[64px] border border-slate-200 justify-center text-center">
                      {isImageUrl(targetItem) ? (
                        <img src={targetItem} alt={`Hình ảnh ${rIdx + 1}`} className="max-h-24 max-w-full rounded object-contain" />
                      ) : (
                        <span className="break-words line-clamp-3 leading-snug">{targetItem}</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Chế độ kết quả/chế độ luyện tập (Result Mode) - showCorrect === true */}
      {showCorrect && (
        <div className="space-y-4 w-full">
          {/* Header 3 cột */}
          <div className="grid grid-cols-3 gap-6 pb-2 border-b border-slate-100">
            <div className="text-center text-sm font-bold text-slate-700">Your Answers:</div>
            <div></div>
            <div className="text-center text-sm font-bold text-slate-700">Correct Answers:</div>
          </div>

          <div className="space-y-3">
            {rightItems?.map((targetItem, rIdx) => {
              const correctPairList = (question.correctPairs || [])
                .map(p => Array.isArray(p) ? { l: p[0], r: p[1] } : p);
              const correctLeftIndices = correctPairList.filter(p => p.r === rIdx).map(p => p.l);
              const userLeftIndices = pairs.filter(p => p.r === rIdx).map(p => p.l);

              // Kiểm tra xem hàng này người dùng ghép đúng hoàn toàn không
              const isRowCorrect = userLeftIndices.length === correctLeftIndices.length &&
                userLeftIndices.every(lIdx => correctLeftIndices.includes(lIdx));

              return (
                <div key={rIdx} className="grid grid-cols-3 gap-6 items-stretch">
                  {/* Cột 1: Câu trả lời của người dùng (Your Answers) */}
                  <div className="flex flex-col justify-center gap-2 p-1 bg-slate-50 border border-slate-100" style={{ minHeight: '52px' }}>
                    {userLeftIndices.length > 0 ? (
                      userLeftIndices.map(lIdx => {
                        const text = leftItems[lIdx];
                        const isCorrect = correctLeftIndices.includes(lIdx);

                        return (
                          <div
                            key={lIdx}
                            className={`flex items-center justify-between p-2.5 text-white font-semibold text-base rounded-none shadow-sm relative transition-all ${isCorrect ? 'bg-[#006F28]' : 'bg-[#C84B31]'
                              }`}
                          >
                            <span className="flex-1 pr-6 break-words">{text}</span>

                            <span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-inner">
                              {isCorrect ? '✓' : '✕'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-between p-2.5 bg-[#C84B31] text-white font-semibold text-xs rounded-none shadow-sm">
                        <span className="text-base">Chưa ghép nối</span>
                        <span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[10px] font-black text-white shrink-0">
                          ✕
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cột 2: Mô tả cố định */}
                  <div className="flex items-center p-3 bg-slate-50 text-slate-800 font-semibold text-xs rounded-none shadow-sm border border-slate-200 justify-center text-center select-none" style={{ minHeight: '52px' }}>
                    {isImageUrl(targetItem) ? (
                      <img src={targetItem} alt={`Hình ảnh ${rIdx + 1}`} className="max-h-24 max-w-full rounded object-contain" />
                    ) : (
                      <span className="break-words line-clamp-3 leading-snug">{targetItem}</span>
                    )}
                  </div>

                  {/* Cột 3: Đáp án đúng (Correct Answers) - Chỉ hiển thị khi làm sai */}
                  <div className="flex flex-col justify-center gap-2">
                    {!isRowCorrect && correctLeftIndices.length > 0 ? (
                      correctLeftIndices.map(lIdx => {
                        const text = leftItems[lIdx];
                        return (
                          <div
                            key={lIdx}
                            className="flex items-center justify-center p-2.5 bg-[#006F28] text-white font-semibold text-base rounded-none shadow-sm text-center h-full min-h-[42px]"
                          >
                            {text}
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full w-full"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {pairs.length > 0 && !isLocked && !showCorrect && (
        <button
          onClick={() => onSelect([])}
          className="text-xs text-rose-500 font-bold hover:underline"
        >
          Xóa các cặp đã nối
        </button>
      )}
    </div>
  );
}