/**
 * Hàm kiểm tra đáp án cho nhiều loại câu hỏi
 */
export function checkAnswer(userAnswer, question) {
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false
  
  switch (question.type) {
    case 'multiple_select':
    case 'multiple':
      const correct = question.correctAnswers || []
      const user = Array.isArray(userAnswer) ? userAnswer : []
      if (correct.length === 0 && question.answer && Array.isArray(question.answer)) {
        const choices = question.choices || question.options || []
        const correctIndices = question.answer.map(val => choices.indexOf(val)).filter(i => i !== -1)
        return user.length === correctIndices.length && user.every(v => correctIndices.includes(v))
      }
      return user.length === correct.length && user.every(v => correct.includes(v))
    case 'fill_blank':
      return userAnswer.toString().trim().toLowerCase() === question.answer?.toString().toLowerCase()
    case 'drag_drop':
    case 'reorder':
      if (Array.isArray(question.answer) && !question.correctOrder) {
        const items = question.items || question.options || []
        const correctOrder = question.answer.map(val => items.indexOf(val))
        return JSON.stringify(userAnswer) === JSON.stringify(correctOrder)
      }
      return JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder)
    case 'matching':
    case 'questionBox':
      if (Array.isArray(userAnswer)) {
        const correctPairs = question.correctPairs || []
        const normalizedCorrect = correctPairs.map(p => Array.isArray(p) ? { l: p[0], r: p[1] } : p)
        const sortedUser = [...userAnswer].sort((a, b) => a.l - b.l || a.r - b.r)
        const sortedCorrect = [...normalizedCorrect].sort((a, b) => a.l - b.l || a.r - b.r)
        return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
      }
      if (typeof userAnswer === 'object' && typeof question.answer === 'object') {
        return JSON.stringify(userAnswer) === JSON.stringify(question.answer)
      }
      return false
    case 'hotspot':
      // Chấm điểm dựa trên mảng các chỉ số vùng được chọn (tương tự multiple_select)
      if (Array.isArray(userAnswer)) {
        const correctHotspots = question.correctAnswers || []
        return userAnswer.length === correctHotspots.length && userAnswer.every(v => correctHotspots.includes(v))
      }
      const hotspots = question.hotspots || question.spots
      if (typeof userAnswer === 'object' && hotspots) {
        return hotspots.some(h => 
        userAnswer.x >= h.x && userAnswer.x <= h.x + h.width && 
        userAnswer.y >= h.y && userAnswer.y <= h.y + h.height
        )
      }
      return false
    case 'matrix_radio':
    case 'TRUE_FALSE_MATRIX':
    case 'table':
      if (!userAnswer || typeof userAnswer !== 'object') return false
      if (Array.isArray(question.answer)) {
        const rows = question.rows || []
        const labels = question.labels || []
        return rows.every((r, i) => labels[userAnswer[i]] === question.answer[i])
      }
      const rowKeys = Object.keys(question.answer || {})
      return rowKeys.length > 0 && rowKeys.every(key => userAnswer[key] === question.answer[key])
    default:
      if (question.type === 'single') return userAnswer === question.answer
      return userAnswer === question.answer
  }
}

/**
 * Định dạng hiển thị đáp án dựa trên loại câu hỏi
 */
export function formatAnswer(val, question) {
  if (val === null || val === undefined || val === '') return 'Chưa chọn'
  if (question.type === 'multiple_select' || question.type === 'multiple') {
    return Array.isArray(val) ? val.map(i => String.fromCharCode(65 + i)).join(', ') : 'Lỗi dữ liệu'
  }
  if (question.type === 'fill_blank') return val
  if (question.type === 'drag_drop' || question.type === 'reorder') {
    const items = question.items || question.options || []
    return Array.isArray(val) ? val.map(idx => items[idx]).join(' → ') : 'Chưa sắp xếp'
  }
  if (question.type === 'matching' || question.type === 'questionBox') {
    if (typeof val === 'object' && !Array.isArray(val)) return 'Đã hoàn thành nối cặp'
    return `Đã nối ${val.length} cặp`
  }
  if (question.type === 'hotspot') {
    if (Array.isArray(val)) {
      return val.map(idx => `Vùng #${idx + 1}`).join(', ')
    }
    return val.x ? `Tọa độ: X:${Math.round(val.x)}% Y:${Math.round(val.y)}%` : 'Đã chọn'
  }
  if (question.type === 'matrix_radio' || question.type === 'TRUE_FALSE_MATRIX' || question.type === 'table') {
    const rows = question.rows || question.devices || []
    const cols = question.columns || question.labels || ['Nhập', 'Xuất']
    if (Array.isArray(val)) {
      return rows.map((r, i) => `${r.text || r}: ${cols[val[i]] || '?'}`).join(', ')
    }
    return rows.map(r => `${r.name || r.text}: ${cols[val[r.id]] || '?'}`).join(', ')
  }
  const choices = question.choices || question.options
  return choices ? choices[val] : val
}