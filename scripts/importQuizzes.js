import { db } from '../src/firebase.js';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { sampleQuizzes } from '../src/data/sampleQuizzes.js';

async function importData() {
  console.log('🚀 Bắt đầu làm sạch và cập nhật dữ liệu trên Firebase...');
  
  try {
    // Bước 1: Xóa toàn bộ dữ liệu cũ trong collection 'quizzes'
    const querySnapshot = await getDocs(collection(db, 'quizzes'));
    const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, 'quizzes', document.id)));
    await Promise.all(deletePromises);
    console.log('🧹 Đã xóa toàn bộ câu hỏi cũ trên Firebase.');

    // Bước 2: Import dữ liệu mới từ sampleQuizzes.js
    for (const quiz of sampleQuizzes) {
      // Đẩy dữ liệu quiz vào collection 'quizzes'
      const quizRef = doc(collection(db, 'quizzes'), quiz.id);
      await setDoc(quizRef, quiz);
      console.log(`✅ Đã import thành công bài thi: ${quiz.title}`);
    }
    console.log('🎉 Hoàn tất! Dữ liệu đã sẵn sàng trên Firebase.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi import dữ liệu:', error);
    process.exit(1);
  }
}

importData();