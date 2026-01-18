/**
 * Circle Setup Script
 *
 * This script will:
 * 1. Generate an Entity Secret
 * 2. Register it with Circle
 * 3. Create a Treasury Wallet
 * 4. Update your .env file
 */

const {
  generateEntitySecret,
  registerEntitySecretCiphertext,
  initiateDeveloperControlledWalletsClient,
} = require("@circle-fin/developer-controlled-wallets");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const API_KEY = process.env.CIRCLE_API_KEY || "YOUR_API_KEY_HERE";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("\n🚀 Circle Treasury Wallet Setup\n");

  try {
    // Step 1: Generate Entity Secret
    console.log("📝 Step 1: Generating Entity Secret...");
    console.log("⚠️  COPY THIS SECRET - IT WILL ONLY BE SHOWN ONCE!\n");

    // Generate and capture the entity secret
    const originalLog = console.log;
    let entitySecret = "";
    console.log = (message) => {
      if (typeof message === "string" && message.length === 64) {
        entitySecret = message;
      }
      originalLog(message);
    };

    generateEntitySecret();
    console.log = originalLog;

    if (!entitySecret) {
      console.error("❌ Failed to generate entity secret");
      process.exit(1);
    }

    console.log("\n✅ Entity Secret Generated!\n");

    // Ask user to confirm they saved it
    const saved = await question(
      "Have you saved this Entity Secret? (yes/no): ",
    );
    if (saved.toLowerCase() !== "yes") {
      console.log(
        "\n⚠️  Please save the Entity Secret above before continuing!",
      );
      process.exit(0);
    }

    // Step 2: Register Entity Secret
    console.log("\n📝 Step 2: Registering Entity Secret with Circle...");

    const response = await registerEntitySecretCiphertext({
      apiKey: API_KEY,
      entitySecret: entitySecret,
      recoveryFileDownloadPath: ".",
    });

    console.log("✅ Entity Secret Registered!");
    console.log("📁 Recovery file saved to current directory");
    console.log("⚠️  KEEP THIS RECOVERY FILE SAFE!\n");

    // Step 3: Create Wallet Set
    console.log("📝 Step 3: Creating Wallet Set...");

    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: entitySecret,
    });

    const walletSetResponse = await client.createWalletSet({
      name: "HumanGridAI Treasury",
    });

    const walletSetId = walletSetResponse.data?.walletSet?.id;
    console.log(`✅ Wallet Set Created: ${walletSetId}\n`);

    // Step 4: Create Treasury Wallet
    console.log("📝 Step 4: Creating Treasury Wallet on BASE-SEPOLIA...");

    const walletsResponse = await client.createWallets({
      blockchains: ["BASE-SEPOLIA"],
      count: 1,
      walletSetId: walletSetId,
    });

    const wallet = walletsResponse.data?.wallets?.[0];

    if (!wallet) {
      console.error("❌ Failed to create wallet");
      process.exit(1);
    }

    console.log("✅ Treasury Wallet Created!\n");
    console.log("📋 Wallet Details:");
    console.log(`   ID: ${wallet.id}`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Blockchain: ${wallet.blockchain}\n`);

    // Step 5: Update .env file
    console.log("📝 Step 5: Updating rust-service/.env file...");

    const envPath = path.join(__dirname, "..", "rust-service", ".env");
    let envContent = fs.readFileSync(envPath, "utf8");

    envContent = envContent.replace(
      /CIRCLE_ENTITY_SECRET=.*/,
      `CIRCLE_ENTITY_SECRET=${entitySecret}`,
    );
    envContent = envContent.replace(
      /CIRCLE_TREASURY_WALLET_ID=.*/,
      `CIRCLE_TREASURY_WALLET_ID=${wallet.id}`,
    );
    envContent = envContent.replace(
      /CIRCLE_TREASURY_ADDRESS=.*/,
      `CIRCLE_TREASURY_ADDRESS=${wallet.address}`,
    );

    fs.writeFileSync(envPath, envContent);

    console.log("✅ Environment file updated!\n");

    // Step 6: Final instructions
    console.log("🎉 Setup Complete!\n");
    console.log("📋 Next Steps:");
    console.log("   1. Fund your treasury wallet with testnet USDC:");
    console.log("      - Go to https://console.circle.com/faucet");
    console.log(`      - Enter address: ${wallet.address}`);
    console.log("      - Request testnet USDC\n");
    console.log("   2. Run database migration:");
    console.log("      - Go to Supabase Dashboard → SQL Editor");
    console.log("      - Run supabase-circle-schema.sql\n");
    console.log("   3. Start your services:");
    console.log("      - cd rust-service && cargo run");
    console.log("      - npm run dev\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response?.data) {
      console.error("API Error:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
