const SportType = {
  Basketball: 1,
  Baseball: 2,
  Hockey: 3,
  Rugby: 4,
  Soccer: 5,
}

const Result = {
  None: 0,
  Home: 1,
  Away: 2,
}

const sportId = Number(args[0])
const gameId = args[1]

if (secrets.apiKey == "") {
  throw Error(
    "API_KEY environment variable not set for Sports API. Get a free key from https://dashboard.api-football.com/register"
  )
}
if (Object.values(SportType).indexOf(sportId) == -1) {
  throw Error("Invalid sportId")
}
if (gameId == "" || gameId == "0") {
  throw Error("Invalid gameId")
}

const baseUrls = {
  [SportType.Basketball]: "https://v1.basketball.api-sports.io",
  [SportType.Baseball]: "https://v1.baseball.api-sports.io",
  [SportType.Hockey]: "https://v1.hockey.api-sports.io",
  [SportType.Rugby]: "https://v1.rugby.api-sports.io",
  [SportType.Soccer]: "https://v3.football.api-sports.io",
}

const gamesPaths = {
  [SportType.Basketball]: "/games",
  [SportType.Baseball]: "/games",
  [SportType.Hockey]: "/games",
  [SportType.Rugby]: "/games",
  [SportType.Soccer]: "/fixtures",
}

const fetchSportData = async (sport, path, params) => {
  const response = await Functions.makeHttpRequest({
    url: `${baseUrls[sport]}${path}?${params}`,
    headers: { "x-apisports-key": secrets.apiKey },
  })
  if (response.status !== 200) {
    throw new Error(`Status ${response.status}`)
  }
  if (Object.keys(response.data.errors).length > 0) {
    throw new Error("API error")
  }
  if (response.data.results === 0) {
    throw new Error(`Game ${gameId} not found`)
  }
  return response.data.response[0]
}

const getGameResult = async (sport, gameId) => {
  const data = await fetchSportData(sport, gamesPaths[sport], `id=${gameId}`)
  const status = getGameStatus(sport, data)
  if (status == "POST" || status == "CANC" || status == "INTR" || status == "ABD") {
    return Functions.encodeUint256(Result.None)
  }
  if (status != "FT") {
    throw new Error("Game not finished")
  }
  const winner = getGameWinner(sport, data)
  return Functions.encodeUint256(winner)
}

const getGameStatus = (sport, data) => {
  if (sport == SportType.Soccer) {
    return data.fixture.status.short
  } else {
    return data.status.short
  }
}

const getGameWinner = (sport, data) => {
  switch (sport) {
    case SportType.Basketball:
    case SportType.Baseball:
      return data.scores.home.total > data.scores.away.total ? Result.Home : Result.Away
    case SportType.Hockey:
    case SportType.Rugby:
      return data.scores.home == data.scores.away
        ? Result.None
        : data.scores.home > data.scores.away
        ? Result.Home
        : Result.Away
    case SportType.Soccer:
      return data.goals.home == data.goals.away
        ? Result.None
        : data.goals.home > data.goals.away
        ? Result.Home
        : Result.Away
    default:
      throw new Error(`Sport ${sport} not supported`)
  }
}

return getGameResult(sportId, gameId)
