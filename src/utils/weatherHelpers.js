export function boDauTiengViet(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function layBieuTuongThoiTiet(code, rain = 0, isDay = 1) {
  if (rain > 0) return { icon: "🌧️", text: `Mưa (${rain} mm)` };

  // Ban đêm (isDay === 0)
  if (isDay === 0) {
    if (code === 0) return { icon: "🌙", text: "Trời quang" };
    if ([1, 2, 3].includes(code)) return { icon: "☁️", text: "Nhiều mây" };
  }

  // Ban ngày (isDay === 1)
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

export function dinhDangNgay(chuoiNgay) {
  const d = new Date(chuoiNgay);
  const thu = d.toLocaleDateString("vi-VN", { weekday: "short" });
  const ngayThang = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${thu}, ${ngayThang}`;
}

// Chuyển "2026-09-10T16:00" -> "16:00"
export function dinhDangGio(chuoiThoiGian) {
  const d = new Date(chuoiThoiGian);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Hàm đổi C -> F
export function chuyenDoiNhietDo(doC, donVi) {
  if (doC === null || doC === undefined) return "--";
  if (donVi === "F") {
    return Math.round((doC * 9) / 5 + 32);
  }
  return Math.round(doC);
}
