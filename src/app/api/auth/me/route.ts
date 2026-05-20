import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getTokenFromHeaders, COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = getTokenFromHeaders(req.headers);
  if (!token) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: '登录已过期' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, nickname: true, gender: true, age: true, profession: true, permanentCity: true, onboardingDone: true },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
  return res;
}
