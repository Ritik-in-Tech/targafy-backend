FROM node:alpine3.18

# Set working directory
WORKDIR /src

# List contents of the current build context
RUN ls -la

# Explicitly copy package.json
COPY package.json ./package.json

# List contents after copying
RUN ls -la

# Install dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# List contents after copying everything
RUN ls -la

# Create secure_files directory
RUN mkdir -p /app/secure_files

# Set environment variables
ENV SERVICE_KEY="/app/secure_files/service_key.json"
ENV OPENSSL_CNF_PATH="/app/secure_files/openssl.cnf"
ENV SSL_KEY_PATH="/app/secure_files/localhost.key"
ENV SSL_CERT_PATH="/app/secure_files/localhost.crt"

# Expose the port your app runs on
EXPOSE 5000

# Command to run your application
CMD ["npm", "run", "dev"]