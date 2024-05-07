'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import Image from 'next/image'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import ClaimButton from '@/components/claim-button'
import { contractAddress } from '@/config/contract'
import {
  useSportsPredictionGameCalculateWinnings,
  useSportsPredictionGameGetGame,
  useSportsPredictionGameIsPredictionCorrect,
} from '@/generated'
import { Game, Winner, PredictionResponse } from '@/types'

export default function BetCard({
  prediction,
  games,
}: {
  prediction: PredictionResponse
  games: Game[]
}) {
  const { address } = useAccount()
  const [transferInProgress, setTransferInProgress] = useState(false)
  const { data: gameData } = useSportsPredictionGameGetGame({
    address: contractAddress,
    args: [prediction.gameId],
  })
  const { data: isPredictionCorrect } =
    useSportsPredictionGameIsPredictionCorrect({
      address: contractAddress,
      args: [address!, prediction.gameId, 0],
    })
  const { data: calculatedWinnings } = useSportsPredictionGameCalculateWinnings(
    {
      address: contractAddress,
      args: [prediction.gameId, prediction.amount, prediction.result],
    },
  )

  const game = games.find((g) => g.id === Number(gameData?.externalId))
  const predictedWinner = prediction.result === 1 ? Winner.Home : Winner.Away
  const isDrawResult = gameData?.result === 0

  const txHash = prediction.claimed
    ? localStorage.getItem(`claim-${prediction.gameId}`)
    : localStorage.getItem(
        `prediction-${prediction.gameId}-${prediction.index}`,
      )

  const transferMsgId =
    prediction.claimed && localStorage.getItem(`transfer-${prediction.gameId}`)

  return (
    <div className="mb-8">
      {gameData && game ? (
        <>
          <div className="mb-2 w-full rounded-[8px] bg-card p-6">
            <div className="flex w-full items-center space-x-[12px]">
              {gameData?.resolved && isPredictionCorrect ? (
                <Image
                  src="/winner-cup.svg"
                  width={35}
                  height={40}
                  alt="winner-cup"
                />
              ) : null}
              <div className="w-full">
                <div className="mb-2 flex items-center justify-between font-[450] leading-4">
                  <div className="mb-2 flex items-center space-x-[4px]">
                    <Image
                      src={game.teams[predictedWinner].logo ?? '/na.webp'}
                      width={16}
                      height={16}
                      className="max-h-[16px] max-w-[16px] object-contain"
                      alt={game.teams[predictedWinner].name ?? 'team-logo'}
                    />
                    <p>{`${game.teams[predictedWinner].name} ${
                      gameData.resolved ? '' : 'Wins'
                    }${
                      gameData.resolved && isDrawResult
                        ? 'Tied'
                        : gameData.resolved && isPredictionCorrect
                        ? 'Won'
                        : gameData.resolved && !isPredictionCorrect
                        ? 'Lost'
                        : ''
                    }`}</p>
                  </div>
                  {gameData.resolved && isDrawResult ? (
                    <div className="flex items-center">
                      <p>{`${formatEther(
                        prediction.amount ?? BigInt(0),
                      )} ETH`}</p>
                    </div>
                  ) : gameData.resolved && isPredictionCorrect ? (
                    <div className="flex items-center">
                      <Image
                        src="/arrow-price-up.svg"
                        width={16}
                        height={16}
                        alt="price-up"
                      />
                      <p>{`+${formatEther(
                        calculatedWinnings ?? BigInt(0),
                      )} ETH`}</p>
                    </div>
                  ) : gameData.resolved && !isPredictionCorrect ? (
                    <div className="flex items-center">
                      <Image
                        src="/arrow-price-down.svg"
                        width={16}
                        height={16}
                        alt="price-down"
                      />
                      <p>{`-${formatEther(
                        prediction.amount ?? BigInt(0),
                      )} ETH`}</p>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Image
                        src="/arrow-price-up.svg"
                        width={16}
                        height={16}
                        alt="price-up"
                      />
                      <p>{`+${formatEther(
                        calculatedWinnings ?? BigInt(0),
                      )} ETH`}</p>
                    </div>
                  )}
                </div>
                <p className="text-[12px] leading-4 text-secondary-foreground">
                  {`${game.teams.home.name} vs ${
                    game.teams.away.name
                  }, ${format(game.date, 'eeee, MMMM d')}`}
                </p>
              </div>
            </div>
          </div>
          {gameData.resolved ? (
            ((isPredictionCorrect || isDrawResult) && !prediction.claimed) ||
            transferInProgress ? (
              <ClaimButton
                calculatedWinnings={calculatedWinnings ?? BigInt(0)}
                gameId={prediction.gameId}
                onTransfer={setTransferInProgress}
              />
            ) : null
          ) : (
            <a
              href={`https://twitter.com/intent/tweet?text=I%20just%20predicted%20${game.teams[predictedWinner].name}%20will%20win%20in%20the%20${game.teams.home.name}-vs-${game.teams.away.name}%20game%20using%20%23Chainlink%20Functions!%0a&url=https://rugby-demo.app/`}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="mb-2 w-full bg-[#375BD2] text-base font-black leading-4 text-foreground hover:bg-[#375BD2]/90">
                <Image src="/x-logo.svg" alt="X" width={16} height={16} />
                <span className="ml-2">Share Prediction</span>
              </Button>
            </a>
          )}
          {txHash && (
            <a
              href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full border-2 border-border bg-background text-base font-medium leading-4 text-foreground hover:bg-background/90 hover:text-muted-foreground">
                View Etherscan
              </Button>
            </a>
          )}
          {transferMsgId && (
            <a
              href={`https://ccip.chain.link/msg/${transferMsgId}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full border-2 border-border bg-background text-base font-medium leading-4 text-foreground hover:bg-background/90 hover:text-muted-foreground">
                View CCIP Explorer
              </Button>
            </a>
          )}
        </>
      ) : null}
    </div>
  )
}
