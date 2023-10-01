'use client'

import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import blockies from 'ethereum-blockies'
import { Button } from '@/components/ui/button'

import Caret from '../../public/caret.svg'

const ConnectWallet = () => {
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
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90"
                  >
                    Connect Wallet
                  </Button>
                )
              }
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    className="w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90"
                  >
                    Wrong network
                  </Button>
                )
              }
              return (
                <Button
                  onClick={openAccountModal}
                  className="w-full justify-between px-6 py-3 text-sm font-bold leading-4 text-foreground"
                >
                  <span>{account.displayBalance}</span>
                  <div className="flex items-center space-x-[8px]">
                    <span>
                      {account.ensName ? account.ensName : account.displayName}
                    </span>
                    {account.ensAvatar ? (
                      <Image
                        src={account.ensAvatar}
                        width={18}
                        height={18}
                        alt="blockie"
                        className="rounded"
                      />
                    ) : (
                      <Image
                        src={blockies
                          .create({ seed: account.address })
                          .toDataURL()}
                        width={18}
                        height={18}
                        alt="blockie"
                        className="rounded"
                      />
                    )}
                    <Caret />
                  </div>
                </Button>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export default ConnectWallet
