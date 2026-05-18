import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEMO_USER_ID = 'demo-user';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: DEMO_USER_ID },
    });

    if (!user) {
      // Auto-create demo user if not exists
      const created = await prisma.user.create({
        data: { id: DEMO_USER_ID, nickname: 'Demo User' },
      });
      return NextResponse.json(created);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, gender, age, profession, permanentCity, avatarUrl, bodyShape, skinTone, onboardingDone } = body;

    const data: Record<string, unknown> = {};
    if (nickname !== undefined) data.nickname = nickname;
    if (gender !== undefined) data.gender = gender;
    if (age !== undefined) data.age = age;
    if (profession !== undefined) data.profession = profession;
    if (permanentCity !== undefined) data.permanentCity = permanentCity;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
    if (bodyShape !== undefined) data.bodyShape = bodyShape;
    if (skinTone !== undefined) data.skinTone = skinTone;
    if (onboardingDone !== undefined) data.onboardingDone = onboardingDone;

    const user = await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      update: data,
      create: {
        id: DEMO_USER_ID,
        nickname: nickname ?? 'Demo User',
        gender: gender ?? 'female',
        ...data,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT /api/user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
