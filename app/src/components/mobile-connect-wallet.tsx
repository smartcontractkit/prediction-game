'use client'

import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const MobileConnectWallet = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              return (
                <Image
                  src="/wallet.svg"
                  width={24}
                  height={24}
                  alt="Connect Wallet"
                  onClick={
                    connected
                      ? (chain?.unsupported && openChainModal) ||
                        openAccountModal
                      : openConnectModal
                  }
                />
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export default MobileConnectWallet
