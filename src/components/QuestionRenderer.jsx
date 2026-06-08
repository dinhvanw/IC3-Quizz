import React from 'react'
import MultipleChoiceRenderer from './MultipleChoiceRenderer'
import MatrixRenderer from './MatrixRenderer'
import FillBlankRenderer from './FillBlankRenderer'
import DragDropRenderer from './DragDropRenderer'
import MatchingRenderer from './MatchingRenderer'
import HotspotRenderer from './HotspotRenderer'

export default function QuestionRenderer({ question, selected, onSelect, isLocked, showCorrect }) {
  const qType = question.type || 'multiple_choice';
  const displayTitle = question.text || question.questionText; // Đảm bảo tiêu đề câu hỏi luôn có sẵn

  console.log(`[QuestionRenderer] Rendering type: ${qType}`, question); // Debugging

  switch (qType) {
    case 'multiple_choice':
    case 'multiple_select':
      return <MultipleChoiceRenderer {...{ question, selected, onSelect, isLocked, showCorrect, displayTitle }} />
    
    case 'matrix_radio':
    case 'TRUE_FALSE_MATRIX':
      return <MatrixRenderer {...{ question, selected, onSelect, isLocked, showCorrect, displayTitle }} />

    case 'fill_blank':
      return <FillBlankRenderer {...{ question, selected, onSelect, isLocked, showCorrect, displayTitle }} />

    case 'drag_drop':
      return <DragDropRenderer {...{ question, selected, onSelect, isLocked, showCorrect, displayTitle }} />

    case 'matching':
    case 'questionBox':
      return <MatchingRenderer {...{ question, selected, onSelect, isLocked, showCorrect, displayTitle }} />

    case 'hotspot':
      return <HotspotRenderer {...{ question, selected, onSelect, isLocked, showCorrect, displayTitle }} />

    default:
      return (
        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 italic">
          Loại câu hỏi "{qType}" đang được cập nhật giao diện...
        </div>
      )
  }
}