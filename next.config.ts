import type { NextConfig } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const securityHeaders = [
  // Prevents clickjacking — nobody can embed this app in an iframe
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stops browsers from MIME-sniffing — prevents XSS via file uploads
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Forces HTTPS for 2 years, includes subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Controls what info is sent in the Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restricts browser features (camera, mic, geolocation, etc.)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Cross-Origin isolation — prevents Spectre-style side-channel attacks
  { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // DNS prefetch off — prevents DNS leakage to third parties
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Content Security Policy — the main XSS defense
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js inline scripts + Stripe.js
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      // Styles: self + inline (Tailwind/shadcn generates inline styles)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + Google Maps thumbnails
      "img-src 'self' data: blob: https://maps.googleapis.com https://lh3.googleusercontent.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // API calls allowed to these origins only
      `connect-src 'self' ${APP_URL} https://*.supabase.co https://api.openai.com https://api.stripe.com`,
      // Stripe checkout iframe
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Form submissions: only to self
      "form-action 'self'",
      // No mixed content
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
