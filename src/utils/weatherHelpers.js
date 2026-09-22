// =========================================================================
// CÁC HÀM TIỆN ÍCH TRỢ GIÚP XỬ LÝ DỮ LIỆU & ĐỊNH DẠNG (weatherHelpers.js)
// =========================================================================

// -------------------------------------------------------------------------
// 1. HÀM BỎ DẤU TIẾNG VIỆT
// - Tác dụng: Chuyển "Hà Nội" -> "Ha Noi", "Đà Lạt" -> "Da Lat"
// - Mục đích: Giúp tìm kiếm không dấu trên API Open-Meteo chính xác
// -------------------------------------------------------------------------
export function boDauTiengViet(str) {
  return str
    .normalize("NFD") // Tách các ký tự dấu tổ hợp Unicode
    .replace(/[\u0300-\u036f]/g, "") // Xóa sạch các dấu thanh, mũ, huyền, sắc, hỏi, ngã, nặng
    .replace(/đ/g, "d") // Thay chữ đ thường thành d
    .replace(/[ĐÐ]/g, "D"); // Thay chữ Đ hoa hoặc chữ Đ kiểu Eth thành D
}

// -------------------------------------------------------------------------
// 2. HÀM CHUẨN HÓA ĐỊA DANH ĐỂ SO SÁNH TRÙNG LẶP
// - Tác dụng: Loại bỏ tiền tố hành chính ("tỉnh", "thành phố", "quận"...) và khoảng trắng
// - Mục đích: Nhận diện "Thành phố Đà Lạt" và "Đà Lạt" là cùng một nơi để không bị lặp chữ
// -------------------------------------------------------------------------
export function chuanHoa(str) {
  return boDauTiengViet(str || "")
    .toLowerCase()
    .replace(/^(tinh|tp|thanh pho|huyen|quan|thi xa)\s+/i, "")
    .replace(/\s+/g, "");
}

// -------------------------------------------------------------------------
// 3. HÀM CHUYỂN MÃ THỜI TIẾT WMO THÀNH BIỂU TƯỢNG VÀ MÔ TẢ TIẾNG VIỆT
// - code: Mã chuẩn quốc tế WMO Weather Code (0 = trời quang, 1-3 = mây, 61-65 = mưa,...)
// - rain: Lượng mưa tính bằng mm
// - isDay: 1 là ban ngày (☀️), 0 là ban đêm (🌙)
// -------------------------------------------------------------------------
export function layBieuTuongThoiTiet(code, rain = 0, isDay = 1) {
  // Nếu có lượng mưa thực tế đo được lớn hơn 0
  if (rain > 0) return { icon: "🌧️", text: `Mưa (${rain} mm)` };

  // Nhánh xử lý khi là Ban đêm (isDay === 0)
  if (isDay === 0) {
    if (code === 0) return { icon: "🌙", text: "Trời quang" };
    if ([1, 2, 3].includes(code)) return { icon: "☁️", text: "Nhiều mây" };
  }

  // Nhánh xử lý khi là Ban ngày (isDay === 1)
  if (code === 0) return { icon: "☀️", text: "Quang" };
  if ([1, 2, 3].includes(code)) return { icon: "⛅", text: "Có mây" };
  if ([45, 48].includes(code)) return { icon: "🌫️", text: "Sương mù" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return { icon: "🌧️", text: "Có mưa" };
  if ([71, 73, 75, 85, 86].includes(code))
    return { icon: "❄️", text: "Có tuyết" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", text: "Dông bão" };
  return { icon: "🌡️", text: "K rõ" };
}

// -------------------------------------------------------------------------
// 4. HÀM ĐỊNH DẠNG NGÀY THÁNG TIẾNG VIỆT
// - Chuyển "2026-09-18" thành dạng "T.Sáu, 18/09"
// -------------------------------------------------------------------------
export function dinhDangNgay(chuoiNgay) {
  const d = new Date(chuoiNgay);
  const thu = d.toLocaleDateString("vi-VN", { weekday: "short" });
  const ngayThang = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${thu}, ${ngayThang}`;
}

// -------------------------------------------------------------------------
// 5. HÀM ĐỊNH DẠNG GIỜ THEO CHUẨN 24 GIỜ
// - Chuyển "2026-09-18T16:00" thành "16:00"
// -------------------------------------------------------------------------
export function dinhDangGio(chuoiThoiGian) {
  const d = new Date(chuoiThoiGian);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// -------------------------------------------------------------------------
// 6. HÀM CHUYỂN ĐỔI NHIỆT ĐỘ GIỮA ĐỘ C VÀ ĐỘ F
// - Công thức: °F = (°C * 9/5) + 32
// -------------------------------------------------------------------------
export function chuyenDoiNhietDo(doC, donVi) {
  if (doC === null || doC === undefined) return "--";
  if (donVi === "F") {
    return Math.round((doC * 9) / 5 + 32);
  }
  return Math.round(doC);
}

// -------------------------------------------------------------------------
// 7. HÀM ĐỊNH DẠNG ĐẦY ĐỦ TÊN ĐỊA DANH TỪ KẾT QUẢ TÌM KIẾM
// - Tác dụng: Ghép Tên địa danh + Huyện/Thị xã + Tỉnh/Thành phố + Quốc gia
// - Tự động loại bỏ các thành phần trùng nhau để kết quả luôn gọn gàng và đầy đủ
// -------------------------------------------------------------------------
export function dinhDangTenDiaDiem(item) {
  if (!item) return "";
  const cacThanhPhan = [];
  const cacKhoaDaCo = new Set();

  function themVao(text) {
    if (!text) return;
    const khoa = chuanHoa(text);
    if (!khoa || cacKhoaDaCo.has(khoa)) return;
    cacKhoaDaCo.add(khoa);
    cacThanhPhan.push(text);
  }

  themVao(item.name); // 1. Tên địa điểm chính (ví dụ: Đà Lạt, Quận 1)
  themVao(item.admin2); // 2. Cấp quận / huyện / thành phố con
  themVao(item.admin1); // 3. Cấp tỉnh / thành phố trực thuộc / bang
  themVao(item.country); // 4. Quốc gia

  return cacThanhPhan.join(", ");
}

