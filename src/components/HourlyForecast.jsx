import { dinhDangGio, chuyenDoiNhietDo } from "../utils/weatherHelpers";

export default function HourlyForecast({ hourlyList, donVi }) {
  if (!hourlyList || hourlyList.length === 0) return null;

  return (
    <div className="w-full border-t pt-3 mb-4">
      <p className="text-xs font-semibold text-gray-600 mb-2">
        24 giờ tiếp theo:
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 w-full">
        {hourlyList.map((item, index) => (
          <div
            key={item.time}
            className="flex flex-col items-center min-w-13.75 bg-blue-50/50 rounded-xl p-2 text-center shrink-0"
          >
            <span className="text-[10px] text-gray-500">
              {index === 0 ? "Bây giờ" : dinhDangGio(item.time)}
            </span>
            <span className="text-base my-1">{item.trangThai.icon}</span>
            <span className="text-xs font-bold text-gray-700">
              {chuyenDoiNhietDo(item.temp, donVi)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
