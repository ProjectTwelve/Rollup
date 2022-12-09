// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

contract RollUpStorage {
  // side chainId
  uint256 internal _chainId;

  // verified transaction
  mapping(bytes32 => address) internal _verified;

  struct Tx {
    uint256 txType; //  ---┐
    uint256 chainId; // |
    uint256 nonce; // |
    uint256 maxPriorityFeePerGas; // |
    uint256 maxFeePerGas; // |
    uint256 gasLimit; //  -┘
    address to; //  ---┐
    uint256 value; //  -┘
    bytes data;
    bytes[] accessList; // The above is the original transaction information
    bytes32 r;
    bytes32 s;
    uint8 v; // |
  }

  struct EncodedTx {
    bytes txType; //  ---┐
    bytes chainId; // |
    bytes nonce; // |
    bytes maxPriorityFeePerGas; // |
    bytes maxFeePerGas; // |
    bytes gasLimit; //  -┘
    bytes to; //  ---┐
    bytes value; //  -┘
    bytes data;
    bytes accessList; // The above is the original transaction information
    bytes r;
    bytes s;
    bytes v; // |
  }

  uint256[48] private __gap;
}
