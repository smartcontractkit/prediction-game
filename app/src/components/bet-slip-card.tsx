'use client'

import Image from 'next/image'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatEther, parseEther } from 'viem'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocalStateContext } from '@/app/context'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { contractAddress, minWager } from '@/config/contract'
import { winnerToResult } from '@/config/api'
import {
  useSportsPredictionGameCalculateWinnings,
  useSportsPredictionGameGetGameId,
} from '@/generated'
import { Prediction } from '@/types'

const formSchema = z.object({
  wager: z.coerce.number().gt(0),
  toWin: z.coerce.number(),
})

export default function BetslipCard({
  prediction,
}: {
  prediction: Prediction
}) {
  const { predictions, setPredictions } = useLocalStateContext()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wager: minWager,
      toWin: 0,
    },
  })

  const wager = form.watch('wager')
  const toWin = form.watch('toWin')
  const debouncedWager = useDebounce(wager)
  const { data: gameId } = useSportsPredictionGameGetGameId({
    address: contractAddress,
    args: [BigInt(prediction.game.sportId), BigInt(prediction.game.id)],
  })

  const { isLoading } = useSportsPredictionGameCalculateWinnings({
    address: contractAddress,
    args: [
      gameId!,
      parseEther(`${debouncedWager}`),
      winnerToResult[prediction.predictedWinner],
    ],
    onError: (e) => {
      console.log(e)
      form.setValue('toWin', wager)
    },
    onSuccess: (data) => {
      form.setValue('toWin', Number(formatEther(data)))
    },
    onSettled: () => {
      const newPredictions = [...predictions]
      const index = predictions.findIndex(
        (p) => p.game.id === prediction.game.id,
      )
      newPredictions[index] = {
        ...prediction,
        wager,
        toWin,
      }
      setPredictions(newPredictions)
    },
  })

  return (
    <div className="mb-4 flex w-full items-start space-x-[24px] rounded-[8px] border-l-[12px] border-l-[#2FB96C] bg-card py-6 pl-3 pr-4">
      <button
        onClick={() => {
          const index = predictions.findIndex(
            (p) => p.game.id === prediction.game.id,
          )
          setPredictions([
            ...predictions.slice(0, index),
            ...predictions.slice(index + 1),
          ])
        }}
      >
        <Image src="/bin.svg" width={16} height={16} alt="bin" />
      </button>
      <div>
        <div className="mb-2 flex items-center space-x-[4px]">
          <Image
            src={
              prediction.game.teams[prediction.predictedWinner].logo ??
              '/na.webp'
            }
            width={16}
            height={16}
            className="max-h-[16px] max-w-[16px] object-contain"
            alt={
              prediction.game.teams[prediction.predictedWinner].name ??
              'team-logo'
            }
          />
          <p className="font-[450] leading-4">{`${
            prediction.game.teams[prediction.predictedWinner].name
          } Wins`}</p>
        </div>
        <p className="text-[12px] leading-4 text-secondary-foreground">
          {`${prediction.game.teams.home.name} vs ${
            prediction.game.teams.away.name
          }, ${format(prediction.game.date, 'eeee, MMMM d')}`}
        </p>
        <Form {...form}>
          <form className="grid w-full grid-flow-col gap-4 md:grid-flow-col md:gap-2">
            <div>
              <span className="mb-2 text-[14px] leading-4">Wager</span>
              <FormField
                control={form.control}
                name="wager"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex space-x-[8px] rounded-[8px] bg-secondary px-4 py-3">
                        <Image
                          src="/optimism.svg"
                          width={16}
                          height={16}
                          alt="optimism"
                        />
                        <Input
                          disabled={isLoading}
                          type="number"
                          className="h-auto rounded-none border-0 p-0 [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          {...field}
                          onChange={(e) => {
                            if (Number(e.target.value) < 0) {
                              return
                            }
                            field.onChange(e)
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <span className="mb-2 text-[14px] leading-4">To Win</span>
              <FormField
                control={form.control}
                name="toWin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex space-x-[8px] rounded-[8px] bg-secondary px-4 py-3">
                        <Image
                          src="/optimism.svg"
                          width={16}
                          height={16}
                          alt="optimism"
                        />
                        <Input
                          disabled
                          type="number"
                          className="h-auto rounded-none border-0 p-0 [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-default disabled:opacity-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
