// Nhập các React Hook cốt lõi:
// - createContext: Tạo ngữ cảnh dùng chung (Context) để truyền dữ liệu đi khắp ứng dụng
// - useState: Quản lý biến trạng thái (state) người dùng đang đăng nhập
// - useEffect: Chạy các hiệu ứng phụ (như gọi API kiểm tra phiên đăng nhập khi web vừa mở)
import { createContext, useState, useEffect } from "react";

// Khởi tạo và xuất AuthContext (giá trị mặc định là null)
// Đây là "kênh phát sóng" trung tâm để các component khác (như App.jsx, LoginPage.jsx)
// có thể đăng ký lắng nghe và lấy thông tin tài khoản người dùng
export const AuthContext = createContext(null);

// Tên khóa (key) dùng để lưu thông tin người dùng công khai vào bộ nhớ trình duyệt
// Mục đích: Giúp giao diện hiển thị tên người dùng ngay lập tức khi vừa F5, không bị chớp giật
const PROFILE_CACHE_KEY = "weather_user_profile";

// Hàm hỗ trợ: Lấy thông tin tài khoản đã lưu tạm trước đó từ bộ nhớ trình duyệt
function getInitialUser() {
  try {
    // Nếu đang chạy ở môi trường server (không có cửa sổ trình duyệt window) thì trả về null
    if (typeof window === "undefined") return null;

    // 1. Kiểm tra trong localStorage (dành cho người dùng tick chọn "Ghi nhớ đăng nhập" 30 ngày)
    const local = localStorage.getItem(PROFILE_CACHE_KEY);
    // Nếu có dữ liệu chuỗi JSON thì chuyển đổi (parse) thành object người dùng { id, email, name, role }
    if (local) return JSON.parse(local);

    // 2. Nếu localStorage không có, kiểm tra tiếp trong sessionStorage (dành cho phiên đăng nhập tạm thời)
    const session = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (session) return JSON.parse(session);

    // Nếu cả 2 nơi đều không có dữ liệu nghĩa là người dùng chưa từng đăng nhập
    return null;
  } catch {
    // Nếu dữ liệu JSON bị lỗi cú pháp hoặc bị chặn storage thì trả về null an toàn
    return null;
  }
}

// Component AuthProvider: "Trạm phát sóng" bao bọc quanh toàn bộ ứng dụng
// Bất kỳ component con nào nằm trong {children} (App.jsx, SearchBar, LoginPage,...) đều nhận được dữ liệu từ đây
export function AuthProvider({ children }) {
  // Khởi tạo biến trạng thái user:
  // - user: Chứa object { id, email, name, role } nếu đã đăng nhập, hoặc null nếu chưa
  // - setUser: Hàm cập nhật lại thông tin user
  // - getInitialUser: Chạy ngay lập tức lúc ban đầu để lấy cache, tránh bị giật màn hình
  const [user, setUser] = useState(getInitialUser);

  // Hook useEffect chạy 1 lần duy nhất ngay sau khi trang web tải xong lần đầu:
  // Mục đích: Xác minh ngầm với Server xem phiên đăng nhập (Cookie) có thật sự hợp lệ không
  useEffect(() => {
    // Định nghĩa hàm bất đồng bộ để gọi API kiểm tra
    async function verifySession() {
      try {
        // Gửi yêu cầu HTTP GET tới route: /api/auth/me (xử lý tại file server/routes/auth.js)
        // Trình duyệt sẽ TỰ ĐỘNG đính kèm cookie bí mật 'session_token' (HttpOnly) gửi kèm lên server
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        // Nếu Backend phản hồi mã trạng thái 200 OK (nghĩa là Cookie hợp lệ và còn hạn trong SQLite)
        if (res.ok) {
          // Giải mã dữ liệu JSON mà server trả về
          const data = await res.json();
          // Nếu server xác nhận thành công và có thông tin user
          if (data.success && data.user) {
            // Cập nhật lại state user với thông tin mới nhất từ cơ sở dữ liệu
            setUser(data.user);
          }
        } else {
          // Nếu Backend báo lỗi (401 Unauthorized - Cookie đã hết hạn hoặc bị xóa trong SQLite)
          // Đặt trạng thái người dùng về null (chưa đăng nhập)
          setUser(null);
          try {
            // Xóa sạch bộ nhớ tạm trên trình duyệt để tránh dữ liệu rác
            localStorage.removeItem(PROFILE_CACHE_KEY);
            sessionStorage.removeItem(PROFILE_CACHE_KEY);
          } catch {
            // Bỏ qua nếu có lỗi bảo mật storage
          }
        }
      } catch (err) {
        // Bắt lỗi nếu mất mạng hoặc Backend server chưa được bật
        console.warn("Không thể kết nối tới backend:", err);
      }
    }

    // Thực thi hàm kiểm tra phiên ngầm
    verifySession();
  }, []); // Mảng rỗng [] đảm bảo useEffect chỉ chạy đúng 1 lần khi trang web vừa tải

  // =========================================================================
  // 1. HÀM ĐĂNG NHẬP (login):
  // - Nhận vào: email, password, và cờ rememberMe (mặc định là true - ghi nhớ 30 ngày)
  // - Được gọi từ: Form Đăng nhập trong file src/components/LoginPage.jsx
  // =========================================================================
  const login = async (email, password, rememberMe = true) => {
    // Gửi yêu cầu HTTP POST tới Backend tại route: /api/auth/login (trong server/routes/auth.js)
    const res = await fetch("/api/auth/login", {
      method: "POST", // Phương thức gửi dữ liệu bảo mật
      headers: { "Content-Type": "application/json" }, // Báo cho server biết dữ liệu gửi lên là JSON
      // Đóng gói email, password và rememberMe thành chuỗi JSON để gửi đi
      body: JSON.stringify({ email, password, rememberMe }),
    });

    // Chờ và đọc phản hồi JSON từ Backend server
    const data = await res.json();

    // Nếu Backend báo lỗi (ví dụ: sai mật khẩu, tài khoản không tồn tại)
    if (!res.ok || !data.success) {
      // Ném ra lỗi để giao diện LoginPage bắt được (catch) và hiển thị dòng chữ đỏ cho người dùng
      throw new Error(data.error || "Đăng nhập thất bại!");
    }

    // Backend đã kiểm tra Bcrypt thành công và tự gán HttpOnly Cookie vào trình duyệt
    // Cập nhật trạng thái người dùng trong React state để giao diện đổi sang "Đã đăng nhập"
    setUser(data.user);

    try {
      // Nếu người dùng chọn "Ghi nhớ đăng nhập":
      if (rememberMe) {
        // Lưu cache vào localStorage (tồn tại lâu dài đến 30 ngày ngay cả khi tắt máy)
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data.user));
        // Dọn dẹp sessionStorage cũ nếu có
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
      } else {
        // Nếu người dùng KHÔNG tick chọn ghi nhớ:
        // Lưu vào sessionStorage (tự động xóa sạch ngay khi tắt tab/tắt trình duyệt)
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data.user));
        // Xóa khỏi localStorage
        localStorage.removeItem(PROFILE_CACHE_KEY);
      }
    } catch {
      // Bỏ qua lỗi nếu trình duyệt chặn quyền ghi storage
    }

    // Trả về thông tin user để component LoginPage biết là đã thành công và tự động đóng popup
    return data.user;
  };

  // =========================================================================
  // 2. HÀM ĐĂNG KÝ (register):
  // - Nhận vào: email, password, name (họ tên người dùng)
  // - Được gọi từ: Form Đăng ký trong file src/components/LoginPage.jsx
  // =========================================================================
  const register = async (email, password, name) => {
    // Gửi yêu cầu HTTP POST tới route: /api/auth/register (trong server/routes/auth.js)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Gửi thông tin tài khoản mới lên server để lưu vào SQLite
      body: JSON.stringify({ email, password, name }),
    });

    // Đọc kết quả JSON do Backend trả về
    const data = await res.json();

    // Nếu Backend từ chối (ví dụ: email này đã có người đăng ký trước đó)
    if (!res.ok || !data.success) {
      // Báo lỗi ra giao diện đăng ký
      throw new Error(data.error || "Đăng ký thất bại!");
    }

    // Backend tự động băm mật khẩu (Bcrypt hash), lưu vào database SQLite,
    // đồng thời cấp luôn phiên đăng nhập (Set-Cookie) để người dùng không cần đăng nhập lại
    setUser(data.user);

    try {
      // Lưu cache tên người dùng vào localStorage
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data.user));
    } catch {
      // Bỏ qua lỗi storage
    }

    // Trả về thông tin user mới đăng ký thành công
    return data.user;
  };

  // =========================================================================
  // 3. HÀM ĐĂNG XUẤT (logout):
  // - Được gọi khi người dùng bấm nút "Đăng xuất 🚪" trên Navbar trong file src/App.jsx
  // =========================================================================
  const logout = async () => {
    try {
      // Gửi yêu cầu HTTP POST tới route: /api/auth/logout (trong server/routes/auth.js)
      // Mục đích: Yêu cầu Backend xóa token này trong bảng 'sessions' của SQLite và hủy bỏ Cookie
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      // Nếu gặp lỗi mạng không gọi được tới server thì ghi log cảnh báo
      console.error("Lỗi khi gọi API đăng xuất:", e);
    } finally {
      // Khối finally LUÔN LUÔN chạy dù API thành công hay thất bại:
      // 1. Đặt biến user về null -> Giao diện lập tức quay về trạng thái chưa đăng nhập
      setUser(null);
      try {
        // 2. Xóa sạch mọi dấu vết cache người dùng khỏi cả localStorage và sessionStorage
        localStorage.removeItem(PROFILE_CACHE_KEY);
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
      } catch {
        // Bỏ qua lỗi storage
      }
    }
  };

  // =========================================================================
  // 4. TRẢ VỀ PROVIDER CỦA REACT CONTEXT:
  // Cung cấp các biến và hàm xác thực cho toàn bộ cây thư mục giao diện ứng dụng
  // =========================================================================
  return (
    <AuthContext.Provider
      value={{
        user, // Thông tin tài khoản hiện tại { id, email, name, role } hoặc null
        isAuthenticated: !!user, // Biến boolean tiện ích: true nếu đã đăng nhập, false nếu chưa
        login, // Hàm gọi đăng nhập
        register, // Hàm gọi đăng ký
        logout, // Hàm gọi đăng xuất
      }}
    >
      {/* Hiển thị các component con bên trong (toàn bộ nội dung trang web) */}
      {children}
    </AuthContext.Provider>
  );
}
