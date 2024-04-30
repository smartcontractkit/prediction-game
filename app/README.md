# Sports Prediction Game: Frontend

This directory is a Next.js project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

It contains the frontend for the sports prediction game and additional backend for data aggregation and server side rendering.

## Quick Start

Install all dependencies:

```bash
npm install
```

Set environment variables by copying `.env.example` to `.env` and filling in the values:

- _NEXT_PUBLIC_ALCHEMY_API_KEY_ for the network you want to use. You can get one from [Alchemy](https://www.alchemy.com/).
- _NEXT_PUBLIC_WALLET_CONNECT_ID_ for the wallet connector. You can get one from [WalletConnect](https://walletconnect.org/) by going to [WalletConnect Cloud](https://cloud.walletconnect.com/sign-in).
- _NEXT_PUBLIC_CONTRACT_ADDRESS_ for the deployed game contract address.
- _API_KEY_ for the sports data API. Obtain one [here](https://dashboard.api-football.com/register).

Run `npm run dev` in your terminal, and then open [localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [RainbowKit](https://www.rainbowkit.com/)
- [wagmi](https://wagmi.sh/) & [viem](https://viem.sh/)
- [shadcn/ui](https://ui.shadcn.com/)
