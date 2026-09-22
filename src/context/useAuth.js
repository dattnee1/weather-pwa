// =========================================================================
// CUSTOM HOOK: useAuth (useAuth.js)
// =========================================================================
// Tiện ích giúp các component (App, LoginPage,...) dễ dàng truy cập vào AuthContext
// mà không cần phải tự import cả useContext lẫn AuthContext mỗi lần dùng
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
  // Lấy dữ liệu được phát ra từ AuthProvider gần nhất
  const context = useContext(AuthContext);

  // Nếu gọi hook này ở component nằm ngoài AuthProvider thì ném ra cảnh báo lỗi
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }

  // Trả về { user, isAuthenticated, login, register, logout }
  return context;
}
