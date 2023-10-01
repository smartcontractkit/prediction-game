'use client'

import * as React from 'react'
import Image from 'next/image'
import { WagmiConfig } from 'wagmi'
import blockies from 'ethereum-blockies'
import {
  AvatarComponent,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { chains, config } from '@/wagmi'
import { LocalStateContextProvider } from '@/app/context'

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    <Image
      src={ensImage}
      width={size}
      height={size}
      alt="ens-avatar"
      className="rounded"
    />
  ) : (
    <Image
      src={blockies.create({ seed: address }).toDataURL()}
      width={size}
      height={size}
      alt="blockie"
      className="rounded"
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider
        chains={chains}
        avatar={CustomAvatar}
        theme={darkTheme({
          accentColor: '#375BD2',
          accentColorForeground: '#FFFFFF',
        })}
        modalSize="compact"
      >
        <LocalStateContextProvider>
          {mounted && children}
        </LocalStateContextProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
