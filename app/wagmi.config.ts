import { defineConfig } from '@wagmi/cli'
import { hardhat, react } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    hardhat({
      project: '../contracts',
      artifacts: '../contracts/build/artifacts',
      include: ['contracts/SportsPredictionGame.sol/**'],
    }),
    react({
      useContractRead: true,
      useContractFunctionRead: true,
    }),
  ],
})
