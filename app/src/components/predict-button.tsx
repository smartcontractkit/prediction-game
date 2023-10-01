'use client'

import { useLocalStateContext } from '@/app/context'
import { Button } from '@/components/ui/button'
import { Game, Winner } from '@/types'

export default function PredictButton({
  game,
  predictedWinner,
}: {
  game: Game
  predictedWinner: Winner
}) {
  const { predictions, setPredictions, setTab } = useLocalStateContext()
  const predictedGame = predictions.find((p) => p.game.id === game.id)

  if (!predictedGame) {
    return (
      <Button
        onClick={() => {
          setPredictions([...predictions, { game, predictedWinner }])
          setTab('betslip')
        }}
        className="w-[157px] shrink-0 text-[12px] font-bold hover:bg-[#232833] hover:text-muted-foreground"
      >
        Predict to Win
      </Button>
    )
  }

  if (predictedWinner === predictedGame.predictedWinner) {
    return (
      <Button
        disabled
        className="w-[157px] shrink-0 text-[12px] font-bold text-foreground disabled:bg-[#1D804C] disabled:opacity-100"
      >
        Predicted to Win
      </Button>
    )
  }

  if (predictedWinner !== predictedGame.predictedWinner) {
    return (
      <Button
        disabled
        className="w-[157px] shrink-0 text-[12px] font-bold text-foreground disabled:bg-[#BC4342] disabled:opacity-100"
      >
        Predicted to Lose
      </Button>
    )
  }
}
