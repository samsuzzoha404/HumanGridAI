# Setting up HumanGrid Rust Service
Write-Host "Setting up HumanGrid Rust Service..." -ForegroundColor Cyan

# Check if Rust is installed
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Rust is not installed. Please install from: https://rustup.rs/" -ForegroundColor Red
    exit 1
}

Write-Host "Rust version: $(rustc --version)" -ForegroundColor Green

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please edit .env with your configuration" -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
cargo build

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Cyan
cargo test

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Edit .env with your contract addresses and keys"
Write-Host "2. Run: cargo run"
Write-Host "3. Test: curl http://localhost:8080/health"
