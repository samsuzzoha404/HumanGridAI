# Circle API Testing Script
# Run this after backend starts on http://localhost:8080

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Circle API Test Suite" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1/4] Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "✓ Backend is healthy!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)`n" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend not responding. Make sure 'cargo run' is running!" -ForegroundColor Red
    exit 1
}

# Test 2: Treasury Balance
Write-Host "[2/4] Checking treasury wallet balance..." -ForegroundColor Yellow
try {
    $balance = Invoke-RestMethod -Uri "http://localhost:8080/api/circle/balance/db7d9787-8e42-51fa-977a-288ca7569483" -Method Get
    Write-Host "✓ Treasury balance retrieved!" -ForegroundColor Green
    Write-Host "  Wallet ID: db7d9787-8e42-51fa-977a-288ca7569483" -ForegroundColor Gray
    Write-Host "  Address: 0x704744beb4218080b3b7512aed6275426987cd7d" -ForegroundColor Gray
    Write-Host "  USDC Balance: $($balance.balance) USDC`n" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get balance: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create Worker Wallet
Write-Host "[3/4] Creating test worker wallet..." -ForegroundColor Yellow
$createWalletBody = @{
    userId = "test-worker-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

try {
    $wallet = Invoke-RestMethod -Uri "http://localhost:8080/api/circle/create-wallet" -Method Post -Body $createWalletBody -ContentType "application/json"
    Write-Host "✓ Worker wallet created!" -ForegroundColor Green
    Write-Host "  Wallet ID: $($wallet.walletId)" -ForegroundColor Gray
    Write-Host "  Address: $($wallet.address)`n" -ForegroundColor Gray
    
    $workerWalletId = $wallet.walletId
    $workerAddress = $wallet.address
    
    # Test 4: Send Payment
    Write-Host "[4/4] Sending 0.01 USDC payment to worker..." -ForegroundColor Yellow
    $paymentBody = @{
        toWalletAddress = $workerAddress
        amount = "0.01"
    } | ConvertTo-Json
    
    try {
        $payment = Invoke-RestMethod -Uri "http://localhost:8080/api/circle/pay-worker" -Method Post -Body $paymentBody -ContentType "application/json"
        Write-Host "✓ Payment sent!" -ForegroundColor Green
        Write-Host "  Transfer ID: $($payment.transferId)" -ForegroundColor Gray
        Write-Host "  Amount: 0.01 USDC" -ForegroundColor Gray
        Write-Host "  Status: $($payment.status)" -ForegroundColor Gray
        Write-Host "`n  View on Arc Explorer:" -ForegroundColor Cyan
        Write-Host "  https://testnet.arcscan.app/address/$workerAddress`n" -ForegroundColor Blue
    } catch {
        Write-Host "✗ Payment failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Wallet creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Go to Wallet tab to see Circle integration" -ForegroundColor White
Write-Host "3. Create your personal wallet" -ForegroundColor White
Write-Host "4. Complete tasks to earn USDC!`n" -ForegroundColor White
