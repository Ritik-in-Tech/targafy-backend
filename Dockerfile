FROM node:alpine3.18

# Set working directory
WORKDIR /src

# Copy package files from the root directory to the working directory
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# Create secure_files directory and copy necessary files
RUN mkdir -p /src/secure_files
COPY secure_files/service_key.json /src/secure_files/
COPY secure_files/openssl.cnf /src/secure_files/
COPY secure_files/localhost.key /src/secure_files/
COPY secure_files/localhost.crt /src/secure_files/

# Set environment variables
ENV SERVICE_KEY="/src/secure_files/service_key.json"
ENV OPENSSL_CNF_PATH="/src/secure_files/openssl.cnf"
ENV SSL_KEY_PATH="/src/secure_files/localhost.key"
ENV SSL_CERT_PATH="/src/secure_files/localhost.crt"

# Expose the ports your app runs on
EXPOSE 443
EXPOSE 80

# Command to run your application
CMD ["npm", "run", "dev"]
