#!/usr/bin/env node
/**
 * Testnet Stress Test
 * Simulates 100+ real transactions to verify system stability
 */

const axios = require("axios");
const { ethers } = require("ethers");

const API_URL = process.env.API_URL || "http://localhost:8081";
const NUM_TRANSACTIONS = parseInt(process.env.TEST_COUNT || "100");
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || "10");

// Test results tracking
const results = {
  total: 0,
  successful: 0,
  failed: 0,
  errors: [],
  timings: [],
};

async function createTestWallet() {
  const startTime = Date.now();

  try {
    const response = await axios.post(`${API_URL}/api/circle/create-wallet`, {
      user_id: `test_user_${Date.now()}_${Math.random()}`,
      metadata: {
        test: true,
        experiment: "stress_test",
      },
    });

    const duration = Date.now() - startTime;
    results.timings.push(duration);

    return {
      success: true,
      wallet_id: response.data.wallet_id,
      address: response.data.address,
      duration,
    };
  } catch (error) {
    results.errors.push({
      operation: "create_wallet",
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

async function completeTask(walletId) {
  const startTime = Date.now();

  try {
    // Accept task
    const acceptResponse = await axios.post(
      `${API_URL}/api/tasks/task_test_${Date.now()}/accept`,
      {
        worker_address: walletId,
      }
    );

    // Complete task
    const completeResponse = await axios.post(
      `${API_URL}/api/tasks/task_test_${Date.now()}/complete`,
      {
        user_id: walletId,
        submission: "test_solution",
        metadata: {
          test: true,
          experiment: "stress_test",
        },
      }
    );

    const duration = Date.now() - startTime;
    results.timings.push(duration);

    return { success: true, duration };
  } catch (error) {
    results.errors.push({
      operation: "complete_task",
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

async function runExperiment() {
  console.log("🧪 Testnet Stress Test");
  console.log("======================");
  console.log(`Target: ${NUM_TRANSACTIONS} transactions`);
  console.log(`Concurrent users: ${CONCURRENT_USERS}`);
  console.log(`API: ${API_URL}\n`);

  const startTime = Date.now();

  // Create batches
  const batches = [];
  for (let i = 0; i < NUM_TRANSACTIONS; i += CONCURRENT_USERS) {
    const batchSize = Math.min(CONCURRENT_USERS, NUM_TRANSACTIONS - i);
    batches.push(batchSize);
  }

  // Run batches
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchSize = batches[batchIdx];
    console.log(
      `\n📦 Batch ${batchIdx + 1}/${batches.length} (${batchSize} transactions)`
    );

    const batchPromises = [];
    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(
        (async () => {
          results.total++;

          // Create wallet
          const walletResult = await createTestWallet();
          if (!walletResult.success) {
            results.failed++;
            return;
          }

          // Complete task
          const taskResult = await completeTask(walletResult.wallet_id);
          if (taskResult.success) {
            results.successful++;
            process.stdout.write(".");
          } else {
            results.failed++;
            process.stdout.write("x");
          }
        })()
      );
    }

    await Promise.all(batchPromises);

    // Progress update
    const progress = ((results.total / NUM_TRANSACTIONS) * 100).toFixed(1);
    console.log(
      `\n   Progress: ${results.total}/${NUM_TRANSACTIONS} (${progress}%)`
    );
    console.log(`   Success rate: ${results.successful}/${results.total}`);
  }

  const totalDuration = Date.now() - startTime;

  // Calculate statistics
  const avgTiming =
    results.timings.reduce((a, b) => a + b, 0) / results.timings.length;
  const maxTiming = Math.max(...results.timings);
  const minTiming = Math.min(...results.timings);

  console.log("\n\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    📊 TEST RESULTS                         ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("📈 Performance:");
  console.log(`   Total transactions: ${results.total}`);
  console.log(`   Successful: ${results.successful} (${((results.successful / results.total) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);
  console.log(`   Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(
    `   Throughput: ${(results.total / (totalDuration / 1000)).toFixed(2)} tx/s`
  );

  console.log("\n⏱️  Timing:");
  console.log(`   Average: ${avgTiming.toFixed(0)}ms`);
  console.log(`   Min: ${minTiming.toFixed(0)}ms`);
  console.log(`   Max: ${maxTiming.toFixed(0)}ms`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.operation}: ${err.error}`);
    });
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more`);
    }
  }

  console.log("\n🎯 Success Criteria:");
  const successRate = (results.successful / results.total) * 100;
  console.log(
    `   ${successRate >= 95 ? "✅" : "❌"} Success rate > 95%: ${successRate.toFixed(1)}%`
  );
  console.log(
    `   ${avgTiming < 5000 ? "✅" : "❌"} Average timing < 5s: ${avgTiming.toFixed(0)}ms`
  );
  console.log(
    `   ${results.errors.length === 0 ? "✅" : "❌"} Zero critical errors: ${results.errors.length}`
  );

  const allPassed = successRate >= 95 && avgTiming < 5000 && results.errors.length === 0;

  console.log(`\n${allPassed ? "✅ ALL CRITERIA PASSED" : "❌ SOME CRITERIA FAILED"}`);

  // Save results
  const fs = require("fs");
  const resultsPath = `./logs/experiments/stress_test_${Date.now()}.json`;
  fs.mkdirSync("./logs/experiments", { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  process.exit(allPassed ? 0 : 1);
}

runExperiment().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
