FROM node:alpine3.18
WORKDIR /src/server
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
