// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

contract RollUpStorage {
 
  // verified transaction
  mapping(bytes32 => address) internal _verified;
  struct Tx {
    bytes32 rlpTxHash;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  uint256[49] private __gap;
}

