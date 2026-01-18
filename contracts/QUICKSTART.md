# HumanGridAI Smart Contracts - Quick Start Guide

## Prerequisites

Install [Foundry](https://book.getfoundry.sh/getting-started/installation):

```powershell
# Windows (PowerShell)
irm https://github.com/foundry-rs/foundry/releases/download/nightly/foundryup-init.ps1 | iex
foundryup
```

```bash
# Linux/Mac
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Setup (First Time)

### Windows (PowerShell)

```powershell
cd contracts
.\setup.ps1
```

### Linux/Mac

```bash
cd contracts
chmod +x setup.sh
./setup.sh
```

## Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

**Required Environment Variables:**

- `DEPLOYER_PRIVATE_KEY` - Your deployer wallet private key
- `VERIFIER_ADDRESS` - Rust service address (authorized to approve payments)
- `USDC_ADDRESS` - USDC contract address for your network

**Network USDC Addresses:**

- Base Sepolia (testnet): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Test

```bash
forge test                    # Run all tests
forge test -vv                # Verbose output
forge test -vvv               # Very verbose (with stack traces)
forge test --match-test test_CompleteTask  # Run specific test
forge coverage                # Coverage report
```

## Deploy

### To Base Sepolia (Testnet)

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

### To Base Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_mainnet \
  --broadcast \
  --verify
```

## After Deployment

1. Copy contract addresses from output
2. Update `.env` with `ESCROW_ADDRESS` and `REPUTATION_ADDRESS`
3. Add addresses to your frontend config
4. Configure Rust service with contract addresses
5. Fund requester wallets with USDC

## Verify Contracts (Manual)

If auto-verification fails:

```bash
forge verify-contract \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode "constructor(address,address)" $USDC_ADDRESS $VERIFIER_ADDRESS) \
  $ESCROW_ADDRESS \
  src/HumanGridEscrow.sol:HumanGridEscrow
```

## Integration Example

```typescript
// Frontend integration
import { createPublicClient, createWalletClient, parseUnits } from 'viem';
import { base } from 'viem/chains';

const escrowAbi = [...]; // Import from artifacts

// 1. Approve USDC
await walletClient.writeContract({
  address: USDC_ADDRESS,
  abi: erc20Abi,
  functionName: 'approve',
  args: [ESCROW_ADDRESS, parseUnits('10', 6)] // 10 USDC
});

// 2. Create task
const taskId = keccak256(toBytes('unique-task-id'));
await walletClient.writeContract({
  address: ESCROW_ADDRESS,
  abi: escrowAbi,
  functionName: 'createTask',
  args: [taskId, workerAddress, parseUnits('10', 6)]
});

// 3. Listen for completion (from Rust verifier)
publicClient.watchContractEvent({
  address: ESCROW_ADDRESS,
  abi: escrowAbi,
  eventName: 'TaskCompleted',
  onLogs: (logs) => {
    console.log('Task completed:', logs);
    // Update UI
  }
});
```

## Useful Commands

```bash
# Check gas costs
forge test --gas-report

# Run specific test file
forge test --match-path test/HumanGridEscrow.t.sol

# Fork mainnet for testing
forge test --fork-url https://mainnet.base.org

# Generate documentation
forge doc

# Flatten contracts (for verification)
forge flatten src/HumanGridEscrow.sol

# Check contract size
forge build --sizes
```

## Troubleshooting

**"Transaction failed" during deployment:**

- Check deployer has ETH for gas
- Verify USDC_ADDRESS is correct for network
- Ensure VERIFIER_ADDRESS is not zero address

**Tests failing:**

- Run `forge clean` then `forge build`
- Check Foundry version: `forge --version`
- Update Foundry: `foundryup`

**Verification failed:**

- Ensure API key is set (if using Etherscan)
- Try manual verification (see above)
- Check contract is deployed to expected address

## Next Steps

1. **Phase 2**: Build Rust service to call `completeTask()`
2. **Frontend**: Integrate contract calls with UI
3. **Events**: Set up event listener in Supabase
4. **Monitoring**: Add contract monitoring/alerts
