// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RollUpStorage.sol";
import "./interfaces/IRollUpgradable.sol";
import "./access/SafeOwnableUpgradeable.sol";
import "./libraries/RLPReader.sol";

contract RollUpgradable is
  RollUpStorage,
  IRollUpgradable,
  SafeOwnableUpgradeable,
  UUPSUpgradeable
{
  using RLPReader for RLPReader.RLPItem;
  using RLPReader for bytes;

  /**
   * @dev verify tx set
   * @param txs pending transaction
   */
  function verifyTxSet(
    Tx[] calldata txs
  ) external virtual override returns (bool) {
    uint chainId;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 rlpTxHash;
    uint len = txs.length;
    for (uint256 i = 0; i < len; i++) {
      Tx calldata t = txs[i];
      (rlpTxHash, chainId, v, r, s) = _decodeTx(t);
      if (_verified[rlpTxHash] != address(0)) {
        continue;
      }
      address from = _verifyTx(rlpTxHash, chainId, v, r, s);

      _syncTx(from, rlpTxHash);
    }

    return true;
  }

  /**
   * @dev initialize contract
   */
  function initialize(address owner_, uint256 chainId_) public initializer {
    _chainId = chainId_;
    __Ownable_init_unchained(owner_);
  }

  /**
   * @dev verify tx from side chain
   */
  function _verifyTx(
    bytes32 dataHash,
    uint256 chainId,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal view returns (address signer) {
    if (chainId != _chainId) revert CommonError.SidechainIdNotMatch();
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
  ) internal pure returns (bytes32, uint256, uint8, bytes32, bytes32) {
    bytes memory rlpTx = t.rlpTx[1:];
    RLPReader.RLPItem[] memory ls = rlpTx.toRlpItem().toList();
    uint256 chainId = ls[0].toUint();
    uint8 v = t.v;
    bytes32 r = t.r;
    bytes32 s = t.s;
    bytes32 rlpTxHash = keccak256(t.rlpTx);
    return (rlpTxHash, chainId, v, r, s);
  }
}

