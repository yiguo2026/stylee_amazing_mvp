import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  const token = await createToken(user.id);
  const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, nickname: user.nickname, gender: user.gender, onboardingDone: user.onboardingDone } });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' });
  return res;
}
