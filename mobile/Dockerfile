FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

EXPOSE 8081 19000 19001

CMD ["npx", "expo", "start", "--host", "lan", "--non-interactive"]
