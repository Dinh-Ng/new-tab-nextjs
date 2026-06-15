'use client'

import { useEffect } from 'react'
import { saveTokenToSession } from '@/lib/google-drive'

/**
 * OAuth callback page for the implicit grant flow.
 *
 * Google redirects here after the user consents, with the access token in the
 * URL hash fragment, e.g.:
 *   /auth/callback#access_token=ya29...&expires_in=3599&token_type=Bearer
 *
 * We parse the hash, save the token to sessionStorage, then redirect to home.
 * No server-side code or secrets are needed.
 *
 * ⚠️  Register this page's URL in Google Cloud Console:
 *     Credentials → OAuth Client → Authorized redirect URIs
 *     Add: https://new-tab-nextjs.vercel.app/auth/callback
 *          http://localhost:3000/auth/callback  (for local dev)
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1) // strip leading '#'
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const expiresIn = parseInt(params.get('expires_in') ?? '3600', 10)
    const error = params.get('error')

    if (error) {
      console.error('OAuth error:', error)
      window.location.replace('/?auth_error=' + encodeURIComponent(error))
      return
    }

    if (accessToken) {
      saveTokenToSession(accessToken, expiresIn)
    }

    // Redirect back to the main page
    window.location.replace('/')
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        color: '#888',
      }}
    >
      <p>Signing you in…</p>
    </div>
  )
}
