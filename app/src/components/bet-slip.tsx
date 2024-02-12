import { fetchCurrentLeagues, fetchGames } from '@/lib/fetch-data'
import BetSlipList from '@/components/bet-slip-list'
import { currentSeason } from '@/config/api'
import { Sport } from '@/types'

const BetSlip = async () => {
  const leagueIds = (await fetchCurrentLeagues(Sport.Rugby)).map((l) => l.id)
  const games = (
    await Promise.all(
      leagueIds.map(async (leagueId) => {
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
