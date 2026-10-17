'use client'

// PaharPahara — main page.
// Single-route SPA: login screen + tabbed dashboard.
// Uses NextAuth credentials provider + TanStack Query for server state.

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Mountain, LogOut, Globe, Bell, Loader2, Menu, X, ShieldAlert, Search, Command, Upload, Activity, FileText, MapPin, GitCompare, ScrollText } from 'lucide-react'
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
import { DashboardSkeleton } from '@/components/pahar/skeletons'

type Tab = 'dashboard' | 'sites' | 'cases' | 'reports' | 'sources' | 'jobs' | 'preparedness' | 'notifications' | 'audit' | 'compare'

const ROLE_TABS: Record<Role, Tab[]> = {
  admin: ['dashboard', 'sites', 'cases', 'reports', 'preparedness', 'notifications', 'audit'],
  doe_reviewer: ['dashboard', 'sites', 'cases', 'reports', 'notifications'],
  forest_officer: ['dashboard', 'sites', 'cases', 'reports', 'notifications'],
  preparedness: ['dashboard', 'sites', 'preparedness', 'reports', 'notifications'],
  viewer: ['dashboard', 'sites', 'reports'],
}

export default function Home() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    const saved = window.localStorage.getItem('pp-lang') as Lang | null
    return saved === 'bn' || saved === 'en' ? saved : 'en'
  })
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    const h = window.location.hash.slice(1)
    const params = new URLSearchParams(h)
    const tb = params.get('tab')
    if (tb && ['dashboard', 'sites', 'cases', 'reports', 'sources', 'jobs', 'preparedness', 'notifications', 'audit', 'compare'].includes(tb)) {
      return tb as Tab
    }
    return 'dashboard'
  })
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

  // Sync tab + selection to URL hash (bookmarkable views)
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    if (selectedSiteSlug) params.set('site', selectedSiteSlug)
    if (selectedCaseId) params.set('case', selectedCaseId)
    const newHash = params.toString()
    if (window.location.hash.slice(1) !== newHash) {
      window.history.replaceState(null, '', `#${newHash}`)
    }
  }, [tab, selectedSiteSlug, selectedCaseId])

  // Listen for browser back/forward
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const tb = params.get('tab')
      if (tb && ['dashboard', 'sites', 'cases', 'reports', 'sources', 'jobs', 'preparedness', 'notifications', 'audit', 'compare'].includes(tb)) {
        setTab(tb as Tab)
      }
      setSelectedSiteSlug(params.get('site'))
      setSelectedCaseId(params.get('case'))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
        if (allowed.includes(tb as Tab)) {
          setTab(tb as Tab)
          return true
        }
        // Blocked — show toast for role-restricted tabs
        if (tb === 'audit') {
          toast.error(lang === 'en' ? 'Audit Log requires admin role' : 'অডিট লগের জন্য অ্যাডমিন ভূমিকা প্রয়োজন')
        } else if (tb === 'preparedness') {
          toast.error(lang === 'en' ? 'Preparedness tab not available for your role' : 'আপনার ভূমিকার জন্য প্রস্তুতি ট্যাব অনুপলব্ধ')
        } else if (tb === 'compare') {
          toast.error(lang === 'en' ? 'Compare tab not available for your role' : 'আপনার ভূমিকার জন্য তুলনা ট্যাব অনুপলব্ধ')
        }
      }
      return false
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
      <header className="sticky top-0 z-30 border-b border-border/60 glass shadow-sm">
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

          {/* Desktop tabs — premium pill style */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {allowedTabs.map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-3 py-1.5 text-[13px] rounded-lg transition-all whitespace-nowrap ${
                  effectiveTab === tb
                    ? 'bg-primary text-primary-foreground font-semibold shadow-premium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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

        {/* Mobile tabs — slide-down panel with icons */}
        {navOpen && (
          <nav className="md:hidden border-t border-border/60 glass px-4 py-3 grid grid-cols-2 gap-1.5 shadow-premium">
            {allowedTabs.map((tb) => {
              const icons: Record<string, typeof Mountain> = {
                dashboard: Activity,
                sites: MapPin,
                cases: FileText,
                compare: GitCompare,
                reports: FileText,
                sources: Mountain,
                jobs: Activity,
                preparedness: ShieldAlert,
                notifications: Bell,
                audit: ScrollText,
              }
              const Icon = icons[tb] ?? Activity
              return (
                <button
                  key={tb}
                  onClick={() => {
                    setTab(tb)
                    setNavOpen(false)
                  }}
                  className={`px-3 py-2.5 text-sm rounded-lg transition-all text-left flex items-center gap-2 ${
                    effectiveTab === tb
                      ? 'bg-primary text-primary-foreground font-semibold shadow-premium'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                  lang={lang}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t.nav[tb]}
                </button>
              )
            })}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 py-6">
        {/* Imported data banner */}
        <ImportedDataBanner lang={lang} onClear={() => {
          localStorage.removeItem('pp-imported-dashboard')
          localStorage.removeItem('pp-imported-dashboard-time')
          window.location.reload()
        }} />
        <DashboardRouter tab={effectiveTab} lang={lang} role={role} setTab={setTab} initialSiteSlug={selectedSiteSlug} initialCaseId={selectedCaseId} onCaseSelected={setSelectedCaseId} onSiteSelected={setSelectedSiteSlug} />
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
  initialSiteSlug,
  initialCaseId,
  onCaseSelected,
  onSiteSelected,
}: {
  tab: Tab
  lang: Lang
  role: Role
  setTab: (t: Tab) => void
  initialSiteSlug: string | null
  initialCaseId: string | null
  onCaseSelected: (id: string | null) => void
  onSiteSelected: (slug: string | null) => void
}) {
  const t = dict[lang]
  const qc = useQueryClient()

  // Single dashboard query for everything (sites, cases, sources, jobs, notifications, bulletins, rainfall summary)
  // Checks localStorage for imported data first; falls back to API.
  const { data, isLoading, error, refetch } = useQuery<DashboardDataDTO>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Check for imported data in localStorage (set by the Import button)
      if (typeof window !== 'undefined') {
        const imported = localStorage.getItem('pp-imported-dashboard')
        if (imported) {
          try {
            return JSON.parse(imported) as DashboardDataDTO
          } catch {
            // Invalid stored data — remove and fall through to API
            localStorage.removeItem('pp-imported-dashboard')
            localStorage.removeItem('pp-imported-dashboard-time')
          }
        }
      }
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
    return <DashboardSkeleton />
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
      return <SitesView data={data} lang={lang} initialSlug={initialSiteSlug} onSelectedChange={onSiteSelected} />
    case 'cases':
      return <CasesView data={data} lang={lang} role={role} reload={reload} initialSelectedId={initialCaseId} onSelectedChange={onCaseSelected} />
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, oklch(0.28 0.05 152), oklch(0.20 0.03 155), oklch(0.15 0.02 150))' }}>
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left — premium brand panel with satellite imagery feel */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, oklch(0.28 0.06 152) 0%, oklch(0.22 0.04 155) 40%, oklch(0.15 0.02 150) 100%)' }} />
          {/* Topographic SVG overlay */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 600 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              {[80, 160, 240, 320, 400, 480, 560, 640].map((y, i) => (
                <path
                  key={i}
                  d={`M0 ${y} Q ${80 + i * 25} ${y - 30} ${160 + i * 20} ${y + 15} T ${320 + i * 25} ${y - 10} T ${480 + i * 20} ${y + 25} T 600 ${y}`}
                  fill="none"
                  stroke="oklch(0.70 0.08 140)"
                  strokeWidth="0.6"
                  strokeDasharray="4 5"
                  opacity="0.4"
                />
              ))}
            </svg>
          </div>
          {/* Floating glow orbs */}
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, oklch(0.45 0.10 140 / 0.15), transparent 70%)' }} />
          <div className="absolute bottom-32 left-16 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, oklch(0.55 0.08 75 / 0.1), transparent 70%)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white shadow-premium-lg" style={{ background: 'linear-gradient(135deg, oklch(0.45 0.10 140), oklch(0.35 0.08 155))' }}>
                <Mountain className="h-7 w-7" />
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight text-white" lang={lang}>{t.appName}</div>
                <div className="text-sm text-white/60" lang={lang}>{t.tagline}</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight text-white" lang={lang}>
              {lang === 'en'
                ? 'From satellite evidence to a traceable officer decision — in one workflow.'
                : 'স্যাটেলাইট প্রমাণ থেকে অনুসরণযোগ্য কর্মকর্তা সিদ্ধান্ত — এক ওয়ার্কফ্লোতে।'}
            </h1>
            <p className="text-base text-white/50 leading-relaxed" lang={lang}>
              {lang === 'en'
                ? 'Collect source data → validate and store it → display the evidence → record an authorized human decision → generate a saved bilingual report.'
                : 'উৎস তথ্য সংগ্রহ → যাচাই ও সংরক্ষণ → প্রমাণ প্রদর্শন → অনুমোদিত মানব সিদ্ধান্ত → দ্বিভাষিক রিপোর্ট সংরক্ষণ।'}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Sentinel-2 + Cloud Score+', 'NASA IMERG', 'Open-Meteo Forecast', 'BMD CAP 1.2', 'Dynamic World'].map((s) => (
                <span key={s} className="text-[11px] px-2.5 py-1 rounded-full text-white/80" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-white/40" lang={lang}>
            {t.footer.disclaimer}
          </div>
        </div>

        {/* Right — premium login form */}
        <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white shadow-premium-lg" style={{ background: 'linear-gradient(135deg, oklch(0.45 0.10 140), oklch(0.35 0.08 155))' }}>
                <Mountain className="h-7 w-7" />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight" lang={lang}>{t.login.title}</h2>
              <p className="text-sm text-muted-foreground mt-1.5" lang={lang}>{t.login.subtitle}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground" lang={lang}>{t.login.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@paharpahara.bd"
                  required
                  autoComplete="email"
                  className="h-11 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground" lang={lang}>{t.login.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-11 text-sm"
                />
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-semibold shadow-premium" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.login.signingIn}
                  </>
                ) : (
                  t.login.submit
                )}
              </Button>
            </form>

            {/* Demo accounts — premium card style with auto-fill hint */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70" lang={lang}>
                  {t.login.demoAccounts}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium" lang={lang}>
                  {lang === 'en' ? '👆 Click to auto-fill' : '👆 ক্লিক করে অটো-ফিল'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mb-3" lang={lang}>
                {lang === 'en' ? 'Click any role below — email + password fill automatically, then press Sign in.' : 'নিচের যেকোনো ভূমিকায় ক্লিক করুন — ইমেইল + পাসওয়ার্ড স্বয়ংক্রিয়ভাবে পূরণ হবে, তারপর সাইন ইন চাপুন।'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => {
                      setEmail(a.email)
                      setPassword(a.pw)
                    }}
                    className="text-left px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-premium hover:bg-primary/5 transition-all text-[11px] group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-semibold capitalize text-foreground group-hover:text-primary transition-colors">{a.role.replace(/_/g, ' ')}</div>
                      <span className="text-[8px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                    <div className="text-muted-foreground truncate font-mono text-[10px]">{a.email}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center w-full mt-6">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className="gap-1.5 text-muted-foreground">
                <Globe className="h-4 w-4" />
                {lang === 'en' ? 'বাংলা' : 'English'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Banner shown when imported dashboard data is active (from localStorage).
function ImportedDataBanner({ lang, onClear }: { lang: Lang; onClear: () => void }) {
  const [info, setInfo] = useState<{ time: string } | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('pp-imported-dashboard')
    const storedTime = localStorage.getItem('pp-imported-dashboard-time')
    if (stored && storedTime) return { time: storedTime }
    return null
  })

  if (!info) return null

  return (
    <div className="mb-4 p-2.5 rounded-lg border border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-800 flex items-center gap-2.5">
      <Upload className="h-4 w-4 text-violet-600 dark:text-violet-300 shrink-0" />
      <div className="flex-1 min-w-0 text-xs">
        <span className="font-medium text-violet-900 dark:text-violet-200" lang={lang}>
          {lang === 'en' ? 'Viewing imported data' : 'ইম্পোর্ট করা ডেটা দেখা হচ্ছে'}
        </span>
        <span className="text-violet-700 dark:text-violet-300 ml-1.5">
          · {new Date(info.time).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka' })}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="h-7 text-[11px] gap-1 border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-900/40"
      >
        <X className="h-3 w-3" />
        <span lang={lang}>{lang === 'en' ? 'Clear & reload' : 'মুছুন ও রিলোড'}</span>
      </Button>
    </div>
  )
}
