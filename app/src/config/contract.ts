import { Address } from 'viem'

export const contractAddress = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as Address

export const minWager = 0.00001
export const maxWager = 0.01
