/**
 * Circle Setup Script
 * 
 * This script helps you:
 * 1. Generate an entity secret
 * 2. Register it with Circle
 * 3. Create a treasury wallet
 * 
 * Run: node scripts/circle-setup.js
 */

const { 
  generateEntitySecret, 
  registerEntitySecretCiphertext,
  initiateDeveloperControlledWalletsClient 
} = require('@circle-fin/developer-controlled-wallets');
const fs = require('fs');
const path = require('path');

const API_KEY = 'TEST_API_KEY:ea8f8ed4bc41faf22b500a0f6a63720a:156303ffb275999e9741e64fdd8dcb6a';

async function setup() {
  console.log('🚀 Circle Setup for HumanGridAI\n');

  // Step 1: Check if entity secret already exists
  const envPath = path.join(__dirname, '..', 'rust-service', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  let entitySecret = null;
  const match = envContent.match(/CIRCLE_ENTITY_SECRET=(.+)/);
  
  if (match && match[1] && match[1].trim() !== '') {
    entitySecret = match[1].trim();
    console.log('✅ Found existing entity secret in .env');
  } else {
    // Step 2: Generate new entity secret
    console.log('📝 Generating new entity secret...');
    console.log('⚠️  The function will print the secret below. Copy it!\n');
    generateEntitySecret();
    
    console.log('\n⚠️  IMPORTANT: Copy the entity secret from above and paste it here:');
    console.log('Then manually update rust-service/.env with:');
    console.log('   CIRCLE_ENTITY_SECRET=<your-secret-here>');
    console.log('\nThen run this script again.\n');
    process.exit(0);

    // Step 3: Register entity secret with Circle
    console.log('📡 Registering entity secret with Circle...');
    try {
      const response = await registerEntitySecretCiphertext({
        apiKey: API_KEY,
        entitySecret: entitySecret
      });

      console.log('✅ Entity secret registered successfully!');
      console.log('⚠️  Recovery file saved. Keep it secure!\n');

      // Update .env file
      const updatedEnv = envContent.replace(
        /CIRCLE_ENTITY_SECRET=.*/,
        `CIRCLE_ENTITY_SECRET=${entitySecret}`
      );
      fs.writeFileSync(envPath, updatedEnv);
      console.log('✅ Updated rust-service/.env with entity secret\n');
    } catch (error) {
      console.error('❌ Failed to register entity secret:', error.message);
      console.error('Full error:', error.response?.data || error);
      process.exit(1);
    }
  }

  // Step 4: Create Circle client
  console.log('🔌 Initializing Circle client...');
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: entitySecret,
  });

  // Step 5: Create wallet set
  console.log('📦 Creating wallet set...');
  let walletSetId;
  try {
    const walletSetResponse = await client.createWalletSet({
      name: 'HumanGridAI Treasury Set',
    });
    walletSetId = walletSetResponse.data?.walletSet?.id;
    console.log(`✅ Wallet Set Created: ${walletSetId}\n`);
  } catch (error) {
    console.error('❌ Failed to create wallet set:', error.message);
    process.exit(1);
  }

  // Step 6: Create treasury wallet
  console.log('💰 Creating treasury wallet on BASE-SEPOLIA...');
  try {
    const walletsResponse = await client.createWallets({
      blockchains: ['BASE-SEPOLIA'],
      count: 1,
      walletSetId: walletSetId,
    });

    const wallet = walletsResponse.data?.wallets?.[0];
    if (!wallet) {
      throw new Error('No wallet returned from API');
    }

    console.log('✅ Treasury Wallet Created!');
    console.log(`   Wallet ID: ${wallet.id}`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Blockchain: ${wallet.blockchain}\n`);

    // Update .env file with wallet details
    let updatedEnv = fs.readFileSync(envPath, 'utf8');
    updatedEnv = updatedEnv.replace(
      /CIRCLE_TREASURY_WALLET_ID=.*/,
      `CIRCLE_TREASURY_WALLET_ID=${wallet.id}`
    );
    updatedEnv = updatedEnv.replace(
      /CIRCLE_TREASURY_ADDRESS=.*/,
      `CIRCLE_TREASURY_ADDRESS=${wallet.address}`
    );
    fs.writeFileSync(envPath, updatedEnv);

    console.log('✅ Updated rust-service/.env with wallet details\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 Setup Complete!\n');
    console.log('Next steps:');
    console.log('1. Fund treasury: https://console.circle.com/faucet');
    console.log(`   Address: ${wallet.address}`);
    console.log('2. Run database migration in Supabase SQL Editor');
    console.log('3. Start services: cargo run (Rust) & npm run dev (Frontend)');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Failed to create wallet:', error.message);
    console.error('Full error:', error.response?.data || error);
    process.exit(1);
  }
}

setup().catch(console.error);
