'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Book, ListTodo, Gamepad2, Moon, Sun, Target, Zap } from 'lucide-react'
import { useTheme } from 'next-themes'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const items = [
  {
    title: 'Task Manager',
    url: '/task-manager',
    icon: ListTodo,
    description: 'Manage your tasks',
  },
  {
    title: 'Story Reader',
    url: '/story-reader',
    icon: Book,
    description: 'Read your stories',
  },
  {
    title: 'Game Center',
    url: '/game',
    icon: Gamepad2,
    description: 'Play mini games',
  },
  {
    title: 'Daily Quests',
    url: '/daily-quests',
    icon: Target,
    description: 'Track daily goals',
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <Sidebar className="sidebar-premium border-r-0">
      {/* Header */}
      <SidebarHeader className="sidebar-header px-4 py-5">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Zap className="sidebar-logo-icon" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">NexTab</span>
            <span className="sidebar-brand-tagline">Your personal hub</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-2">
        <div className="sidebar-section-label">Navigation</div>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} className="sidebar-menu-btn h-auto p-0">
                  <Link href={item.url} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                    <div className={`sidebar-nav-icon-wrap ${isActive ? 'active' : ''}`}>
                      <item.icon className="sidebar-nav-icon" />
                    </div>
                    <div className="sidebar-nav-text">
                      <span className="sidebar-nav-title">{item.title}</span>
                      <span className="sidebar-nav-desc">{item.description}</span>
                    </div>
                    {isActive && <div className="sidebar-active-dot" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-4 py-4">
        <div className="sidebar-footer-divider" />
        <div className="sidebar-footer-content">
          <div className="sidebar-version">
            <span className="sidebar-version-dot" />
            <span className="sidebar-version-text">v2.0 · 2026</span>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="sidebar-theme-toggle"
            aria-label="Toggle theme"
          >
            <Sun className="sidebar-theme-icon sun" />
            <Moon className="sidebar-theme-icon moon" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
