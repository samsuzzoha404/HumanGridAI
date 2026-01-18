# HumanGrid Protocol Service

**Off-chain verification and protocol brain for HumanGridAI**

This Rust service handles all decision-making logic that Solidity contracts explicitly avoid. It is the **intelligence layer** that determines correctness, calculates reputation, detects fraud, and approves payments.

## Core Principle

**Rust = reversible intelligence + coordination**

This service handles:

- ✅ Task result validation
- ✅ CAPTCHA / response verification
- ✅ Confidence scoring
- ✅ Fraud detection
- ✅ Reputation scoring
- ✅ Agent-native API

This service DOES NOT handle:

- ❌ Money (that's Solidity)
- ❌ Final settlement authority (that's blockchain)

> Rust decides correctness. Solidity settles it.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HumanGrid Protocol Service                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  API Layer (Axum)                                            │
│  ├─ /api/verify-task          Verify task submissions       │
│  ├─ /api/calculate-reputation  Calculate reputation tier    │
│  ├─ /api/report-fraud          Report fraudulent activity   │
│  └─ /api/worker-stats/:addr    Get worker statistics        │
│                                                               │
│  Verification Layer                                          │
│  ├─ CAPTCHA verification       Time-based validation         │
│  ├─ Image labeling             Consensus checking            │
│  ├─ Text validation            Quality scoring               │
│  └─ Custom tasks               Extensible logic              │
│                                                               │
│  Intelligence Layer                                          │
│  ├─ Confidence scoring         ML-based quality assessment   │
│  ├─ Fraud detection            Pattern analysis              │
│  └─ Reputation calculation     Tier-based scoring            │
│                                                               │
│  Blockchain Layer (ethers-rs)                                │
│  ├─ HumanGridEscrow            Complete/cancel tasks         │
│  └─ ReputationSBT              Mint reputation badges        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
rust-service/
├── src/
│   ├── main.rs                    # API server entry point
│   ├── config.rs                  # Configuration management
│   ├── error.rs                   # Error types
│   ├── models.rs                  # Request/response models
│   │
│   ├── api/                       # HTTP API endpoints
│   │   ├── mod.rs
│   │   ├── health.rs              # Health check endpoint
│   │   ├── verify.rs              # Task verification
│   │   ├── reputation.rs          # Reputation calculation
│   │   └── fraud.rs               # Fraud reporting
│   │
│   ├── verifier/                  # Core verification logic
│   │   └── mod.rs                 # Task validation algorithms
│   │
│   ├── reputation/                # Reputation system
│   │   └── mod.rs                 # Tier calculation
│   │
│   ├── fraud/                     # Fraud detection
│   │   └── mod.rs                 # Pattern analysis
│   │
│   └── blockchain/                # Blockchain integration
│       ├── mod.rs                 # Client setup
│       └── escrow.rs              # Contract interactions
│
├── Cargo.toml                     # Dependencies
├── .env.example                   # Environment template
└── README.md                      # This file
```

---

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "service": "HumanGrid Protocol Service",
  "version": "0.1.0",
  "chain_id": 84532,
  "blockchain": {
    "status": "healthy",
    "block_number": 12345678
  }
}
```

---

### Verify Task

```http
POST /api/verify-task
```

**Request:**

```json
{
  "task_id": "0x1234...",
  "worker": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "submission": {
    "type": "captcha",
    "solution": "XY7Z",
    "time_taken_ms": 5000
  }
}
```

**Response:**

```json
{
  "task_id": "0x1234...",
  "verified": true,
  "confidence_score": 0.89,
  "proof_hash": "0xabcd...",
  "payment_initiated": true,
  "message": "Payment released. Transaction: 0x5678..."
}
```

---

### Calculate Reputation

```http
POST /api/calculate-reputation
```

**Request:**

```json
{
  "worker_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**

```json
{
  "worker_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "total_tasks": 150,
  "successful_tasks": 145,
  "accuracy_rate": 96.67,
  "current_tier": 3,
  "tier_name": "Gold",
  "next_tier_at": 200
}
```

---

### Get Worker Stats

```http
GET /api/worker-stats/:address
```

**Response:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "total_tasks": 150,
  "completed_tasks": 145,
  "failed_tasks": 5,
  "average_confidence": 0.89,
  "reputation_tier": 3,
  "tier_name": "Gold",
  "earnings_total": "1500000000",
  "fraud_reports": 0
}
```

---

### Report Fraud

```http
POST /api/report-fraud
```

**Request:**

```json
{
  "task_id": "0x1234...",
  "worker": "0x...",
  "reason": "Suspicious timing pattern",
  "evidence": {
    "time_taken_ms": 100,
    "confidence": 0.2
  }
}
```

**Response:**

```json
{
  "fraud_report_id": "FR-a1b2c3d4",
  "status": "received",
  "action_taken": "Manual review required"
}
```

---

## Setup

### Prerequisites

- [Rust](https://rustup.rs/) 1.75+
- PostgreSQL (optional, for caching)
- Running Ethereum node or RPC provider

### Installation

```bash
cd rust-service

# Copy environment template
cp .env.example .env

# Edit .env with your values
# - Add verifier private key
# - Add contract addresses from Phase 1 deployment
# - Configure RPC endpoints

# Build
cargo build --release

# Run tests
cargo test

# Run service
cargo run --release
```

---

## Configuration

Edit `.env` with your settings:

```bash
# Server
PORT=8080
RUST_LOG=info,humangrid_service=debug

# Blockchain
CHAIN_ID=84532  # Base Sepolia
RPC_URL=https://sepolia.base.org
ESCROW_CONTRACT_ADDRESS=0x...  # From Phase 1
REPUTATION_CONTRACT_ADDRESS=0x...  # From Phase 1
VERIFIER_PRIVATE_KEY=0x...  # Your verifier key

# Thresholds
MIN_CONFIDENCE_SCORE=0.75
REPUTATION_BRONZE_TASKS=10
REPUTATION_SILVER_TASKS=50
REPUTATION_GOLD_TASKS=200
REPUTATION_PLATINUM_TASKS=1000

# Features
ENABLE_FRAUD_DETECTION=true
ENABLE_REPUTATION_MINTING=true
```

---

## Verification Logic

### CAPTCHA Verification

- ✅ Validates solution correctness
- ✅ Checks timing (too fast = bot, too slow = timeout)
- ✅ Calculates confidence score
- ✅ Generates cryptographic proof

### Image Labeling

- ✅ Validates label quality
- ✅ Checks consensus (future: multi-human)
- ✅ Confidence threshold enforcement

### Text Validation

- ✅ Consistency checking
- ✅ Issue description quality
- ✅ NLP-based scoring (future)

### Custom Tasks

- ✅ Extensible verification pipeline
- ✅ Task-specific validation rules

---

## Fraud Detection

The service analyzes submissions for:

- ⚠️ Suspiciously fast completion times
- ⚠️ Low confidence scores
- ⚠️ Consistent timing patterns (bot indicators)
- ⚠️ Historical accuracy trends
- ⚠️ Known fraud patterns

**Risk Levels:**

- **Low** → Normal monitoring
- **Medium** → Increased scrutiny
- **High** → Manual review required
- **Critical** → Account flagged

---

## Reputation System

### Tier Thresholds (Configurable)

- **Bronze** → 10+ tasks
- **Silver** → 50+ tasks
- **Gold** → 200+ tasks
- **Platinum** → 1000+ tasks

### Calculation

1. Query worker's task history
2. Calculate accuracy rate
3. Determine tier based on completed tasks
4. Mint SBT on-chain if tier increased

---

## Blockchain Integration

### Contract Interactions

**HumanGridEscrow:**

- `completeTask(taskId, proof)` - Release payment
- `cancelTask(taskId)` - Refund requester
- `isTaskActive(taskId)` - Check task status

**ReputationSBT:**

- `mint(worker, tier)` - Mint reputation badge
- `getTier(worker)` - Get current tier

### Transaction Flow

```
1. Verify submission (Rust)
   └─> Confidence score >= 0.75?

2. Fraud check (Rust)
   └─> Risk level acceptable?

3. Call completeTask() (Solidity)
   └─> Payment released to worker

4. Update reputation (Rust)
   └─> Mint SBT if tier increased

5. Emit events (Solidity)
   └─> Supabase listens and updates UI
```

---

## Development

### Run in Development Mode

```bash
cargo watch -x run
```

### Run Tests

```bash
cargo test
cargo test -- --nocapture  # With output
```

### Check Code Quality

```bash
cargo fmt       # Format code
cargo clippy    # Lint
```

### Build for Production

```bash
cargo build --release --target x86_64-unknown-linux-gnu
```

---

## Deployment

### Docker (Recommended)

```dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/humangrid-service /usr/local/bin/
CMD ["humangrid-service"]
```

### Build and Run

```bash
docker build -t humangrid-service .
docker run -p 8080:8080 --env-file .env humangrid-service
```

---

## Integration with Frontend

### Example: Verify Task from Next.js

```typescript
const response = await fetch("http://localhost:8080/api/verify-task", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    task_id: taskId,
    worker: workerAddress,
    submission: {
      type: "captcha",
      solution: captchaSolution,
      time_taken_ms: timeTaken,
    },
  }),
});

const result = await response.json();

if (result.payment_initiated) {
  // Update UI to show payment success
  console.log("Payment released:", result.message);
}
```

---

## Security Considerations

- 🔒 Private key stored in environment (never commit)
- 🔒 Rate limiting on all endpoints
- 🔒 Request validation (validator crate)
- 🔒 Fraud detection always active
- 🔒 CORS configured for production domains
- 🔒 Database credentials secured
- 🔒 HTTPS in production

---

## Performance

- ⚡ Async/await for I/O operations
- ⚡ Connection pooling for blockchain
- ⚡ Stateless design for horizontal scaling
- ⚡ Minimal storage writes
- ⚡ Efficient proof generation

---

## Monitoring

### Logs

```bash
# View logs
RUST_LOG=debug cargo run
```

### Metrics (Future)

- Task verification rate
- Average confidence scores
- Fraud detection accuracy
- Blockchain transaction success rate

---

## Future Enhancements

### Phase 3+

- Multi-human consensus
- ZK proofs of verification
- ML-based fraud detection
- Worker reputation decay
- Task difficulty adjustment
- Advanced analytics

---

## Troubleshooting

**Connection refused:**

- Check RPC_URL is correct
- Verify blockchain is accessible

**Transaction failed:**

- Check verifier has ETH for gas
- Verify contract addresses are correct
- Ensure verifier is authorized in contracts

**Tests failing:**

- Run `cargo clean`
- Update dependencies: `cargo update`

---

## Contributing

1. Follow Rust best practices
2. Add tests for new features
3. Update documentation
4. Run `cargo fmt` and `cargo clippy`

---

## License

MIT
