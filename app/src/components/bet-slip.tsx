import { fetchGames } from '@/lib/fetch-data'
import BetSlipList from '@/components/bet-slip-list'
import { currentSeason, leagueIds } from '@/config/api'
import { Sport } from '@/types'

const BetSlip = async () => {
  const games = (
    await Promise.all(
      leagueIds[Sport.Rugby].map(async (leagueId) => {
        const games = await fetchGames(Sport.Rugby, leagueId, currentSeason)
        return games
      }),
    )
  ).flat()

  return (
    <>
      <BetSlipList games={games} />
    </>
  )
}

export default BetSlip
