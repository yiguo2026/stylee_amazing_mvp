import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const USER_ID = 'demo-user';

export async function GET() {
  const outfits = await prisma.outfit.findMany({
    where: { userId: USER_ID },
    include: { items: { include: { item: true }, orderBy: { displayOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ outfits });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const outfit = await prisma.outfit.create({
    data: {
      userId: USER_ID,
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
