// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;
import "../RollUpStorage.sol";

interface IRollUpgradable {
  event SyncTx(bytes32 txHash);

  function verifyTxSet(RollUpStorage.Tx[] calldata txs) external returns (bool);
  function getChainId()external returns(uint);
  function isVerified(bytes32 hash)external returns(bool,address);
}

