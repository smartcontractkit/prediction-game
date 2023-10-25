import { League, Winner } from '@/types'

export const liveGameStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'PT']

export const currentGameStatuses = ['NS', ...liveGameStatuses]

export const currentSeason = new Date().getFullYear()

export const leaguesCountLimit = 5

export const winnerToResult = {
  [Winner.Home]: 1,
  [Winner.Away]: 2,
}

export const leaguesData: {
  [key: number]: League
} = {
  69: {
    id: 69,
    name: 'World Cup',
    country: 'World',
    logo: '/world-cup-logo.svg',
  },
}
