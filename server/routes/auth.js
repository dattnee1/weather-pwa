// =========================================================================
// CÁC ROUTE XÁC THỰC TÀI KHOẢN VỚI MYSQL LARAGON (server/routes/auth.js)
// =========================================================================
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db.js"; // Nhập pool kết nối MySQL

const router = express.Router();

// =========================================================================
// HÀM HELPER: TẠO PHIÊN ĐĂNG NHẬP VÀ THIẾT LẬP COOKIE HTTPONLY
// =========================================================================
async function createSessionAndSetCookie(res, userId, rememberMe = true) {
  const token = crypto.randomUUID();
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + duration;

  // 1. Dọn dẹp phiên hết hạn khỏi MySQL
  await pool.execute("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]);

  // 2. Thêm phiên mới vào bảng sessions
  await pool.execute(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    [token, userId, expiresAt]
  );

  // 3. Thiết lập HttpOnly Cookie gửi về trình duyệt
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: false, // Môi trường localhost
    path: "/",
  };

  if (rememberMe) {
    cookieOptions.maxAge = duration;
  }

  res.cookie("auth_token", token, cookieOptions);
  return token;
}

// =========================================================================
// 1. ROUTE ĐĂNG KÝ: POST /api/auth/register
// =========================================================================
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ email, mật khẩu và họ tên!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu phải chứa ít nhất 6 ký tự!" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Kiểm tra xem email đã tồn tại trong MySQL chưa
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email này đã được đăng ký tài khoản!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedEmail)}`;

    // Chèn người dùng mới vào MySQL
    const [result] = await pool.execute(
      `INSERT INTO users (email, password, name, role, avatar) VALUES (?, ?, ?, 'Thành viên', ?)`,
      [trimmedEmail, hashedPassword, name.trim(), avatar]
    );

    // Lấy ID vừa tự động tăng: result.insertId
    await createSessionAndSetCookie(res, result.insertId);

    return res.json({
      success: true,
      user: {
        id: result.insertId,
        email: trimmedEmail,
        name: name.trim(),
        role: "Thành viên",
        avatar,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi đăng ký tài khoản!" });
  }
});

// =========================================================================
// 2. ROUTE ĐĂNG NHẬP: POST /api/auth/login
// =========================================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ email và mật khẩu!" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [trimmedEmail]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác!" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác!" });
    }

    await createSessionAndSetCookie(res, user.id, rememberMe !== false);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi đăng nhập!" });
  }
});

// =========================================================================
// 3. ROUTE KIỂM TRA PHIÊN HIỆN TẠI: GET /api/auth/me
// =========================================================================
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập!" });
    }

    // JOIN bảng sessions với bảng users
    const [rows] = await pool.execute(
      `SELECT sessions.token, sessions.expires_at, users.id, users.email, users.name, users.role, users.avatar
       FROM sessions
       JOIN users ON sessions.user_id = users.id
       WHERE sessions.token = ? AND sessions.expires_at > ?`,
      [token, Date.now()]
    );

    const session = rows[0];

    if (!session) {
      res.clearCookie("auth_token", { path: "/" });
      return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn!" });
    }

    return res.json({
      success: true,
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        avatar: session.avatar,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy session:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi xác thực!" });
  }
});

// =========================================================================
// 4. ROUTE ĐĂNG XUẤT: POST /api/auth/logout
// =========================================================================
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (token) {
      await pool.execute("DELETE FROM sessions WHERE token = ?", [token]);
    }
    res.clearCookie("auth_token", { path: "/" });
    return res.json({ success: true, message: "Đăng xuất thành công!" });
  } catch (err) {
    console.error("Lỗi đăng xuất:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi đăng xuất!" });
  }
});

// =========================================================================
// 5. ROUTE GỬI MÃ OTP QUÊN MẬT KHẨU: POST /api/auth/send-reset-code
// =========================================================================
router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Vui lòng nhập địa chỉ email!" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [trimmedEmail]);

    if (users.length === 0) {
      return res.status(404).json({ error: "Email này chưa tồn tại trong hệ thống!" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // Hạn 10 phút

    // Cú pháp MySQL khi trùng khóa chính email: ON DUPLICATE KEY UPDATE
    await pool.execute(
      `INSERT INTO reset_codes (email, code, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
      [trimmedEmail, code, expiresAt]
    );

    console.log(`\n📨 ================================================`);
    console.log(`📩 [GỬI MÃ XÁC THỰC EMAIL - LARAGON MYSQL]`);
    console.log(`👉 Người nhận: ${trimmedEmail}`);
    console.log(`🔑 Mã xác thực 6 ký tự: [ ${code} ]`);
    console.log(`================================================\n`);

    return res.json({
      success: true,
      message: "Đã gửi mã xác nhận 6 số đến email của bạn!",
      code,
    });
  } catch (err) {
    console.error("Lỗi gửi mã OTP:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi gửi mã xác thực!" });
  }
});

// =========================================================================
// 6. ROUTE XÁC MINH OTP VÀ ĐỔI MẬT KHẨU: POST /api/auth/verify-and-reset-password
// =========================================================================
router.post("/verify-and-reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ email, mã và mật khẩu mới!" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới phải chứa ít nhất 6 ký tự!" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [trimmedEmail]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản người dùng này!" });
    }

    const [records] = await pool.execute("SELECT * FROM reset_codes WHERE email = ?", [trimmedEmail]);
    const record = records[0];

    if (!record) {
      return res.status(400).json({ error: "Bạn chưa yêu cầu mã xác thực cho email này!" });
    }

    if (Date.now() > record.expires_at) {
      await pool.execute("DELETE FROM reset_codes WHERE email = ?", [trimmedEmail]);
      return res.status(400).json({ error: "Mã xác thực đã hết hạn! Vui lòng xin mã mới." });
    }

    if (record.code !== trimmedCode) {
      return res.status(400).json({ error: "Mã xác thực không chính xác!" });
    }

    // Cập nhật mật khẩu mới đã băm
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);

    // Xóa mã OTP và hủy toàn bộ phiên cũ
    await pool.execute("DELETE FROM reset_codes WHERE email = ?", [trimmedEmail]);
    await pool.execute("DELETE FROM sessions WHERE user_id = ?", [user.id]);

    return res.json({
      success: true,
      message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
    });
  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err);
    return res.status(500).json({ error: "Lỗi hệ thống khi đổi mật khẩu!" });
  }
});

export default router;
