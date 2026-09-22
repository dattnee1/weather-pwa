// =========================================================================
// CÁC HÀM GỌI API THỜI TIẾT & ĐỊA LÝ NGOÀI (weatherApi.js)
// =========================================================================
// Hàm loại bỏ dấu tiếng Việt để tìm kiếm không dấu chuẩn xác
import { boDauTiengViet } from "../utils/weatherHelpers";

// =========================================================================
// 1. HÀM TÌM KIẾM ĐỊA ĐIỂM (Geocoding API)
// - Dịch vụ: Open-Meteo Geocoding API (miễn phí, không cần API key)
// - Mục đích: Người dùng gõ tên "Đà Lạt" -> trả về tọa độ (vĩ độ, kinh độ), tỉnh, quốc gia
// =========================================================================
export async function timKiemDiaDiem(text) {
  // Chuẩn hóa chuỗi tìm kiếm bỏ dấu tiếng Việt để API Open-Meteo hiểu tốt nhất
  const tuKhoa = boDauTiengViet(text.trim());
  if (tuKhoa.length < 2) return [];

  // Gửi request tìm kiếm tối đa 5 kết quả với ngôn ngữ tiếng Việt (language=vi)
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(tuKhoa)}&count=5&language=vi`,
  );
  if (!res.ok) throw new Error("Lỗi khi tìm kiếm địa điểm");

  const data = await res.json();
  // Trả về mảng danh sách các địa điểm tìm thấy (hoặc mảng rỗng nếu không có)
  return data.results || [];
}

// =========================================================================
// 2. HÀM LẤY CHI TIẾT THỜI TIẾT (Forecast API)
// - Dịch vụ: Open-Meteo Weather Forecast API
// - Nhận vào: latitude (vĩ độ), longitude (kinh độ)
// - Trả về: Dữ liệu thời tiết hiện tại (current), 24 giờ tiếp theo (hourly) và 7 ngày tới (daily)
// =========================================================================
export async function layChiTietThoiTiet(latitude, longitude) {
  // Xây dựng URL truy vấn với các thông số:
  // - current: nhiệt độ 2m, mã thời tiết WMO, lượng mưa, tốc độ gió 10m, độ ẩm, ngày/đêm
  // - hourly: nhiệt độ theo giờ, mã thời tiết, ngày/đêm
  // - daily: mã thời tiết theo ngày, nhiệt độ cao nhất, nhiệt độ thấp nhất
  // - timezone=auto: Tự động phát hiện múi giờ của địa phương đó
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,rain,wind_speed_10m,relative_humidity_2m,is_day&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Lỗi khi tải thông tin thời tiết");

  return await res.json();
}

// =========================================================================
// 3. HÀM ĐỔI TỌA ĐỘ GPS THÀNH TÊN ĐỊA DANH THỰC TẾ (Reverse Geocoding)
// - Dịch vụ: BigDataCloud Reverse Geocode Client API (miễn phí phía client)
// - Nhận vào: Tọa độ lat, lon từ GPS thiết bị
// - Trả về: Tên đầy đủ gồm Phường/Xã + Quận/Huyện + Tỉnh/Thành phố + Quốc gia
// =========================================================================
export async function layTenTuToaDo(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`,
    );
    const data = await res.json();

    const cacThanhPhan = [];
    // Phường / Xã hoặc khu vực địa phương (locality)
    if (data.locality) cacThanhPhan.push(data.locality);
    // Quận / Huyện / Thành phố (city)
    if (
      data.city &&
      !cacThanhPhan.some((p) => p.toLowerCase() === data.city.toLowerCase())
    ) {
      cacThanhPhan.push(data.city);
    }
    // Tỉnh / Thành phố trực thuộc trung ương (principalSubdivision)
    if (
      data.principalSubdivision &&
      !cacThanhPhan.some(
        (p) => p.toLowerCase() === data.principalSubdivision.toLowerCase(),
      )
    ) {
      cacThanhPhan.push(data.principalSubdivision);
    }
    // Quốc gia (countryName)
    if (
      data.countryName &&
      !cacThanhPhan.some(
        (p) => p.toLowerCase() === data.countryName.toLowerCase(),
      )
    ) {
      cacThanhPhan.push(data.countryName);
    }

    // Ghép các cấp lại thành chuỗi, ví dụ: "Phường 1, Thành phố Đà Lạt, Tỉnh Lâm Đồng, Việt Nam"
    return cacThanhPhan.length > 0 ? cacThanhPhan.join(", ") : "Vị trí của bạn";
  } catch {
    // Nếu có lỗi mạng thì dùng tên mặc định an toàn
    return "Vị trí của bạn";
  }
}
