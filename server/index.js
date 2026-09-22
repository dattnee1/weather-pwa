// =========================================================================
// MÁY CHỦ BACKEND NODE.JS + EXPRESS (server/index.js)
// =========================================================================
// Nhập framework Express để xây dựng máy chủ web backend
import express from "express";
// Thư viện phân tích Cookie từ HTTP Request header
import cookieParser from "cookie-parser";
// Nhập tập hợp các route xác thực tài khoản (đăng nhập, đăng ký, quên mật khẩu, me, logout)
import authRoutes from "./routes/auth.js";
// Nạp file db.js để tự động khởi tạo cơ sở dữ liệu SQLite và bảng dữ liệu khi server bật
import "./db.js";

// Khởi tạo ứng dụng Express
const app = express();
// Cổng hoạt động của máy chủ backend (Port 3001)
// Được Frontend Vite (Port 5173) cấu hình Proxy chuyển tiếp qua đường dẫn /api
const PORT = 3001;

// -------------------------------------------------------------------------
// CÁC MIDDLEWARE XỬ LÝ DỮ LIỆU ĐẦU VÀO
// -------------------------------------------------------------------------
// 1. Cho phép Express đọc và phân tích dữ liệu dạng JSON gửi lên từ body của Request
app.use(express.json());
// 2. Cho phép Express đọc và giải mã các Cookie do trình duyệt gửi kèm trong Request
app.use(cookieParser());

// -------------------------------------------------------------------------
// ĐỊNH TUYẾN CÁC ĐƯỜNG DẪN API (ROUTING)
// -------------------------------------------------------------------------
// Tất cả các yêu cầu bắt đầu bằng /api/auth/... sẽ được chuyển tiếp cho authRoutes xử lý:
// - /api/auth/register
// - /api/auth/login
// - /api/auth/me
// - /api/auth/logout
// - /api/auth/send-reset-code
// - /api/auth/verify-and-reset-password
app.use("/api/auth", authRoutes);

// Endpoint kiểm tra sức khỏe của server (Health check)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// -------------------------------------------------------------------------
// KHỞI ĐỘNG LẮNG NGHE YÊU CẦU TẠI CỔNG 3001
// -------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 [Backend Server] Đang chạy tại http://localhost:${PORT}`);
  console.log(`📁 [SQLite] Đang sử dụng database server/database.sqlite`);
});
