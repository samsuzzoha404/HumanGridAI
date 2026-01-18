# HumanGridAI

**The error-handling layer for the autonomous AI economy**

HumanGridAI is a decentralized human-in-the-loop verification protocol that enables AI agents to request human intelligence for tasks requiring judgment, verification, or CAPTCHA-breaking. Built with trustless USDC settlement and off-chain verification logic.

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Complete protocol design, phases, and technical strategy
- **[PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md)** — Solidity smart contracts (USDC escrow + reputation SBTs)
- **[PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)** — Rust verification service (task validation + fraud detection)
- **[contracts/README.md](./contracts/README.md)** — Smart contract documentation
- **[rust-service/README.md](./rust-service/README.md)** — Rust service API documentation

## 🏗️ Project Structure

```
HumanGridAI/
├── src/                    # Next.js frontend (Phase 0)
├── contracts/              # Solidity smart contracts (Phase 1)
│   ├── src/
│   │   ├── HumanGridEscrow.sol
│   │   └── ReputationSBT.sol
│   └── test/
├── rust-service/           # Rust verification service (Phase 2)
│   ├── src/
│   │   ├── verifier/       # Task verification logic
│   │   ├── fraud/          # Fraud detection
│   │   ├── reputation/     # Reputation calculation
│   │   └── blockchain/     # Contract integration
│   └── Cargo.toml
└── README.md
```

## 🚀 Quick Start

### 1. Deploy Smart Contracts

```bash
cd contracts
forge install
forge build
forge test
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast
```

### 2. Run Rust Service

```bash
cd rust-service
cp .env.example .env
# Edit .env with contract addresses
cargo run
```

### 3. Run Frontend

```bash
npm install
npm run dev
```

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
