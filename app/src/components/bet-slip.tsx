import { fetchGames } from '@/lib/fetch-data'
import BetSlipList from '@/components/bet-slip-list'
import { currentSeason } from '@/config/api'
import { Sport } from '@/types'
import { getLeaguesIds } from '@/lib/server-context'

const BetSlip = async () => {
  const leagueIds = getLeaguesIds()
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
