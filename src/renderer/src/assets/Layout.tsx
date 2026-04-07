import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Monitor, Settings, LayoutDashboard, House, MonitorOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { useTranslation } from 'react-i18next'
import { ModeToggle } from '@/components/mode-toggle'
import { usePresentationContext } from '@/context/PresentationContext'

function BeaverLogo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-700 text-white dark:bg-amber-600">
      <svg
        viewBox="0 0 64 64"
        className="h-5 w-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CastOR logo"
      >
        <path
          d="M20 24L26 14L32 22L38 14L44 24"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="32"
          cy="36"
          rx="18"
          ry="14"
          fill="currentColor"
          opacity="0.9"
        />
        <circle cx="25" cy="34" r="2.5" fill="white" />
        <circle cx="39" cy="34" r="2.5" fill="white" />
        <rect x="26" y="41" width="4" height="8" rx="1" fill="white" />
        <rect x="34" y="41" width="4" height="8" rx="1" fill="white" />
      </svg>
    </div>
  )
}

function NavItem({
  to,
  children,
  icon: Icon,
}: {
  to: string
  children: React.ReactNode
  icon?: React.ElementType
}) {
  return (
    <NavLink to={to} end={to === "/"}>
      {({ isActive }) => (
        <Button variant={isActive ? "secondary" : "ghost"} className="gap-2">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{children}</span>
        </Button>
      )}
    </NavLink>
  )
}

const Layout = () => {
  const { t } = useTranslation()
  const { castWindowOpen, openCastWindow, closeCastWindow } = usePresentationContext()

  const handleCastClick = () => {
    if (castWindowOpen) {
      closeCastWindow()
    } else {
      openCastWindow()
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <BeaverLogo />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold">CastOR</span>
                <span className="text-xs text-muted-foreground">
                  {t('header.subtitle')}
                </span>
              </div>
            </div>

            <Separator orientation="vertical" />

            <nav className="flex items-center gap-2">
              <NavItem to="/" icon={House}>
                {t('nav.home')}
              </NavItem>
              <NavItem to="/dashboard" icon={LayoutDashboard}>
                {t('nav.dashboard')}
              </NavItem>
              <NavItem to="/settings" icon={Settings}>
                {t('nav.settings')}
              </NavItem>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={castWindowOpen ? "default" : "outline"} 
              className="gap-2"
              onClick={handleCastClick}
            >
              {castWindowOpen ? (
                <>
                  <MonitorOff className="h-4 w-4" />
                  {t('actions.stopCast', 'Stop Cast')}
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  {t('actions.cast')}
                </>
              )}
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full h-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
