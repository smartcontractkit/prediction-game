'use client'

import { useState, useEffect } from 'react'
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import Image from 'next/image'
import { formatEther } from 'viem'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { contractAddress } from '@/config/contract'
import {
  usePrepareSportsPredictionGameClaim,
  useSportsPredictionGameTransferRequestSentEvent,
} from '@/generated'

const ClaimButton = ({
  gameId,
  calculatedWinnings,
  onTransfer,
}: {
  gameId: bigint
  calculatedWinnings: bigint
  onTransfer: (bool: boolean) => void
}) => {
  const [isCcipInProgress, setIsCcipInProgress] = useState(false)
  const [ccipMsgId, setCcipMsgId] = useState('')
  const { config: withdrawConfig } = usePrepareSportsPredictionGameClaim({
    address: contractAddress,
    args: [gameId, false],
  })
  const { write: withdraw, data: withdrawData } =
    useContractWrite(withdrawConfig)

  const { isLoading: isLoadingWithdraw } = useWaitForTransaction({
    hash: withdrawData?.hash,
  })
  const { config: ccipConfig } = usePrepareSportsPredictionGameClaim({
    address: contractAddress,
    args: [gameId, true],
  })
  const { writeAsync: ccip, data: ccipData } = useContractWrite(ccipConfig)

  const { isLoading: isLoadingCcip } = useWaitForTransaction({
    hash: ccipData?.hash,
  })

  useSportsPredictionGameTransferRequestSentEvent({
    address: contractAddress,
    listener: (data) => {
      const ccipMsgId = data[0].args.requestId
      if (ccipMsgId) {
        setCcipMsgId(ccipMsgId)
        localStorage.setItem(`transfer-${gameId}`, ccipMsgId)
      }
    },
  })

  useEffect(() => {
    if (withdrawData?.hash) {
      localStorage.setItem(`claim-${gameId}`, withdrawData?.hash)
    }
  }, [withdrawData?.hash, gameId])

  return (
    <div className="flex space-x-2">
      <Button
        disabled={!withdraw || isLoadingWithdraw || isLoadingCcip}
        onClick={() => withdraw?.()}
        className="mb-2 w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90"
      >
        {isLoadingWithdraw ? (
          <Loader2 className="animate-spin" />
        ) : (
          <span>Withdraw</span>
        )}
      </Button>
      <Dialog onOpenChange={onTransfer}>
        <DialogTrigger asChild>
          <Button
            disabled={!ccip || isLoadingWithdraw || isLoadingCcip}
            className="mb-2 w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90"
          >
            {isLoadingCcip ? (
              <Loader2 className="animate-spin" />
            ) : (
              <span>CCIP Transfer</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[400px] bg-[#181D29] sm:max-w-[400px]">
          {isCcipInProgress ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Transfer in progress...
                </DialogTitle>
                <DialogDescription className="font-[450] text-muted-foreground">
                  We are transferring your tokens now. Check on the status of
                  your transfer via the CCIP Explorer below.
                </DialogDescription>
              </DialogHeader>
              <div className="flex w-full items-center justify-center space-x-4 py-6">
                <div className="flex h-14 w-14 items-center space-x-1 rounded-full bg-[#375BD2] p-1">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-white delay-100" />
                  <div className="h-3 w-3 animate-pulse rounded-full bg-white delay-200" />
                  <div className="h-3 w-3 animate-pulse rounded-full bg-white delay-300" />
                </div>
              </div>
              <DialogFooter>
                <div className="flex w-full flex-col space-y-2">
                  <DialogTrigger asChild>
                    <Button className="mb-2 w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90">
                      Continue
                    </Button>
                  </DialogTrigger>
                  {ccipMsgId && (
                    <a
                      href={`https://ccip.chain.link/msg/${ccipMsgId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full border-2 border-border bg-background text-base font-black leading-4 text-foreground hover:bg-background/90 hover:text-muted-foreground">
                        View on CCIP Explorer
                      </Button>
                    </a>
                  )}
                </div>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Transfer tokens via CCIP
                </DialogTitle>
                <DialogDescription className="font-[450] text-muted-foreground">
                  {`You are transferring ${formatEther(
                    calculatedWinnings,
                  )} MATIC from Polygon Mumbai to Avalanche Fuji.`}
                </DialogDescription>
              </DialogHeader>
              <div className="flex w-full items-end space-x-4">
                <div>
                  <span className="mb-4 text-[14px] leading-4">From</span>
                  <div className="flex items-center space-x-[8px] rounded-[8px] bg-primary px-4 py-3">
                    <Image
                      src="/matic.svg"
                      width={24}
                      height={24}
                      alt="matic"
                    />
                    <div className="text-sm font-[450] leading-4">{`${formatEther(
                      calculatedWinnings,
                    )} MATIC`}</div>
                  </div>
                </div>
                <Image
                  className="mb-3"
                  src="/arrow-no-bg.svg"
                  width={24}
                  height={24}
                  alt="arrow"
                />
                <div className="flex-1">
                  <span className="mb-4 text-[14px] leading-4">To</span>
                  <div className="flex items-center space-x-[8px] rounded-[8px] bg-primary px-4 py-3">
                    <Image src="/avax.svg" width={24} height={24} alt="avax" />
                    <div className="text-sm font-[450] leading-4">AVAX</div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <div className="flex w-full flex-col space-y-2">
                  <Button
                    onClick={async () => {
                      await ccip?.()
                      setIsCcipInProgress(true)
                    }}
                    className="mb-2 w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90"
                  >
                    Transfer
                  </Button>
                  <DialogTrigger asChild>
                    <Button className="w-full border-2 border-border bg-background text-base font-black leading-4 text-foreground hover:bg-background/90 hover:text-muted-foreground">
                      Cancel
                    </Button>
                  </DialogTrigger>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClaimButton
