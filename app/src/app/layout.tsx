import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'

import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { Providers } from '@/app/providers'
import MainNav from '@/components/main-nav'
import MobileNav from '@/components/mobile-nav'
import MobileBetSlip from '@/components/mobile-bet-slip'
import MobileConnectWallet from '@/components/mobile-connect-wallet'
import MobileWalletAlert from '@/components/mobile-wallet-alert'
import SearchBar from '@/components/search-bar'
import BetSlip from '@/components/bet-slip'
import GoogleTag from '@/components/google-tag'

export const metadata = {
  title: siteConfig.name,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          'min-h-[100dvh] bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <Providers>
          <div className="container flex min-h-[100dvh] flex-row px-0">
            <div className="hidden h-[100dvh] justify-between border-r border-r-border p-4 md:flex md:w-[260px] md:shrink-0 md:flex-col">
              <MainNav />
            </div>
            <main className="max-w-[100vw] flex-1">
              <div className="flex h-16 items-center justify-between border-b border-b-border p-4 md:hidden">
                <MobileNav />
                <Image src="/logo.svg" width={105} height={32} alt="logo" className='ml-12' />
                <div className="flex space-x-6">
                  <MobileConnectWallet />
                  <MobileBetSlip />
                </div>
              </div>
              <MobileWalletAlert />
              <div className="flex h-16 items-center justify-between border-b border-b-border pl-4">
                <h1
                  className={cn(
                    'flex-1 font-mono text-xl font-black leading-5',
                    fontMono.variable,
                  )}
                >
                  Matches
                </h1>
                <div className="flex h-full items-center">
                  <SearchBar />
                </div>
              </div>
              {children}
            </main>
            <div className="hidden border-l border-l-border md:flex md:w-[440px] md:flex-col">
              <BetSlip />
            </div>
          </div>
          <GoogleTag />
        </Providers>
      </body>
    </html>
  )
}
