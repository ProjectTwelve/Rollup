// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RollUpStorage.sol";
import "./interfaces/IRollUpgradable.sol";
import "./access/SafeOwnableUpgradeable.sol";



contract RollUpgradable is
  RollUpStorage,
  IRollUpgradable,
  SafeOwnableUpgradeable,
  UUPSUpgradeable
{
  
  /**
   * @dev verify tx set
   * @param txs pending transaction
   */
  function verifyTxSet(
    Tx[] calldata txs
  ) external virtual override returns (bool) {
    bytes32 hashTx;
    uint8 v;
    bytes32 r;
    bytes32 s;

    for (uint256 i = 0; i < txs.length; i++) {
      Tx calldata t = txs[i];
      (hashTx, v, r, s) = _decodeTx(t);
      if (_verified[hashTx] != address(0)) {
        continue;
      }
      address from = _verifyTx(hashTx, v, r, s);
      if(from == address(0)) revert CommonError.FailedVerifyTx();
  
      _syncTx(from, hashTx);
    }

    return true;
  }

  /**
   * @dev initialize contract
   */
  function initialize(address owner_) public initializer {

    __Ownable_init_unchained(owner_);
  }

  /**
   * @dev verify tx from side chain
   */
  function _verifyTx(
    bytes32 dataHash,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal pure returns (address signer) {
    
    // ecrecover
    uint8 _v = v == 1 || v == 0 ? 27 + v : v;
    signer = ECDSA.recover(dataHash, _v, r, s);
  }

  /**
   * @dev sync tx from side chain
   */
  function _syncTx(address from, bytes32 dataHash) internal {
    _verified[dataHash] = from;
    emit SyncTx(dataHash);
  }

  /**
   * @dev upgrade function
   */
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  function _decodeTx(
    Tx calldata t
  ) internal pure returns (bytes32, uint8, bytes32, bytes32) {
    bytes32 txHash = t.rlpTxHash;
    uint8 v = t.v;
    bytes32 r = t.r;
    bytes32 s = t.s;

    return (txHash, v, r, s);
  }
}

