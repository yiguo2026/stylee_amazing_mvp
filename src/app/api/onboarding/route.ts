import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const USER_ID = 'demo-user';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nickname, gender, age, profession, permanentCity, styleLikes = [], styleDislikes = [], initialItems = [] } = body;

  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {
      nickname: nickname || '用户',
      gender: gender || 'female',
      age: age || null,
      profession: profession || null,
      permanentCity: permanentCity || null,
      onboardingDone: true,
    },
    create: {
      id: USER_ID,
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
      where: { id: `pref-like-${tagName}` },
      update: {},
      create: { id: `pref-like-${tagName}`, userId: USER_ID, tagName, tagType: 'style', preferenceType: 'like' },
    });
  }
  for (const tagName of styleDislikes) {
    await prisma.userStylePreference.upsert({
      where: { id: `pref-dislike-${tagName}` },
      update: {},
      create: { id: `pref-dislike-${tagName}`, userId: USER_ID, tagName, tagType: 'style', preferenceType: 'dislike' },
    });
  }

  for (const item of initialItems) {
    await prisma.wardrobeItem.create({
      data: {
        userId: USER_ID,
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
