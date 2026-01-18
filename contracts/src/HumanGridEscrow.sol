// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IERC20} from "./interfaces/IERC20.sol";

/**
 * @title HumanGridEscrow
 * @notice Trustless USDC escrow for human task verification
 * @dev Solidity is intentionally boring — it is a vault, not a brain.
 *
 * This contract ONLY handles:
 * - Holding USDC in escrow
 * - Releasing payments on verifier approval
 * - Emitting immutable events
 *
 * This contract DOES NOT handle:
 * - Task validation logic (that's Rust)
 * - CAPTCHA verification (that's Rust)
 * - Confidence scoring (that's Rust)
 * - Fraud detection (that's Rust)
 */
contract HumanGridEscrow {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error Unauthorized();
    error InvalidAmount();
    error TaskNotFound();
    error TaskAlreadyExists();
    error TaskAlreadyCompleted();
    error TaskNotExpired();
    error TransferFailed();
    error InvalidAddress();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TaskCreated(
        bytes32 indexed taskId,
        address indexed requester,
        address indexed worker,
        uint256 amount,
        uint256 createdAt
    );

    event TaskCompleted(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 amount,
        uint256 completedAt
    );

    event TaskCancelled(
        bytes32 indexed taskId,
        address indexed requester,
        uint256 refundAmount,
        uint256 cancelledAt
    );

    event VerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier
    );

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    struct Task {
        address requester;
        address worker;
        uint256 amount;
        uint256 createdAt;
        bool completed;
        bool cancelled;
    }

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Authorized verifier (Rust service address)
    address public verifier;

    /// @notice Contract owner
    address public owner;

    /// @notice Task ID -> Task details
    mapping(bytes32 => Task) public tasks;

    /// @notice Task expiration time (24 hours)
    uint256 public constant TASK_EXPIRY = 24 hours;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert Unauthorized();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _usdc, address _verifier) {
        if (_usdc == address(0) || _verifier == address(0))
            revert InvalidAddress();

        usdc = IERC20(_usdc);
        verifier = _verifier;
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                        CORE ESCROW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new task and deposit USDC into escrow
     * @dev Requester must approve USDC before calling
     * @param taskId Unique task identifier (generated off-chain)
     * @param worker Address of the assigned human worker
     * @param amount USDC amount to pay upon completion
     */
    function createTask(
        bytes32 taskId,
        address worker,
        uint256 amount
    ) external {
        if (amount == 0) revert InvalidAmount();
        if (worker == address(0)) revert InvalidAddress();
        if (tasks[taskId].createdAt != 0) revert TaskAlreadyExists();

        // Transfer USDC from requester to escrow
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        // Store task details
        tasks[taskId] = Task({
            requester: msg.sender,
            worker: worker,
            amount: amount,
            createdAt: block.timestamp,
            completed: false,
            cancelled: false
        });

        emit TaskCreated(taskId, msg.sender, worker, amount, block.timestamp);
    }

    /**
     * @notice Complete a task and release payment to worker
     * @dev Only callable by authorized verifier (Rust service)
     * @param taskId Task to complete
     * @param proof Optional verification proof (for event logging)
     */
    function completeTask(bytes32 taskId, bytes32 proof) external onlyVerifier {
        Task storage task = tasks[taskId];

        if (task.createdAt == 0) revert TaskNotFound();
        if (task.completed) revert TaskAlreadyCompleted();
        if (task.cancelled) revert TaskNotFound();

        // Mark as completed
        task.completed = true;

        // Transfer USDC to worker
        bool success = usdc.transfer(task.worker, task.amount);
        if (!success) revert TransferFailed();

        emit TaskCompleted(taskId, task.worker, task.amount, block.timestamp);
    }

    /**
     * @notice Cancel an expired or invalid task and refund requester
     * @dev Can be called by requester after expiry or by verifier anytime
     * @param taskId Task to cancel
     */
    function cancelTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];

        if (task.createdAt == 0) revert TaskNotFound();
        if (task.completed) revert TaskAlreadyCompleted();
        if (task.cancelled) revert TaskNotFound();

        // Only verifier can cancel before expiry
        bool isVerifier = msg.sender == verifier;
        bool isRequester = msg.sender == task.requester;
        bool isExpired = block.timestamp >= task.createdAt + TASK_EXPIRY;

        if (!isVerifier && !(isRequester && isExpired)) {
            revert Unauthorized();
        }

        // Mark as cancelled
        task.cancelled = true;

        // Refund USDC to requester
        bool success = usdc.transfer(task.requester, task.amount);
        if (!success) revert TransferFailed();

        emit TaskCancelled(
            taskId,
            task.requester,
            task.amount,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get task details
     * @param taskId Task identifier
     * @return Task struct
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Check if task is active (not completed or cancelled)
     * @param taskId Task identifier
     * @return True if task is active
     */
    function isTaskActive(bytes32 taskId) external view returns (bool) {
        Task memory task = tasks[taskId];
        return task.createdAt != 0 && !task.completed && !task.cancelled;
    }

    /**
     * @notice Check if task is expired
     * @param taskId Task identifier
     * @return True if task has expired
     */
    function isTaskExpired(bytes32 taskId) external view returns (bool) {
        Task memory task = tasks[taskId];
        return
            task.createdAt != 0 &&
            block.timestamp >= task.createdAt + TASK_EXPIRY &&
            !task.completed &&
            !task.cancelled;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update verifier address
     * @dev Only owner can update
     * @param newVerifier New verifier address
     */
    function updateVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert InvalidAddress();

        address oldVerifier = verifier;
        verifier = newVerifier;

        emit VerifierUpdated(oldVerifier, newVerifier);
    }

    /**
     * @notice Transfer ownership
     * @dev Only owner can transfer
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}
