#!/bin/bash
set -e

echo "🦀 Setting up HumanGrid Rust Service..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Installing rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

echo "✅ Rust $(rustc --version)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

echo "📦 Installing dependencies..."
cargo build

echo ""
echo "🧪 Running tests..."
cargo test

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your contract addresses and keys"
echo "2. Run: cargo run"
echo "3. Test: curl http://localhost:8080/health"
