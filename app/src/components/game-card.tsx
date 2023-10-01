import Image from 'next/image'
import { format } from 'date-fns'
import PredictButton from '@/components/predict-button'
import { liveGameStatuses } from '@/config/api'
import { Game, Winner } from '@/types'

export default function GameCard({ game }: { game: Game }) {
  const isLive = liveGameStatuses.includes(game.status)
  return (
    <div className="mx-4 mb-2 rounded-[8px] bg-card p-4">
      <div className="flex items-center justify-between">
        <Image
          src={game.teams.home.logo}
          width={24}
          height={24}
          className="max-h-[24px] max-w-[24px] object-contain"
          alt={game.teams.home.name}
        />
        <p className="ml-2 truncate font-[450] md:flex-1">
          {game.teams.home.name}
        </p>
        <div className="flex items-center">
          <div className="mx-4 rounded bg-primary px-[10px] py-1">
            {game.scores.home ?? '0'}
          </div>
          <PredictButton game={game} predictedWinner={Winner.Home} />
        </div>
      </div>
      <div className="my-3 flex items-center">
        <span className="mx-3 text-[8px] text-secondary-foreground">@</span>
        <div className="w-[calc(100%-189px)] border-b border-b-primary" />
      </div>
      <div className="flex items-center justify-between">
        <Image
          src={game.teams.away.logo}
          width={24}
          height={24}
          className="max-h-[24px] max-w-[24px] object-contain"
          alt={game.teams.away.name}
        />
        <p className="ml-2 truncate font-[450] md:flex-1">
          {game.teams.away.name}
        </p>
        <div className="flex items-center">
          <div className="mx-4 rounded bg-primary px-[10px] py-1">
            {game.scores.away ?? '0'}
          </div>
          <PredictButton game={game} predictedWinner={Winner.Away} />
        </div>
      </div>
      {isLive && (
        <Image
          src="/live.svg"
          className="pt-1"
          alt="Live game"
          width={32}
          height={16}
        />
      )}
      {!isLive && (
        <p className="mt-1 text-[12px] font-[450] leading-4 text-secondary-foreground">
          {`${format(game.date, 'eeee, MMMM d @ h:mm aaa z')}`}
        </p>
      )}
    </div>
  )
}
