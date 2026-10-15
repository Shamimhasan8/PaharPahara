// Sign in endpoint (wraps NextAuth credentials)
import { NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'
// Note: this is a server route that just returns the CSRF/token info.
// The actual sign-in is done client-side via next-auth/react signIn().
// This endpoint is a fallback for non-JS clients (not used by the SPA).

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    providers: [{ id: 'credentials', name: 'PaharPahara' }],
    hint: 'POST email + password to /api/auth/callback/credentials via next-auth/react signIn()',
  })
}
