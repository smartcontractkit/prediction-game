const { ethers } = require("hardhat")
const { expect } = require("chai")
const { simulateRequest, getRequestConfig } = require("../../FunctionsSandboxLibrary")
const { generateRequest } = require("../../tasks/Functions-client/buildRequestJSON")
const { SHARED_DON_PUBLIC_KEY } = require("../../networks")
const requestConfigBase = require("../../Functions-request-config")

describe("ResultsConsumer Integration Tests", async function () {
  let mockResultsConsumer, registry, accounts, deployer

  beforeEach(async function () {
    accounts = await ethers.getSigners()
    deployer = accounts[0]

    // Deploy a mock oracle & registry contract to simulate a fulfillment
    const chainlink = await deployMockOracle()
    const { oracle, linkToken } = chainlink
    registry = chainlink.registry

    // Add the wallet initiating the request to the oracle allowlist to authorize a simulated fulfillment
    const allowlistTx = await oracle.addAuthorizedSenders([deployer.address])
    await allowlistTx.wait(1)

    // Create & fund a subscription
    const createSubscriptionTx = await registry.createSubscription()
    const createSubscriptionReceipt = await createSubscriptionTx.wait(1)
    const subscriptionId = createSubscriptionReceipt.events[0].args["subscriptionId"].toNumber()
    const juelsAmount = ethers.utils.parseUnits("10")
    await linkToken.transferAndCall(
      registry.address,
      juelsAmount,
      ethers.utils.defaultAbiCoder.encode(["uint64"], [subscriptionId])
    )

    // Generate source & secrets from the request config
    const requestConfig = getRequestConfig(requestConfigBase)
    const request = await generateRequest(requestConfig, { oracle: oracle.address, simulate: false })

    // Deploy the client contract
    const gasLimit = 300_000
    const mockResultsConsumerFactory = await ethers.getContractFactory("MockResultsConsumer")
    mockResultsConsumer = await mockResultsConsumerFactory.deploy(
      oracle.address,
      subscriptionId,
      request.source,
      request.secrets,
      gasLimit
    )
    await mockResultsConsumer.deployTransaction.wait(1)

    // Authorize the client contract to use the subscription
    await registry.addConsumer(subscriptionId, mockResultsConsumer.address)
  })

  it("should deploy mock", async function () {
    expect(mockResultsConsumer.address).to.be.properAddress
  })

  it("should request and fulfill result", async function () {
    const sportId = requestConfigBase.args[0]
    const externalId = requestConfigBase.args[1]
    const response = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)

    const requestTx = await mockResultsConsumer.requestResult(sportId, externalId)
    const requestTxReceipt = await requestTx.wait(1)
    const requestId = requestTxReceipt.events[2].args.id

    expect(requestTx).to.emit(mockResultsConsumer, "RequestedResult").withArgs(sportId, externalId, requestId)

    expect(await simulateRequestAndFulfill(registry, requestId, requestConfigBase))
      .to.emit(mockResultsConsumer, "ResultProcessed")
      .withArgs(sportId, externalId, response)
  })
})

const simulateRequestAndFulfill = async (registry, requestId, config) => {
  const requestConfig = getRequestConfig(config)
  const { success, result } = await simulateRequest(requestConfig)
  // Simulate a request fulfillment
  const accounts = await ethers.getSigners()
  const dummyTransmitter = accounts[0].address
  const dummySigners = Array(31).fill(dummyTransmitter)
  await registry.fulfillAndBill(
    requestId,
    success ? result : "0x",
    success ? "0x" : result,
    dummyTransmitter,
    dummySigners,
    4,
    100_000,
    500_000,
    {
      gasLimit: 500_000,
    }
  )
}

const deployMockOracle = async () => {
  // Deploy mocks: LINK token & LINK/ETH price feed
  const linkTokenFactory = await ethers.getContractFactory("LinkToken")
  const linkPriceFeedFactory = await ethers.getContractFactory("MockV3Aggregator")
  const linkToken = await linkTokenFactory.deploy()
  const linkPriceFeed = await linkPriceFeedFactory.deploy(0, ethers.BigNumber.from(5021530000000000))
  // Deploy proxy admin
  await upgrades.deployProxyAdmin()
  // Deploy the oracle contract
  const oracleFactory = await ethers.getContractFactory("contracts/dev/functions/FunctionsOracle.sol:FunctionsOracle")
  const oracleProxy = await upgrades.deployProxy(oracleFactory, [], {
    kind: "transparent",
  })
  await oracleProxy.deployTransaction.wait(1)
  // Set the secrets encryption public DON key in the mock oracle contract
  await oracleProxy.setDONPublicKey("0x" + SHARED_DON_PUBLIC_KEY)
  // Deploy the mock registry billing contract
  const registryFactory = await ethers.getContractFactory(
    "contracts/dev/functions/FunctionsBillingRegistry.sol:FunctionsBillingRegistry"
  )
  const registryProxy = await upgrades.deployProxy(
    registryFactory,
    [linkToken.address, linkPriceFeed.address, oracleProxy.address],
    {
      kind: "transparent",
    }
  )
  await registryProxy.deployTransaction.wait(1)
  // Set registry configuration
  const config = {
    maxGasLimit: 300_000,
    stalenessSeconds: 86_400,
    gasAfterPaymentCalculation: 39_173,
    weiPerUnitLink: ethers.BigNumber.from("5000000000000000"),
    gasOverhead: 519_719,
    requestTimeoutSeconds: 300,
  }
  await registryProxy.setConfig(
    config.maxGasLimit,
    config.stalenessSeconds,
    config.gasAfterPaymentCalculation,
    config.weiPerUnitLink,
    config.gasOverhead,
    config.requestTimeoutSeconds
  )
  // Set the current account as an authorized sender in the mock registry to allow for simulated local fulfillments
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  await registryProxy.setAuthorizedSenders([oracleProxy.address, deployer.address])
  await oracleProxy.setRegistry(registryProxy.address)
  return { oracle: oracleProxy, registry: registryProxy, linkToken }
}
