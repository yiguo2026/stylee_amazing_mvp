import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = getTokenFromHeaders(req.headers);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId || null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, nickname: true, gender: true, age: true, profession: true, permanentCity: true, onboardingDone: true },
  });

  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { nickname, gender, age, profession, permanentCity, onboardingDone } = body;

  const data: Record<string, unknown> = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (gender !== undefined) data.gender = gender;
  if (age !== undefined) data.age = age;
  if (profession !== undefined) data.profession = profession;
  if (permanentCity !== undefined) data.permanentCity = permanentCity;
  if (onboardingDone !== undefined) data.onboardingDone = onboardingDone;

  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ id: user.id, username: user.username, nickname: user.nickname, gender: user.gender, age: user.age, profession: user.profession, permanentCity: user.permanentCity, onboardingDone: user.onboardingDone });
}
