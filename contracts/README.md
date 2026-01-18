# HumanGridAI Smart Contracts

Solidity contracts for trustless USDC escrow and payment release.

## Core Principle

**Solidity is intentionally boring — it is a vault, not a brain.**

These contracts handle:

- ✅ Hold USDC in escrow
- ✅ Release payments on valid task completion
- ✅ Emit immutable on-chain events
- ✅ Mint basic reputation SBTs

These contracts DO NOT handle:

- ❌ Task validation logic
- ❌ CAPTCHA verification
- ❌ Confidence scoring
- ❌ Fraud detection
- ❌ Reputation math

> All intelligence lives in the Rust service. Solidity only settles.

## Contracts

### HumanGridEscrow.sol

Main escrow contract for USDC deposits and task payments.

**Key Functions:**

- `createTask(taskId, worker, amount)` - Requester deposits USDC for a task
- `completeTask(taskId, proof)` - Verifier approves and releases payment
- `cancelTask(taskId)` - Refund if task expires or is invalid

**Events:**

- `TaskCreated(taskId, requester, worker, amount)`
- `TaskCompleted(taskId, worker, amount, timestamp)`
- `TaskCancelled(taskId, refundAmount)`

### ReputationSBT.sol

Soulbound tokens representing worker reputation milestones.

**Key Functions:**

- `mint(worker, tier)` - Mint reputation badge (called by verifier)
- `getTier(worker)` - Get current reputation tier

## Setup

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Installation

```bash
cd contracts
forge install
```

### Build

```bash
forge build
```

### Test

```bash
forge test
forge test -vvv  # Verbose with stack traces
```

### Coverage

```bash
forge coverage
```

## Deployment

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your keys
```

### 2. Deploy to Base Sepolia (Testnet)

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

### 3. Deploy to Base Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_mainnet \
  --broadcast \
  --verify
```

## Integration Flow

```
1. AI Agent requests task
   └─> Frontend calls Supabase

2. Supabase triggers escrow deposit
   └─> createTask() on HumanGridEscrow

3. Human completes task
   └─> Supabase records submission

4. Rust verifier validates
   └─> POST to verifier API

5. Verifier approves payment
   └─> completeTask() on HumanGridEscrow
   └─> Emits TaskCompleted event

6. Supabase listens to events
   └─> Updates UI instantly
```

## Security Considerations

- All funds are held in escrow until verifier approval
- Only authorized verifier can release payments
- Tasks can be cancelled with refunds if stuck
- Reentrancy protection on all external calls
- USDC approval required before task creation

## Gas Optimization

- Minimal storage writes
- Event-driven design for indexing
- No loops over unbounded arrays
- Efficient struct packing

## Testing Strategy

- Unit tests for all state transitions
- Fuzz testing for edge cases
- Integration tests with mock USDC
- Gas benchmarking
- Invariant testing for escrow safety

## Future Upgrades

- Multi-token support (not just USDC)
- Batch payment releases
- Reputation tier automation
- Dispute resolution (Phase 3)
