# Hướng dẫn Firebase Quiz System

## 1. Setup Firebase

### Bước 1: Tạo Firebase Project

1. Vào https://console.firebase.google.com
2. Tạo project mới
3. Bật Firestore Database và Authentication

### Bước 2: Cấu hình Authentication

**⚠️ QUAN TRỌNG: Nếu gặp lỗi `auth/configuration-not-found`, làm theo bước này:**

1. Vào Firebase Console → Chọn project `ic3-quizz`
2. Vào mục **Authentication** (ở phía bên trái)
3. Chọn tab **Sign-in method**
4. **Bật Email/Password** authentication:
   - Nhấn vào "Email/Password"
   - Bật "Enable"
   - Bật "Email enumeration protection (recommended)" (tùy chọn)
   - Nhấn "Save"
5. Đảm bảo status hiển thị "Enabled"

### Bước 3: Cấu hình firebaseConfig

Mở `src/firebase.js` và thay thế `firebaseConfig` bằng config của project Firebase của bạn:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## 2. Cấu trúc Firestore Database

### Collection: `quizzes`

```
quizzes
├── {quizId}
    ├── id: string
    ├── title: string
    ├── category: string
    ├── summary: string
    ├── duration: number (phút)
    └── questions: array
        ├── {questionId}
        │   ├── id: string
        │   ├── type: string (multiple_choice|multiple_select|fill_blank|drag_drop|hotspot|matching)
        │   ├── text: string
        │   ├── image?: string (URL ảnh câu hỏi - cho drag_drop, hotspot)
        │   ├── choices: array (cho multiple_choice, multiple_select)
        │   ├── answer: number|array (index hoặc [indices])
        │   ├── correctAnswers?: array (cho multiple_select, matching)
        │   ├── hints?: string
        │   └── explanation?: string
```

## 3. Các loại câu hỏi được hỗ trợ

### 1. Multiple Choice (Trắc nghiệm đơn)

```json
{
  "id": "q1",
  "type": "multiple_choice",
  "text": "1 + 1 = ?",
  "choices": ["1", "2", "3", "4"],
  "answer": 1,
  "explanation": "Đáp án đúng là 2"
}
```

### 2. Multiple Select (Chọn nhiều đáp án đúng)

```json
{
  "id": "q2",
  "type": "multiple_select",
  "text": "Chọn tất cả các thành phố lớn",
  "choices": ["Hà Nội", "TP.HCM", "Đà Nẵng", "Thanh Hóa"],
  "correctAnswers": [0, 1, 2],
  "explanation": "Hà Nội, TP.HCM, Đà Nẵng là ba thành phố lớn"
}
```

### 3. Fill Blank (Điền khoảng trống)

```json
{
  "id": "q3",
  "type": "fill_blank",
  "text": "The capital of France is ___",
  "answer": "Paris",
  "hints": "Thành phố nổi tiếng với tháp Eiffel",
  "explanation": "Đáp án là Paris"
}
```

### 4. Drag and Drop

```json
{
  "id": "q4",
  "type": "drag_drop",
  "text": "Sắp xếp các bước theo thứ tự",
  "items": ["Bước 1", "Bước 2", "Bước 3"],
  "correctOrder": [0, 1, 2],
  "explanation": "Đây là thứ tự đúng"
}
```

### 5. Hotspot (Click vào điểm đúng trên ảnh)

```json
{
  "id": "q5",
  "type": "hotspot",
  "text": "Click vào ổ cọc phía bên phải",
  "image": "https://example.com/image.jpg",
  "hotspots": [{ "x": 75, "y": 50, "width": 20, "height": 30 }],
  "answer": 0,
  "explanation": "Ổ cọc nằm ở phía bên phải hình ảnh"
}
```

### 6. Matching (Nối cặp)

```json
{
  "id": "q6",
  "type": "matching",
  "text": "Nối các từ với định nghĩa",
  "leftItems": ["Apple", "Orange", "Banana"],
  "rightItems": ["Trái quýt", "Quả táo", "Chuối"],
  "correctPairs": [
    [0, 1],
    [1, 0],
    [2, 2]
  ],
  "explanation": "Đây là các cặp đúng"
}
```

## 4. Ví dụ Firestore JSON

```json
{
  "quizzes": {
    "quiz_ic3_basics": {
      "id": "quiz_ic3_basics",
      "title": "IC3 Basics",
      "category": "Công nghệ Thông tin",
      "summary": "Kiến thức cơ bản về IT",
      "duration": 15,
      "questions": [
        {
          "id": "q1",
          "type": "multiple_choice",
          "text": "Phần mềm nào dùng để soạn thảo văn bản?",
          "choices": ["Excel", "Word", "PowerPoint", "Access"],
          "answer": 1,
          "explanation": "Word là phần mềm soạn thảo văn bản"
        },
        {
          "id": "q2",
          "type": "multiple_select",
          "text": "Chọn các phần mềm có trong Microsoft Office",
          "choices": ["Photoshop", "Excel", "Word", "Illustrator"],
          "correctAnswers": [1, 2],
          "explanation": "Excel và Word là phần của Office"
        }
      ]
    }
  }
}
```

## 5. Sử dụng trong ứng dụng

### Lấy tất cả quizzes

```javascript
import { fetchAllQuizzes } from "@/services/quizService";

const quizzes = await fetchAllQuizzes();
console.log(quizzes);
```

### Lấy quiz theo ID

```javascript
import { fetchQuizById } from "@/services/quizService";

const quiz = await fetchQuizById("quiz_ic3_basics");
console.log(quiz);
```

### Lấy quizzes theo category

```javascript
import { fetchQuizzesByCategory } from "@/services/quizService";

const quizzes = await fetchQuizzesByCategory("Công nghệ Thông tin");
console.log(quizzes);
```

## 6. Chuyển dữ liệu từ sampleQuizzes.js sang Firebase

1. Vào Firebase Console
2. Tạo collection `quizzes`
3. Thêm documents với ID là `quiz_id`
4. Copy dữ liệu từ `sampleQuizzes.js` vào mỗi document

Hoặc dùng script import để tự động hóa (sẽ thêm sau).

## 7. Cập nhật App.jsx

```javascript
import { fetchAllQuizzes } from "@/services/quizService";

useEffect(() => {
  const loadQuizzes = async () => {
    const data = await fetchAllQuizzes();
    setQuizzes(data);
  };
  loadQuizzes();
}, []);
```

## 8. Tiếp theo

Sau khi setup Firebase:

1. Cập nhật QuizList.jsx để hiển thị dữ liệu từ Firebase
2. Cập nhật Quiz.jsx để support nhiều loại câu hỏi
3. Tạo admin panel để quản lý câu hỏi
