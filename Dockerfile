FROM node:alpine3.18

# Set working directory
WORKDIR /src

# Copy package files from the root directory to the working directory
COPY  package.json ./

# Install dependencies
RUN ls -la && npm install

# Copy the rest of your source code
COPY . .

# Create secure_files directory
RUN mkdir -p /src/secure_files

# Set environment variables
ENV SERVICE_KEY="/src/secure_files/service_key.json"
ENV OPENSSL_CNF_PATH="/src/secure_files/openssl.cnf"
ENV SSL_KEY_PATH="/src/secure_files/localhost.key"
ENV SSL_CERT_PATH="/src/secure_files/localhost.crt"

# Expose the port your app runs on
EXPOSE 5000

# Command to run your application
CMD ["npm", "run", "dev"]
