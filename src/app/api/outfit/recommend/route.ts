import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId || null;
}

const SCENE_COMMENTS: Record<string, string[]> = {
  '职场': ['干练利落的商务组合，适合正式场合又不失个性。', '专业与品味兼备，展现职场自信。'],
  '休闲': ['轻松自在的日常搭配，简约而不简单。', '舒适与时尚并重，适合日常出行。'],
  '约会': ['浪漫精致的搭配，让你在约会中脱颖而出。', '温柔又有品味，给对方留下好印象。'],
  '运动': ['活力满满的运动组合，舒适又时尚。', '运动休闲两不误，简单舒适。'],
  '正式': ['庄重得体的搭配，适合重要场合。', '正式但不刻板，展现你的品味。'],
  '度假': ['轻松惬意的度假风格，享受阳光。', '度假也要美美哒，舒适与时尚兼得。'],
  'default': ['这套搭配颜色和谐，风格统一，适合多种场合。', '简约大方的组合，百搭又实用。'],
};

const OUTFIT_NAMES: Record<string, string[]> = {
  '职场': ['商务精英装', '干练通勤风', '职场优雅装'],
  '休闲': ['周末休闲风', '轻松日常装', '简约出行装'],
  '约会': ['浪漫约会装', '温柔甜美风', '优雅约会装'],
  '运动': ['运动活力装', '休闲运动风', '活力出行装'],
  'default': ['简约搭配', '日常穿搭', '经典组合'],
};

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { occasionTags = [], styleTags = [], colorTags = [] } = body;

  const items = await prisma.wardrobeItem.findMany({
    where: { userId, status: 'active' },
  });

  const tops = items.filter(i => i.category === '上装');
  const bottoms = items.filter(i => i.category === '下装');
  const outers = items.filter(i => i.category === '外套');
  const shoes = items.filter(i => i.category === '鞋');
  const bags = items.filter(i => i.category === '包');
  const accessories = items.filter(i => i.category === '配饰');

  const scene = occasionTags[0] || 'default';

  function pickRandom<T>(arr: T[], exclude: T[] = []): T | null {
    const available = arr.filter(a => !exclude.includes(a));
    if (available.length === 0) return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
    return available[Math.floor(Math.random() * available.length)];
  }

  const outfits = [];
  const usedTops: any[] = [];
  const usedBottoms: any[] = [];

  for (let i = 0; i < 3; i++) {
    const top = pickRandom(tops, usedTops);
    if (top) usedTops.push(top);
    const bottom = pickRandom(bottoms, usedBottoms);
    if (bottom) usedBottoms.push(bottom);
    const shoe = pickRandom(shoes);
    const outer = i === 1 && outers.length > 0 ? pickRandom(outers) : null;
    const bag = i === 2 && bags.length > 0 ? pickRandom(bags) : null;
    const acc = i === 0 && accessories.length > 0 ? pickRandom(accessories) : null;

    const outfitItems: any[] = [];
    if (top) outfitItems.push({ id: top.id, name: top.name, category: top.category, color: top.color, imageUrl: top.imageUrl, role: '上装' });
    if (outer) outfitItems.push({ id: outer.id, name: outer.name, category: outer.category, color: outer.color, imageUrl: outer.imageUrl, role: '外套' });
    if (bottom) outfitItems.push({ id: bottom.id, name: bottom.name, category: bottom.category, color: bottom.color, imageUrl: bottom.imageUrl, role: '下装' });
    if (shoe) outfitItems.push({ id: shoe.id, name: shoe.name, category: shoe.category, color: shoe.color, imageUrl: shoe.imageUrl, role: '鞋' });
    if (bag) outfitItems.push({ id: bag.id, name: bag.name, category: bag.category, color: bag.color, imageUrl: bag.imageUrl, role: '包' });
    if (acc) outfitItems.push({ id: acc.id, name: acc.name, category: acc.category, color: acc.color, imageUrl: acc.imageUrl, role: '配饰' });

    const names = OUTFIT_NAMES[scene] || OUTFIT_NAMES['default'];
    const comments = SCENE_COMMENTS[scene] || SCENE_COMMENTS['default'];

    outfits.push({
      name: names[i] || `搭配方案 ${i + 1}`,
      items: outfitItems,
      aiComment: comments[i] || comments[0],
      scene: scene === 'default' ? '日常' : scene,
    });
  }

  const session = await prisma.recommendationSession.create({
    data: {
      userId,
      rawQuery: body.rawQuery || null,
      nlpKeywords: body.nlpKeywords || null,
      city: body.city || '北京',
      temperature: body.temperature || 22,
      weatherType: body.weatherType || '晴',
    },
  });

  return NextResponse.json({ outfits, sessionId: session.id });
}
