FROM node:20-alpine
# better-sqlite3 需要编译原生模块
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "index.js"]
