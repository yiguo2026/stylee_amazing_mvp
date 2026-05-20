import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/auth';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const TAGS = [
  { name: '职场', type: 'occasion', icon: '💼' },
  { name: '休闲', type: 'occasion', icon: '☕' },
  { name: '约会', type: 'occasion', icon: '💕' },
  { name: '运动', type: 'occasion', icon: '🏃' },
  { name: '正式', type: 'occasion', icon: '🎩' },
  { name: '度假', type: 'occasion', icon: '🏖️' },
  { name: '极简', type: 'style', icon: null },
  { name: '法式', type: 'style', icon: null },
  { name: '街头', type: 'style', icon: null },
  { name: '甜美', type: 'style', icon: null },
  { name: '韩系', type: 'style', icon: null },
  { name: '复古', type: 'style', icon: null },
  { name: '知性', type: 'style', icon: null },
  { name: '通勤简约', type: 'style', icon: null },
  { name: '冷色', type: 'color_system', icon: null },
  { name: '暖色', type: 'color_system', icon: null },
  { name: '中性色', type: 'color_system', icon: null },
  { name: '黑白', type: 'color_system', icon: null },
  { name: '春', type: 'season', icon: null },
  { name: '夏', type: 'season', icon: null },
  { name: '秋', type: 'season', icon: null },
  { name: '冬', type: 'season', icon: null },
];

const WARDROBE_ITEMS = [
  { name: '浅蓝牛津纺衬衫', category: '上装', color: '浅蓝', material: '牛津纺棉', brand: 'UNIQLO', price: 199, fitType: 'Regular Fit', season: '春/夏/秋', sourceType: 'photo_ai' },
  { name: '白色圆领T恤', category: '上装', color: '白色', material: '纯棉', brand: 'COS', price: 149, fitType: 'Regular Fit', season: '春/夏', sourceType: 'manual' },
  { name: '米色针织开衫', category: '上装', color: '米色', material: '羊绒混纺', brand: 'UNIQLO', price: 399, fitType: 'Loose Fit', season: '秋/冬', sourceType: 'album_ai' },
  { name: '深灰休闲西裤', category: '下装', color: '深灰', material: '棉混纺', brand: 'MUJI', price: 299, fitType: 'Slim Fit', season: '四季', sourceType: 'photo_ai' },
  { name: '藏青西装外套', category: '外套', color: '藏青', material: '羊毛混纺', brand: 'ZARA', price: 599, fitType: 'Regular Fit', season: '秋/冬', sourceType: 'link_import' },
  { name: '白色德训鞋', category: '鞋', color: '白色', material: '皮革/橡胶', brand: 'Margiela', price: 899, fitType: '-', season: '四季', sourceType: 'manual' },
  { name: '棕色皮质邮差包', category: '包', color: '棕色', material: '头层牛皮', brand: 'Coach', price: 1299, fitType: '-', season: '四季', sourceType: 'manual' },
  { name: '银色极简手表', category: '配饰', color: '银色', material: '不锈钢', brand: 'Daniel Wellington', price: 899, fitType: '-', season: '四季', sourceType: 'manual' },
];

const OUTFITS = [
  { name: '周四会议装', scene: '职场', aiComment: '经典的商务休闲组合，浅蓝衬衫搭配深灰西裤干练利落，白色德训鞋增添轻松感，适合周四这种半正式的会议日。', items: ['浅蓝牛津纺衬衫', '深灰休闲西裤', '白色德训鞋'] },
  { name: '周末早午餐', scene: '休闲', aiComment: '衬衫配西裤外搭西装，随性又有型。周末可以敞开外套，搭配更轻松。', items: ['浅蓝牛津纺衬衫', '深灰休闲西裤', '藏青西装外套'] },
  { name: '雨天保暖风', scene: '日常', aiComment: '西装外套挡风效果好，搭配西裤和乐福鞋适合雨天通勤。', items: ['藏青西装外套', '深灰休闲西裤', '白色德训鞋'] },
  { name: '清爽休闲风', scene: '休闲', aiComment: '极简白T + 西裤 + 白鞋，轻松又不失品味。', items: ['白色圆领T恤', '深灰休闲西裤', '白色德训鞋'] },
];

async function main() {
  // Create tags
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { id: tag.name },
      update: {},
      create: { id: tag.name, name: tag.name, type: tag.type, icon: tag.icon },
    });
  }

  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {},
    create: {
      id: 'demo-user',
      username: 'xiaomei',
      passwordHash: await hashPassword('1234'),
      nickname: '小美',
      gender: 'female',
      age: 25,
      profession: '设计师',
      permanentCity: '上海',
      onboardingDone: true,
    },
  });

  // Create style preferences
  const likes = ['简约', '通勤', '法式', '温柔', '韩系'];
  const dislikes = ['朋克', 'Oversize', '暗黑'];
  for (const name of likes) {
    await prisma.userStylePreference.upsert({
      where: { id: `pref-like-${name}` },
      update: {},
      create: { id: `pref-like-${name}`, userId: user.id, tagName: name, tagType: 'style', preferenceType: 'like' },
    });
  }
  for (const name of dislikes) {
    await prisma.userStylePreference.upsert({
      where: { id: `pref-dislike-${name}` },
      update: {},
      create: { id: `pref-dislike-${name}`, userId: user.id, tagName: name, tagType: 'style', preferenceType: 'dislike' },
    });
  }

  // Create wardrobe items
  const createdItems: Record<string, any> = {};
  for (const item of WARDROBE_ITEMS) {
    const dbItem = await prisma.wardrobeItem.create({
      data: {
        userId: user.id,
        name: item.name,
        category: item.category,
        color: item.color,
        material: item.material,
        brand: item.brand,
        price: item.price,
        fitType: item.fitType,
        season: item.season,
        sourceType: item.sourceType,
        wearCount: Math.floor(Math.random() * 20),
      },
    });
    createdItems[item.name] = dbItem;
  }

  // Create outfits
  for (const outfit of OUTFITS) {
    const dbOutfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        name: outfit.name,
        scene: outfit.scene,
        aiComment: outfit.aiComment,
        source: 'ai_generated',
      },
    });

    for (let i = 0; i < outfit.items.length; i++) {
      const itemName = outfit.items[i];
      const item = createdItems[itemName];
      if (item) {
        await prisma.outfitItem.create({
          data: {
            outfitId: dbOutfit.id,
            itemId: item.id,
            role: i === 0 ? '上装' : i === 1 ? '下装' : i === 2 ? '鞋' : '配饰',
            displayOrder: i,
          },
        });
      }
    }

    // Create wear events for some outfits
    if (outfit.name !== '雨天保暖风') {
      await prisma.wearEvent.create({
        data: {
          userId: user.id,
          outfitId: dbOutfit.id,
          wearDate: new Date(2025, 4, Math.floor(Math.random() * 10) + 1),
          weather: '☀️ 晴 22°C',
          rating: Math.floor(Math.random() * 2) + 4,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
