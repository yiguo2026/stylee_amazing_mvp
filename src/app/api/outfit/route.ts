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

  const outfits = await prisma.outfit.findMany({
    where: { userId },
    include: { items: { include: { item: true }, orderBy: { displayOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ outfits });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const outfit = await prisma.outfit.create({
    data: {
      userId,
      name: body.name || '未命名搭配',
      scene: body.scene || null,
      aiComment: body.aiComment || null,
      source: body.source || 'user_created',
      isFavorite: body.isFavorite || false,
      sessionId: body.sessionId || null,
      items: {
        create: (body.items || []).map((it: { itemId: string; role?: string; displayOrder?: number }, i: number) => ({
          itemId: it.itemId,
          role: it.role || null,
          displayOrder: it.displayOrder ?? i,
        })),
      },
    },
    include: { items: { include: { item: true } } },
  });
  return NextResponse.json({ outfit }, { status: 201 });
}
