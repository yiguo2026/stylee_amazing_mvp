import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password, nickname } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }
  if (username.length < 2 || username.length > 20) {
    return NextResponse.json({ error: '用户名需要 2-20 个字符' }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: '密码至少 4 个字符' }, { status: 400 });
  }

  let existing;
  try {
    existing = await prisma.user.findFirst({ where: { username } });
  } catch (e) {
    console.error('findUser error:', e);
    return NextResponse.json({ error: `查询失败: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash, nickname: nickname || username },
    });

    const token = await createToken(user.id);
    const isProd = process.env.VERCEL === '1';
    const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, nickname: user.nickname } });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' });
    return res;
  } catch (e) {
    console.error('createUser error:', e);
    return NextResponse.json({ error: `注册失败: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
