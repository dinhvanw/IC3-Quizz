import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from '../firebase.js'
import { doc, getDoc, setDoc } from 'firebase/firestore'

/**
 * Danh sách email admin mặc định.
 * Ngoài ra, hệ thống cũng kiểm tra trường `isAdmin` trên Firestore document của user.
 */
const DEFAULT_ADMIN_EMAILS = [
  'admin@ic3quizz.com',
  // Thêm email admin tại đây
]

/**
 * Đăng nhập bằng email/password
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error) {
    let message = 'Đã có lỗi xảy ra khi đăng nhập.'
    switch (error.code) {
      case 'auth/configuration-not-found':
        message = 'Firebase Authentication chưa được cấu hình. Vui lòng kiểm tra Firebase Console: bật Email/Password authentication trong Sign-in methods.'
        break
      case 'auth/user-not-found':
        message = 'Không tìm thấy tài khoản với email này.'
        break
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Mật khẩu không chính xác.'
        break
      case 'auth/invalid-email':
        message = 'Địa chỉ email không hợp lệ.'
        break
      case 'auth/too-many-requests':
        message = 'Quá nhiều lần thử. Vui lòng thử lại sau.'
        break
      default:
        message = error.message
    }
    console.error('Login error:', error.code, error)
    return { user: null, error: message }
  }
}

/**
 * Đăng ký tài khoản mới
 */
export async function register(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Tạo profile trên Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName || email.split('@')[0],
      isAdmin: DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase()),
      createdAt: new Date().toISOString()
    })

    return { user, error: null }
  } catch (error) {
    let message = 'Đã có lỗi xảy ra khi đăng ký.'
    switch (error.code) {
      case 'auth/configuration-not-found':
        message = 'Firebase Authentication chưa được cấu hình. Vui lòng kiểm tra Firebase Console: bật Email/Password authentication trong Sign-in methods.'
        break
      case 'auth/email-already-in-use':
        message = 'Email này đã được đăng ký. Hãy đăng nhập.'
        break
      case 'auth/weak-password':
        message = 'Mật khẩu quá yếu. Cần ít nhất 6 ký tự.'
        break
      case 'auth/invalid-email':
        message = 'Địa chỉ email không hợp lệ.'
        break
      default:
        message = error.message
    }
    console.error('Register error:', error.code, error)
    return { user: null, error: message }
  }
}

/**
 * Đăng xuất
 */
export async function logout() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error)
  }
}

/**
 * Kiểm tra trạng thái đăng nhập. Trả về Promise resolve user hoặc null.
 */
export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Kiểm tra xem user hiện tại có phải admin không.
 * Kiểm tra cả danh sách email cứng lẫn cờ isAdmin trên Firestore.
 */
export async function checkIsAdmin(user) {
  if (!user) return false

  // Kiểm tra danh sách email admin mặc định
  if (DEFAULT_ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
    return true
  }

  // Kiểm tra cờ isAdmin trên Firestore
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (userDoc.exists()) {
      return userDoc.data().isAdmin === true
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra quyền admin:', error)
  }

  return false
}

/**
 * Lấy profile người dùng từ Firestore
 */
export async function getUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Lỗi khi lấy profile:', error)
    return null
  }
}
