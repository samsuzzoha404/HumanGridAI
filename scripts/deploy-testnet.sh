#!/bin/bash
# Testnet Deployment Script for Base Sepolia
# Phase 3: Controlled Reality Check

set -e

echo "🚀 HumanGridAI Testnet Deployment"
echo "=================================="
echo ""
echo "Target: Base Sepolia Testnet"
echo "Date: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.testnet ]; then
    echo "📋 Loading testnet configuration..."
    export $(cat .env.testnet | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Error: .env.testnet not found${NC}"
    echo "Please create .env.testnet with required variables"
    exit 1
fi

# Verify required variables
required_vars=(
    "BASE_SEPOLIA_RPC_URL"
    "DEPLOYER_PRIVATE_KEY"
    "VERIFIER_PRIVATE_KEY"
    "CIRCLE_API_KEY_TESTNET"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"
echo ""

# Step 1: Deploy Smart Contracts
echo "📝 Step 1: Deploying Smart Contracts to Base Sepolia"
echo "======================================================"
cd contracts

# Get Base Sepolia USDC address (testnet)
USDC_BASE_SEPOLIA="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
VERIFIER_ADDRESS=$(cast wallet address --private-key $VERIFIER_PRIVATE_KEY)

echo "USDC (Base Sepolia): $USDC_BASE_SEPOLIA"
echo "Verifier Address: $VERIFIER_ADDRESS"

# Deploy contracts
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $BASE_SEPOLIA_RPC_URL \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY \
    -vvvv

# Extract deployed addresses
ESCROW_ADDRESS=$(forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY | grep "HumanGridEscrow:" | awk '{print $2}')
REPUTATION_ADDRESS=$(forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY | grep "ReputationSBT:" | awk '{print $2}')

echo -e "${GREEN}✅ Contracts deployed:${NC}"
echo "   Escrow: $ESCROW_ADDRESS"
echo "   Reputation: $REPUTATION_ADDRESS"
echo ""

cd ..

# Step 2: Setup Circle Programmable Wallets (Testnet)
echo "💳 Step 2: Setting up Circle Testnet Wallets"
echo "=============================================="

# Create wallet sets for testnet
echo "Creating Circle wallet sets..."
cd scripts

node setup-circle-testnet.js

cd ..

echo -e "${GREEN}✅ Circle wallet sets created${NC}"
echo ""

# Step 3: Deploy Rust Service
echo "🦀 Step 3: Building and Deploying Rust Service"
echo "==============================================="

cd rust-service

# Build optimized release
echo "Building optimized binary..."
cargo build --release

# Create deployment package
echo "Creating deployment package..."
mkdir -p ../deploy/testnet
cp target/release/humangrid-service ../deploy/testnet/
cp -r migrations ../deploy/testnet/ || true

cd ..

echo -e "${GREEN}✅ Rust service built${NC}"
echo ""

# Step 4: Update Environment Variables
echo "🔧 Step 4: Generating Production Environment File"
echo "=================================================="

cat > deploy/testnet/.env << EOF
# Generated on $(date)
# Base Sepolia Testnet Configuration

# Network
CHAIN_ID=84532
RPC_URL=$BASE_SEPOLIA_RPC_URL
RPC_WS_URL=${BASE_SEPOLIA_WS_URL:-wss://sepolia.base.org}

# Contracts
ESCROW_CONTRACT_ADDRESS=$ESCROW_ADDRESS
REPUTATION_CONTRACT_ADDRESS=$REPUTATION_ADDRESS

# Circle API (Testnet)
CIRCLE_API_KEY=$CIRCLE_API_KEY_TESTNET
CIRCLE_API_URL=https://api-sandbox.circle.com
CIRCLE_ENTITY_SECRET=$CIRCLE_ENTITY_SECRET_TESTNET
CIRCLE_USER_WALLET_SET_ID=$CIRCLE_USER_WALLET_SET_ID_TESTNET
CIRCLE_TREASURY_WALLET_SET_ID=$CIRCLE_TREASURY_WALLET_SET_ID_TESTNET

# Verifier
VERIFIER_PRIVATE_KEY=$VERIFIER_PRIVATE_KEY

# Database
DATABASE_URL=$SUPABASE_URL

# Security
API_KEY_SALT=$(openssl rand -hex 32)
MAX_REQUESTS_PER_MINUTE=100

# Mode
DEMO_MODE=false
USE_CIRCLE_CUSTODY=true

# Monitoring
RUST_LOG=info,humangrid_service=debug
EOF

echo -e "${GREEN}✅ Environment file created${NC}"
echo ""

# Step 5: Setup Database
echo "💾 Step 5: Initializing Database Schema"
echo "========================================"

# Run Supabase migrations
echo "Running migrations..."
psql $DATABASE_URL < supabase-schema.sql
psql $DATABASE_URL < supabase-phase3-schema.sql

echo -e "${GREEN}✅ Database initialized${NC}"
echo ""

# Step 6: Deploy to Server (if DEPLOY_HOST is set)
if [ -n "$DEPLOY_HOST" ]; then
    echo "🚀 Step 6: Deploying to Remote Server"
    echo "====================================="
    
    echo "Uploading files to $DEPLOY_HOST..."
    scp -r deploy/testnet/* $DEPLOY_USER@$DEPLOY_HOST:/opt/humangrid/
    
    echo "Starting service..."
    ssh $DEPLOY_USER@$DEPLOY_HOST "cd /opt/humangrid && systemctl restart humangrid-service"
    
    echo -e "${GREEN}✅ Service deployed and started${NC}"
else
    echo "⏭️  Step 6: Remote deployment skipped (DEPLOY_HOST not set)"
fi

echo ""

# Step 7: Verify Deployment
echo "🔍 Step 7: Verifying Deployment"
echo "==============================="

echo "Checking contract deployment..."
cast code $ESCROW_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL > /dev/null && echo "  ✅ Escrow contract verified" || echo "  ❌ Escrow contract not found"
cast code $REPUTATION_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL > /dev/null && echo "  ✅ Reputation contract verified" || echo "  ❌ Reputation contract not found"

if [ -n "$DEPLOY_HOST" ]; then
    echo "Checking service health..."
    curl -s http://$DEPLOY_HOST:8081/health | jq . && echo "  ✅ Service is healthy" || echo "  ⚠️  Service health check failed"
fi

echo ""

# Generate test script
echo "📝 Generating Test Script"
echo "========================="

cat > deploy/testnet/run_experiments.sh << 'EOF'
#!/bin/bash
# Testnet Experiments Script
# Run mandatory experiments as specified in Phase 3

echo "🧪 Running Testnet Experiments"
echo "=============================="

# Experiment 1: 100+ real transactions
echo "1. Testing 100+ transactions..."
node scripts/testnet-stress-test.js --count 100

# Experiment 2: Delayed webhooks
echo "2. Testing delayed webhooks..."
node scripts/test-delayed-webhooks.js

# Experiment 3: Failed transactions
echo "3. Testing failed transaction handling..."
node scripts/test-failed-transactions.js

# Experiment 4: Network congestion
echo "4. Simulating network congestion..."
node scripts/test-network-congestion.js

# Experiment 5: Wallet creation under load
echo "5. Testing wallet creation under load..."
node scripts/test-wallet-creation-load.js

echo ""
echo "✅ All experiments complete"
echo "Review logs in ./logs/experiments/"
EOF

chmod +x deploy/testnet/run_experiments.sh

echo -e "${GREEN}✅ Test script generated${NC}"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ✅ TESTNET DEPLOYMENT COMPLETE                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Deployment Summary:"
echo "   Network: Base Sepolia (Chain ID: 84532)"
echo "   Escrow Contract: $ESCROW_ADDRESS"
echo "   Reputation Contract: $REPUTATION_ADDRESS"
echo "   Block Explorer: https://sepolia.basescan.org/address/$ESCROW_ADDRESS"
echo ""
echo "🔗 Service URLs:"
echo "   API: http://${DEPLOY_HOST:-localhost}:8081"
echo "   Health: http://${DEPLOY_HOST:-localhost}:8081/health"
echo ""
echo "📝 Next Steps:"
echo "   1. Run experiments: ./deploy/testnet/run_experiments.sh"
echo "   2. Monitor logs: tail -f /opt/humangrid/logs/humangrid.log"
echo "   3. Check metrics: http://${DEPLOY_HOST:-localhost}:8081/metrics"
echo "   4. Test Circle webhooks: https://console.circle.com/webhooks"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - This is TESTNET with fake money"
echo "   - Get testnet USDC: https://faucet.circle.com"
echo "   - Get testnet ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
echo "   - Monitor for 24-48 hours before considering mainnet"
echo ""
echo "🎯 Success Criteria (Phase 3):"
echo "   ✅ 100+ transactions without errors"
echo "   ✅ Delayed webhooks handled correctly"
echo "   ✅ Failed transactions recovered gracefully"
echo "   ✅ Network congestion did not cause double-spend"
echo "   ✅ Wallet creation stable under load"
echo ""
echo "If ALL criteria pass → Ready for Phase 4 (Fraud Detection)"
echo "If ANY fail → FIX IMMEDIATELY and re-test"
echo ""
