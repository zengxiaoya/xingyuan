FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json .
RUN pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
