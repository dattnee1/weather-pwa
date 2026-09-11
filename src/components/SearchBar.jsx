import { useState, useEffect, useRef } from "react";
import { timKiemDiaDiem } from "../services/weatherApi";

export default function SearchBar({ onSelectCity, onGetGPS, loadingGPS }) {
  const [tenThanhPho, setTenThanhPho] = useState("");
  const [danhSachGoiY, setDanhSachGoiY] = useState([]);
  const daChonTuGoiY = useRef(false);

  useEffect(() => {
    if (daChonTuGoiY.current) {
      daChonTuGoiY.current = false;
      return;
    }

    if (!tenThanhPho.trim() || tenThanhPho.trim().length < 2) {
      setDanhSachGoiY([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const ketQua = await timKiemDiaDiem(tenThanhPho);
        setDanhSachGoiY(ketQua);
      } catch {
        setDanhSachGoiY([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [tenThanhPho]);

  function handleChon(item) {
    daChonTuGoiY.current = true;
    setTenThanhPho(`${item.name}, ${item.country ?? ""}`);
    setDanhSachGoiY([]);
    onSelectCity(item);
  }

  return (
    <div className="relative w-full mb-4 flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          className="border border-gray-300 rounded-xl px-3 py-2 w-full outline-none focus:border-blue-500 text-sm"
          placeholder="Gõ tên TP (Đà Lạt, Tokyo...)"
          value={tenThanhPho}
          onChange={(e) => setTenThanhPho(e.target.value)}
        />

        {danhSachGoiY.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-20 overflow-hidden">
            {danhSachGoiY.map((item) => (
              <div
                key={item.id}
                onClick={() => handleChon(item)}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-gray-400">
                  {item.admin1 ? `${item.admin1}, ` : ""}
                  {item.country ?? ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nút bấm định vị GPS */}
      <button
        onClick={onGetGPS}
        disabled={loadingGPS}
        title="Lấy vị trí GPS của tôi"
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-xl flex items-center justify-center transition cursor-pointer text-sm"
      >
        {loadingGPS ? "..." : "📍"}
      </button>
    </div>
  );
}
