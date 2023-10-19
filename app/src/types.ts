export enum Sport {
  Basketball = 1,
  Baseball = 2,
  Hockey = 3,
  Rugby = 4,
  Soccer = 5,
}

export type League = {
  id: number
  name: string
  country: string
  logo: string
  season?: string
}

export type LeagueResponse = League & {
  seasons: { current: boolean }[]
}

export type Game = {
  id: number
  date: Date
  timestamp: number
  timezone: string
  status: string
  teams: {
    home: {
      name: string
      logo: string
    }
    away: {
      name: string
      logo: string
    }
  }
  scores: {
    home: number
    away: number
  }
  sportId: Sport
}

export enum Winner {
  Home = 'home',
  Away = 'away',
}

export type Prediction = {
  game: Game
  predictedWinner: Winner
  wager?: number
  toWin?: number
  winner?: Winner
}

export type PredictionResponse = {
  gameId: bigint
  result: number
  amount: bigint
  claimed: boolean
  index?: number
}
