#!/bin/bash
set -e

echo "🔍 Installing Foundry dependencies..."
forge install foundry-rs/forge-std --no-commit

echo ""
echo "🔨 Building contracts..."
forge build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in values"
echo "2. Run tests: forge test"
echo "3. Deploy: forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast"
