import { revalidatePath } from 'next/cache';

// Called by the backend after every admin change so the landing page refreshes immediately.
export async function POST(request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = new URL(request.url).searchParams.get('secret');
  if (!secret || given !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidatePath('/');
  return Response.json({ ok: true });
}
