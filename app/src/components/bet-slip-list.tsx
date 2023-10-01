'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useLocalStateContext } from '@/app/context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertTitle } from '@/components/ui/alert'
import ConnectWallet from '@/components/connect-wallet'
import BetslipCard from '@/components/bet-slip-card'
import BetCard from '@/components/bet-card'
import PlaceBetButton from '@/components/place-bet-button'
import { cn } from '@/lib/utils'
import { contractAddress } from '@/config/contract'
import {
  useSportsPredictionGameGetActivePredictions,
  useSportsPredictionGameGetPastPredictions,
} from '@/generated'
import { Game, PredictionResponse } from '@/types'

function addIndexToPredictions(
  predictions: readonly PredictionResponse[] | undefined,
) {
  const idIndicesMap: Record<string, number> = {}
  return predictions?.map((prediction) => {
    const id = prediction.gameId.toString()
    if (idIndicesMap[id] === undefined) {
      idIndicesMap[id] = 0
    }
    const newItem = { ...prediction, index: idIndicesMap[id] }
    idIndicesMap[id]++
    return newItem
  })
}

export default function BetSlipList({ games }: { games: Game[] }) {
  const { address, isConnected } = useAccount()
  const {
    predictions,
    error: predictionsError,
    tab,
    setTab,
  } = useLocalStateContext()

  const onTabChange = (value: string) => {
    setTab(value)
  }
  const { data: activePredictionsData } =
    useSportsPredictionGameGetActivePredictions({
      address: contractAddress,
      args: [address!],
      onError: (err) => console.error(err),
      watch: true,
    })
  const activePredictions = addIndexToPredictions(activePredictionsData)

  const { data: pastPredictionsData } =
    useSportsPredictionGameGetPastPredictions({
      address: contractAddress,
      args: [address!],
      watch: true,
    })
  const pastPredictions = addIndexToPredictions(pastPredictionsData)

  const arePredictionsEmpty =
    (!activePredictions && !pastPredictions) ||
    (activePredictions?.length === 0 && pastPredictions?.length === 0)

  return (
    <>
      <Tabs value={tab} onValueChange={onTabChange} className="flex-1">
        <TabsList className="h-16 w-full space-x-3 rounded-none border-b border-b-border bg-background px-4 py-3">
          <TabsTrigger
            value="betslip"
            className="flex-1 py-3 text-[16px] font-black leading-[16px] hover:text-primary-foreground data-[state=active]:rounded-[8px] data-[state=active]:bg-[#375BD2]"
          >
            Predictions Slip
          </TabsTrigger>
          <TabsTrigger
            value="my-bets"
            className="flex-1 py-3 text-[16px] font-black leading-[16px] hover:text-primary-foreground data-[state=active]:rounded-[8px] data-[state=active]:bg-[#375BD2]"
          >
            My Predictions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="betslip" className="flex flex-col items-center">
          {predictionsError && (
            <div className="w-full px-4">
              <Alert
                variant="destructive"
                className="my-4 flex items-center space-x-4 border-0 bg-[#FCCDCD] text-[#DE2624]"
              >
                <Image
                  src="/alert-diamond.svg"
                  width={24}
                  height={24}
                  alt="alert"
                />
                <AlertTitle>{`Error: ${predictionsError}`}</AlertTitle>
              </Alert>
            </div>
          )}
          {predictions.length > 0 ? (
            <div className="w-full px-4">
              <ScrollArea
                className={cn(
                  'w-full',
                  predictionsError
                    ? 'h-[calc(100dvh-440px)] md:h-[calc(100vh-372px)]'
                    : 'h-[calc(100dvh-240px)] md:h-[calc(100vh-172px)]',
                )}
              >
                {predictions.map((prediction) => (
                  <BetslipCard
                    key={prediction.game.id}
                    prediction={prediction}
                  />
                ))}
                {isConnected ? <PlaceBetButton setTab={setTab} /> : null}
              </ScrollArea>
            </div>
          ) : (
            <div
              className={cn(
                "flex w-full	flex-col items-center	justify-center bg-[url('/empty-bg.svg')] bg-center bg-no-repeat",
                predictionsError
                  ? 'h-[calc(100dvh-440px)] md:h-[calc(100vh-372px)]'
                  : 'h-[calc(100dvh-240px)] md:h-[calc(100vh-172px)]',
              )}
            >
              <Image
                src="/rugby-man.svg"
                width={150}
                height={204}
                alt="empty-bets"
                className="mb-10"
              />
              <p className="font-bold">Prediction Slip is empty</p>
              <p className="mt-6 w-[230px] text-center text-base font-[450] text-secondary-foreground">
                To add a Prediction to your
                <br />
                prediction slip, please select a<br />
                prediction from the list.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="my-bets" className="flex flex-col items-center ">
          {arePredictionsEmpty ? (
            <div className="flex h-[calc(100dvh-240px)] w-full flex-col	items-center justify-center	bg-[url('/empty-bg.svg')] bg-center bg-no-repeat md:h-[calc(100vh-172px)]">
              <Image
                src="/rugby-man.svg"
                width={150}
                height={204}
                alt="empty-bets"
                className="mb-10"
              />
              <p className="font-bold">No predictions placed...</p>
              <p className="mt-6 w-[230px] text-center text-base font-[450] text-secondary-foreground">
                Once you add a prediction via the predictions slip tab, it will
                show up here.
              </p>
            </div>
          ) : (
            <div className="w-full px-4">
              <ScrollArea className="h-[calc(100dvh-240px)] w-full md:h-[calc(100vh-172px)]">
                <div className="mb-6 font-[450] leading-4">
                  Predictions in Progress
                </div>
                {activePredictions?.map((prediction, i) => (
                  <BetCard key={i} prediction={prediction} games={games} />
                ))}
                <div className="mb-6 font-[450] leading-4">
                  Completed Predictions
                </div>
                {pastPredictions?.map((prediction, i) => (
                  <BetCard key={i} prediction={prediction} games={games} />
                ))}
              </ScrollArea>
            </div>
          )}
        </TabsContent>
      </Tabs>
      <div className="absolute inset-x-0 bottom-0 p-6 md:static">
        <ConnectWallet />
      </div>
    </>
  )
}
