import React from 'react';

export default function DragDropRenderer({ question, selected, onSelect, isLocked, showCorrect, displayTitle }) {
  const { items, correctOrder } = question;
  const currentOrder = Array.isArray(selected) ? selected : (items || []).map((_, i) => i);
  const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(correctOrder);

  const handleDragStart = (e, startIdx) => {
    if (isLocked) return;
    e.dataTransfer.setData('dragIndex', startIdx.toString());
  };

  const handleDrop = (e, dropIdx) => {
    if (isLocked) return;
    e.preventDefault();
    const dragIdx = parseInt(e.dataTransfer.getData('dragIndex'), 10);
    if (isNaN(dragIdx) || dragIdx === dropIdx) return;

    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(dragIdx, 1);
    newOrder.splice(dropIdx, 0, movedItem);
    onSelect(newOrder);
  };

  return (
    <div className="space-y-4 mb-6">
      <p className="text-sm text-slate-500 italic mb-2 font-medium">Kéo và thả để sắp xếp theo thứ tự đúng:</p>
      <div className="grid gap-2">
        {currentOrder.map((itemIdx, displayIdx) => (
          <div
            key={itemIdx}
            draggable={!isLocked}
            onDragStart={(e) => handleDragStart(e, displayIdx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, displayIdx)}
            className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${isLocked ? 'cursor-not-allowed' : 'cursor-move hover:border-blue-400 hover:bg-blue-50'
              } ${showCorrect
                ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50')
                : 'border-slate-200 bg-white shadow-sm'
              }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
              {displayIdx + 1}
            </div>
            <span className="flex-1 text-slate-900 font-medium text-lg">{items[itemIdx]}</span>
            {!isLocked && (
              <span className="text-slate-300">⋮⋮</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}