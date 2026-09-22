// =========================================================================
// KHUNG DỰ BÁO THỜI TIẾT 7 NGÀY TIẾP THEO (Forecast7Days.jsx)
// =========================================================================
// Các hàm tiện ích:
// - dinhDangNgay: Đổi chuỗi ngày "2026-09-18" thành dạng tiếng Việt "T.Sáu, 18/09"
// - chuyenDoiNhietDo: Chuyển đổi nhiệt độ theo đơn vị °C hoặc °F
import { dinhDangNgay, chuyenDoiNhietDo } from "../utils/weatherHelpers";

// Props nhận vào:
// - forecastList: Mảng 7 ngày dự báo [{ ngay, maxTemp, minTemp, trangThai }, ...]
// - donVi: Đơn vị đo nhiệt độ ("C" hoặc "F")
export default function Forecast7Days({ forecastList, donVi }) {
  // Nếu chưa có mảng dữ liệu thì không hiển thị
  if (!forecastList || forecastList.length === 0) return null;

  return (
    <div className="w-full border-t pt-3">
      {/* Tiêu đề mục dự báo 7 ngày */}
      <p className="text-xs font-semibold text-gray-600 mb-2">
        Dự báo 7 ngày tới:
      </p>

      {/* Thanh cuộn ngang hiển thị các thẻ dự báo theo từng ngày */}
      <div className="flex gap-2 overflow-x-auto pb-2 w-full">
        {forecastList.map((d, index) => (
          <div
            key={d.ngay}
            className="flex flex-col items-center min-w-17.5 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center shrink-0"
          >
            {/* Tên thứ & ngày: Ngày đầu tiên hiển thị "H.nay", các ngày sau hiển thị thứ và ngày/tháng */}
            <span className="text-[11px] text-gray-500 font-medium">
              {index === 0 ? "H.nay" : dinhDangNgay(d.ngay)}
            </span>
            {/* Biểu tượng thời tiết đặc trưng trong ngày */}
            <span className="text-xl my-1">{d.trangThai.icon}</span>
            {/* Nhiệt độ cao nhất trong ngày (Max Temp) */}
            <span className="text-xs font-bold text-gray-800">
              {chuyenDoiNhietDo(d.maxTemp, donVi)}°
            </span>
            {/* Nhiệt độ thấp nhất trong ngày (Min Temp) */}
            <span className="text-[10px] text-gray-400">
              {chuyenDoiNhietDo(d.minTemp, donVi)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
