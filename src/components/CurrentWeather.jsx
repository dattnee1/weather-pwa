import { chuyenDoiNhietDo } from "../utils/weatherHelpers";

export default function CurrentWeather({ data, locationName, donVi }) {
  if (!data) return null;

  return (
    <div className="flex flex-col items-center w-full">
      {locationName && (
        <p className="text-gray-500 text-xs mb-3">📍 {locationName}</p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="bg-amber-50 rounded-xl px-3 py-2 text-gray-700 font-semibold text-lg">
          Nhiệt độ {chuyenDoiNhietDo(data.nhietDo, donVi)} °{donVi}
        </span>
        <span className="px-2 py-1 text-sm font-medium">
          {data.trangThai.icon} {data.trangThai.text}
        </span>
      </div>

      <div className="flex items-center gap-2 w-full justify-center mb-4">
        <p className="bg-blue-50 rounded-xl px-3 py-2 text-gray-700 text-xs">
          Độ ẩm: <strong>{data.doAm} %</strong>
        </p>
        <p className="bg-blue-50 rounded-xl px-3 py-2 text-gray-700 text-xs">
          Tốc độ gió: <strong>{data.gio} km/h</strong>
        </p>
      </div>
    </div>
  );
}
