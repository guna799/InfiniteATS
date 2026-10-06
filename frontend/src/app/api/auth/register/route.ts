import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/session';
import { clientIp, isRateLimited } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  if (isRateLimited(`register:${clientIp(request)}`, 10)) {
    return NextResponse.json({ error: 'Too many registration attempts. Try again later.' }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const [existingAccount, existingStaff] = await Promise.all([
    prisma.candidateAccount.findUnique({ where: { email: data.email } }),
    prisma.user.findFirst({ where: { email: data.email } }),
  ]);
  if (existingAccount || existingStaff) {
    return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
  }

  const account = await prisma.candidateAccount.create({
    data: {
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      location: data.location || null,
      lastLoginAt: new Date(),
    },
  });

  const response = NextResponse.json({ redirectTo: '/profile?welcome=1' }, { status: 201 });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken({
      sub: account.id,
      kind: 'candidate',
      email: account.email,
      name: `${account.firstName} ${account.lastName}`,
    }),
    sessionCookieOptions()
  );
  return response;
}
