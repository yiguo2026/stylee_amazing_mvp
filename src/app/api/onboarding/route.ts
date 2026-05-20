import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId || null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { nickname, gender, age, profession, permanentCity, styleLikes = [], styleDislikes = [], initialItems = [] } = body;

  await prisma.user.update({
    where: { id: userId },
    data: {
      nickname: nickname || '用户',
      gender: gender || 'female',
      age: age || null,
      profession: profession || null,
      permanentCity: permanentCity || null,
      onboardingDone: true,
    },
  });

  for (const tagName of styleLikes) {
    await prisma.userStylePreference.upsert({
      where: { id: `pref-like-${userId}-${tagName}` },
      update: {},
      create: { id: `pref-like-${userId}-${tagName}`, userId, tagName, tagType: 'style', preferenceType: 'like' },
    });
  }
  for (const tagName of styleDislikes) {
    await prisma.userStylePreference.upsert({
      where: { id: `pref-dislike-${userId}-${tagName}` },
      update: {},
      create: { id: `pref-dislike-${userId}-${tagName}`, userId, tagName, tagType: 'style', preferenceType: 'dislike' },
    });
  }

  for (const item of initialItems) {
    await prisma.wardrobeItem.create({
      data: {
        userId,
        name: item.name,
        category: item.category,
        color: item.color || '未知',
        material: item.material || null,
        brand: item.brand || null,
        sourceType: 'manual',
      },
    });
  }

  return NextResponse.json({ ok: true });
}
