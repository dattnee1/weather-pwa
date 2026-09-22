// =========================================================================
// KHUNG DỰ BÁO THỜI TIẾT 24 GIỜ TIẾP THEO (HourlyForecast.jsx)
// =========================================================================
// Các hàm tiện ích:
// - dinhDangGio: Đổi chuỗi thời gian ISO (2026-09-18T16:00) thành dạng hiển thị 16:00
// - chuyenDoiNhietDo: Chuyển đổi nhiệt độ theo đơn vị °C hoặc °F
import { dinhDangGio, chuyenDoiNhietDo } from "../utils/weatherHelpers";

// Props nhận vào:
// - hourlyList: Mảng 24 phần tử thời tiết theo giờ [{ time, temp, trangThai }, ...]
// - donVi: Đơn vị nhiệt độ ("C" hoặc "F")
export default function HourlyForecast({ hourlyList, donVi }) {
  // Nếu chưa có mảng dữ liệu hoặc mảng rỗng thì ẩn component
  if (!hourlyList || hourlyList.length === 0) return null;

  return (
    <div className="w-full border-t pt-3 mb-4">
      {/* Tiêu đề mục dự báo theo giờ */}
      <p className="text-xs font-semibold text-gray-600 mb-2">
        24 giờ tiếp theo:
      </p>

      {/* Thanh cuộn ngang (overflow-x-auto) chứa 24 thẻ thời tiết */}
      <div className="flex gap-2 overflow-x-auto pb-2 w-full">
        {hourlyList.map((item, index) => (
          <div
            key={item.time}
            className="flex flex-col items-center min-w-13.75 bg-blue-50/50 rounded-xl p-2 text-center shrink-0"
          >
            {/* Cột mốc thời gian: phần tử đầu tiên hiển thị chữ "Bây giờ", các giờ sau hiển thị giờ:phút */}
            <span className="text-[10px] text-gray-500">
              {index === 0 ? "Bây giờ" : dinhDangGio(item.time)}
            </span>
            {/* Biểu tượng thời tiết (☀️, 🌧️, 🌙,...) */}
            <span className="text-base my-1">{item.trangThai.icon}</span>
            {/* Nhiệt độ tại mốc giờ đó */}
            <span className="text-xs font-bold text-gray-700">
              {chuyenDoiNhietDo(item.temp, donVi)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
