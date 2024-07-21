FROM node:alpine3.18

# Set working directory
WORKDIR /src

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your source code
COPY . .

# Create secure_files directory
RUN mkdir -p /src/secure_files

# Use build arguments to create sensitive files
ARG SERVICE_KEY_CONTENT
ARG OPENSSL_CNF_CONTENT
ARG SSL_KEY_CONTENT
ARG SSL_CERT_CONTENT

RUN echo "$SERVICE_KEY_CONTENT" > /src/secure_files/service_key.json && \
    echo "$OPENSSL_CNF_CONTENT" > /src/secure_files/openssl.cnf && \
    echo "$SSL_KEY_CONTENT" > /src/secure_files/localhost.key && \
    echo "$SSL_CERT_CONTENT" > /src/secure_files/localhost.crt

# Set environment variables
ENV SERVICE_KEY="/src/secure_files/service_key.json"
ENV OPENSSL_CNF_PATH="/src/secure_files/openssl.cnf"
ENV SSL_KEY_PATH="/src/secure_files/localhost.key"
ENV SSL_CERT_PATH="/src/secure_files/localhost.crt"

# Expose the port your app runs on
EXPOSE 5000

# Command to run your application
CMD ["npm", "run", "dev"]