# On-chain Portfolio
App allows users to fetch USDC, ETH, and LINK token balances for a particular Ethereum address.

## Features

- Retrieve token balances (USDC, ETH, LINK) for any Ethereum address
- Mobile responsive interface
- Cached responses for improved performance

## Project Structure

The project consists of two main components:

### Frontend

- Built with React + TypeScript
- Fully responsive for mobile and desktop devices

### Backend

- Built with Fastify + TypeScript
- Implements in-memory caching (60-second TTL)
- Uses Alchemy API for interacting with Ethereum blockchain
- Data validation with Zod

## API Endpoints

- `/api/status`: Check server status
- `/api/balance?address=<0x123>`: Fetch token balances for the specified address
  - Validates requests and responses using Zod
  - Implements caching to reduce API calls to Alchemy

## Getting Started

### Prerequisites

- Node.js and a package manager (bun, npm, yarn, or pnpm)
- Alchemy API key

### Running the Frontend

```bash
git clone https://github.com/satyambnsal/onchain-portfolio
cd frontend
bun install
bun run dev
```

You can replace `bun` with any other package manager of your choice (`npm`, `yarn`, or `pnpm`).

### Running the Backend

```bash
cd backend
bun install

# Set up your environment variables
# Create a .env file with ALCHEMY_API_KEY=your_api_key

bun run dev
```

## Environment Variables

Backend requires the following environment variables:

- `ALCHEMY_API_KEY`: Your Alchemy API key for interacting with Ethereum

## Technologies Used

- **Frontend**: React, TypeScript
- **Backend**: Fastify, TypeScript, Zod
- **Blockchain Integration**: Alchemy API
