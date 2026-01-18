// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/HumanGridEscrow.sol";
import "../src/interfaces/IERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing
 */
contract MockUSDC is IERC20 {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    function mint(address to, uint256 amount) external {
        balances[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

contract HumanGridEscrowTest is Test {
    HumanGridEscrow public escrow;
    MockUSDC public usdc;

    address public owner = address(1);
    address public verifier = address(2);
    address public requester = address(3);
    address public worker = address(4);

    uint256 constant TASK_AMOUNT = 10e6; // 10 USDC (6 decimals)
    bytes32 constant TASK_ID = keccak256("task1");

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy escrow
        vm.prank(owner);
        escrow = new HumanGridEscrow(address(usdc), verifier);

        // Fund requester
        usdc.mint(requester, 1000e6);
    }

    /*//////////////////////////////////////////////////////////////
                            TASK CREATION
    //////////////////////////////////////////////////////////////*/

    function test_CreateTask() public {
        // Approve USDC
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);

        // Create task
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

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
        uint256 requesterBalanceBefore = usdc.balanceOf(requester);
        uint256 escrowBalanceBefore = usdc.balanceOf(address(escrow));

        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);

        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        assertEq(
            usdc.balanceOf(requester),
            requesterBalanceBefore - TASK_AMOUNT
        );
        assertEq(
            usdc.balanceOf(address(escrow)),
            escrowBalanceBefore + TASK_AMOUNT
        );
    }

    function testRevert_CreateTaskWithoutApproval() public {
        vm.prank(requester);
        vm.expectRevert();
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);
    }

    function testRevert_CreateTaskZeroAmount() public {
        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.InvalidAmount.selector);
        escrow.createTask(TASK_ID, worker, 0);
    }

    function testRevert_CreateTaskZeroWorker() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);

        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.InvalidAddress.selector);
        escrow.createTask(TASK_ID, address(0), TASK_AMOUNT);
    }

    function testRevert_CreateDuplicateTask() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT * 2);

        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        vm.prank(requester);
        vm.expectRevert(HumanGridEscrow.TaskAlreadyExists.selector);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);
    }

    /*//////////////////////////////////////////////////////////////
                            TASK COMPLETION
    //////////////////////////////////////////////////////////////*/

    function test_CompleteTask() public {
        // Create task
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

        uint256 workerBalanceBefore = usdc.balanceOf(worker);

        // Complete task
        bytes32 proof = keccak256("verification_proof");
        vm.prank(verifier);
        escrow.completeTask(TASK_ID, proof);

        // Verify task completed
        HumanGridEscrow.Task memory task = escrow.getTask(TASK_ID);
        assertTrue(task.completed);
        assertFalse(escrow.isTaskActive(TASK_ID));

        // Verify payment transferred
        assertEq(usdc.balanceOf(worker), workerBalanceBefore + TASK_AMOUNT);
    }

    function testRevert_CompleteTaskUnauthorized() public {
        vm.prank(requester);
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

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
        usdc.approve(address(escrow), TASK_AMOUNT);
        vm.prank(requester);
        escrow.createTask(TASK_ID, worker, TASK_AMOUNT);

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
