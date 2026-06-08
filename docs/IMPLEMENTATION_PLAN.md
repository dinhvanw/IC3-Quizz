# Kế hoạch thực hiện: Firebase + Multiple Question Types

## 📋 Tóm tắt

Bạn muốn chuyển từ hardcode dữ liệu sang Firebase để quản lý câu hỏi dễ dàng hơn, và hỗ trợ nhiều loại câu hỏi như GMetrix.

## 🚀 Các bước thực hiện

### Phase 1: Setup Firebase (1-2 giờ)

#### Bước 1.1: Tạo Firebase Project

- [ ] Vào https://console.firebase.google.com
- [ ] Tạo project mới: "IC3-Quizz"
- [ ] Tạo Firestore Database (Production mode: Start in test mode)
- [ ] Copy Firebase Config

#### Bước 1.2: Update firebase.js

```javascript
// Thay YOUR_* bằng giá trị từ Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

#### Bước 1.3: Test kết nối

```bash
npm install
npm run dev
# Kiểm tra console trong browser có lỗi gì không
```

### Phase 2: Migrate dữ liệu sang Firebase (30 phút - 1 giờ)

#### Bước 2.1: Import sampleQuizzes

Có 2 cách:

**Cách 1: Dùng Firebase Console (dễ)**

1. Firebase Console → Firestore Database
2. Tạo Collection "quizzes"
3. Thêm từng quiz từ sampleQuizzes.js vào

**Cách 2: Dùng Script (nhanh)**

```bash
# Cập nhật package.json thêm script:
"import-quizzes": "node scripts/importQuizzes.js"

# Chạy:
npm run import-quizzes
```

#### Bước 2.2: Kiểm tra Firestore

- [ ] Firestore Database → Collection "quizzes" có dữ liệu chưa?
- [ ] Mỗi quiz có questions array chưa?

### Phase 3: Cập nhật Component để support nhiều loại câu hỏi (2-3 giờ)

#### Bước 3.1: Tạo QuestionRenderer.jsx

Tạo component để hiển thị từng loại câu hỏi:

```jsx
// src/components/questions/QuestionRenderer.jsx
import MultipleChoice from './types/MultipleChoice'
import MultipleSelect from './types/MultipleSelect'
import FillBlank from './types/FillBlank'
import DragDrop from './types/DragDrop'
import Matching from './types/Matching'
// ... etc

export default function QuestionRenderer({ question, selected, onSelect }) {
  switch(question.type) {
    case 'multiple_choice': return <MultipleChoice {...} />
    case 'multiple_select': return <MultipleSelect {...} />
    case 'fill_blank': return <FillBlank {...} />
    case 'drag_drop': return <DragDrop {...} />
    case 'matching': return <Matching {...} />
    default: return null
  }
}
```

#### Bước 3.2: Tạo từng loại câu hỏi

- [ ] MultipleChoice.jsx (đã có, chỉ cần refactor)
- [ ] MultipleSelect.jsx (checkbox)
- [ ] FillBlank.jsx (text input)
- [ ] DragDrop.jsx (drag n drop)
- [ ] Matching.jsx (line drawing)

#### Bước 3.3: Update Quiz.jsx

```javascript
import { fetchQuizById } from "@/services/quizService";
import QuestionRenderer from "./questions/QuestionRenderer";

// Thay selectChoice() để hỗ trợ các loại câu:
function selectChoice(choiceIndex) {
  const question = questions[index];

  if (question.type === "multiple_select") {
    // Xử lý multiple select (array)
    const selected = answers[index] || [];
    if (selected.includes(choiceIndex)) {
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = selected.filter((i) => i !== choiceIndex);
        return next;
      });
    } else {
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = [...selected, choiceIndex];
        return next;
      });
    }
  } else {
    // Xử lý single choice
    const next = [...answers];
    next[index] = choiceIndex;
    setAnswers(next);
  }
}

// Tính điểm cho từng loại câu:
function checkAnswer(answer, question) {
  switch (question.type) {
    case "multiple_choice":
      return answer === question.answer;
    case "multiple_select":
      return (
        JSON.stringify(Array.isArray(answer) ? answer.sort() : []) ===
        JSON.stringify(
          Array.isArray(question.correctAnswers)
            ? question.correctAnswers.sort()
            : [],
        )
      );
    case "fill_blank":
      return answer?.trim().toLowerCase() === question.answer.toLowerCase();
    case "drag_drop":
      return JSON.stringify(answer) === JSON.stringify(question.correctOrder);
    case "matching":
      return JSON.stringify(answer) === JSON.stringify(question.correctPairs);
    default:
      return false;
  }
}
```

#### Bước 3.4: Update useQuiz Hook

```javascript
// Tính toán điểm chính xác cho nhiều loại câu
function calculateScore(answers, questions) {
  let correct = 0;
  questions.forEach((q, idx) => {
    if (checkAnswer(answers[idx], q)) {
      correct++;
    }
  });
  return Math.round((correct / questions.length) * 100);
}
```

### Phase 4: Update QuizList.jsx để lấy từ Firebase (30 phút)

```javascript
import { fetchAllQuizzes } from "@/services/quizService";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      const data = await fetchAllQuizzes();
      setQuizzes(data);
      setLoading(false);
    }
    loadQuizzes();
  }, []);

  if (loading) return <div>Loading...</div>;
  return (
    <div>
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
```

### Phase 5: Testing & Optimization (1-2 giờ)

#### Bước 5.1: Test từng loại câu

- [ ] Multiple Choice: Chọn đáp án, xem feedback
- [ ] Multiple Select: Chọn nhiều, kiểm tra điểm
- [ ] Fill Blank: Nhập text, kiểm tra
- [ ] Drag Drop: Sắp xếp, kiểm tra
- [ ] Matching: Nối cặp, kiểm tra

#### Bước 5.2: Test Review Feature

- [ ] Quay lại câu trước (Prev)
- [ ] Xem lại câu đã làm
- [ ] Không thể sửa câu đã khóa
- [ ] Click Next một lần để qua câu

#### Bước 5.3: Performance

- [ ] Lazy load quizzes
- [ ] Cache dữ liệu
- [ ] Optimize re-renders

## 📁 Cấu trúc files mới

```
src/
├── components/
│   ├── Quiz.jsx (update)
│   ├── QuizList.jsx (update)
│   ├── questions/
│   │   ├── QuestionRenderer.jsx (new)
│   │   └── types/
│   │       ├── MultipleChoice.jsx (refactor)
│   │       ├── MultipleSelect.jsx (new)
│   │       ├── FillBlank.jsx (new)
│   │       ├── DragDrop.jsx (new)
│   │       └── Matching.jsx (new)
├── services/
│   └── quizService.js (new)
├── hooks/
│   ├── useQuiz.js (new)
│   └── useQuestionValidation.js (new)
├── data/
│   └── sampleQuizzes.js (update)
└── firebase.js (setup + test)

scripts/
└── importQuizzes.js (new)

docs/
├── FIREBASE_SETUP.md (new)
└── IMPLEMENTATION_PLAN.md (this file)
```

## 💡 Tips & Recommendations

### Về Firebase:

- Dùng **Test Mode** lúc phát triển (cho phép read/write cho tất cả)
- Khi production: setup Authentication + Security Rules
- Index ngành theo category để query nhanh

### Về Question Types:

- Mỗi type nên là component riêng (dễ bảo trì)
- Dùng validation hook để check đáp án
- Store answers theo format của từng type (single, array, string, v.v.)

### Về UX:

- Hiển thị progress bar: X/Y câu
- Lưu draft answer khi navigate
- Export kết quả dạng PDF

## ⏰ Timeline

- **Phase 1 (Firebase setup)**: 1-2 giờ
- **Phase 2 (Data migration)**: 30 phút - 1 giờ
- **Phase 3 (Component update)**: 2-3 giờ
- **Phase 4 (QuizList update)**: 30 phút
- **Phase 5 (Testing)**: 1-2 giờ

**Tổng cộng**: ~5-8 giờ làm việc

## 🆘 Nếu cần hỗ trợ

1. **Firestore rules không cho phép access?**
   - Vào Security Rules → Thay bằng test mode
   - Hoặc setup auth đúng

2. **Import script bị lỗi?**
   - Check Firebase config có đúng không
   - Check node modules cài đủ

3. **Question type mới không hiển thị?**
   - Check question.type có đúng spelling không
   - Check QuestionRenderer import đủ component

## 📚 Tài liệu tham khảo

- Firebase Firestore: https://firebase.google.com/docs/firestore
- React hooks: https://react.dev/reference/react
- Drag & Drop API: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
