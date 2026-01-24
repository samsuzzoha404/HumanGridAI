<div align="center">

# 🌐 HumanGridAI

### _The Human Intelligence Layer for Autonomous AI Agents_

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange?logo=rust)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![Base Network](https://img.shields.io/badge/Base-Testnet-0052FF?logo=coinbase)](https://base.org/)

[Live Demo](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) • [Documentation](#-documentation) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

---

</div>

## 🎯 Overview

**HumanGridAI** is a decentralized protocol that bridges the gap between autonomous AI agents and human intelligence. When AI encounters tasks requiring judgment, verification, or human cognition (like CAPTCHA solving, content moderation, or complex decision-making), it can seamlessly request and compensate human workers through our trustless infrastructure.

### 🔑 Key Features

| Feature                   | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| 🤖 **AI-Native API**      | Simple REST endpoints for AI agents to submit verification tasks |
| 💰 **Trustless Payments** | USDC escrow on Base L2 with automatic settlement                 |
| 🛡️ **Fraud Prevention**   | Multi-layered verification and reputation system                 |
| ⚡ **Low Latency**        | Off-chain verification with on-chain finality                    |
| 📊 **Worker Reputation**  | Soulbound tokens tracking performance history                    |
| 🔐 **Circle Wallets**     | User-controlled wallets for seamless payment flows               |

---

## 🎨 Problem & Solution

### The Problem

As AI agents become more autonomous in executing tasks (trading, research, data processing), they frequently encounter obstacles requiring human intelligence:

- CAPTCHA challenges blocking automated workflows
- Content that requires human judgment (moderation, verification)
- Tasks needing real-world context or common sense
- Situations where AI lacks sufficient confidence to proceed

### Our Solution

HumanGridAI provides a **decentralized marketplace** where:

1. **AI Agents** submit tasks with USDC payment
2. **Human Workers** complete tasks and earn rewards
3. **Smart Contracts** ensure trustless escrow and settlement
4. **Rust Verifiers** validate work quality off-chain
5. **Reputation System** maintains network integrity

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI AGENT LAYER                           │
│  (Python SDK, REST API, WebSocket for real-time updates)       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RUST VERIFICATION SERVICE                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Verifier   │  │ Fraud        │  │  Reputation  │         │
│  │   Engine     │  │ Detection    │  │  Scorer      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN LAYER (Base Network)                    │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │ HumanGridEscrow.sol  │  │    ReputationSBT.sol        │   │
│  │ • USDC Deposits      │  │ • Soulbound Tokens          │   │
│  │ • Auto Settlement    │  │ • Performance Tracking      │   │
│  │ • Dispute System     │  │ • Trust Scoring             │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                         │
│  • Worker Dashboard  • Task Marketplace  • Analytics           │
│  • Wallet Integration (Circle)  • Real-time Updates            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

<table>
<tr>
<td width="33%" valign="top">

#### 🎨 Frontend

- **Framework**: Next.js 15.5
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query
- **Wallet**: Circle User-Controlled Wallets
- **Blockchain**: Viem + Wagmi

</td>
<td width="33%" valign="top">

#### ⚙️ Backend

- **Runtime**: Rust 1.70+
- **Framework**: Axum + Tokio
- **Database**: PostgreSQL (Supabase)
- **Caching**: Redis
- **Queue**: Background jobs
- **Monitoring**: Structured logging

</td>
<td width="33%" valign="top">

#### ⛓️ Blockchain

- **Network**: Arc Testnet (Chain ID: 5042002)
- **Smart Contracts**: Solidity 0.8.20
- **Framework**: Foundry
- **Token**: USDC (Circle)
- **NFTs**: Soulbound Reputation Tokens
- **RPC**: https://rpc.testnet.arc.network

</td>
</tr>
</table>

---

## 📁 Project Structure

```
HumanGridAI/
│
├── 🎨 Frontend (Next.js + TypeScript)
│   ├── src/
│   │   ├── app/                    # Next.js 15 app router
│   │   │   ├── dashboard/          # Worker dashboard
│   │   │   ├── tasks/              # Task marketplace
│   │   │   └── api/                # API routes
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn components
│   │   │   ├── wallet/             # Circle wallet integration
│   │   │   └── tasks/              # Task components
│   │   ├── lib/
│   │   │   ├── circleWalletSDK.ts # Circle SDK config
│   │   │   └── supabase.ts        # Database client
│   │   └── hooks/                  # React hooks
│   │
│   ├── public/                     # Static assets
│   └── package.json
│
├── ⚙️ Rust Service (Backend)
│   ├── src/
│   │   ├── main.rs                 # Entry point
│   │   ├── api/                    # REST API routes
│   │   ├── verifier/               # Task verification logic
│   │   ├── fraud/                  # Fraud detection engine
│   │   ├── reputation/             # Reputation calculation
│   │   ├── blockchain/             # Smart contract integration
│   │   └── models/                 # Data models
│   │
│   ├── Cargo.toml                  # Rust dependencies
│   └── .env.example                # Environment template
│
├── ⛓️ Smart Contracts (Solidity)
│   ├── src/
│   │   ├── HumanGridEscrow.sol    # USDC escrow & settlement
│   │   ├── ReputationSBT.sol      # Soulbound reputation NFTs
│   │   └── interfaces/            # Contract interfaces
│   │
│   ├── test/                       # Foundry tests
│   ├── script/                     # Deployment scripts
│   └── foundry.toml                # Foundry configuration
│
├── 📚 Database (Supabase)
│   ├── supabase-schema.sql        # Main database schema
│   ├── supabase-worker-wallets-schema.sql
│   └── insert-demo-tasks.sql      # Seed data
│
└── 📖 Documentation
    ├── ARCHITECTURE.md             # System design
    ├── PHASE1_COMPLETE.md          # Smart contract docs
    ├── PHASE2_COMPLETE.md          # Rust service docs
    └── ARC_NETWORK_MIGRATION.md    # Arc testnet guide
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm ([install via nvm](https://github.com/nvm-sh/nvm))
- **Rust** 1.70+ ([install via rustup](https://rustup.rs/))
- **Foundry** ([install guide](https://book.getfoundry.sh/getting-started/installation))
- **PostgreSQL** (or use [Supabase](https://supabase.com/))
- **Git** for version control

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/HumanGridAI.git
cd HumanGridAI
```

### 2️⃣ Deploy Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
forge install

# Run tests
forge test -vvv

# Deploy to Arc Testnet
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --verify

# Save the deployed contract addresses
# You'll need them for the Rust service
```

<details>
<summary>📝 Click to see expected output</summary>

```
✅ HumanGridEscrow deployed at: 0x7Ff1781e128328e17ECaAA3E095192E2c5419454
   Explorer: https://testnet.arcscan.app/address/0x7Ff1781e128328e17ECaAA3E095192E2c5419454

✅ ReputationSBT deployed at: 0xafB025Bf2c44E26Ce20132304948430d7978ebb7
   Explorer: https://testnet.arcscan.app/address/0xafB025Bf2c44E26Ce20132304948430d7978ebb7

✅ Network: Arc Testnet (Chain ID: 5042002)
✅ Current Block: 23,223,365+
✅ Verification successful
```

</details>

### 3️⃣ Configure Rust Service

```bash
cd ../rust-service

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/humangrid
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Blockchain (Arc Testnet)
ESCROW_CONTRACT_ADDRESS=0x7Ff1781e128328e17ECaAA3E095192E2c5419454
REPUTATION_CONTRACT_ADDRESS=0xafB025Bf2c44E26Ce20132304948430d7978ebb7
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
CHAIN_ID=5042002
PRIVATE_KEY=your-private-key

# Circle API
CIRCLE_API_KEY=your-circle-api-key
CIRCLE_APP_ID=your-app-id

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8081
```

### 4️⃣ Start Rust Service

```bash
# Build the service
cargo build --release

# Run database migrations
sqlx migrate run

# Start the server
cargo run --release
```

The service will start on `http://localhost:8081`

✅ **Service Status:**

- Rust Backend: Running on http://localhost:8081
- Connected to Arc Testnet (Chain ID: 5042002)
- Features: Fraud detection, reputation minting enabled
- Current Block Height: 23,223,365+

### 5️⃣ Setup Database

```bash
# Connect to your Supabase dashboard
# Navigate to SQL Editor
# Run these schema files in order:

1. supabase-schema.sql
2. supabase-worker-wallets-schema.sql
3. insert-demo-tasks.sql (optional, for testing)
```

### 6️⃣ Launch Frontend

```bash
cd ../ # Back to root directory

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Frontend environment variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_CIRCLE_APP_ID=your-circle-app-id
```

```bash
# Start development server
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 📖 Documentation

Comprehensive documentation is available in the following files:

| Document                                               | Description                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                   | Complete system design, protocol phases, and technical strategy |
| [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md)             | Smart contract implementation (Escrow + Reputation SBTs)        |
| [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)             | Rust verification service (Task validation + Fraud detection)   |
| [ARC_NETWORK_MIGRATION.md](./ARC_NETWORK_MIGRATION.md) | Guide to deploying on Arc Testnet                               |
| [contracts/README.md](./contracts/README.md)           | Smart contract API reference                                    |
| [rust-service/README.md](./rust-service/README.md)     | Backend API documentation                                       |

---

## 🔌 API Reference

### Rust Backend Endpoints

#### Submit Task (AI Agent)

```bash
POST /api/tasks
Content-Type: application/json

{
  "task_type": "captcha_solve",
  "payload": {
    "image_url": "https://example.com/captcha.png"
  },
  "reward_usdc": "5.00",
  "deadline_seconds": 300
}
```

#### Get Task (Worker)

```bash
GET /api/workers/tasks/available
Authorization: Bearer <worker_token>
```

#### Submit Solution (Worker)

```bash
POST /api/workers/tasks/{task_id}/submit
Content-Type: application/json

{
  "solution": "ABC123",
  "time_taken": 45
}
```

[View Full API Documentation →](./rust-service/README.md)

---

## 🧪 Testing

### Smart Contracts

```bash
cd contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testEscrowDeposit

# Generate coverage report
forge coverage
```

### Rust Service

```bash
cd rust-service

# Run unit tests
cargo test

# Run with output
cargo test -- --nocapture

# Run integration tests
cargo test --test integration_tests
```

### Frontend

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:ui
```

---

## 🛠️ Development Workflow

### Using Lovable (Recommended)

1. Visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Start prompting to make changes
3. Changes are automatically committed to this repo

### Using Your IDE

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd HumanGridAI

# Install dependencies
npm install

# Start development server
npm run dev

# Make your changes and commit
git add .
git commit -m "feat: your feature description"
git push origin main
```

### Using GitHub Codespaces

1. Click the **Code** button on the repository
2. Select **Codespaces** tab
3. Click **New codespace**
4. Edit files directly in the browser
5. Commit and push changes

---

## 🚢 Deployment

### Frontend Deployment

#### Option 1: Lovable (One-Click)

1. Open your [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Click **Share → Publish**
3. Your app is now live! 🎉

#### Option 2: Vercel

```bash
npm install -g vercel
vercel deploy --prod
```

#### Option 3: Manual (any host)

```bash
npm run build
npm run start
```

### Rust Service Deployment

```bash
# Build optimized binary
cargo build --release

# Deploy to your server (example with PM2)
pm2 start target/release/rust-service --name humangrid-api
pm2 save
pm2 startup
```

### Smart Contracts

```bash
# Deploy to Arc Testnet (Current Deployment)
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --verify

# Deployed Contracts:
# Escrow: 0x7Ff1781e128328e17ECaAA3E095192E2c5419454
# Reputation: 0xafB025Bf2c44E26Ce20132304948430d7978ebb7
# Explorer: https://testnet.arcscan.app/
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Standards

- **Frontend**: Follow ESLint rules, use TypeScript
- **Rust**: Run `cargo fmt` and `cargo clippy` before committing
- **Solidity**: Follow Solidity style guide, add NatSpec comments
- **Tests**: Maintain >80% code coverage
- **Documentation**: Update README if adding features

---

## 🐛 Troubleshooting

<details>
<summary><b>Dev server not starting</b></summary>

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

</details>

<details>
<summary><b>Rust compilation errors</b></summary>

```bash
# Update Rust toolchain
rustup update

# Clean build artifacts
cargo clean

# Rebuild
cargo build --release
```

</details>

<details>
<summary><b>Smart contract deployment fails</b></summary>

```bash
# Check RPC connection (Arc Testnet)
curl -X POST https://rpc.testnet.arc.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Verify you have testnet ETH on Arc
cast balance $YOUR_ADDRESS --rpc-url https://rpc.testnet.arc.network

# View deployed contracts
# Escrow: https://testnet.arcscan.app/address/0x7Ff1781e128328e17ECaAA3E095192E2c5419454
# Reputation: https://testnet.arcscan.app/address/0xafB025Bf2c44E26Ce20132304948430d7978ebb7

# Try deployment with more gas
forge script script/Deploy.s.sol --gas-limit 3000000
```

</details>

---

## 📊 Performance Benchmarks

| Metric              | Value       | Network                       |
| ------------------- | ----------- | ----------------------------- |
| **Task Submission** | <500ms      | API Response Time             |
| **Verification**    | <2s         | Off-chain Validation          |
| **Settlement**      | <15s        | Arc Testnet Finality          |
| **Gas Cost**        | ~$0.001     | Per Transaction (Arc Testnet) |
| **Throughput**      | 1000 TPS    | Theoretical Max               |
| **Current Block**   | 23,223,365+ | Arc Testnet                   |

---

## 🔐 Security

- **Smart Contracts**: Audited by [Auditor Name] _(pending)_
- **Access Control**: Role-based permissions (RBAC)
- **Fraud Detection**: Multi-layer verification system
- **Data Encryption**: All sensitive data encrypted at rest
- **Rate Limiting**: API endpoints protected against abuse

**Report security issues**: security@humangrid.ai

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Circle** for User-Controlled Wallets SDK
- **Base** for low-cost L2 infrastructure
- **Foundry** for smart contract development
- **Supabase** for database and auth
- **shadcn/ui** for beautiful components

---

## 🔗 Links

- **Website**: [humangrid.ai](https://humangrid.ai) _(coming soon)_
- **Documentation**: [docs.humangrid.ai](https://docs.humangrid.ai)
- **Twitter**: [@HumanGridAI](https://twitter.com/HumanGridAI)
- **Discord**: [Join our community](https://discord.gg/humangrid)

---

<div align="center">

**Built with ❤️ for the autonomous AI economy**

[⭐ Star this repo](https://github.com/yourusername/HumanGridAI) • [🐛 Report Bug](https://github.com/yourusername/HumanGridAI/issues) • [💡 Request Feature](https://github.com/yourusername/HumanGridAI/issues)

</div>
