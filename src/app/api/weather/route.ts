import { NextRequest, NextResponse } from 'next/server';

const WEATHER_DATA: Record<string, { city: string; temperature: number; weatherType: string; icon: string; desc: string; tip: string }> = {
  '北京': { city: '北京', temperature: 22, weatherType: '晴', icon: '☀️', desc: '晴', tip: '体感 20°C · 建议薄外套 + 长裤' },
  '上海': { city: '上海', temperature: 25, weatherType: '多云', icon: '🌤', desc: '多云', tip: '体感 23°C · 建议 T恤 + 薄外套' },
  '广州': { city: '广州', temperature: 30, weatherType: '阵雨', icon: '🌧', desc: '阵雨', tip: '体感 28°C · 建议短袖 + 携带雨具' },
  '成都': { city: '成都', temperature: 19, weatherType: '阴', icon: '🌥', desc: '阴', tip: '体感 17°C · 建议毛衣 + 外套' },
  '哈尔滨': { city: '哈尔滨', temperature: 12, weatherType: '小雨', icon: '🌧', desc: '小雨', tip: '体感 10°C · 建议厚外套 + 长裤' },
  '三亚': { city: '三亚', temperature: 33, weatherType: '晴热', icon: '☀️', desc: '晴热', tip: '体感 31°C · 建议 T恤 + 短裤' },
};

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || '北京';
  const data = WEATHER_DATA[city] || WEATHER_DATA['北京'];
  return NextResponse.json(data);
}
