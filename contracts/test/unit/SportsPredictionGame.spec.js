const { ethers } = require("hardhat")
const { expect } = require("chai")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

const Result = {
  None: 0,
  Home: 1,
  Away: 2,
}

describe("SportsPredictionGame Unit Tests", async function () {
  const sportId = 1
  const externalId = 1
  const gameId = "340282366920938463463374607431768211457"
  const result = 1
  const wager = ethers.utils.parseEther("0.01")
  const startTimeDelay = 100
  const resolveDelay = 2 * 60 * 60
  const delay = startTimeDelay + resolveDelay
  const destinationChainSelector = 1

  let owner
  let users
  let startTime

  let sportsPredictionGame
  let mockFunctionsOracle
  let mockRouterClient
  let mockSwapRouter
  let linkToken
  let exchangeToken
  let sportsPredictionGameFactory
  let mockFunctionsOracleFactory
  let mockRouterClientFactory
  let mockSwapRouterFactory
  let linkTokenFactory
  let erc20MinterFactory

  before(async function () {
    ;[owner, ...users] = await ethers.getSigners()

    sportsPredictionGameFactory = await ethers.getContractFactory("SportsPredictionGame")
    mockFunctionsOracleFactory = await ethers.getContractFactory("MockFunctionsOracle")
    mockRouterClientFactory = await ethers.getContractFactory("MockRouterClient")
    mockSwapRouterFactory = await ethers.getContractFactory("MockSwapRouter")
    linkTokenFactory = await ethers.getContractFactory("LinkToken")
    erc20MinterFactory = await ethers.getContractFactory("ERC20PresetMinterPauser")
  })

  beforeEach(async function () {
    mockFunctionsOracle = await mockFunctionsOracleFactory.deploy()
    mockRouterClient = await mockRouterClientFactory.deploy()
    mockSwapRouter = await mockSwapRouterFactory.deploy()
    linkToken = await linkTokenFactory.deploy()
    exchangeToken = await erc20MinterFactory.deploy("Exchange Token", "TEST")

    sportsPredictionGame = await sportsPredictionGameFactory.deploy({
      oracle: mockFunctionsOracle.address,
      ccipRouter: mockRouterClient.address,
      link: linkToken.address,
      weth9Token: ethers.constants.AddressZero,
      exchangeToken: exchangeToken.address,
      uniswapV3Router: mockSwapRouter.address,
      subscriptionId: 123,
      destinationChainSelector,
      gasLimit: 3000000,
      secrets: ethers.constants.HashZero,
      source: "...",
    })

    await linkToken.transfer(sportsPredictionGame.address, ethers.utils.parseEther("100"))
    await exchangeToken.mint(owner.address, ethers.utils.parseEther("100"))

    const fakeReceiver = ethers.Wallet.createRandom()
    await sportsPredictionGame.setDestinationContractReceiver(fakeReceiver.address)

    latestBlockTime = await time.latest()
    startTime = latestBlockTime + startTimeDelay
  })

  describe("Register", () => {
    it("should not be able to register game twice", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, { value: wager })
      ).to.be.revertedWithCustomError(sportsPredictionGame, "GameAlreadyRegistered")
    })

    it("should not be able to register game with start time in the past", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, 0, result, { value: wager })
      ).to.be.revertedWithCustomError(sportsPredictionGame, "TimestampInPast")
    })

    it("should register game", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })

      const game = await sportsPredictionGame.getGame(gameId)
      expect(game.sportId).to.equal(sportId)
      expect(game.externalId).to.equal(externalId)
      expect(game.timestamp).to.equal(startTime)
      expect(game.homeWagerAmount).to.equal(wager)
      expect(game.awayWagerAmount).to.equal(0)
      expect(game.resolved).to.equal(false)
      expect(game.result).to.equal(0)
    })

    it("should add game to active games", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      const activeGames = await sportsPredictionGame.getActiveGames()
      expect(activeGames.length).to.equal(1)
    })

    it("should emit GameRegistered event", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, { value: wager })
      ).to.emit(sportsPredictionGame, "GameRegistered")
    })
  })

  describe("Predict", () => {
    it("should not be able to predict on not registered game", async () => {
      await expect(sportsPredictionGame.predict(0, Result.Home, { value: wager })).to.be.revertedWithCustomError(
        sportsPredictionGame,
        "GameNotRegistered"
      )
    })

    it("should not be able to predict on resolved game", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      await expect(sportsPredictionGame.predict(gameId, Result.Home, { value: wager })).to.be.revertedWithCustomError(
        sportsPredictionGame,
        "GameIsResolved"
      )
    })

    it("should not be able to predict game that already started", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await time.increase(100)
      await expect(sportsPredictionGame.predict(gameId, result, { value: wager })).to.be.revertedWithCustomError(
        sportsPredictionGame,
        "GameAlreadyStarted"
      )
    })

    it("should revert if Result is not Home or Away", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, Result.None, { value: wager })
      ).to.be.revertedWithCustomError(sportsPredictionGame, "InvalidResult")
    })

    it("should revert if wager is 0", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, { value: 0 })
      ).to.be.revertedWithCustomError(sportsPredictionGame, "InsufficientValue")
    })

    it("should revert if wager is less than minimum", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, { value: 1 })
      ).to.be.revertedWithCustomError(sportsPredictionGame, "InsufficientValue")
    })

    it("should revert if wager is more than maximum", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
          value: wager.mul(2),
        })
      ).to.be.revertedWithCustomError(sportsPredictionGame, "ValueTooHigh")
    })

    it("should register prediction", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })

      const userPredictions = await sportsPredictionGame.getActivePredictions(owner.address)
      expect(userPredictions.length).to.equal(1)
      expect(userPredictions[0].result).to.equal(result)
      expect(userPredictions[0].amount).to.equal(wager)
      expect(userPredictions[0].claimed).to.equal(false)

      const game = await sportsPredictionGame.getGame(gameId)
      expect(game.homeWagerAmount).to.equal(wager)
    })

    it("should get past predictions when game is resolved", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      const pastPredictions = await sportsPredictionGame.getPastPredictions(owner.address)
      expect(pastPredictions.length).to.equal(1)
      expect(pastPredictions[0].result).to.equal(result)
      expect(pastPredictions[0].amount).to.equal(wager)
      expect(pastPredictions[0].claimed).to.equal(false)
    })

    it("should check if prediction is correct", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await sportsPredictionGame.predict(gameId, Result.Away, { value: wager })

      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      expect(await sportsPredictionGame.isPredictionCorrect(owner.address, gameId, 0)).to.equal(true)
      expect(await sportsPredictionGame.isPredictionCorrect(owner.address, gameId, 1)).to.equal(false)
    })

    it("should emit PredictionRegistered event", async () => {
      await expect(
        sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, { value: wager })
      ).to.emit(sportsPredictionGame, "Predicted")
    })
  })

  describe("Resolve", () => {
    it("should not be able to resolve before game finished", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })

      await expect(
        resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, startTimeDelay)
      ).to.be.revertedWithCustomError(sportsPredictionGame, "GameNotReadyToResolve")
    })

    context("when game is resolved", () => {
      let resolveTx

      beforeEach(async () => {
        await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
          value: wager,
        })
        resolveTx = await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)
      })

      it("should update game details", async () => {
        const game = await sportsPredictionGame.getGame(gameId)
        expect(game.resolved).to.equal(true)
        expect(game.result).to.equal(result)
      })

      it("should remove game from active games", async () => {
        const activeGames = await sportsPredictionGame.getActiveGames()
        expect(activeGames.length).to.equal(0)
      })

      it("should not be able to resolve game twice", async () => {
        await expect(
          resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)
        ).to.be.revertedWithCustomError(sportsPredictionGame, "GameIsResolved")
      })

      it("should emit GameResolved event", async () => {
        await expect(resolveTx).to.emit(sportsPredictionGame, "GameResolved")
      })
    })
  })

  describe("Claim", () => {
    it("should not be able to claim winnings before game is resolved", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await expect(sportsPredictionGame.claim(gameId, false)).to.be.revertedWithCustomError(
        sportsPredictionGame,
        "GameNotResolved"
      )
    })

    it("should not be able to claim winnings if prediction is not correct", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, Result.Away, delay)

      await expect(sportsPredictionGame.claim(gameId, false)).to.be.revertedWithCustomError(
        sportsPredictionGame,
        "NothingToClaim"
      )
    })

    it("should not claim winnings twice", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      await sportsPredictionGame.claim(gameId, false)
      await expect(sportsPredictionGame.claim(gameId, false)).to.be.revertedWithCustomError(
        sportsPredictionGame,
        "NothingToClaim"
      )
    })

    it("should claim winnings if prediction is correct", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      await expect(() => sportsPredictionGame.claim(gameId, false)).to.changeEtherBalance(owner, wager)
    })

    it("should split winnings between results", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await sportsPredictionGame.connect(users[0]).predict(gameId, result, { value: wager })
      await sportsPredictionGame.connect(users[1]).predict(gameId, Result.Away, { value: wager })
      await sportsPredictionGame.connect(users[2]).predict(gameId, Result.Away, { value: wager })

      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      await expect(() => sportsPredictionGame.claim(gameId, false)).to.changeEtherBalance(owner, wager.mul(2))
      await expect(() => sportsPredictionGame.connect(users[0]).claim(gameId, false)).to.changeEtherBalance(
        users[0],
        wager.mul(2)
      )
    })

    it("should combine winnings if user has multiple predictions", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await sportsPredictionGame.predict(gameId, result, { value: wager })

      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      await expect(() => sportsPredictionGame.claim(gameId, false)).to.changeEtherBalance(owner, wager.mul(2))
    })

    it("should refund if there is no winner", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, Result.None, delay)

      await expect(() => sportsPredictionGame.claim(gameId, false)).to.changeEtherBalance(owner, wager)
    })

    it("should send request to transfer winnings cross-chain if flag is set", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      const abi = ethers.utils.defaultAbiCoder
      const params = abi.encode(["address"], [owner.address])

      await expect(sportsPredictionGame.claim(gameId, true))
        .to.emit(mockRouterClient, "ClientCCIPSend")
        .withArgs(destinationChainSelector, params)
    })

    it("should emit Claimed event", async () => {
      await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
        value: wager,
      })
      await resolveGame(sportsPredictionGame, mockFunctionsOracle, gameId, result, delay)

      await expect(sportsPredictionGame.claim(gameId, false))
        .to.emit(sportsPredictionGame, "Claimed")
        .withArgs(owner.address, gameId, wager)
    })
  })

  describe("Automation", () => {
    describe("checkUpkeep", () => {
      it("should return false if there are no active games to resolve", async () => {
        const [upkeepNeeded, performData] = await sportsPredictionGame.callStatic.checkUpkeep(ethers.constants.HashZero)

        expect(upkeepNeeded).to.equal(false)
        expect(performData).to.equal("0x")
      })

      it("should return true if there are active games to resolve", async () => {
        await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
          value: wager,
        })
        await time.increase(delay)

        const [upkeepNeeded, performData] = await sportsPredictionGame.callStatic.checkUpkeep(ethers.constants.HashZero)

        expect(upkeepNeeded).to.equal(true)
        expect(performData).to.equal(ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(gameId)), 32))
      })
    })

    describe("performUpkeep", () => {
      it("should request game result from oracle", async () => {
        await sportsPredictionGame.registerAndPredict(sportId, externalId, startTime, result, {
          value: wager,
        })
        await time.increase(delay)

        const performData = ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(gameId)), 32)

        await expect(sportsPredictionGame.performUpkeep(performData))
          .to.emit(sportsPredictionGame, "RequestedResult")
          .withArgs(sportId, externalId, ethers.constants.HashZero)
      })
    })
  })
})

async function resolveGame(gameContract, mockOracleContract, gameId, result, delay) {
  await time.increase(delay)

  const performData = ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(gameId)), 32)
  await gameContract.performUpkeep(performData)

  const client = gameContract.address
  const requestId = ethers.constants.HashZero
  const data = ethers.utils.hexZeroPad(ethers.utils.hexlify(result), 32)

  return mockOracleContract.fulfillRequest(client, requestId, data)
}
