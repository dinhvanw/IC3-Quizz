import { db } from '../firebase.js'
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, deleteDoc, setDoc, orderBy, limit } from 'firebase/firestore'

/**
 * Hàm hỗ trợ chuẩn hóa dữ liệu quiz từ Firestore.
 * Chuyển đổi questions từ Map sang Array dựa trên questionOrder để tương thích với UI.
 */
function normalizeQuiz(id, data) {
  const quiz = { id, ...data }
  
  // Nếu questions là Object (Map) và có questionOrder, chuyển thành mảng
  if (quiz.questions && !Array.isArray(quiz.questions) && quiz.questionOrder) {
    quiz.questions = quiz.questionOrder.map(qId => ({
      id: qId,
      ...quiz.questions[qId]
    }))
  } else if (quiz.questions && typeof quiz.questions === 'object' && !Array.isArray(quiz.questions)) {
    // Nếu là Object nhưng không có order, chuyển thành mảng các giá trị
    quiz.questions = Object.values(quiz.questions)
  }
  
  // Đảm bảo questions luôn là mảng để tránh lỗi .length hoặc .map ở UI
  if (!quiz.questions || !Array.isArray(quiz.questions)) quiz.questions = []

  return quiz
}

/**
 * Fetch all quizzes from Firebase
 */
export async function fetchAllQuizzes() {
  try {
    const quizzesRef = collection(db, 'quizzes')
    const snapshot = await getDocs(quizzesRef)
    return snapshot.docs.map(doc => normalizeQuiz(doc.id, doc.data()))
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return []
  }
}

/**
 * Tạo một bài thi mới (ví dụ: Tạo phần GM1 trong GS6 LV1)
 */
export async function createQuiz(data) {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const newDoc = await addDoc(quizzesRef, {
      ...data,
      questions: [],
      createdAt: new Date().toISOString()
    });
    return newDoc.id;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
}

/**
 * Xóa một bài thi khỏi Firebase
 */
export async function deleteQuiz(quizId) {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    await deleteDoc(quizRef);
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

/**
 * Cập nhật dữ liệu quiz (ví dụ: thêm câu hỏi)
 */
export async function updateQuiz(quizId, data) {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    await updateDoc(quizRef, data);
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch a single quiz by ID
 */
export async function fetchQuizById(quizId) {
  try {
    const quizRef = doc(db, 'quizzes', quizId)
    const snapshot = await getDoc(quizRef)
    if (snapshot.exists()) {
      return normalizeQuiz(snapshot.id, snapshot.data())
    }
    return null
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return null
  }
}

/**
 * Fetch quizzes by category
 */
export async function fetchQuizzesByCategory(category) {
  try {
    const quizzesRef = collection(db, 'quizzes')
    const q = query(quizzesRef, where('category', '==', category))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => normalizeQuiz(doc.id, doc.data()))
  } catch (error) {
    console.error('Error fetching quizzes by category:', error)
    return []
  }
}

// ============================================
// Cloud Sync: Lịch sử làm bài (user_attempts)
// ============================================

/**
 * Lưu kết quả một lần làm bài của user lên Firestore.
 * Collection: user_attempts/{auto-id}
 */
export async function saveUserAttempt(userId, attemptData) {
  if (!userId) return null
  try {
    const attemptsRef = collection(db, 'user_attempts')
    const docRef = await addDoc(attemptsRef, {
      userId,
      ...attemptData,
      date: new Date().toISOString()
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving user attempt:', error)
    return null
  }
}

/**
 * Tải lịch sử làm bài của user từ Firestore (tối đa 20 bài gần nhất).
 */
export async function fetchUserAttempts(userId) {
  if (!userId) return []
  try {
    const attemptsRef = collection(db, 'user_attempts')
    const q = query(
      attemptsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(20)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching user attempts:', error)
    return []
  }
}

// ============================================
// Cloud Sync: Tiến trình làm dở (resume_progress)
// ============================================

/**
 * Lưu tiến trình làm dở của user lên Firestore.
 * Document ID: `${userId}_${quizId}_${mode}`
 */
export async function saveResumeProgress(userId, quizId, mode, progressData) {
  if (!userId) return
  try {
    const docId = `${userId}_${quizId}_${mode}`
    const progressRef = doc(db, 'resume_progress', docId)
    await setDoc(progressRef, {
      userId,
      quizId,
      mode,
      ...progressData,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving resume progress:', error)
  }
}

/**
 * Tải tiến trình làm dở từ Firestore.
 */
export async function fetchResumeProgress(userId, quizId, mode) {
  if (!userId) return null
  try {
    const docId = `${userId}_${quizId}_${mode}`
    const progressRef = doc(db, 'resume_progress', docId)
    const snapshot = await getDoc(progressRef)
    if (snapshot.exists()) {
      return snapshot.data()
    }
    return null
  } catch (error) {
    console.error('Error fetching resume progress:', error)
    return null
  }
}

/**
 * Xóa tiến trình làm dở khỏi Firestore (khi hoàn thành bài thi).
 */
export async function deleteResumeProgress(userId, quizId, mode) {
  if (!userId) return
  try {
    const docId = `${userId}_${quizId}_${mode}`
    const progressRef = doc(db, 'resume_progress', docId)
    await deleteDoc(progressRef)
  } catch (error) {
    console.error('Error deleting resume progress:', error)
  }
}
