// All supported networks and related contract addresses are defined here.
//
// LINK token addresses: https://docs.chain.link/resources/link-token-contracts/
// Price feeds addresses: https://docs.chain.link/data-feeds/price-feeds/addresses
// Chain IDs: https://chainlist.org/?testnets=true

require("@chainlink/env-enc").config()

const DEFAULT_VERIFICATION_BLOCK_CONFIRMATIONS = 2

const npmCommand = process.env.npm_lifecycle_event
const isTestEnvironment = npmCommand == "test" || npmCommand == "test:unit"

// Set EVM private key (required)
const PRIVATE_KEY = process.env.PRIVATE_KEY
if (!isTestEnvironment && !PRIVATE_KEY) {
  throw Error("Set the PRIVATE_KEY environment variable with your EVM wallet private key")
}

const networks = {
  ethereumSepolia: {
    url: process.env.ETHEREUM_SEPOLIA_RPC_URL || "UNSET",
    gasPrice: undefined,
    accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    verifyApiKey: process.env.ETHERSCAN_API_KEY || "UNSET",
    chainId: 11155111,
    confirmations: DEFAULT_VERIFICATION_BLOCK_CONFIRMATIONS,
    nativeCurrencySymbol: "ETH",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    linkPriceFeed: "0x42585eD362B3f1BCa95c640FdFf35Ef899212734",
    functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    functionsDonId: "fun-ethereum-sepolia-1",
  },
  optimismSepolia: {
    url: process.env.OPTIMISM_SEPOLIA_RPC_URL || "UNSET",
    gasPrice: 1_500_000, // for spikes and higher L2 prices.
    accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    verifyApiKey: process.env.OP_ETHERSCAN_API_KEY || "UNSET",
    chainId: 11155420,
    confirmations: DEFAULT_VERIFICATION_BLOCK_CONFIRMATIONS,
    nativeCurrencySymbol: "ETH",
    linkToken: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
    linkPriceFeed: "0x98EeB02BC20c5e7079983e8F0D0D839dFc8F74fA", // LINK/ETH
    functionsRouter: "0xC17094E3A1348E5C7544D4fF8A36c28f2C6AAE28",
    functionsDonId: "fun-optimism-sepolia-1",
    ccipRouter: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
    ccipChainSelector: "5224473277236331295",
    ccipTestToken: "0x8aF4204e30565DF93352fE8E1De78925F6664dA7",
    uniswapV3Router: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    weth9: "0x4200000000000000000000000000000000000006",
    fundAmount: "1", // 1 LINK
  },
  avalancheFuji: {
    url: process.env.AVALANCHE_FUJI_RPC_URL || "UNSET",
    gasPrice: undefined,
    accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    verifyApiKey: process.env.SNOWTRACE_API_KEY || "UNSET",
    chainId: 43113,
    confirmations: 2 * DEFAULT_VERIFICATION_BLOCK_CONFIRMATIONS,
    nativeCurrencySymbol: "AVAX",
    linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
    linkPriceFeed: "0x79c91fd4F8b3DaBEe17d286EB11cEE4D83521775", // LINK/AVAX
    functionsRouter: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
    functionsDonId: "fun-avalanche-fuji-1",
    ccipRouter: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
    ccipChainSelector: "14767482510784806043",
    ccipTestToken: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4",
    uniswapV3Router: "0x6EE6e170636Aee203a4079498361936984ea64B3",
    weth9: "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
    fundAmount: "1", // 1 LINK
  },
}

module.exports = {
  networks,
}
