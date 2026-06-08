export const sampleQuizzes = [
  {
    id: "quiz_ic3_gs6_demo",
    title: "IC3 GS6 - Demo Tổng Hợp Các Loại Câu Hỏi",
    category: "Kiến thức tổng hợp",
    summary: "Bài thi mẫu chứa tất cả các dạng câu hỏi GMetrix phổ biến nhất.",
    duration: 20,
    questions: [
      {
        id: "gs6_q1",
        type: "multiple_choice",
        text: "Thiết bị nào sau đây được coi là 'não bộ' của máy tính?",
        choices: ["RAM", "Ổ cứng (HDD/SSD)", "Bộ vi xử lý (CPU)", "Card đồ họa (GPU)"],
        answer: 2,
        explanation: "CPU (Central Processing Unit) thực hiện các tính toán và điều khiển mọi hoạt động của máy tính."
      },
      {
        id: "gs6_q2",
        type: "multiple_select",
        text: "Những hành động nào sau đây giúp bảo vệ máy tính khỏi phần mềm độc hại? (Chọn 3)",
        choices: [
          "Cài đặt phần mềm diệt virus",
          "Mở tất cả các tệp đính kèm trong email lạ",
          "Cập nhật hệ điều hành thường xuyên",
          "Sử dụng tường lửa (Firewall)",
          "Chia sẻ mật khẩu với bạn bè"
        ],
        correctAnswers: [0, 2, 3],
        explanation: "Phần mềm diệt virus, cập nhật hệ thống và tường lửa là các lớp bảo mật cơ bản."
      },
      {
        id: "gs6_q3",
        type: "fill_blank",
        text: "Tên viết tắt của mạng diện rộng là ____ (Viết hoa 3 chữ cái)",
        answer: "WAN",
        explanation: "WAN là viết tắt của Wide Area Network."
      },
      {
        id: "gs6_q4",
        type: "drag_drop",
        text: "Hãy sắp xếp các đơn vị đo lường bộ nhớ sau theo thứ tự từ nhỏ đến lớn:",
        items: ["Kilobyte (KB)", "Byte", "Megabyte (MB)", "Gigabyte (GB)"],
        correctOrder: [1, 0, 2, 3],
        explanation: "Thứ tự đúng là: Byte < KB < MB < GB."
      },
      {
        id: "gs6_q5",
        type: "matching",
        text: "Hãy nối các thiết bị sau với đúng loại chức năng của chúng:",
        leftItems: ["Bàn phím", "Màn hình", "Loa", "Máy quét (Scanner)"],
        rightItems: ["Thiết bị nhập (Input)", "Thiết bị xuất (Output)"],
        correctPairs: [
          { l: 0, r: 0 },
          { l: 1, r: 1 },
          { l: 2, r: 1 },
          { l: 3, r: 0 }
        ],
        explanation: "Bàn phím và Máy quét là thiết bị nhập. Màn hình và Loa là thiết bị xuất."
      },
      {
        id: "gs6_q6",
        type: "matrix_radio",
        text: "Phân loại các thiết bị sau theo chức năng chính của chúng:",
        devices: [
          { id: "m1", text: "Màn hình cảm ứng" },
          { id: "m2", text: "Máy chiếu" },
          { id: "m3", text: "Máy quét mã vạch" }
        ],
        columns: ["Nhập (Input)", "Xuất (Output)"],
        answer: {
          "m1": 0,
          "m2": 1,
          "m3": 0
        },
        explanation: "Máy chiếu là thiết bị xuất. Máy quét mã vạch là thiết bị nhập."
      },
      {
        id: "gs6_q7",
        type: "hotspot",
        text: "Hãy click vào vị trí của nút 'Làm mới trang' (Refresh) trong hình ảnh dưới đây:",
        image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800",
        hotspots: [
          { x: 10, y: 10, width: 10, height: 10 }
        ],
        answer: 0,
        explanation: "Nút Refresh thường nằm cạnh thanh địa chỉ ở góc trên bên trái trình duyệt."
      },
      {
        id: "gs6_q8",
        type: "TRUE_FALSE_MATRIX",
        text: "Đánh giá các tổ hợp phím tắt sau:",
        rows: [
          { "id": "r1", "text": "Windows Ctrl+P hay MacOS Cmd+P = Paste" },
          { "id": "r2", "text": "Windows Ctrl+X hay MacOS Cmd+X = Cut" },
          { "id": "r3", "text": "Windows Ctrl+A hay MacOS Cmd+A = Select All Text" },
          { "id": "r4", "text": "Windows Ctrl+E hay MacOS Cmd+E = End of Document" }
        ],
        columns: ["Đúng", "Sai"],
        answer: {
          "r1": 1,
          "r2": 0,
          "r3": 0,
          "r4": 1
        },
        explanation: "Ctrl+P là Print, Ctrl+X là Cut, Ctrl+A là Select All. Ctrl+E thường dùng để căn giữa (Center)."
      }
    ]
  }
];