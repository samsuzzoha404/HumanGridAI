// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/HumanGridEscrow.sol";

/**
 * @title HumanGridEscrowTest
 * @notice Tests for Arc Testnet native USDC escrow
 */
contract HumanGridEscrowTest is Test {
    HumanGridEscrow public escrow;

    address public owner = address(1);
    address public verifier = address(2);
    address public requester = address(3);
    address public worker = address(4);

    uint256 constant TASK_AMOUNT = 10 ether; // 10 USDC (18 decimals on Arc)
    bytes32 constant TASK_ID = keccak256("task1");

    function setUp() public {
        // Deploy escrow (Arc uses native USDC)
        vm.prank(owner);
        escrow = new HumanGridEscrow(verifier);

        // Fund requester with native USDC
        vm.deal(requester, 1000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            TASK CREATION
    //////////////////////////////////////////////////////////////*/

    function test_CreateTask() public {
        // Create task with native USDC
        vm.prank(requester);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);

        // Verify task details
        HumanGridEscrow.Task memory task = escrow.getTask(TASK_ID);
        assertEq(task.requester, requester);
        assertEq(task.worker, worker);
        assertEq(task.amount, TASK_AMOUNT);
        assertEq(task.completed, false);
        assertEq(task.cancelled, false);
        assertTrue(escrow.isTaskActive(TASK_ID));
    }

    function test_CreateTaskTransfersUSDC() public {
        uint256 requesterBalanceBefore = requester.balance;
        uint256 escrowBalanceBefore = address(escrow).balance;

        vm.prank(requester);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);

        assertEq(requester.balance, requesterBalanceBefore - TASK_AMOUNT);
        assertEq(address(escrow).balance, escrowBalanceBefore + TASK_AMOUNT);
    }

    function testRevert_CreateTaskZeroAmount() public {
        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.InvalidAmount.selector);
        escrow.createTask{value: 0}(TASK_ID, worker);
    }

    function testRevert_CreateTaskZeroWorker() public {
        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.InvalidAddress.selector);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, address(0));
    }

    function testRevert_CreateDuplicateTask() public {
        vm.prank(requester);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);

        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.TaskAlreadyExists.selector);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);
    }

    /*//////////////////////////////////////////////////////////////
                            TASK COMPLETION
    //////////////////////////////////////////////////////////////*/

    function test_CompleteTask() public {
        // Create task
        vm.prank(requester);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);

        uint256 workerBalanceBefore = worker.balance;

        // Complete task
        bytes32 proof = keccak256("verification_proof");
        vm.prank(verifier);
        escrow.completeTask(TASK_ID, proof);

        // Verify task completed
        HumanGridEscrow.Task memory task = escrow.getTask(TASK_ID);
        assertTrue(task.completed);
        assertFalse(escrow.isTaskActive(TASK_ID));

        // Verify payment transferred
        assertEq(worker.balance, workerBalanceBefore + TASK_AMOUNT);
    }

    function testRevert_CompleteTaskUnauthorized() public {
        vm.prank(requester);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);

        bytes32 proof = keccak256("verification_proof");
        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.Unauthorized.selector);
        escrow.completeTask(TASK_ID, proof);
    }

    function testRevert_CompleteNonexistentTask() public {
        bytes32 proof = keccak256("verification_proof");
        vm.prank(verifier);
        vm.expectRevert(HumanGridEscrow.TaskNotFound.selector);
        escrow.completeTask(TASK_ID, proof);
    }

    function testRevert_CompleteTaskTwice() public {
        vm.prank(requester);
        escrow.createTask{value: TASK_AMOUNT}(TASK_ID, worker);

        bytes32 proof = keccak256("verification_proof");
        vm.prank(verifier);
        escrow.completeTask(TASK_ID, proof);

        vm.prank(verifier);
        vm.expectRevert(HumanGridEscrow.TaskAlreadyCompleted.selector);
        escrow.completeTask(TASK_ID, proof);
    }

    /*//////////////////////////////////////////////////////////////
                            TASK CANCELLATION
    //////////////////////////////////////////////////////////////*/

    function test_CancelTaskByVerifier() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        uint256 requesterBalanceBefore = usdc.balanceOf(requester);

        vm.prank(verifier);
        escrow.cancelTask(TASK_ID);

        // Verify refund
        assertEq(
            usdc.balanceOf(requester),
            requesterBalanceBefore + TASK_AMOUNT
        );

        // Verify task cancelled
        HumanGridEscrow.Task memory task = escrow.getTask(TASK_ID);
        assertTrue(task.cancelled);
        assertFalse(escrow.isTaskActive(TASK_ID));
    }

    function test_CancelExpiredTaskByRequester() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        // Warp time forward past expiry
        vm.warp(block.timestamp + 25 hours);
        assertTrue(escrow.isTaskExpired(TASK_ID));

        uint256 requesterBalanceBefore = usdc.balanceOf(requester);

        vm.prank(requester);
        escrow.cancelTask(TASK_ID);

        // Verify refund
        assertEq(
            usdc.balanceOf(requester),
            requesterBalanceBefore + TASK_AMOUNT
        );
    }

    function testRevert_CancelTaskByRequesterBeforeExpiry() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.Unauthorized.selector);
        escrow.cancelTask(TASK_ID);
    }

    function testRevert_CancelCompletedTask() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        bytes32 proof = keccak256("verification_proof");
        vm.prank(verifier);
        escrow.completeTask(TASK_ID, proof);

        vm.prank(verifier);
        vm.expectRevert(HumanGridEscrow.TaskAlreadyCompleted.selector);
        escrow.cancelTask(TASK_ID);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateVerifier() public {
        address newVerifier = address(5);

        vm.prank(owner);
        escrow.updateVerifier(newVerifier);

        assertEq(escrow.verifier(), newVerifier);
    }

    function testRevert_UpdateVerifierUnauthorized() public {
        address newVerifier = address(5);

        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.Unauthorized.selector);
        escrow.updateVerifier(newVerifier);
    }

    function test_TransferOwnership() public {
        address newOwner = address(6);

        vm.prank(owner);
        escrow.transferOwnership(newOwner);

        assertEq(escrow.owner(), newOwner);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTING
    //////////////////////////////////////////////////////////////*/

    function testFuzz_CreateAndCompleteTask(uint256 amount) public {
        amount = bound(amount, 1e6, 1000000e6); // 1 to 1M USDC

        usdc.mint(requester, amount);

        vm.prank(requester);
        usdc.approve(address(escrow), amount);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, amount);

        bytes32 proof = keccak256("proof");
        vm.prank(verifier);
        escrow.completeTask(TASK_ID, proof);

        assertEq(usdc.balanceOf(worker), amount);
    }
}
