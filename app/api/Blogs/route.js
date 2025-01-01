import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  const { title, content, author, imageUrl } = await req.json();
  const blog = await prisma.blog.create({ data: { title, content, author, imageUrl } });
  return NextResponse.json(blog);
}
