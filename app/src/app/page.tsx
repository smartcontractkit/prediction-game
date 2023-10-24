import {
  fetchLeagueDetails,
  fetchCurrentGames,
  fetchTestGames,
  fetchCurrentLeaguesIds,
} from '@/lib/fetch-data'
import { ScrollArea } from '@/components/ui/scroll-area'
import LeagueSection from '@/components/league-section'
import GameCard from '@/components/game-card'
import { leaguesData, currentSeason } from '@/config/api'
import { Sport, Game } from '@/types'
import { setLeaguesIds } from '@/lib/server-context'

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const currentLeaguesIds = await fetchCurrentLeaguesIds(Sport.Rugby)
  setLeaguesIds(currentLeaguesIds)
  const data = await Promise.all(
    currentLeaguesIds.map(async (leagueId) => {
      const league = leaguesData[leagueId]
        ? leaguesData[leagueId]
        : await fetchLeagueDetails(Sport.Rugby, leagueId)
      let allGames: Game[] = await fetchCurrentGames(Sport.Rugby, leagueId)
      // todo: remove after implementing dummy games
      if (searchParams.mode === 'test') {
        const testGames = await fetchTestGames(
          Sport.Rugby,
          leagueId,
          currentSeason,
        )
        allGames = [...testGames, ...allGames]
      }
      const games = searchParams.search
        ? allGames.filter(
            ({ teams }) =>
              teams.home.name
                .toLowerCase()
                .includes((searchParams.search as string).toLowerCase()) ||
              teams.away.name
                .toLowerCase()
                .includes((searchParams.search as string).toLowerCase()),
          )
        : allGames
      return { league, games }
    }),
  )

  return (
    <ScrollArea className="h-[calc(100vh-64px)]">
      {data.map(({ league, games }) => (
        <>
          {games.length > 0 ? (
            <LeagueSection key={league.id} league={league}>
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </LeagueSection>
          ) : null}
        </>
      ))}
    </ScrollArea>
  )
}
