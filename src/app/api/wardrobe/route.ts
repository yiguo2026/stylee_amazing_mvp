import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const USER_ID = 'demo-user';

export async function GET() {
  const items = await prisma.wardrobeItem.findMany({
    where: { userId: USER_ID, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.wardrobeItem.create({
    data: {
      userId: USER_ID,
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
