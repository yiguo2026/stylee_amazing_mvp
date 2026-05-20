import { NextRequest, NextResponse } from 'next/server';

const CITIES: Record<string, { lat: number; lon: number; label: string }> = {
  '北京': { lat: 39.9042, lon: 116.4074, label: '北京' },
  '上海': { lat: 31.2304, lon: 121.4737, label: '上海' },
  '广州': { lat: 23.1291, lon: 113.2644, label: '广州' },
  '深圳': { lat: 22.5431, lon: 114.0579, label: '深圳' },
  '成都': { lat: 30.5728, lon: 104.0668, label: '成都' },
  '杭州': { lat: 30.2741, lon: 120.1551, label: '杭州' },
  '武汉': { lat: 30.5928, lon: 114.3055, label: '武汉' },
  '哈尔滨': { lat: 45.8038, lon: 126.5350, label: '哈尔滨' },
  '三亚': { lat: 18.2528, lon: 109.5120, label: '三亚' },
  '西安': { lat: 34.3416, lon: 108.9398, label: '西安' },
};

const WMO_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: '晴', icon: '☀️' },
  1: { desc: '大部晴', icon: '🌤' },
  2: { desc: '多云', icon: '⛅' },
  3: { desc: '阴', icon: '🌥' },
  45: { desc: '雾', icon: '🌫' },
  48: { desc: '冻雾', icon: '🌫' },
  51: { desc: '小毛毛雨', icon: '🌦' },
  53: { desc: '毛毛雨', icon: '🌦' },
  55: { desc: '大毛毛雨', icon: '🌦' },
  61: { desc: '小雨', icon: '🌧' },
  63: { desc: '中雨', icon: '🌧' },
  65: { desc: '大雨', icon: '🌧' },
  66: { desc: '冻雨', icon: '🌧' },
  67: { desc: '大冻雨', icon: '🌧' },
  71: { desc: '小雪', icon: '🌨' },
  73: { desc: '中雪', icon: '🌨' },
  75: { desc: '大雪', icon: '❄️' },
  77: { desc: '雪粒', icon: '🌨' },
  80: { desc: '阵雨', icon: '🌦' },
  81: { desc: '中阵雨', icon: '🌧' },
  82: { desc: '大阵雨', icon: '🌧' },
  85: { desc: '阵雪', icon: '🌨' },
  86: { desc: '大阵雪', icon: '❄️' },
  95: { desc: '雷暴', icon: '⛈' },
  96: { desc: '雷暴冰雹', icon: '⛈' },
  99: { desc: '强雷暴冰雹', icon: '⛈' },
};

function getTip(temp: number, weatherDesc: string): string {
  const feelsLike = temp - 2;
  if (temp >= 30) return `体感 ${feelsLike}°C · 建议 T恤 + 短裤`;
  if (temp >= 25) return `体感 ${feelsLike}°C · 建议 T恤 + 薄外套`;
  if (temp >= 20) return `体感 ${feelsLike}°C · 建议薄外套 + 长裤`;
  if (temp >= 15) return `体感 ${feelsLike}°C · 建议卫衣 + 外套`;
  if (temp >= 10) return `体感 ${feelsLike}°C · 建议毛衣 + 厚外套`;
  if (temp >= 0) return `体感 ${feelsLike}°C · 建议厚外套 + 围巾`;
  return `体感 ${feelsLike}°C · 建议羽绒服 + 保暖内衣`;
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || '北京';
  const coords = CITIES[city] || CITIES['北京'];

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,apparent_temperature&timezone=Asia%2FShanghai`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    const data = await res.json();

    const temp = Math.round(data.current?.temperature_2m ?? 22);
    const feelsLike = Math.round(data.current?.apparent_temperature ?? temp - 2);
    const code = data.current?.weather_code ?? 0;
    const wmo = WMO_CODES[code] || WMO_CODES[0];

    return NextResponse.json({
      city: coords.label,
      temperature: temp,
      feelsLike,
      weatherType: wmo.desc,
      icon: wmo.icon,
      desc: wmo.desc,
      tip: getTip(temp, wmo.desc),
    });
  } catch {
    // Fallback to mock if API fails
    return NextResponse.json({
      city: coords.label,
      temperature: 22,
      feelsLike: 20,
      weatherType: '晴',
      icon: '☀️',
      desc: '晴',
      tip: '数据获取失败，建议薄外套 + 长裤',
    });
  }
}
