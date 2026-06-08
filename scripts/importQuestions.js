import { collection, setDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '../src/firebase.js'
import questionsData from '../question.json' assert { type: 'json' }

/**
 * Xóa tất cả undefined fields từ object
 */
function cleanObject(obj) {
  if (!obj) return {}
  const cleaned = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map(v => typeof v === 'object' ? cleanObject(v) : v)
      } else if (typeof value === 'object') {
        cleaned[key] = cleanObject(value)
      } else {
        cleaned[key] = value
      }
    }
  }
  return cleaned
}

/**
 * Chuyển đổi loại câu hỏi từ question.json sang format sampleQuizzes
 */
function transformQuestion(q) {
  const baseQuestion = {
    id: q.id || `q_${Date.now()}_${Math.random()}`,
    text: q.text || '',
    explanation: q.explanation || ''
  }

  // Chuyển đổi theo loại câu hỏi
  switch (q.type) {
    case 'single':
      return {
        ...baseQuestion,
        type: 'multiple_choice',
        choices: q.options || [],
        answer: q.options ? q.options.indexOf(q.answer) : 0
      }

    case 'multiple':
      return {
        ...baseQuestion,
        type: 'multiple_select',
        choices: q.options || [],
        correctAnswers: q.answer 
          ? q.answer.map(ans => q.options.indexOf(ans)).filter(idx => idx !== -1)
          : []
      }

    case 'table':
      // Nếu có 2 labels (Đúng/Sai hoặc Có/Không)
      if (q.labels && q.labels.length === 2) {
        return {
          ...baseQuestion,
          type: 'TRUE_FALSE_MATRIX',
          rows: (q.rows || []).map((text, idx) => ({
            id: `r${idx}`,
            text
          })),
          columns: q.labels,
          answer: (q.rows || []).reduce((acc, text, idx) => {
            acc[`r${idx}`] = q.labels.indexOf(q.answer[idx]) ?? 0
            return acc
          }, {})
        }
      }
      // Nếu có nhiều hơn 2 labels, dùng matrix_radio
      return {
        ...baseQuestion,
        type: 'matrix_radio',
        items: (q.rows || []).map((text, idx) => ({
          id: `m${idx}`,
          text
        })),
        columns: q.labels || [],
        answer: (q.rows || []).reduce((acc, text, idx) => {
          acc[`m${idx}`] = q.labels.indexOf(q.answer[idx]) ?? 0
          return acc
        }, {})
      }

    case 'reorder':
      return {
        ...baseQuestion,
        type: 'drag_drop',
        items: q.options || [],
        correctOrder: q.answer 
          ? q.answer.map(ans => q.options.indexOf(ans))
          : Array.from({ length: (q.options || []).length }, (_, i) => i)
      }

    case 'matching':
      // Nếu answer là object, convert sang format matching
      if (typeof q.answer === 'object' && !Array.isArray(q.answer)) {
        const entries = Object.entries(q.answer)
        const leftItems = entries.map(([key]) => key)
        const rightItems = [...new Set(entries.map(([, val]) => val))]
        
        return {
          ...baseQuestion,
          type: 'matching',
          leftItems,
          rightItems,
          correctPairs: entries.map(([left, right], idx) => ({
            l: leftItems.indexOf(left),
            r: rightItems.indexOf(right)
          }))
        }
      }
      break

    case 'hotspot':
      return {
        ...baseQuestion,
        type: 'hotspot',
        image: q.image || '',
        hotspots: q.hotspots || [],
        answer: q.answer ?? 0
      }

    default:
      return {
        ...baseQuestion,
        type: 'multiple_choice',
        choices: q.options || [],
        answer: 0
      }
  }
}

async function importQuestions() {
  try {
    console.log('🔄 Bắt đầu import câu hỏi từ question.json...\n')
    const batch = writeBatch(db)
    let totalQuizzes = 0
    let totalQuestions = 0
    
    // Duyệt từng level (LV1, LV2, v.v.)
    for (const [level, categories] of Object.entries(questionsData)) {
      console.log(`📚 Xử lý Level: ${level}`)
      
      // Duyệt từng category (BS, v.v.)
      for (const [category, questions] of Object.entries(categories)) {
        if (!Array.isArray(questions)) {
          console.warn(`  ⚠️  ${category} không phải là array, bỏ qua`)
          continue
        }
        
        const quizId = `${level.toLowerCase()}_${category.toLowerCase()}`
        
        // Transform tất cả câu hỏi và clean undefined fields
        const transformedQuestions = questions.map(q => cleanObject(transformQuestion(q)))
        
        const quiz = {
          id: quizId,
          title: `${level} - ${category}`,
          category: level,
          summary: `Bộ câu hỏi ${level} phần ${category}`,
          duration: 45,
          questions: transformedQuestions
        }
        
        // Clean object trước khi lưu (xóa undefined fields)
        const cleanQuiz = cleanObject(quiz)
        
        // Thêm vào batch
        batch.set(doc(db, 'quizzes', quizId), cleanQuiz)
        
        console.log(`  ✓ ${category}: ${questions.length} câu → ${transformedQuestions.length} câu đã transform`)
        totalQuizzes++
        totalQuestions += transformedQuestions.length
      }
    }
    
    // Commit batch
    console.log(`\n📤 Đang upload ${totalQuizzes} bài thi lên Firestore...`)
    await batch.commit()
    
    console.log(`\n✅ Import hoàn tất!`)
    console.log(`   📊 Tổng bài thi: ${totalQuizzes}`)
    console.log(`   ❓ Tổng câu hỏi: ${totalQuestions}`)
  } catch (error) {
    console.error('❌ Lỗi khi import:', error)
    process.exit(1)
  }
}

importQuestions()

