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
        const normalizePair = (p) => {
          const pair = Array.isArray(p) ? { l: p[0], r: p[1] } : p
          return {
            l: Number(pair.l),
            r: Number(pair.r)
          }
        }
        const normalizedCorrect = correctPairs.map(normalizePair)
        const normalizedUser = userAnswer.map(normalizePair)
        const sortedUser = [...normalizedUser].sort((a, b) => a.l - b.l || a.r - b.r)
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
      const rows = question.rows || question.devices || []
      const cols = question.columns || question.labels || []

      if (Array.isArray(question.answer)) {
        return rows.every((r, i) => {
          const userColLabel = cols[userAnswer[i]]?.toString().toLowerCase()
          const correctColLabel = question.answer[i]?.toString().toLowerCase()
          return userColLabel === correctColLabel
        })
      }
      const rowKeys = Object.keys(question.answer || {})
      return rowKeys.length > 0 && rowKeys.every(key => userAnswer[key] === question.answer[key])
    default:
      // For single choice questions, compare values. Convert to lowercase for string comparison.
      if (question.type === 'single' || question.type === 'multiple_choice') {
        return typeof userAnswer === 'string' && typeof question.answer === 'string' ? userAnswer.toLowerCase() === question.answer.toLowerCase() : userAnswer === question.answer;
      }
      return userAnswer === question.answer // Fallback, should ideally be covered by specific types
  }
}

/**
 * Định dạng hiển thị đáp án dựa trên loại câu hỏi
 */
export function formatAnswer(val, question) {
  if (val === null || val === undefined || val === '') return 'Chưa chọn'
  if (Array.isArray(val) && val.length === 0) return 'Chưa chọn'
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
    if (Array.isArray(val)) {
      const leftItems = question.leftItems || []
      const rightItems = question.rightItems || []
      return val.map(pair => {
        const left = leftItems[Number(pair.l)] || `Mục ${pair.l}`
        const right = rightItems[Number(pair.r)] || `Mục ${pair.r}`
        const rightText = typeof right === 'string' && (right.startsWith('http') || right.startsWith('data:image')) ? `Ảnh ${Number(pair.r) + 1}` : right
        return `${left} ↔ ${rightText}`
      }).join(', ')
    }
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

// ---------- Shuffling helpers for exam mode (GMETRIX-style) ----------
export function shuffleArray(arr) {
  const a = Array.isArray(arr) ? [...arr] : []
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

function remapIndexMap(originalLength, shuffledIndices) {
  // Returns a map from oldIndex -> newIndex
  const map = new Array(originalLength).fill(-1)
  shuffledIndices.forEach((oldIdx, newIdx) => { map[oldIdx] = newIdx })
  return map
}

function shuffleQuestionChoices(question) {
  if (!question) return question
  const q = { ...question }

  // Handle matrix-like questions: shuffle both columns and rows
  // Handle matrix-like questions: shuffle both columns and rows
  const matrixTypes = ['matrix_radio', 'TRUE_FALSE_MATRIX', 'table']
  if (matrixTypes.includes(q.type)) {
    let shuffledRowIndices = null;

    // Shuffle rows if they exist
    if (Array.isArray(q.rows)) {
  
      const origRows = [...q.rows];
      const rowIndices = origRows.map((_, i) => i);
      shuffledRowIndices = shuffleArray(rowIndices);
      q.rows = shuffledRowIndices.map(i => origRows[i]);
    } else if (Array.isArray(q.devices)) {
     
      const origDevices = [...q.devices];
      const deviceIndices = origDevices.map((_, i) => i);
      shuffledRowIndices = shuffleArray(deviceIndices);
      q.devices = shuffledRowIndices.map(i => origDevices[i]);
    }

    // If rows were shuffled AND the answer is an array of labels (TRUE_FALSE_MATRIX specific)
    if (shuffledRowIndices && Array.isArray(q.answer) && q.type === 'TRUE_FALSE_MATRIX') {
      const originalAnswerArray = [...q.answer];
      const newAnswerArray = new Array(originalAnswerArray.length);
      shuffledRowIndices.forEach((oldRowIdx, newRowIdx) => {
        newAnswerArray[newRowIdx] = originalAnswerArray[oldRowIdx];
      });
      q.answer = newAnswerArray;
    }
  }


  // Handle matching questions: shuffle both leftItems and rightItems
  if (q.type === 'matching' || q.type === 'questionBox') {
    // Shuffle leftItems and remap correctPairs.l
    const origLeft = Array.isArray(q.leftItems) ? q.leftItems : (Array.isArray(q.left) ? q.left : [])
    if (origLeft.length > 0) {
      const lIndices = origLeft.map((_, i) => i)
      const lShuffled = shuffleArray(lIndices)
      q.leftItems = lShuffled.map(i => origLeft[i])
      const lIndexMap = remapIndexMap(origLeft.length, lShuffled)
      if (Array.isArray(q.correctPairs)) {
        q.correctPairs = q.correctPairs.map(p => ({ l: lIndexMap[p.l] ?? p.l, r: p.r }))
      }
    }

    const origRight = Array.isArray(q.rightItems) ? q.rightItems : []
    if (origRight.length === 0) return q
    const indices = origRight.map((_, i) => i)
    const shuffled = shuffleArray(indices)
    q.rightItems = shuffled.map(i => origRight[i])
    const indexMap = remapIndexMap(origRight.length, shuffled)
    if (Array.isArray(q.correctPairs)) {
      q.correctPairs = q.correctPairs.map(p => ({ l: p.l, r: indexMap[p.r] ?? p.r }))
    }
    return q
  }

  // Only shuffle choices/options/items for standard choice-like questions
  const key = q.choices ? 'choices' : q.options ? 'options' : q.items ? 'items' : null
  if (!key) return q

  const orig = Array.isArray(q[key]) ? q[key] : []
  if (orig.length === 0) return q
  const indices = orig.map((_, i) => i)
  const shuffledIndices = shuffleArray(indices)
  const newArr = shuffledIndices.map(i => orig[i])
  q[key] = newArr

  const indexMap = remapIndexMap(orig.length, shuffledIndices)

  // Remap single numeric answer
  if (typeof q.answer === 'number') {
    const oldIdx = q.answer
    q.answer = indexMap[oldIdx] ?? q.answer
  }

  // Remap array of correctAnswers (indices)
  if (Array.isArray(q.correctAnswers)) {
    q.correctAnswers = q.correctAnswers.map(oldIdx => indexMap[oldIdx] ?? oldIdx)
  }

  // If question stores correctOrder for drag_drop using indices, remap accordingly
  if (Array.isArray(q.correctOrder) && key === 'items') {
    q.correctOrder = q.correctOrder.map(oldIdx => indexMap[oldIdx] ?? oldIdx)
  }

  return q
}

function remapAnswersArray(originalAnswers, shuffledIndices) {
  if (!Array.isArray(originalAnswers) || originalAnswers.length === 0) {
    return originalAnswers;
  }
  const newAnswers = new Array(originalAnswers.length);
  shuffledIndices.forEach((oldIdx, newIdx) => {
    newAnswers[newIdx] = originalAnswers[oldIdx];
  });
  return newAnswers;
}

export function prepareQuizForMode(quiz, mode, currentAnswers = []) { // Add currentAnswers parameter
  if (!quiz) return quiz
  const newQuiz = { ...quiz }
  let questions = Array.isArray(newQuiz.questions) ? [...newQuiz.questions] : []
  let reorderedAnswers = [...currentAnswers]; // Make a copy of currentAnswers
  if (mode === 'exam') {
    const questionIndices = questions.map((_, i) => i);
    const shuffledQuestionIndices = shuffleArray(questionIndices);
    questions = shuffledQuestionIndices.map(i => questions[i]);
    reorderedAnswers = remapAnswersArray(currentAnswers, shuffledQuestionIndices);
    // Shuffle choices within each question
    questions = questions.map(q => shuffleQuestionChoices(q))
  }
  newQuiz.questions = questions;
  return { newQuiz, reorderedAnswers }; // Return both
}