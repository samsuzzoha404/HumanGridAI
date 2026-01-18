// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/ReputationSBT.sol";

contract ReputationSBTTest is Test {
    ReputationSBT public reputation;

    address public owner = address(1);
    address public verifier = address(2);
    address public worker1 = address(3);
    address public worker2 = address(4);

    function setUp() public {
        vm.prank(owner);
        reputation = new ReputationSBT(verifier);
    }

    /*//////////////////////////////////////////////////////////////
                            REPUTATION MINTING
    //////////////////////////////////////////////////////////////*/

    function test_MintReputation() public {
        vm.prank(verifier);
        reputation.mint(worker1, 1);

        assertEq(reputation.getTier(worker1), 1);
        assertTrue(reputation.hasReputation(worker1));
    }

    function test_MintMultipleTiers() public {
        vm.prank(verifier);
        reputation.mint(worker1, 1);

        vm.prank(verifier);
        reputation.mint(worker2, 3);

        assertEq(reputation.getTier(worker1), 1);
        assertEq(reputation.getTier(worker2), 3);
    }

    function test_UpgradeReputation() public {
        vm.prank(verifier);
        reputation.mint(worker1, 1);

        vm.prank(verifier);
        reputation.mint(worker1, 3);

        assertEq(reputation.getTier(worker1), 3);
    }

    function test_IdempotentMint() public {
        vm.prank(verifier);
        reputation.mint(worker1, 2);

        vm.prank(verifier);
        reputation.mint(worker1, 2);

        assertEq(reputation.getTier(worker1), 2);
    }

    function testRevert_MintUnauthorized() public {
        vm.prank(worker1);
        vm.expectRevert(ReputationSBT.Unauthorized.selector);
        reputation.mint(worker1, 1);
    }

    function testRevert_MintZeroTier() public {
        vm.prank(verifier);
        vm.expectRevert(ReputationSBT.InvalidTier.selector);
        reputation.mint(worker1, 0);
    }

    function testRevert_MintInvalidTier() public {
        vm.prank(verifier);
        vm.expectRevert(ReputationSBT.InvalidTier.selector);
        reputation.mint(worker1, 5);
    }

    function testRevert_DowngradeReputation() public {
        vm.prank(verifier);
        reputation.mint(worker1, 3);

        vm.prank(verifier);
        vm.expectRevert(ReputationSBT.CannotDowngrade.selector);
        reputation.mint(worker1, 1);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function test_GetTierName() public {
        assertEq(reputation.getTierName(0), "New");
        assertEq(reputation.getTierName(1), "Bronze");
        assertEq(reputation.getTierName(2), "Silver");
        assertEq(reputation.getTierName(3), "Gold");
        assertEq(reputation.getTierName(4), "Platinum");
        assertEq(reputation.getTierName(5), "Unknown");
    }

    function test_HasReputation() public {
        assertFalse(reputation.hasReputation(worker1));

        vm.prank(verifier);
        reputation.mint(worker1, 1);

        assertTrue(reputation.hasReputation(worker1));
    }

    /*//////////////////////////////////////////////////////////////
                            SOULBOUND
    //////////////////////////////////////////////////////////////*/

    function testRevert_Transfer() public {
        vm.expectRevert(ReputationSBT.Soulbound.selector);
        reputation.transfer(worker1, worker2);
    }

    function testRevert_TransferFrom() public {
        vm.expectRevert(ReputationSBT.Soulbound.selector);
        reputation.transferFrom(worker1, worker2, 1);
    }

    function testRevert_Approve() public {
        vm.expectRevert(ReputationSBT.Soulbound.selector);
        reputation.approve(worker2, 1);
    }

    function testRevert_SetApprovalForAll() public {
        vm.expectRevert(ReputationSBT.Soulbound.selector);
        reputation.setApprovalForAll(worker2, true);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateVerifier() public {
        address newVerifier = address(5);

        vm.prank(owner);
        reputation.updateVerifier(newVerifier);

        assertEq(reputation.verifier(), newVerifier);
    }

    function testRevert_UpdateVerifierUnauthorized() public {
        address newVerifier = address(5);

        vm.prank(worker1);
        vm.expectRevert(ReputationSBT.Unauthorized.selector);
        reputation.updateVerifier(newVerifier);
    }

    function test_TransferOwnership() public {
        address newOwner = address(6);

        vm.prank(owner);
        reputation.transferOwnership(newOwner);

        assertEq(reputation.owner(), newOwner);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTING
    //////////////////////////////////////////////////////////////*/

    function testFuzz_MintValidTier(uint8 tier) public {
        tier = uint8(bound(tier, 1, 4));

        vm.prank(verifier);
        reputation.mint(worker1, tier);

        assertEq(reputation.getTier(worker1), tier);
    }
}
