import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

import { ReactNode } from 'react'
import DynamicTitle from '@/feature/DynamicTitle'

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'NexTab — Your Personal Hub',
  description: 'A personal productivity dashboard for your new tab.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <DynamicTitle />
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <main className="w-full flex flex-col min-h-screen">
              <header className="sticky top-0 z-40 flex items-center h-12 px-3 border-b bg-background/80 backdrop-blur-sm gap-2 shrink-0">
                <SidebarTrigger className="h-8 w-8" />
                <div className="h-4 w-px bg-border" />
                <span className="text-sm text-muted-foreground font-medium tracking-tight select-none">
                  NexTab
                </span>
              </header>
              <div className="flex-1">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
