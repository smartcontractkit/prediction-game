FROM node:20-alpine AS base

ARG NEXT_PUBLIC_ALCHEMY_API_KEY
ARG NEXT_PUBLIC_WALLET_CONNECT_ID
ARG NEXT_PUBLIC_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_GTM_ID
ARG API_KEY

RUN mkdir -p /app
WORKDIR /app

RUN touch .env

RUN echo NEXT_PUBLIC_ALCHEMY_API_KEY=${NEXT_PUBLIC_ALCHEMY_API_KEY} >> .env
RUN echo NEXT_PUBLIC_WALLET_CONNECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_ID} >> .env
RUN echo NEXT_PUBLIC_CONTRACT_ADDRESS=${NEXT_PUBLIC_CONTRACT_ADDRESS} >> .env
RUN echo NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID} >> .env
RUN echo API_KEY=${API_KEY} >> .env

COPY . .

RUN npm install
RUN npm run build

FROM node:20-alpine AS runtime

COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]