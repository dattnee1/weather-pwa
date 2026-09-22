// =========================================================================
// CÔNG CỤ XEM NHANH DỮ LIỆU MYSQL LARAGON TRÊN TERMINAL (server/view-db.js)
// =========================================================================
import { pool } from "./db.js";

async function showDatabase() {
  try {
    console.log("\n📊 ================== DỮ LIỆU MYSQL TRÊN LARAGON ==================");
    console.log("📌 Danh sách tài khoản trong bảng 'users':");

    const [users] = await pool.execute("SELECT id, email, name, role, password, created_at FROM users");

    const displayUsers = users.map((u) => ({
      ID: u.id,
      Email: u.email,
      "Họ Tên": u.name,
      "Vai Trò": u.role,
      "Mật Khẩu (Bcrypt Hash)": u.password.substring(0, 15) + "...",
      "Ngày Tạo": u.created_at,
    }));

    console.table(displayUsers);

    const [sessions] = await pool.execute("SELECT * FROM sessions");
    console.log(`🔑 Phiên đăng nhập đang hoạt động: ${sessions.length} phiên\n`);

    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi đọc database:", error.message);
    process.exit(1);
  }
}

showDatabase();
