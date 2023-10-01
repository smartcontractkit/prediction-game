const { networks } = require("../networks")
const { addClientConsumerToSubscription } = require("./Functions-billing/add")
const { getRequestConfig } = require("../FunctionsSandboxLibrary")
const { generateRequest } = require("./Functions-client/buildRequestJSON")
const path = require("path")
const process = require("process")

task("deploy-game", "Deploys the SportsPredictionGame contract")
  .addParam("subid", "Billing subscription ID used to pay for Functions requests")
  .addParam("destination", "Destination chain for winnings transfer", "avalancheFuji")
  .addOptionalParam("verify", "Set to true to verify client contract", false, types.boolean)
  .addOptionalParam(
    "gaslimit",
    "Maximum amount of gas that can be used to call fulfillRequest in the client contract",
    250000,
    types.int
  )
  .addOptionalParam(
    "simulate",
    "Flag indicating if simulation should be run before making an on-chain request",
    true,
    types.boolean
  )
  .addOptionalParam(
    "configpath",
    "Path to Functions request config file",
    `${__dirname}/../Functions-request-config.js`,
    types.string
  )
  .setAction(async (taskArgs) => {
    if (network.name === "hardhat") {
      throw Error(
        'This command cannot be used on a local hardhat chain.  Specify a valid network or simulate a SportsPredictionGame request locally with "npx hardhat functions-simulate".'
      )
    }

    if (taskArgs.gaslimit > 300000) {
      throw Error("Gas limit must be less than or equal to 300,000")
    }

    console.log(`Deploying SportsPredictionGame contract to ${network.name}`)

    console.log("\n__Compiling Contracts__")
    await run("compile")

    const destinationChain = taskArgs.destination
    const networkConfig = networks[network.name]
    const destinationChainConfig = networks[destinationChain]

    const unvalidatedRequestConfig = require(path.isAbsolute(taskArgs.configpath)
      ? taskArgs.configpath
      : path.join(process.cwd(), taskArgs.configpath))
    const requestConfig = getRequestConfig(unvalidatedRequestConfig)
    const request = await generateRequest(requestConfig, taskArgs)

    const deployParams = {
      oracle: networkConfig["functionsOracleProxy"],
      ccipRouter: networkConfig.ccipRouter,
      link: networkConfig.linkToken,
      weth9Token: networkConfig.weth9,
      exchangeToken: networkConfig.ccipTestToken,
      uniswapV3Router: networkConfig.uniswapV3Router,
      destinationChainSelector: destinationChainConfig.ccipChainSelector,
      subscriptionId: taskArgs.subid,
      gasLimit: taskArgs.gaslimit,
      secrets: request.secrets,
      source: request.source,
    }

    const gameContractFactory = await ethers.getContractFactory("SportsPredictionGame")
    const gameContract = await gameContractFactory.deploy(deployParams)

    console.log(`\SportsPredictionGame contract deployed to ${gameContract.address} on ${network.name}`)

    await addClientConsumerToSubscription(taskArgs.subid, gameContract.address)

    console.log(`\nDeploying NativeTokenReceiver contract to ${destinationChain}`)

    const destinationChainProvider = new ethers.providers.JsonRpcProvider(destinationChainConfig.url)
    const destinationChainPK = destinationChainConfig.accounts[0]
    const destinationChainWallet = new ethers.Wallet(destinationChainPK, destinationChainProvider)

    const tokenReceiverFactory = await ethers.getContractFactory("NativeTokenReceiver", destinationChainWallet)
    const tokenReceiver = await tokenReceiverFactory.deploy(
      destinationChainConfig.ccipRouter,
      destinationChainConfig.weth9,
      destinationChainConfig.ccipTestToken,
      destinationChainConfig.uniswapV3Router,
      gameContract.address,
      networkConfig.ccipChainSelector
    )

    console.log(`\NativeTokenReceiver contract deployed to ${tokenReceiver.address} on ${destinationChain}`)

    await gameContract.setDestinationContractReceiver(tokenReceiver.address)

    console.log(`\Set ${tokenReceiver.address} as the destination contract receiver`)

    const linkToken = await ethers.getContractAt("LinkTokenInterface", networkConfig.linkToken)
    await linkToken.transfer(gameContract.address, ethers.utils.parseEther(networkConfig.fundAmount))

    console.log(`\Funded game contract with ${networkConfig.fundAmount} LINK`)

    const verifyContract = taskArgs.verify

    if (verifyContract && !!networkConfig.verifyApiKey && networkConfig.verifyApiKey !== "UNSET") {
      try {
        console.log("\nVerifying contract...")
        await gameContract.deployTransaction.wait(Math.max(6 - networkConfig.confirmations, 0))
        await run("verify:verify", {
          address: gameContract.address,
          constructorArguments: [deployParams],
        })
        console.log("Contract verified")
      } catch (error) {
        if (!error.message.includes("Already Verified")) {
          console.log("Error verifying contract.  Delete the build folder and try again.")
          console.log(error)
        } else {
          console.log("Contract already verified")
        }
      }
    } else if (verifyContract) {
      console.log(
        "\nPOLYGONSCAN_API_KEY, ETHERSCAN_API_KEY or SNOWTRACE_API_KEY is missing. Skipping contract verification..."
      )
    }
  })
