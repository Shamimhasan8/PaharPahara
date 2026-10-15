'use client'

// PaharPahara — main page.
// Single-route SPA: login screen + tabbed dashboard.
// Uses NextAuth credentials provider + TanStack Query for server state.

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Mountain, LogOut, Globe, Bell, Loader2, Menu, X, ShieldAlert, Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { dict, type Lang } from '@/lib/i18n'
import type { DashboardDataDTO, Role } from '@/lib/types/dto'
import { DashboardView } from '@/components/views/dashboard-view'
import { SitesView } from '@/components/views/sites-view'
import { CasesView } from '@/components/views/cases-view'
import { ReportsView } from '@/components/views/reports-view'
import { SourcesView } from '@/components/views/sources-view'
import { JobsView } from '@/components/views/jobs-view'
import { PreparednessView } from '@/components/views/preparedness-view'
import { NotificationsView } from '@/components/views/notifications-view'
import { AuditLogView } from '@/components/views/audit-log-view'
import { CompareView } from '@/components/views/compare-view'
import { DhakaClock } from '@/components/pahar/dhaka-clock'
import { ThemeToggle } from '@/components/pahar/theme-toggle'
import { CommandPalette } from '@/components/pahar/command-palette'
import { KeyboardShortcutsHelp, useKeyboardShortcuts } from '@/components/pahar/keyboard-shortcuts'

type Tab = 'dashboard' | 'sites' | 'cases' | 'reports' | 'sources' | 'jobs' | 'preparedness' | 'notifications' | 'audit' | 'compare'

const ROLE_TABS: Record<Role, Tab[]> = {
  admin: ['dashboard', 'sites', 'cases', 'compare', 'reports', 'sources', 'jobs', 'preparedness', 'notifications', 'audit'],
  doe_reviewer: ['dashboard', 'sites', 'cases', 'compare', 'reports', 'sources', 'jobs', 'notifications'],
  forest_officer: ['dashboard', 'sites', 'cases', 'compare', 'reports', 'sources', 'notifications'],
  preparedness: ['dashboard', 'sites', 'preparedness', 'reports', 'sources', 'notifications'],
  viewer: ['dashboard', 'sites', 'reports', 'sources'],
}

export default function Home() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    const saved = window.localStorage.getItem('pp-lang') as Lang | null
    return saved === 'bn' || saved === 'en' ? saved : 'en'
  })
  const [tab, setTab] = useState<Tab>('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [selectedSiteSlug, setSelectedSiteSlug] = useState<string | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const t = dict[lang]

  // Persist language + update html lang
  useEffect(() => {
    localStorage.setItem('pp-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  // Cmd/Ctrl+K command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (session) setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session])

  // Lightweight unread-notifications count for the bell badge (enabled only when logged in)
  const { data: notifData } = useQuery<{ notifications: Array<{ read: boolean }> }>({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    enabled: !!session,
    refetchInterval: 60 * 1000,
  })
  const unreadCount = notifData?.notifications?.filter((n) => !n.read).length ?? 0

  // Lightweight dashboard data for the command palette (enabled only when logged in)
  const { data: cmdData } = useQuery<DashboardDataDTO>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard', { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    enabled: !!session,
    refetchInterval: 60 * 1000,
  })

  // Global keyboard shortcuts (g d/g s/g c/?/L/T) — enabled only when logged in
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts({
    enabled: !!session,
    onNavigate: (tb) => {
      const role = (session?.user as { role?: Role } | undefined)?.role
      if (role) {
        const allowed = ROLE_TABS[role] ?? ['dashboard']
        if (allowed.includes(tb as Tab)) setTab(tb as Tab)
      }
    },
    onToggleLang: () => setLang((l) => (l === 'en' ? 'bn' : 'en')),
    onToggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    onOpenHelp: () => setHelpOpen(true),
    onOpenCommandPalette: () => setCmdOpen(true),
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center topo-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <LoginScreen lang={lang} setLang={setLang} />
  }

  const role = (session.user as { role: Role }).role
  const allowedTabs = ROLE_TABS[role] ?? ['dashboard']
  const effectiveTab = allowedTabs.includes(tab) ? tab : 'dashboard'
  const user = session.user as { name: string; email: string; role: Role; agency: string | null }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 sm:gap-3 px-3 sm:px-4">
          <button
            className="md:hidden p-1.5 rounded hover:bg-muted shrink-0"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-sm">
              <Mountain className="h-4 w-4" />
            </div>
            <div className="hidden lg:block">
              <div className="font-semibold leading-none" lang={lang}>{t.appName}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5" lang={lang}>{t.tagline}</div>
            </div>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-0.5 ml-2">
            {allowedTabs.map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-2.5 py-1.5 text-[13px] rounded-md transition-colors whitespace-nowrap ${
                  effectiveTab === tb
                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                lang={lang}
              >
                {t.nav[tb]}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Command palette trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 h-9 px-2.5 rounded-md border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
            aria-label={lang === 'en' ? 'Open command palette' : 'কমান্ড প্যালেট খুলুন'}
            title={lang === 'en' ? 'Command palette (Ctrl+K)' : 'কমান্ড প্যালেট (Ctrl+K)'}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-[11px]">{lang === 'en' ? 'Search…' : 'খুঁজুন…'}</span>
            <kbd className="text-[9px] font-mono px-1 py-0.5 rounded border border-border bg-muted text-muted-foreground/80 ml-1">⌘K</kbd>
          </button>
          <button
            onClick={() => setCmdOpen(true)}
            className="sm:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            aria-label={lang === 'en' ? 'Search' : 'খুঁজুন'}
          >
            <Search className="h-4 w-4" />
          </button>

          <DhakaClock lang={lang} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="gap-1.5 h-9 px-2.5"
            title={lang === 'en' ? 'Switch to বাংলা' : 'Switch to English'}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold">{lang === 'en' ? 'EN' : 'বাং'}</span>
          </Button>

          <ThemeToggle lang={lang} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTab('notifications')}
            className="gap-1.5 relative h-9 w-9 p-0"
            aria-label={t.nav.notifications}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-border">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs leading-tight">
              <div className="font-medium" lang={lang}>{user.name}</div>
              <div className="text-muted-foreground capitalize" lang={lang}>
                {user.role.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="gap-1.5 h-9 px-2.5" aria-label={t.login.signOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline" lang={lang}>{t.login.signOut}</span>
          </Button>
        </div>

        {/* Mobile tabs */}
        {navOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-2 grid grid-cols-2 gap-1">
            {allowedTabs.map((tb) => (
              <button
                key={tb}
                onClick={() => {
                  setTab(tb)
                  setNavOpen(false)
                }}
                className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                  effectiveTab === tb
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                lang={lang}
              >
                {t.nav[tb]}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 py-6">
        <DashboardRouter tab={effectiveTab} lang={lang} role={role} setTab={setTab} />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-gradient-to-b from-card/40 to-card/80 mt-auto shadow-[0_-1px_0_0_oklch(0.90_0.01_150)]">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-1.5 flex-1" lang={lang}>
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            <span className="leading-relaxed">{t.footer.disclaimer}</span>
          </div>
          <div className="flex items-center gap-3 text-right shrink-0" lang={lang}>
            <div>
              <div className="font-medium text-foreground/80">{t.footer.version}</div>
              <div className="opacity-70">{t.footer.links}</div>
            </div>
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Mountain className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </footer>

      {/* Command palette */}
      {cmdData && (
        <CommandPalette
          open={cmdOpen}
          onOpenChange={setCmdOpen}
          data={cmdData}
          lang={lang}
          role={role}
          allowedTabs={allowedTabs}
          onNavigate={(tb) => setTab(tb as Tab)}
          onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onSignOut={() => signOut({ callbackUrl: '/' })}
        />
      )}

      {/* Keyboard shortcuts help (? to open) */}
      <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} lang={lang} />
    </div>
  )
}

function DashboardRouter({
  tab,
  lang,
  role,
  setTab,
}: {
  tab: Tab
  lang: Lang
  role: Role
  setTab: (t: Tab) => void
}) {
  const t = dict[lang]
  const qc = useQueryClient()

  // Single dashboard query for everything (sites, cases, sources, jobs, notifications, bulletins, rainfall summary)
  const { data, isLoading, error, refetch } = useQuery<DashboardDataDTO>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard', { credentials: 'include' })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    refetchInterval: 60 * 1000,
  })

  const reload = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    qc.invalidateQueries({ queryKey: ['weather'] })
  }, [qc])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground" lang={lang}>{t.common.error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            {t.common.retry}
          </Button>
        </CardContent>
      </Card>
    )
  }

  switch (tab) {
    case 'dashboard':
      return <DashboardView data={data} lang={lang} role={role} setTab={setTab as (t: string) => void} />
    case 'sites':
      return <SitesView data={data} lang={lang} />
    case 'cases':
      return <CasesView data={data} lang={lang} role={role} reload={reload} />
    case 'reports':
      return <ReportsView data={data} lang={lang} />
    case 'sources':
      return <SourcesView data={data} lang={lang} />
    case 'jobs':
      return <JobsView data={data} lang={lang} />
    case 'preparedness':
      return <PreparednessView data={data} lang={lang} />
    case 'notifications':
      return <NotificationsView data={data} lang={lang} reload={reload} />
    case 'audit':
      return <AuditLogView lang={lang} role={role} />
    case 'compare':
      return <CompareView data={data} lang={lang} />
  }
}

function LoginScreen({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = dict[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setSubmitting(false)
    if (!res || res.error) {
      toast.error(t.login.invalid)
    } else {
      // Force reload to ensure session token cookie is set
      window.location.reload()
    }
  }

  const demoAccounts: Array<{ email: string; pw: string; role: string }> = [
    { email: 'admin@paharpahara.bd', pw: 'admin123', role: 'admin' },
    { email: 'reviewer@paharpahara.bd', pw: 'reviewer123', role: 'doe_reviewer' },
    { email: 'forest@paharpahara.bd', pw: 'forest123', role: 'forest_officer' },
    { email: 'preparedness@paharpahara.bd', pw: 'prep123', role: 'preparedness' },
    { email: 'viewer@paharpahara.bd', pw: 'viewer123', role: 'viewer' },
  ]

  return (
    <div className="min-h-screen flex flex-col topo-bg">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left — brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <svg viewBox="0 0 600 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="hill-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.10 150)" />
                  <stop offset="100%" stopColor="oklch(0.35 0.06 160)" />
                </linearGradient>
              </defs>
              <path d="M0 600 Q 100 450 200 520 T 400 480 T 600 540 L 600 800 L 0 800 Z" fill="url(#hill-grad)" opacity="0.6" />
              <path d="M0 700 Q 150 600 300 650 T 600 680 L 600 800 L 0 800 Z" fill="oklch(0.42 0.08 152)" opacity="0.8" />
              {/* contour lines */}
              {[100, 200, 300, 400, 500].map((y, i) => (
                <path
                  key={i}
                  d={`M0 ${y + 200} Q ${100 + i * 30} ${y + 180} ${200 + i * 20} ${y + 220} T ${400 + i * 30} ${y + 200} T 600 ${y + 230}`}
                  fill="none"
                  stroke="oklch(0.55 0.08 150)"
                  strokeWidth="0.5"
                  strokeDasharray="3 4"
                  opacity="0.3"
                />
              ))}
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                <Mountain className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight" lang={lang}>{t.appName}</div>
                <div className="text-sm text-muted-foreground" lang={lang}>{t.tagline}</div>
              </div>
            </div>
          </div>
          <div className="relative space-y-4 max-w-md">
            <h1 className="text-3xl font-bold leading-tight" lang={lang}>
              {lang === 'en'
                ? 'From satellite evidence to a traceable officer decision — in one workflow.'
                : 'স্যাটেলাইট প্রমাণ থেকে অনুসরণযোগ্য কর্মকর্তা সিদ্ধান্ত — এক ওয়ার্কফ্লোতে।'}
            </h1>
            <p className="text-sm text-muted-foreground" lang={lang}>
              {lang === 'en'
                ? 'Collect source data → validate and store it → display the evidence → record an authorized human decision → generate a saved bilingual report.'
                : 'উৎস তথ্য সংগ্রহ → যাচাই ও সংরক্ষণ → প্রমাণ প্রদর্শন → অনুমোদিত মানব সিদ্ধান্ত → দ্বিভাষিক রিপোর্ট সংরক্ষণ।'}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Sentinel-2 + Cloud Score+', 'NASA IMERG', 'Open-Meteo Forecast', 'BMD CAP 1.2', 'Dynamic World'].map((s) => (
                <span key={s} className="text-[11px] px-2 py-1 rounded-full bg-card/80 border border-border text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>
          <div className="relative text-xs text-muted-foreground/80" lang={lang}>
            {t.footer.disclaimer}
          </div>
        </div>

        {/* Right — login form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <Card className="w-full max-w-md shadow-xl border-border/80">
            <CardHeader className="space-y-2 text-center">
              <div className="lg:hidden flex justify-center">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Mountain className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-xl" lang={lang}>{t.login.title}</CardTitle>
              <CardDescription className="text-xs" lang={lang}>{t.login.subtitle}</CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs" lang={lang}>{t.login.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reviewer@paharpahara.bd"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs" lang={lang}>{t.login.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t.login.signingIn}
                    </>
                  ) : (
                    t.login.submit
                  )}
                </Button>

                <div className="w-full pt-2 border-t border-border">
                  <div className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide" lang={lang}>
                    {t.login.demoAccounts}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {demoAccounts.map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        onClick={() => {
                          setEmail(a.email)
                          setPassword(a.pw)
                        }}
                        className="text-left px-2 py-1.5 rounded border border-border bg-card hover:bg-muted text-[11px] transition-colors"
                      >
                        <div className="font-medium capitalize">{a.role.replace(/_/g, ' ')}</div>
                        <div className="text-muted-foreground truncate">{a.email}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className="gap-1.5">
                    <Globe className="h-4 w-4" />
                    {lang === 'en' ? 'বাংলা' : 'English'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
