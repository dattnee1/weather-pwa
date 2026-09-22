// =========================================================================
// CÁC IMPORT THƯ VIỆN & COMPONENT CỐT LÕI
// =========================================================================
import { useState, useEffect } from "react";

// Các component giao diện con cấu thành trang web thời tiết:
import SearchBar from "./components/SearchBar"; // Thanh tìm kiếm thành phố + nút định vị GPS
import CurrentWeather from "./components/CurrentWeather"; // Khung hiển thị thời tiết hiện tại
import HourlyForecast from "./components/HourlyForecast"; // Dự báo thời tiết 24 giờ tiếp theo (cuộn ngang)
import Forecast7Days from "./components/Forecast7Days"; // Dự báo thời tiết 7 ngày tới (danh sách)
import LoginPage from "./components/LoginPage"; // Hộp thoại Modal Đăng nhập / Đăng ký / Quên mật khẩu

// Các công cụ quản lý trạng thái tài khoản người dùng:
import { AuthProvider } from "./context/AuthContext"; // Provider bao bọc toàn bộ ứng dụng để chia sẻ phiên đăng nhập
import { useAuth } from "./context/useAuth"; // Custom Hook để lấy nhanh thông tin user, hàm login/logout

// Các hàm gọi API thời tiết và định vị GPS:
import { layChiTietThoiTiet, layTenTuToaDo } from "./services/weatherApi";

// Các hàm tiện ích định dạng:
import {
  layBieuTuongThoiTiet, // Chuyển mã thời tiết WMO thành emoji và mô tả tiếng Việt
  dinhDangTenDiaDiem, // Định dạng tên địa điểm đầy đủ (Tên, Huyện, Tỉnh, Quốc gia)
} from "./utils/weatherHelpers";

// =========================================================================
// COMPONENT CHÍNH CỦA GIAO DIỆN (MainContent)
// =========================================================================
function MainContent() {
  // Lấy dữ liệu người dùng và hàm đăng xuất từ AuthContext
  const { user, isAuthenticated, logout } = useAuth();

  // -----------------------------------------------------------------------
  // 1. Quản lý trạng thái Modal Đăng nhập / Đăng ký
  // -----------------------------------------------------------------------
  const [authModalOpen, setAuthModalOpen] = useState(false); // Trạng thái mở/đóng hộp thoại modal
  const [authModalMode, setAuthModalMode] = useState("login"); // Chế độ hiển thị: 'login', 'register' hoặc 'forgot'

  // -----------------------------------------------------------------------
  // 2. Quản lý trạng thái dữ liệu thời tiết
  // -----------------------------------------------------------------------
  const [diaDiemTimThay, setDiaDiemTimThay] = useState(""); // Tên địa điểm đầy đủ đang hiển thị trên giao diện
  const [thoiTietData, setThoiTietData] = useState(null); // Dữ liệu thời tiết hiện tại (nhiệt độ, độ ẩm, gió...)
  const [duBao24Gio, setDuBao24Gio] = useState([]); // Mảng chứa 24 giờ dự báo tiếp theo
  const [duBao7Ngay, setDuBao7Ngay] = useState([]); // Mảng chứa 7 ngày dự báo tiếp theo
  const [loading, setLoading] = useState(false); // Trạng thái đang tải dữ liệu thời tiết từ API
  const [loadingGPS, setLoadingGPS] = useState(false); // Trạng thái đang đợi trình duyệt lấy tọa độ GPS

  // -----------------------------------------------------------------------
  // 3. Đơn vị nhiệt độ (°C hoặc °F)
  // -----------------------------------------------------------------------
  const [donVi, setDonVi] = useState("C"); // Mặc định là độ C, người dùng có thể đổi sang F

  // -----------------------------------------------------------------------
  // 4. Báo mất kết nối mạng Internet (Offline Detection)
  // -----------------------------------------------------------------------
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Kiểm tra kết nối mạng lúc ban đầu

  useEffect(() => {
    // Hàm xử lý khi có mạng trở lại
    function handleOnline() {
      setIsOffline(false);
    }
    // Hàm xử lý khi bị ngắt kết nối mạng
    function handleOffline() {
      setIsOffline(true);
    }

    // Đăng ký lắng nghe sự kiện online/offline của trình duyệt
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Hủy đăng ký lắng nghe khi component bị unmount để tránh rò rỉ bộ nhớ
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // -----------------------------------------------------------------------
  // 5. Hàm nạp dữ liệu thời tiết từ tọa độ (lat, lon) và tên địa điểm
  // -----------------------------------------------------------------------
  async function napDuLieuThoiTiet(lat, lon, tenDiaDiem) {
    setLoading(true); // Bật cờ xoay loading
    setDiaDiemTimThay(tenDiaDiem); // Lưu tên địa điểm để hiển thị trên thẻ thời tiết

    try {
      // Gọi API Open-Meteo để lấy toàn bộ dữ liệu hiện tại, 24 giờ và 7 ngày
      const data = await layChiTietThoiTiet(lat, lon);

      // (A) Xử lý thời tiết hiện tại
      const current = data.current;
      setThoiTietData({
        nhietDo: current.temperature_2m,
        doAm: current.relative_humidity_2m,
        gio: current.wind_speed_10m,
        trangThai: layBieuTuongThoiTiet(
          current.weather_code,
          current.rain,
          current.is_day,
        ),
      });

      // (B) Xử lý dự báo 24 giờ tiếp theo tính từ mốc giờ hiện tại
      const hTimes = data.hourly.time;
      const hTemps = data.hourly.temperature_2m;
      const hCodes = data.hourly.weather_code;
      const hIsDay = data.hourly.is_day;

      const now = Date.now();
      // Tìm vị trí mốc thời gian gần nhất với thời điểm hiện tại
      let startIdx = hTimes.findIndex(
        (t) => new Date(t).getTime() >= now - 3600 * 1000,
      );
      if (startIdx === -1) startIdx = 0;

      // Cắt đúng 24 giờ tiếp theo
      const danhSach24Gio = hTimes
        .slice(startIdx, startIdx + 24)
        .map((time, idx) => ({
          time,
          temp: hTemps[startIdx + idx],
          trangThai: layBieuTuongThoiTiet(
            hCodes[startIdx + idx],
            0,
            hIsDay[startIdx + idx],
          ),
        }));
      setDuBao24Gio(danhSach24Gio);

      // (C) Xử lý dự báo 7 ngày tiếp theo
      const daily = data.daily;
      setDuBao7Ngay(
        daily.time.map((ngay, idx) => ({
          ngay,
          maxTemp: daily.temperature_2m_max[idx],
          minTemp: daily.temperature_2m_min[idx],
          trangThai: layBieuTuongThoiTiet(daily.weather_code[idx]),
        })),
      );
    } catch (err) {
      // Báo lỗi ra màn hình nếu không kết nối được tới Open-Meteo
      alert(err.message);
    } finally {
      setLoading(false); // Tắt cờ loading
    }
  }

  // -----------------------------------------------------------------------
  // 6. Hàm xử lý khi người dùng bấm nút GPS 📍 để lấy vị trí hiện tại
  // -----------------------------------------------------------------------
  function handleLayViTriGPS() {
    // Kiểm tra xem trình duyệt có hỗ trợ định vị không
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setLoadingGPS(true); // Bật trạng thái đang lấy GPS

    // Yêu cầu trình duyệt lấy tọa độ GPS của thiết bị
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Đổi tọa độ thành tên địa danh thực tế (Quận/Huyện, Tỉnh/Thành phố, Quốc gia)
        const tenDiaDiem = await layTenTuToaDo(latitude, longitude);
        // Nạp dữ liệu thời tiết cho tọa độ GPS vừa tìm được
        await napDuLieuThoiTiet(latitude, longitude, tenDiaDiem);
        setLoadingGPS(false);
      },
      (err) => {
        alert("Không thể định vị: " + err.message);
        setLoadingGPS(false);
      },
    );
  }

  // -----------------------------------------------------------------------
  // 7. Giao diện trang chủ công khai (Ai vào cũng xem được ngay thời tiết)
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-100 to-indigo-50 select-none">
      {/* Cảnh báo màu đỏ dán cố định trên đầu nếu mất kết nối mạng */}
      {isOffline && (
        <div className="sticky top-0 left-0 w-full bg-red-500 text-white text-xs font-semibold py-2 text-center z-50 shadow-md">
          ⚠️ Mất kết nối Internet. Vui lòng kiểm tra Wi-Fi / 4G!
        </div>
      )}

      {/* =================================================================== */}
      {/* THANH NAVBAR TRÊN ĐỈNH TOÀN MÀN HÌNH (Full-width Sticky Top Header) */}
      {/* =================================================================== */}
      <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Cụm bên trái: Logo ứng dụng + Nút bấm Trang chủ */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <span className="text-2xl drop-shadow-xs">🌦️</span>
              <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden xs:inline">
                Thời Tiết PWA
              </span>
            </div>

            {/* Menu điều hướng chính: Thẻ Trang chủ */}
            <nav className="flex items-center gap-1">
              <button
                id="nav-home"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/60 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>🏠</span>
                <span>Trang chủ</span>
              </button>
            </nav>
          </div>

          {/* Cụm bên phải: Trạng thái tài khoản người dùng */}
          <div>
            {isAuthenticated ? (
              // Nếu ĐÃ ĐĂNG NHẬP: Hiển thị Avatar + Tên người dùng + Nút Đăng xuất
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Khối hiển thị thông tin tài khoản */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200/60 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "👤"}
                  </span>
                  <span className="truncate max-w-[110px] sm:max-w-[160px]" title={user?.name || user?.email}>
                    {user?.name || user?.email}
                  </span>
                </div>

                {/* Nút Đăng xuất */}
                <button
                  id="btn-logout"
                  onClick={logout}
                  title="Đăng xuất khỏi tài khoản"
                  className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200/60 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Đăng xuất</span>
                  <span>🚪</span>
                </button>
              </div>
            ) : (
              // Nếu CHƯA ĐĂNG NHẬP: Hiển thị 2 nút Đăng Nhập & Đăng Ký để mở Popup Modal
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-login"
                  onClick={() => {
                    setAuthModalMode("login"); // Đặt mode là đăng nhập
                    setAuthModalOpen(true); // Mở modal popup
                  }}
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100/90 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer border border-slate-200/60"
                >
                  Đăng Nhập
                </button>
                <button
                  id="btn-open-register"
                  onClick={() => {
                    setAuthModalMode("register"); // Đặt mode là đăng ký
                    setAuthModalOpen(true); // Mở modal popup
                  }}
                  className="text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Đăng Ký
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* KHUNG NỘI DUNG CHÍNH (MAIN WEATHER CARD) Ở GIỮA MÀN HÌNH */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
        <div className="rounded-2xl bg-white shadow-md flex flex-col items-center p-6 w-full max-w-md border border-slate-100">
          {/* Tiêu đề card và nút chuyển đổi đơn vị °C / °F */}
          <div className="flex justify-between items-center w-full mb-4">
            <h1 className="text-slate-800 font-bold text-lg flex items-center gap-1.5">
              <span>Thông tin thời tiết</span>
            </h1>

            {/* Nút chuyển đổi đơn vị °C và °F */}
            <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-semibold">
              <button
                id="btn-unit-c"
                onClick={() => setDonVi("C")}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${donVi === "C" ? "bg-white shadow text-blue-600 font-bold" : "text-gray-500"}`}
              >
                °C
              </button>
              <button
                id="btn-unit-f"
                onClick={() => setDonVi("F")}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${donVi === "F" ? "bg-white shadow text-blue-600 font-bold" : "text-gray-500"}`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Thanh tìm kiếm thành phố (kèm gợi ý autocomplete) và nút GPS */}
          <SearchBar
            onSelectCity={(item, tenDayDu) =>
              napDuLieuThoiTiet(
                item.latitude,
                item.longitude,
                tenDayDu || dinhDangTenDiaDiem(item),
              )
            }
            onGetGPS={handleLayViTriGPS}
            loadingGPS={loadingGPS}
          />

          {/* Hiển thị biểu tượng đang tải khi gọi API */}
          {loading ? (
            <p className="text-sm text-blue-500 py-4 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              <span>Đang nạp dữ liệu thời tiết...</span>
            </p>
          ) : thoiTietData ? (
            // Khi đã nạp dữ liệu thành công: hiển thị 3 phần thời tiết
            <>
              {/* 1. Thời tiết hiện tại */}
              <CurrentWeather
                data={thoiTietData}
                locationName={diaDiemTimThay}
                donVi={donVi}
              />
              {/* 2. Dự báo 24 giờ tới */}
              <HourlyForecast hourlyList={duBao24Gio} donVi={donVi} />
              {/* 3. Dự báo 7 ngày tới */}
              <Forecast7Days forecastList={duBao7Ngay} donVi={donVi} />
            </>
          ) : (
            // Khi vừa mở web chưa chọn thành phố nào
            <p className="text-gray-400 text-sm py-4 text-center">
              Nhập tên thành phố hoặc bấm 📍 để lấy thời tiết
            </p>
          )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL HỘP THOẠI ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MẬT KHẨU (GLASSMORPHISM) */}
      {/* =================================================================== */}
      <LoginPage
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

// =========================================================================
// ROOT COMPONENT: Bao bọc MainContent trong AuthProvider để phân phối State
// =========================================================================
export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
