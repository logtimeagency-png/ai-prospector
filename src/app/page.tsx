import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Zap, Search, MessageSquare, TrendingUp } from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'Busca en Google Maps',
    desc: 'Encuentra negocios locales en cualquier sector y ciudad de España.',
  },
  {
    icon: TrendingUp,
    title: 'Detecta puntos de dolor',
    desc: 'Web lenta, sin reservas, pocas reseñas, sin SSL. Sabemos qué venderles.',
  },
  {
    icon: MessageSquare,
    title: 'Scripts de venta listos',
    desc: 'Email, WhatsApp y DM personalizados. Copia y envía. Sin integraciones.',
  },
]

const PLANS = [
  {
    name: 'Gratis',
    price: '0€',
    period: 'siempre',
    credits: '5 análisis/mes',
    cta: 'Empezar gratis',
    href: '/register',
    features: ['5 leads/mes', 'Opportunity Score', 'Problemas detectados', 'Exportar CSV'],
    highlight: false,
  },
  {
    name: 'Starter',
    price: '9€',
    period: '/mes',
    credits: '100 análisis/mes',
    cta: 'Empezar ahora',
    href: '/register',
    features: ['100 leads/mes', 'Scripts de IA completos', 'Filtros avanzados', 'Exportar CSV', 'Soporte por email'],
    highlight: true,
  },
  {
    name: 'Agency',
    price: '49€',
    period: '/mes',
    credits: '500 análisis/mes',
    cta: 'Para agencias',
    href: '/register',
    features: ['500 leads/mes', 'Todo el plan Starter', 'Multi-localidad', 'Soporte prioritario'],
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Prospector</span>
          <Badge variant="secondary" className="text-xs">by LogTime</Badge>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Gratis →</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-4 text-xs">Venta basada en diagnóstico</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Encuentra negocios locales<br />
          <span className="text-primary">con problemas reales</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          Detecta webs lentas, negocios sin reservas online, pocas reseñas y más.
          Genera scripts de venta personalizados en segundos. Copia y envía.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="px-8">Empezar gratis</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Ya tengo cuenta</Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">5 análisis gratuitos · Sin tarjeta · Sin compromiso</p>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Cómo funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost highlight */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Precio real por lead analizado</h2>
          <div className="bg-gray-50 border rounded-xl p-6 text-4xl font-bold text-primary">
            ~0,0003€
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Por eso podemos ofrecerte 100 leads/mes por solo 9€.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Precios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`bg-white rounded-xl border p-6 space-y-5 ${
                  plan.highlight ? 'border-primary ring-1 ring-primary shadow-md' : ''
                }`}
              >
                {plan.highlight && (
                  <Badge className="text-xs">Más popular</Badge>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.credits}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="block">
                  <Button className="w-full" variant={plan.highlight ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center text-xs text-muted-foreground">
        <p>AI Prospector · by <a href="https://logtime.es" className="hover:text-foreground">LogTime</a> · 2025</p>
      </footer>
    </div>
  )
}
