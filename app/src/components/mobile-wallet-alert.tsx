'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { useLocalStateContext } from '@/app/context'

export default function MobileWalletAlert() {
  const [open, setOpen] = useState(true)
  const { isConnected } = useAccount()
  const { predictions } = useLocalStateContext()

  if (isConnected || !predictions.length) return null

  return (
    open && (
      <div className="flex justify-between bg-alert rounded-[8px] text-lg font-medium text-[#252E42] p-4 mx-4 my-2 md:hidden">
        <div className="w-full text-center">
          To place a prediction, connect wallet
        </div>
        <Image
          src="./close-dark.svg"
          width={16}
          height={16}
          alt="close"
          className="cursor-pointer"
          onClick={() => {
            setOpen(false)
          }}
        />
      </div>
    )
  )
}
