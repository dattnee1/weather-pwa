// =========================================================================
// HỘP THOẠI MODAL ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MẬT KHẨU (LoginPage.jsx)
// =========================================================================
import { useState, useEffect } from "react";
// Lấy các hàm đăng nhập và đăng ký từ context trung tâm
import { useAuth } from "../context/useAuth";

// Props nhận vào:
// - isOpen: Biến boolean điều khiển modal hiển thị hay ẩn
// - onClose: Hàm gọi khi người dùng bấm nút ✕ hoặc bấm ra ngoài nền tối
// - initialMode: Chế độ ban đầu ('login' hoặc 'register') khi mở modal
export default function LoginPage({ isOpen = true, onClose, initialMode = "login" }) {
  // Lấy hàm login và register từ AuthContext
  const { login, register } = useAuth();

  // -----------------------------------------------------------------------
  // 1. Quản lý trạng thái chuyển đổi giữa các Tab biểu mẫu
  // -----------------------------------------------------------------------
  // mode có 3 giá trị: 'login' (Đăng nhập), 'register' (Đăng ký), 'forgot' (Quên mật khẩu)
  const [mode, setMode] = useState(initialMode);

  // -----------------------------------------------------------------------
  // 2. Quản lý các trường nhập liệu trong Form
  // -----------------------------------------------------------------------
  const [name, setName] = useState(""); // Họ và tên (chỉ dùng khi đăng ký)
  const [email, setEmail] = useState(""); // Địa chỉ email tài khoản
  const [password, setPassword] = useState(""); // Mật khẩu chính
  const [confirmPassword, setConfirmPassword] = useState(""); // Xác nhận lại mật khẩu
  const [rememberMe, setRememberMe] = useState(true); // Checkbox ghi nhớ 30 ngày hay phiên tạm
  const [showPassword, setShowPassword] = useState(false); // Ẩn / hiện mật khẩu (icon con mắt)
  const [loading, setLoading] = useState(false); // Trạng thái đang gửi API
  const [errorMessage, setErrorMessage] = useState(""); // Thông báo lỗi màu đỏ nếu thất bại
  const [successMessage, setSuccessMessage] = useState(""); // Thông báo thành công màu xanh

  // -----------------------------------------------------------------------
  // 3. Quy trình Quên mật khẩu OTP 2 bước:
  // - Bước 1: Nhập email -> Hệ thống kiểm tra có trong SQLite không -> Tạo mã OTP 6 số (hạn 10p)
  // - Bước 2: Nhập mã OTP 6 số + Mật khẩu mới -> Cập nhật mật khẩu băm Bcrypt vào SQLite
  // -----------------------------------------------------------------------
  const [forgotStep, setForgotStep] = useState(1); // Bước hiện tại: 1 hoặc 2
  const [otpCode, setOtpCode] = useState(""); // Mã OTP 6 chữ số người dùng nhập
  const [receivedDevCode, setReceivedDevCode] = useState(""); // Mã OTP hiển thị hỗ trợ thử nghiệm

  // Đồng bộ lại chế độ mode mỗi khi component được mở lại
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [initialMode, isOpen]);

  // =======================================================================
  // HÀM GỬI MÃ XÁC THỰC 6 SỐ (Bước 1 của Quên mật khẩu)
  // - Dẫn tới: POST /api/auth/send-reset-code (trong server/routes/auth.js)
  // =======================================================================
  const handleSendResetCode = async (e) => {
    e.preventDefault(); // Ngăn trình duyệt tải lại trang khi submit form
    setErrorMessage("");
    setSuccessMessage("");
    setReceivedDevCode("");

    // Kiểm tra định dạng cơ bản: không được để trống email
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email của bạn!");
      return;
    }

    try {
      setLoading(true);
      // Gửi yêu cầu lên Backend để kiểm tra email tồn tại và tạo mã OTP 6 chữ số
      const res = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      // Nếu Backend báo lỗi (ví dụ: email chưa được đăng ký trong database)
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi mã xác thực!");
      }

      // Chuyển sang Bước 2: Nhập mã và mật khẩu mới
      setForgotStep(2);
      setSuccessMessage(data.message || "Đã gửi mã xác nhận 6 số đến email của bạn!");
      if (data.code) {
        setReceivedDevCode(data.code);
        setOtpCode(data.code); // Điền sẵn mã vào ô input để tiện kiểm thử nhanh
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================================
  // HÀM XỬ LÝ SUBMIT BIỂU MẪU CHÍNH (Đăng nhập, Đăng ký hoặc Đổi mật khẩu)
  // =======================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // ---------------------------------------------------------------------
    // TRƯỜNG HỢP 1: ĐĂNG NHẬP
    // ---------------------------------------------------------------------
    if (mode === "login") {
      if (!email.trim()) {
        setErrorMessage("Vui lòng nhập địa chỉ Email!");
        return;
      }
      if (!password) {
        setErrorMessage("Vui lòng nhập mật khẩu!");
        return;
      }
      try {
        setLoading(true);
        // Gọi hàm login từ AuthContext (sẽ gửi POST /api/auth/login)
        await login(email.trim(), password, rememberMe);
        // Đăng nhập thành công -> Đóng popup modal
        if (onClose) onClose();
      } catch (err) {
        setErrorMessage(err.message || "Đăng nhập thất bại!");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ---------------------------------------------------------------------
    // TRƯỜNG HỢP 2: ĐĂNG KÝ TÀI KHOẢN MỚI
    // ---------------------------------------------------------------------
    if (mode === "register") {
      if (!name.trim()) {
        setErrorMessage("Vui lòng nhập họ và tên của bạn!");
        return;
      }
      if (!email.trim()) {
        setErrorMessage("Vui lòng nhập địa chỉ Email!");
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage("Mật khẩu phải chứa ít nhất 6 ký tự!");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Xác nhận mật khẩu không khớp!");
        return;
      }

      try {
        setLoading(true);
        // Gọi hàm register từ AuthContext (sẽ gửi POST /api/auth/register)
        await register(email.trim(), password, name.trim());
        // Đăng ký thành công -> Tự động đăng nhập luôn và đóng modal
        if (onClose) onClose();
      } catch (err) {
        setErrorMessage(err.message || "Đăng ký thất bại!");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ---------------------------------------------------------------------
    // TRƯỜNG HỢP 3: XÁC THỰC MÃ OTP 6 CHỮ SỐ & ĐẶT MẬT KHẨU MỚI (Bước 2 Quên mật khẩu)
    // - Dẫn tới: POST /api/auth/verify-and-reset-password (trong server/routes/auth.js)
    // ---------------------------------------------------------------------
    if (mode === "forgot" && forgotStep === 2) {
      if (!otpCode.trim() || otpCode.trim().length !== 6) {
        setErrorMessage("Vui lòng nhập đúng mã xác nhận gồm 6 chữ số!");
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage("Mật khẩu mới phải chứa ít nhất 6 ký tự!");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Xác nhận mật khẩu mới không khớp!");
        return;
      }

      try {
        setLoading(true);
        // Gửi mã OTP và mật khẩu mới lên server để kiểm tra và cập nhật vào SQLite
        const res = await fetch("/api/auth/verify-and-reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            code: otpCode.trim(),
            newPassword: password,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Xác thực mã thất bại!");
        }

        // Đổi mật khẩu thành công: thông báo và đưa người dùng về tab đăng nhập
        setSuccessMessage(data.message || "Đổi mật khẩu thành công! Vui lòng đăng nhập.");
        setPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setReceivedDevCode("");
        setForgotStep(1);
        setMode("login");
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Nạp sẵn tài khoản mẫu thử nghiệm
  const handleUseDemo = () => {
    setMode("login");
    setEmail("admin@weather.pwa");
    setPassword("123456");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Chuyển sang màn hình Quên mật khẩu
  const handleSwitchToForgot = () => {
    setMode("forgot");
    setForgotStep(1);
    setOtpCode("");
    setReceivedDevCode("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Nếu isOpen là false thì không render bất kỳ phần tử nào
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto select-none">
      {/* Nền bấm ra ngoài để đóng modal */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Thẻ kính Glassmorphism chính */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 transition-all duration-300 z-10 my-auto">
        {/* Nút đóng modal ✕ */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Đóng cửa sổ"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer z-20"
          >
            ✕
          </button>
        )}
        
        {/* Header thương hiệu */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-2.5 flex items-center justify-center w-15 h-15 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30 text-white text-3xl">
            ☀️
            <span className="absolute -bottom-1 -right-1 text-base">🌧️</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Weather Forecast
          </h1>
        </div>

        {/* Thanh chuyển đổi Tab hoặc Tiêu đề Khôi Phục */}
        {mode === "forgot" ? (
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>🔑</span>
              <span>Khôi Phục Mật Khẩu</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage("");
                setSuccessMessage("");
                setReceivedDevCode("");
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        ) : (
          <div className="flex bg-slate-100/90 p-1 rounded-xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-indigo-600 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-indigo-600 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đăng Ký Mới
            </button>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông báo thành công nếu có */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Khung gợi ý mã xác thực đã nhận được (hỗ trợ thử nghiệm nhanh) */}
        {mode === "forgot" && forgotStep === 2 && receivedDevCode && (
          <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📩</span>
              <span>Mã xác nhận vừa gửi: <strong>{receivedDevCode}</strong></span>
            </div>
            <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-bold">10 phút</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* FORM 1: BƯỚC 1 CỦA QUÊN MẬT KHẨU (NHẬP EMAIL ĐỂ GỬI MÃ)  */}
        {/* ======================================================== */}
        {mode === "forgot" && forgotStep === 1 ? (
          <form onSubmit={handleSendResetCode} className="space-y-3.5">
            <p className="text-xs text-slate-500">
              Nhập email tài khoản của bạn. Hệ thống sẽ kiểm tra và gửi một mã xác nhận 6 số để đổi mật khẩu.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">
                Email tài khoản đã đăng ký
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">📧</span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@weather.pwa"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              id="btn-send-code"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang kiểm tra email...</span>
                </>
              ) : (
                <span>Gửi Mã Xác Thực 6 Số ➔</span>
              )}
            </button>
          </form>
        ) : (
          /* ======================================================== */
          /* FORM CHÍNH: ĐĂNG NHẬP / ĐĂNG KÝ / ĐỔI PASS VỚI MÃ OTP    */
          /* ======================================================== */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Tên người dùng (chỉ hiện khi Đăng ký) */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">
                  Họ và Tên
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 text-sm">👤</span>
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Email (khi ở bước 2 quên mật khẩu sẽ hiển thị kèm nút đổi) */}
            {mode === "forgot" && forgotStep === 2 ? (
              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Email nhận mã:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setErrorMessage("");
                    }}
                    className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Đổi email khác
                  </button>
                </div>
                <div className="py-2 px-3 bg-slate-100/90 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
                  {email}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">
                  Địa chỉ Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 text-sm">📧</span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@weather.pwa"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Ô NHẬP MÃ XÁC NHẬN 6 KÝ TỰ (Chỉ hiện khi Quên mật khẩu - Bước 2) */}
            {mode === "forgot" && forgotStep === 2 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">
                  Mã xác nhận 6 số
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 text-sm">🔢</span>
                  <input
                    id="otp-code"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Nhập 6 chữ số"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-slate-800 font-mono font-bold tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Mật khẩu Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">
                {mode === "forgot" ? "Mật khẩu mới" : "Mật khẩu"}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-1 rounded transition cursor-pointer"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu (khi Đăng ký hoặc Đổi mật khẩu) */}
            {(mode === "register" || mode === "forgot") && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 ml-1">
                  {mode === "forgot" ? "Xác nhận Mật khẩu mới" : "Xác nhận Mật khẩu"}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 text-sm">🔐</span>
                  <input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Ghi nhớ đăng nhập & Quên Mật Khẩu (chỉ hiện ở tab Đăng nhập) */}
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={handleSwitchToForgot}
                  className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Nút gửi Form */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:via-indigo-700 hover:to-sky-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>
                  {mode === "login"
                    ? "Đăng Nhập ➔"
                    : mode === "register"
                    ? "Tạo Tài Khoản Mới ➔"
                    : "Xác Nhận & Đổi Mật Khẩu ➔"}
                </span>
              )}
            </button>

            {/* Nút Gửi lại mã xác nhận (khi ở bước 2 quên mật khẩu) */}
            {mode === "forgot" && forgotStep === 2 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={loading}
                  className="text-xs text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                >
                  Chưa nhận được mã? <span className="underline font-semibold">Gửi lại mã</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* Nút đăng nhập nhanh bằng Demo Account (chỉ ở tab Login) */}
        {mode === "login" && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <button
              id="btn-demo-admin"
              type="button"
              onClick={handleUseDemo}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              👑 <span>Tài khoản Demo có sẵn (admin@weather.pwa / 123456)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
