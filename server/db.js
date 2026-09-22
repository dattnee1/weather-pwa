// =========================================================================
// KẾT NỐI VÀ KHỞI TẠO CƠ SỞ DỮ LIỆU MYSQL TRÊN LARAGON (server/db.js)
// =========================================================================
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// -------------------------------------------------------------------------
// 1. THIẾT LẬP BỂ KẾT NỐI (CONNECTION POOL)
// -------------------------------------------------------------------------
export const pool = mysql.createPool({
  host: "localhost",          // Địa chỉ máy chủ MySQL của Laragon
  port: 3306,                 // Cổng mặc định của MySQL
  user: "root",               // Tài khoản mặc định trong Laragon
  password: "",               // Mật khẩu mặc định trong Laragon để trống
  database: "weather_app",    // Database vừa tạo ở Bước 1
  waitForConnections: true,   // Chờ nếu toàn bộ kết nối trong pool đang bận
  connectionLimit: 10,        // Tối đa 10 kết nối đồng thời
  queueLimit: 0,              // Hàng đợi yêu cầu không giới hạn
});

// -------------------------------------------------------------------------
// 2. HÀM TỰ ĐỘNG KHỞI TẠO BẢNG & DỮ LIỆU MẪU (AUTO INITIALIZATION)
// -------------------------------------------------------------------------
export async function initDatabase() {
  try {
    // 1. Tạo bảng users (Người dùng)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Thành viên',
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tạo bảng sessions (Lưu phiên đăng nhập Cookie HttpOnly)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(100) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tạo bảng reset_codes (Mã OTP quên mật khẩu)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS reset_codes (
        email VARCHAR(191) PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        expires_at BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Kiểm tra và tự động sinh tài khoản Admin mẫu nếu chưa tồn tại
    const [existingAdmin] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      ["admin@weather.pwa"]
    );

    if (existingAdmin.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync("123456", salt);
      const avatarUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=admin@weather.pwa";

      await pool.execute(
        `INSERT INTO users (email, password, name, role, avatar) VALUES (?, ?, ?, ?, ?)`,
        ["admin@weather.pwa", hashedPassword, "Admin", "Quản trị viên", avatarUrl]
      );
      console.log("-> [MySQL Laragon] Đã khởi tạo tài khoản mặc định: admin@weather.pwa / 123456");
    }

    console.log("-> [MySQL Laragon] Kết nối thành công & cấu trúc bảng đã sẵn sàng!");
  } catch (error) {
    console.error("❌ [MySQL Laragon] Lỗi khởi tạo cơ sở dữ liệu:", error.message);
  }
}

// Chạy khởi tạo ngay khi nạp file
initDatabase();
