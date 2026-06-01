FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_USE_MOCK=false

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next

EXPOSE 3000
CMD ["npm", "run", "start"]
