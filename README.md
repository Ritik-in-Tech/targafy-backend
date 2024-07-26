# Targafy

Targafy is a robust Flutter application backed by a powerful backend infrastructure. This app offers a seamless user experience with advanced features and optimized performance.

## Key Features

1. **Secure Authentication**: Implements mobile OTP login for enhanced security and user convenience, ensuring secure access to user accounts.

2. **Real-time Alerts**: Utilizes WebSocket technology to provide live alerts, ensuring users stay informed instantly about important updates or events.

3. **Push Notifications**: Integrated with Firebase to deliver timely push notifications, keeping users engaged with the latest information and prompts.

4. **Cloud-powered**: Leverages AWS services (EC2, S3) for reliable server operations and efficient file storage, ensuring scalability and performance.

5. **Optimized Performance**: Achieves a 40% boost in system speed through carefully optimized database queries, providing a smooth user experience.

6. **Streamlined Development**: Employs GitHub Actions and Docker for a smooth and efficient development process, facilitating continuous integration and deployment.

Targafy combines cutting-edge mobile technology with a robust backend to deliver a high-performance, feature-rich application experience.

## Backend Setup

Follow these steps to set up the backend on your local system:

### Prerequisites

- Node.js (latest LTS version recommended)
- Git
- MongoDB (local instance or cloud connection)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/testgithubtiwari/targafy-backend.git
```

2. Verify Node.js installation:

```bash
node --version
```

3. Navigate to the project root directory:

```bash
cd targafy-backend-test
```

4. Create a secure_files folder in the root directory and add the following files:

1) FCM service key JSON
2) SSL service certificate
3) SSL key file
4) OpenSSL CNF file

```bash
mkdir secure_files
```

5. Create a .env file in the root directory with the following content:

```bash
NODE_ENV=development
ACCESS_TOKEN_SECRET='your access token secret'
ACCESS_TOKEN_EXPIRY='token expiry like 1d'
AUTHKEY='Your Auth key for the otp to send'
TEMPELATE_ID='Tempelate id found from the msg api platform'
MONGODB_PASS='Your mongoDb password'
EXPRESS_SESSION_SECRET='Your session secret'
AWS_ACCESS_KEY='Your aws access key'
AWS_SECRET_KEY='Your aws secret key'
HTTPS_PORT=443
HTTP_PORT=80
ACCESS_TOKEN_SECRET_ADMIN='Your token secret for admin app'
SERVICE_KEY="service key path"
OPENSSL_CNF_PATH="openssl cnf path"
SSL_KEY_PATH="ssl key path"
SSL_CERT_PATH="ssl certificate path"
```

6. Install dependencies:

```bash
npm install
```

7. Start the development server:

```bash
npm run dev
```

If you see the following messages, your setup is successful:

1. HTTP Server running on http://localhost:80
2. HTTPS Server running on https://localhost:443

## Troubleshooting

If you encounter any issues during setup:

1. Ensure all required files are present in the secure_files folder
2. Check that your .env file contains all necessary variables
3. Verify that you have the correct permissions to run the server on ports 80 and 443

## Contributing

We welcome pull requests. For major changes, please open an issue first to discuss what you would like to change.
Please adhere to the following guidelines:

1. Follow the existing code style
2. Write clear, concise commit messages
3. Include tests for new features or bug fixes
4. Update documentation as necessary

## License

[MIT](https://choosealicense.com/licenses/mit/)
