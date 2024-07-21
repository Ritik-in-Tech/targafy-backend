FROM node:alpine3.18
WORKDIR /src
COPY package.json ./
RUN npm install
COPY . .
RUN mkdir -p /app/secure_files
ENV SERVICE_KEY="/app/secure_files/service_key.json"
ENV OPENSSL_CNF_PATH="/app/secure_files/openssl.cnf"
ENV SSL_KEY_PATH="/app/secure_files/localhost.key"
ENV SSL_CERT_PATH="/app/secure_files/localhost.crt"
EXPOSE 5000
CMD ["npm", "run", "dev"]