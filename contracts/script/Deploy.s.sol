// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Script.sol";
import "../src/HumanGridEscrow.sol";
import "../src/ReputationSBT.sol";

/**
 * @title DeployScript
 * @notice Deployment script for HumanGridAI contracts
 * @dev Run with: forge script script/Deploy.s.sol:DeployScript --rpc-url <network> --broadcast
 */
contract DeployScript is Script {
    function run() external {
        // Load environment variables
        address verifier = vm.envAddress("VERIFIER_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        require(verifier != address(0), "VERIFIER_ADDRESS not set");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts (Arc uses native USDC)
        HumanGridEscrow escrow = new HumanGridEscrow(verifier);
        ReputationSBT reputation = new ReputationSBT(verifier);

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("=== HumanGridAI Arc Testnet Deployment ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("");
        console.log("Native Currency: USDC (18 decimals)");
        console.log("Verifier:", verifier);
        console.log("");
        console.log("HumanGridEscrow:", address(escrow));
        console.log("ReputationSBT:", address(reputation));
        console.log("");
        console.log("Add these to your .env:");
        console.log(
            string.concat("ESCROW_ADDRESS=", vm.toString(address(escrow)))
        );
        console.log(
            string.concat(
                "REPUTATION_ADDRESS=",
                vm.toString(address(reputation))
            )
        );
    }
}
