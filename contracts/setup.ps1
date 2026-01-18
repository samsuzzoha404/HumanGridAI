# Installing Foundry dependencies...
Write-Host "Installing Foundry dependencies..." -ForegroundColor Cyan
forge install foundry-rs/forge-std --no-commit

Write-Host ""
Write-Host "Building contracts..." -ForegroundColor Cyan
forge build

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Copy .env.example to .env and fill in values"
Write-Host "2. Run tests: forge test"
Write-Host "3. Deploy: forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast"
