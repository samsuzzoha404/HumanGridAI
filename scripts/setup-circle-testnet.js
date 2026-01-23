#!/usr/bin/env node
/**
 * Circle Testnet Setup Script
 * Creates wallet sets for Base Sepolia testnet
 */

const { Circle, CircleEnvironments } = require("@circle-fin/circle-sdk");

async function main() {
  console.log("🔧 Setting up Circle Testnet Wallet Sets");
  console.log("=========================================\n");

  // Initialize Circle SDK with testnet credentials
  const circle = new Circle(
    process.env.CIRCLE_API_KEY_TESTNET,
    CircleEnvironments.sandbox // Testnet environment
  );

  try {
    // Create User Wallet Set
    console.log("Creating user wallet set...");
    const userWalletSet = await circle.walletSets.create({
      name: "HumanGridAI Users (Testnet)",
    });
    console.log(
      `✅ User Wallet Set ID: ${userWalletSet.data.walletSet.id}`
    );

    // Create Treasury Wallet Set
    console.log("Creating treasury wallet set...");
    const treasuryWalletSet = await circle.walletSets.create({
      name: "HumanGridAI Treasury (Testnet)",
    });
    console.log(
      `✅ Treasury Wallet Set ID: ${treasuryWalletSet.data.walletSet.id}`
    );

    // Create Agent Wallet Set (for future AI agents)
    console.log("Creating agent wallet set...");
    const agentWalletSet = await circle.walletSets.create({
      name: "HumanGridAI Agents (Testnet)",
    });
    console.log(
      `✅ Agent Wallet Set ID: ${agentWalletSet.data.walletSet.id}`
    );

    console.log("\n📝 Add these to your .env.testnet file:");
    console.log(
      `CIRCLE_USER_WALLET_SET_ID_TESTNET=${userWalletSet.data.walletSet.id}`
    );
    console.log(
      `CIRCLE_TREASURY_WALLET_SET_ID_TESTNET=${treasuryWalletSet.data.walletSet.id}`
    );
    console.log(
      `CIRCLE_AGENT_WALLET_SET_ID_TESTNET=${agentWalletSet.data.walletSet.id}`
    );

    console.log("\n✅ Circle testnet setup complete!");
  } catch (error) {
    console.error("❌ Error setting up Circle wallets:", error);
    process.exit(1);
  }
}

main();
