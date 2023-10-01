'use client'

import Image from 'next/image'
import { useAccount, useBalance } from 'wagmi'

const UserBalance = () => {
  const { address } = useAccount()
  const { data } = useBalance({ address })

  return (
    <div className="font-bold">
      {address ? (
        <div className="flex items-center space-x-[4px]">
          <Image src="/matic.svg" width={16} height={16} alt="matic" />
          <span className="text-xs">{`${data?.formatted.slice(0, 4)} ${
            data?.symbol
          }`}</span>
        </div>
      ) : (
        <p>Connect to play!</p>
      )}
    </div>
  )
}

export default UserBalance
