// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

contract RollUpStorage {
    // side chainId
    uint256 internal _chainId;

    // verified transaction
    mapping(bytes32 => bool) internal _isVerified;

    struct Tx {
        address from;
        uint256 txType;
        uint256 chainId;
        uint256 nonce;
        uint256 maxPriorityFeePerGas;
        uint256 maxFeePerGas;
        uint256 gasLimit;
        address to;
        uint256 value;
        bytes data;
        bytes[] accessList; // The above is the original transaction information
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    uint256[48] private __gap;
}
