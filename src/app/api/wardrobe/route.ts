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

  const items = await prisma.wardrobeItem.findMany({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const item = await prisma.wardrobeItem.create({
    data: {
      userId,
      name: body.name,
      category: body.category,
      color: body.color,
      material: body.material || null,
      brand: body.brand || null,
      price: body.price ? parseFloat(body.price) : null,
      imageUrl: body.imageUrl || null,
      fitType: body.fitType || null,
      season: body.season || null,
      sourceType: body.sourceType || 'manual',
      aiRecognizedAttrs: body.aiRecognizedAttrs || null,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
