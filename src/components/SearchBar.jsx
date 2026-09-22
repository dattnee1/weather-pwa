// =========================================================================
// THANH TÌM KIẾM ĐỊA ĐIỂM & ĐỊNH VỊ GPS (SearchBar.jsx)
// =========================================================================
import { useState, useEffect, useRef } from "react";
// Hàm gọi Open-Meteo Geocoding API để tìm kiếm tọa độ theo từ khóa tên thành phố
import { timKiemDiaDiem } from "../services/weatherApi";
// Hàm tiện ích định dạng tên đầy đủ và chuẩn hóa chuỗi so sánh
import { dinhDangTenDiaDiem, chuanHoa } from "../utils/weatherHelpers";

// Props nhận vào:
// - onSelectCity: Hàm callback gửi ngược dữ liệu thành phố đã chọn về App.jsx
// - onGetGPS: Hàm callback kích hoạt quy trình định vị GPS từ trình duyệt
// - loadingGPS: Biến boolean thông báo trạng thái đang lấy tọa độ GPS
export default function SearchBar({ onSelectCity, onGetGPS, loadingGPS }) {
  const [tenThanhPho, setTenThanhPho] = useState(""); // Chuỗi ký tự người dùng gõ vào ô tìm kiếm
  const [danhSachGoiY, setDanhSachGoiY] = useState([]); // Danh sách các kết quả gợi ý trả về từ API
  const daChonTuGoiY = useRef(false); // Cờ đánh dấu để không kích hoạt lại tìm kiếm khi vừa bấm chọn gợi ý

  // -----------------------------------------------------------------------
  // Kỹ thuật Debounce (chờ 400ms sau khi ngừng gõ mới gọi API)
  // Mục đích: Tránh gửi quá nhiều request liên tục làm quá tải API hoặc chậm máy
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Nếu vừa bấm chọn một gợi ý từ danh sách thì bỏ qua, không tìm kiếm lại
    if (daChonTuGoiY.current) {
      daChonTuGoiY.current = false;
      return;
    }

    // Nếu ô tìm kiếm trống hoặc ít hơn 2 ký tự thì xóa danh sách gợi ý
    if (!tenThanhPho.trim() || tenThanhPho.trim().length < 2) {
      setDanhSachGoiY([]);
      return;
    }

    // Hẹn giờ 400ms: nếu người dùng gõ tiếp thì lệnh này sẽ bị hủy (clearTimeout)
    const timer = setTimeout(async () => {
      try {
        // Gọi hàm tìm kiếm geocoding
        const ketQua = await timKiemDiaDiem(tenThanhPho);
        setDanhSachGoiY(ketQua); // Cập nhật danh sách gợi ý vào state
      } catch {
        // Nếu lỗi mạng thì reset gợi ý về rỗng
        setDanhSachGoiY([]);
      }
    }, 400);

    // Hàm dọn dẹp (cleanup function): Hủy hẹn giờ nếu người dùng gõ ký tự mới trước khi 400ms trôi qua
    return () => clearTimeout(timer);
  }, [tenThanhPho]);

  // -----------------------------------------------------------------------
  // Xử lý khi người dùng click chọn 1 địa điểm từ bảng gợi ý dropdown
  // -----------------------------------------------------------------------
  function handleChon(item) {
    daChonTuGoiY.current = true; // Bật cờ để useEffect không gọi tìm kiếm lại
    const tenDayDu = dinhDangTenDiaDiem(item); // Tạo chuỗi tên đầy đủ: Tên, Huyện, Tỉnh, Quốc gia
    setTenThanhPho(tenDayDu); // Điền tên đầy đủ vào ô input
    setDanhSachGoiY([]); // Đóng bảng gợi ý dropdown
    onSelectCity(item, tenDayDu); // Truyền đối tượng địa điểm và tên đầy đủ lên App.jsx để tải thời tiết
  }

  return (
    <div className="relative w-full mb-4 flex gap-2">
      {/* Ô nhập liệu tìm kiếm */}
      <div className="relative flex-1">
        <input
          type="text"
          className="border border-gray-300 rounded-xl px-3 py-2 w-full outline-none focus:border-blue-500 text-sm"
          placeholder="Gõ tên TP (Đà Lạt, Tokyo...)"
          value={tenThanhPho}
          onChange={(e) => setTenThanhPho(e.target.value)}
        />

        {/* Bảng danh sách gợi ý Autocomplete xuất hiện ngay dưới ô nhập */}
        {danhSachGoiY.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-20 overflow-hidden">
            {danhSachGoiY.map((item) => {
              // Lấy các thông tin cấp huyện/tỉnh/quốc gia phụ trợ
              const cacThanhPhanPhu = [];
              const cacKhoaDaCo = new Set([chuanHoa(item.name)]);

              function themPhu(text) {
                if (!text) return;
                const khoa = chuanHoa(text);
                if (!khoa || cacKhoaDaCo.has(khoa)) return;
                cacKhoaDaCo.add(khoa);
                cacThanhPhanPhu.push(text);
              }

              themPhu(item.admin2); // Thêm quận/huyện
              themPhu(item.admin1); // Thêm tỉnh/thành phố
              themPhu(item.country); // Thêm quốc gia

              const phuDuyNhat = cacThanhPhanPhu.join(", ");

              return (
                <div
                  key={item.id}
                  onClick={() => handleChon(item)}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center gap-2"
                >
                  {/* Bên trái: Tên địa điểm chính */}
                  <span className="font-medium text-slate-800 shrink-0">{item.name}</span>
                  {/* Bên phải: Tỉnh/Vùng và Quốc gia */}
                  {phuDuyNhat && (
                    <span className="text-xs text-gray-400 text-right truncate">
                      {phuDuyNhat}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nút bấm định vị GPS của thiết bị */}
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
