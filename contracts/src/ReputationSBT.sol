// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/**
 * @title ReputationSBT
 * @notice Soulbound tokens representing worker reputation milestones
 * @dev Non-transferable reputation badges minted by verifier
 *
 * Reputation tiers (examples):
 * 0 = New (no badge)
 * 1 = Bronze (10+ tasks)
 * 2 = Silver (50+ tasks)
 * 3 = Gold (200+ tasks)
 * 4 = Platinum (1000+ tasks)
 *
 * Note: Tier calculation happens off-chain in Rust.
 * This contract only mints badges based on verifier attestation.
 */
contract ReputationSBT {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error Unauthorized();
    error InvalidAddress();
    error InvalidTier();
    error CannotDowngrade();
    error Soulbound();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ReputationMinted(
        address indexed worker,
        uint8 tier,
        uint256 timestamp
    );
    event ReputationUpgraded(
        address indexed worker,
        uint8 oldTier,
        uint8 newTier
    );
    event VerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier
    );

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Authorized verifier (Rust service address)
    address public verifier;

    /// @notice Contract owner
    address public owner;

    /// @notice Worker address -> reputation tier
    mapping(address => uint8) public reputation;

    /// @notice Maximum tier (for validation)
    uint8 public constant MAX_TIER = 4;

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

    constructor(address _verifier) {
        if (_verifier == address(0)) revert InvalidAddress();

        verifier = _verifier;
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                        REPUTATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint or upgrade reputation badge
     * @dev Only callable by verifier with proof from Rust service
     * @param worker Worker address
     * @param tier New reputation tier (1-4)
     */
    function mint(address worker, uint8 tier) external onlyVerifier {
        if (worker == address(0)) revert InvalidAddress();
        if (tier == 0 || tier > MAX_TIER) revert InvalidTier();

        uint8 currentTier = reputation[worker];

        // Cannot downgrade reputation
        if (tier < currentTier) revert CannotDowngrade();

        // First time minting
        if (currentTier == 0) {
            reputation[worker] = tier;
            emit ReputationMinted(worker, tier, block.timestamp);
        }
        // Upgrading existing reputation
        else if (tier > currentTier) {
            reputation[worker] = tier;
            emit ReputationUpgraded(worker, currentTier, tier);
        }
        // else: tier == currentTier, no-op (idempotent)
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get reputation tier for a worker
     * @param worker Worker address
     * @return Reputation tier (0 = no badge, 1-4 = tier levels)
     */
    function getTier(address worker) external view returns (uint8) {
        return reputation[worker];
    }

    /**
     * @notice Get tier name (for display purposes)
     * @param tier Tier number
     * @return Tier name
     */
    function getTierName(uint8 tier) external pure returns (string memory) {
        if (tier == 0) return "New";
        if (tier == 1) return "Bronze";
        if (tier == 2) return "Silver";
        if (tier == 3) return "Gold";
        if (tier == 4) return "Platinum";
        return "Unknown";
    }

    /**
     * @notice Check if worker has any reputation
     * @param worker Worker address
     * @return True if worker has reputation badge
     */
    function hasReputation(address worker) external view returns (bool) {
        return reputation[worker] > 0;
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

    /*//////////////////////////////////////////////////////////////
                        SOULBOUND ENFORCEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Explicitly block transfers (soulbound)
     * @dev This is not an ERC721 - it's a pure reputation system
     */
    function transfer(address, address) external pure {
        revert Soulbound();
    }

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }
}
