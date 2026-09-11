import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import CurrentWeather from "./components/CurrentWeather";
import HourlyForecast from "./components/HourlyForecast";
import Forecast7Days from "./components/Forecast7Days";
import { layChiTietThoiTiet, layTenTuToaDo } from "./services/weatherApi";
import { layBieuTuongThoiTiet } from "./utils/weatherHelpers";

export default function App() {
  const [diaDiemTimThay, setDiaDiemTimThay] = useState("");
  const [thoiTietData, setThoiTietData] = useState(null);
  const [duBao24Gio, setDuBao24Gio] = useState([]);
  const [duBao7Ngay, setDuBao7Ngay] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);

  // Tính năng: Quản lý đơn vị nhiệt độ (°C hoặc °F)
  const [donVi, setDonVi] = useState("C");

  // Tính năng: Báo mất mạng Offline
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function napDuLieuThoiTiet(lat, lon, tenDiaDiem) {
    setLoading(true);
    setDiaDiemTimThay(tenDiaDiem);

    try {
      const data = await layChiTietThoiTiet(lat, lon);

      // 1. Dữ liệu hiện tại
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

      // 2. Lấy 24 giờ tiếp theo bắt đầu từ giờ hiện tại
      const hTimes = data.hourly.time;
      const hTemps = data.hourly.temperature_2m;
      const hCodes = data.hourly.weather_code;
      const hIsDay = data.hourly.is_day;

      const now = Date.now();
      let startIdx = hTimes.findIndex(
        (t) => new Date(t).getTime() >= now - 3600 * 1000,
      );
      if (startIdx === -1) startIdx = 0;

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

      // 3. Dự báo 7 ngày
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
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Tính năng: Lấy vị trí qua GPS
  function handleLayViTriGPS() {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const tenDiaDiem = await layTenTuToaDo(latitude, longitude);
        await napDuLieuThoiTiet(latitude, longitude, tenDiaDiem);
        setLoadingGPS(false);
      },
      (err) => {
        alert("Không thể định vị: " + err.message);
        setLoadingGPS(false);
      },
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-100">
      {/* Cảnh báo mất kết nối mạng */}
      {isOffline && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-xs font-semibold py-2 text-center z-50">
          ⚠️ Mất kết nối Internet. Vui lòng kiểm tra Wi-Fi / 4G!
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-md flex flex-col items-center p-6 w-full max-w-md">
        {/* Header có nút chuyển đổi C / F */}
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-red-900 font-bold text-lg">
            Thông tin thời tiết
          </h1>

          <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setDonVi("C")}
              className={`px-2 py-1 rounded-md transition ${donVi === "C" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
            >
              °C
            </button>
            <button
              onClick={() => setDonVi("F")}
              className={`px-2 py-1 rounded-md transition ${donVi === "F" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
            >
              °F
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm và nút GPS */}
        <SearchBar
          onSelectCity={(item) =>
            napDuLieuThoiTiet(
              item.latitude,
              item.longitude,
              `${item.name}, ${item.country ?? ""}`,
            )
          }
          onGetGPS={handleLayViTriGPS}
          loadingGPS={loadingGPS}
        />

        {loading ? (
          <p className="text-sm text-blue-500 py-4">Đang nạp dữ liệu...</p>
        ) : thoiTietData ? (
          <>
            <CurrentWeather
              data={thoiTietData}
              locationName={diaDiemTimThay}
              donVi={donVi}
            />
            <HourlyForecast hourlyList={duBao24Gio} donVi={donVi} />
            <Forecast7Days forecastList={duBao7Ngay} donVi={donVi} />
          </>
        ) : (
          <p className="text-gray-400 text-sm py-4">
            Nhập tên hoặc bấm 📍 để lấy thời tiết
          </p>
        )}
      </div>
    </div>
  );
}
