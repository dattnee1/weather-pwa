import { boDauTiengViet } from "../utils/weatherHelpers";

export async function timKiemDiaDiem(text) {
  const tuKhoa = boDauTiengViet(text.trim());
  if (tuKhoa.length < 2) return [];

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(tuKhoa)}&count=5&language=vi`,
  );
  if (!res.ok) throw new Error("Lỗi khi tìm kiếm địa điểm");

  const data = await res.json();
  return data.results || [];
}

// Lấy thời tiết hiện tại, 24 giờ tới và 7 ngày tới
export async function layChiTietThoiTiet(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,rain,wind_speed_10m,relative_humidity_2m,is_day&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Lỗi khi tải thông tin thời tiết");

  return await res.json();
}

// Đổi tọa độ GPS thành tên địa danh hiển thị
// Đổi tọa độ GPS thành tên địa danh thực tế (Quận/Huyện, Tỉnh/Thành phố)
export async function layTenTuToaDo(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`,
    );
    const data = await res.json();

    // Lấy tên Quận/Huyện/Thành phố và Quốc gia
    const tenKhuVuc =
      data.locality ||
      data.city ||
      data.principalSubdivision ||
      "Vị trí của bạn";
    const tenNuoc = data.countryName ? `, ${data.countryName}` : "";

    return `${tenKhuVuc}${tenNuoc}`;
  } catch (err) {
    return "Vị trí của bạn";
  }
}
