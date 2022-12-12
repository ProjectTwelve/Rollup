// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

contract RollUpStorage {
  // sidechain id
  uint256 internal _chainId;


  // verified transaction
  mapping(bytes32 => address) internal _verified;
  struct Tx {
    bytes rlpTx;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  uint256[49] private __gap;
}


