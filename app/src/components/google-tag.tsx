'use client'

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import TagManager from 'react-gtm-module'

const gtmId = process.env.NEXT_PUBLIC_GTM_ID

export default function GoogleTag() {
  useAccount({
    onConnect({ connector }) {
      if (gtmId) {
        TagManager.dataLayer({
          dataLayer: {
            event: 'wallet_connected',
            wallet: connector?.id || 'unknown',
          },
        })
      }
    },
  })

  useEffect(() => {
    if (gtmId) {
      TagManager.initialize({ gtmId })
    }
  }, [])

  return <></>
}
