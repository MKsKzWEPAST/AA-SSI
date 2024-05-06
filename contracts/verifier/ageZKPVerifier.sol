// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {IZKPVerifier} from "@iden3/contracts/interfaces/IZKPVerifier.sol";
import {ArrayUtils} from "@iden3/contracts/lib/ArrayUtils.sol";
import "../smart-money/smart-money.sol";

contract ageZKPVerifier is IZKPVerifier, Ownable2StepUpgradeable {
    /**
     * @dev Max return array length for request queries
     */
    uint256 public constant REQUESTS_RETURN_LIMIT = 1000;

    uint64 public constant REQUEST_ID = 1;

    address public smartMoneyAddress = address(0);

    function setSmartMoneyAddress(address _smartMoneyAddress) external onlyOwner {
        smartMoneyAddress = _smartMoneyAddress;
    }

    /// @dev Main storage structure for the contract
    struct ZKPVerifierStorage {
        IZKPVerifier.ZKPRequest request;
        uint64 requestId;
    }

    // keccak256(abi.encode(uint256(keccak256("iden3.storage.ZKPVerifier")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 internal constant ZKPVerifierStorageLocation =
    0x512d18c55869273fec77e70d8a8586e3fb133e90f1db24c6bcf4ff3506ef6a00;

    /// @dev Get the main storage using assembly to ensure specific storage location
    function _getZKPVerifierStorage() internal pure returns (ZKPVerifierStorage storage $) {
        assembly {
            $.slot := ZKPVerifierStorageLocation
        }
    }

    function initialize() public initializer {
        __ZKPVerifier_init(_msgSender());
    }

    /**
     * @dev Sets the value for {initialOwner}.
     *
     * This value is immutable: it can only be set once during
     * construction.
     */

    function __ZKPVerifier_init(address initialOwner) internal onlyInitializing {
        ___ZKPVerifier_init_unchained(initialOwner);
    }

    function ___ZKPVerifier_init_unchained(address initialOwner) internal onlyInitializing {
        __Ownable_init(initialOwner);
    }

    function submitZKPResponse(
        uint64 requestId,
        uint256[] calldata inputs,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c
    ) public override {

        ZKPVerifierStorage storage s = _getZKPVerifierStorage();
        IZKPVerifier.ZKPRequest storage request = s.request;

        require(
            request.validator != ICircuitValidator(address(0)),
            "validator is not set for this request id"
        ); // validator exists

        request.validator.verify(inputs, a, b, c, request.data, msg.sender);
        _afterProofSubmit(requestId);
    }

    function getZKPRequest(
        uint64 requestId
    ) public view override returns (IZKPVerifier.ZKPRequest memory) {
        require(requestIdExists(requestId), "request id doesn't exist");
        return _getZKPVerifierStorage().request;
    }

    function setZKPRequest(
        uint64 requestId,
        ZKPRequest calldata request
    ) public override onlyOwner {
        ZKPVerifierStorage storage s = _getZKPVerifierStorage();
        s.request = request;
        s.requestId = requestId;
    }

    function getZKPRequestsCount() public pure returns (uint256) {
        return 1;
    }

    function requestIdExists(uint64 requestId) public pure override returns (bool) {
        return (requestId == 1);
    }

    function getZKPRequests(
        uint256 startIndex,
        uint256 length
    ) public view override returns (IZKPVerifier.ZKPRequest[] memory) {
        ZKPVerifierStorage storage s = _getZKPVerifierStorage();

        IZKPVerifier.ZKPRequest[] memory result = new IZKPVerifier.ZKPRequest[](1);
        result[0] = s.request;

        return result;
    }

    /**
     * @dev Hook that is called after any proof response submit
     */
    function _afterProofSubmit(
        uint64 nonce
    ) internal {
        // smartMoney logic
        SmartMoney smc = SmartMoney(smartMoneyAddress);
        smc.notify(nonce, true);
    }

    function deny(uint64 requestId) public onlyOwner {
        // smartMoney logic
        SmartMoney smc = SmartMoney(smartMoneyAddress);
        smc.notify(requestId, false);
    }
}