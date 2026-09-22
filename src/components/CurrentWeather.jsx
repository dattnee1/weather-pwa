// =========================================================================
// KHUNG HIỂN THỊ THỜI TIẾT HIỆN TẠI (CurrentWeather.jsx)
// =========================================================================
// Hàm tiện ích chuyển đổi linh hoạt giữa độ C và độ F
import { chuyenDoiNhietDo } from "../utils/weatherHelpers";

// Props nhận vào:
// - data: Object dữ liệu thời tiết { nhietDo, doAm, gio, trangThai: { icon, text } }
// - locationName: Chuỗi tên địa điểm đầy đủ (ví dụ: "Đà Lạt, Lam Dong, Việt Nam")
// - donVi: Đơn vị đo nhiệt độ hiện tại ("C" hoặc "F")
export default function CurrentWeather({ data, locationName, donVi }) {
  // Nếu chưa có dữ liệu thời tiết thì không render
  if (!data) return null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hiển thị tên địa điểm đầy đủ với icon ghim vị trí */}
      {locationName && (
        <p className="text-gray-600 text-xs mb-3 font-medium text-center px-3 py-1 bg-slate-50/80 border border-slate-100 rounded-xl max-w-full leading-relaxed">
          📍 {locationName}
        </p>
      )}

      {/* Dòng nhiệt độ chính và trạng thái thời tiết (icon + mô tả) */}
      <div className="flex items-center gap-2 mb-3">
        {/* Khối hiển thị nhiệt độ đã chuyển đổi theo đơn vị C hoặc F */}
        <span className="bg-amber-50 rounded-xl px-3 py-2 text-gray-700 font-semibold text-lg">
          Nhiệt độ {chuyenDoiNhietDo(data.nhietDo, donVi)} °{donVi}
        </span>
        {/* Trạng thái thời tiết (ví dụ: 🌧️ Có mưa, ☀️ Quang mây) */}
        <span className="px-2 py-1 text-sm font-medium">
          {data.trangThai.icon} {data.trangThai.text}
        </span>
      </div>

      {/* Các thông số phụ trợ: Độ ẩm không khí và Tốc độ gió */}
      <div className="flex items-center gap-2 w-full justify-center mb-4">
        {/* Khối hiển thị độ ẩm (%) */}
        <p className="bg-blue-50 rounded-xl px-3 py-2 text-gray-700 text-xs">
          Độ ẩm: <strong>{data.doAm} %</strong>
        </p>
        {/* Khối hiển thị vận tốc gió (km/h) */}
        <p className="bg-blue-50 rounded-xl px-3 py-2 text-gray-700 text-xs">
          Tốc độ gió: <strong>{data.gio} km/h</strong>
        </p>
      </div>
    </div>
  );
}
