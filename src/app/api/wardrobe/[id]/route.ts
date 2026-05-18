import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.wardrobeItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.wardrobeItem.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category,
      color: body.color,
      material: body.material || undefined,
      brand: body.brand || undefined,
      price: body.price ? parseFloat(body.price) : undefined,
      fitType: body.fitType || undefined,
      season: body.season || undefined,
      isFavorite: body.isFavorite ?? undefined,
      status: body.status || undefined,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.wardrobeItem.update({ where: { id }, data: { status: 'archived' } });
  return NextResponse.json({ ok: true });
}
