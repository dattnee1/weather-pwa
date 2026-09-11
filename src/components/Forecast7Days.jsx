import { dinhDangNgay, chuyenDoiNhietDo } from "../utils/weatherHelpers";

export default function Forecast7Days({ forecastList, donVi }) {
  if (!forecastList || forecastList.length === 0) return null;

  return (
    <div className="w-full border-t pt-3">
      <p className="text-xs font-semibold text-gray-600 mb-2">
        Dự báo 7 ngày tới:
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 w-full">
        {forecastList.map((d, index) => (
          <div
            key={d.ngay}
            className="flex flex-col items-center min-w-17.5 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center shrink-0"
          >
            <span className="text-[11px] text-gray-500 font-medium">
              {index === 0 ? "H.nay" : dinhDangNgay(d.ngay)}
            </span>
            <span className="text-xl my-1">{d.trangThai.icon}</span>
            <span className="text-xs font-bold text-gray-800">
              {chuyenDoiNhietDo(d.maxTemp, donVi)}°
            </span>
            <span className="text-[10px] text-gray-400">
              {chuyenDoiNhietDo(d.minTemp, donVi)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
