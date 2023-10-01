import Image from 'next/image'
import { League } from '@/types'

export default function LeagueSection({
  league,
  children,
}: {
  league: League
  children: React.ReactNode
}) {
  return (
    <div className="max-w-[100vw]">
      <div className="mx-4 mb-4 mt-6 flex h-[152px] flex-col items-center justify-center rounded-[8px] bg-[url('/bg-field.png')] bg-center bg-no-repeat">
        <Image
          src={league.logo}
          width={116}
          height={116}
          className="h-[116px] w-auto"
          alt={league.name ?? 'league-logo'}
        />
      </div>
      {children}
    </div>
  )
}
