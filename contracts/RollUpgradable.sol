// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RollUpStorage.sol";
import "./interfaces/IRollUpgradable.sol";
import "./access/SafeOwnableUpgradeable.sol";
import "./libraries/RLPReader.sol";
import "./libraries/RLPEncode.sol";

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
  function verifyTxSet(Tx[] calldata txs)
    external
    virtual
    override
    returns (bool)
  {
    for (uint256 i = 0; i < txs.length; i++) {
      Tx calldata t = txs[i];
      EncodedTx memory encoded = _encodeUnit(t);

      bytes32 dataHash = _computeDataHash(encoded);
      address from = _verifyTx(dataHash, t.chainId, t.v, t.r, t.s);
      bytes32 txHash = _computeTxHash(encoded);

      _syncTx(from, txHash);
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
    // check if the transaction is from the target chain
    if (_chainId != chainId) revert CommonError.chainIdNotMatch();

    // ecrecover
    uint8 _v = v == 1 || v == 0 ? 27 + v : v;
    signer = ECDSA.recover(dataHash, _v, r, s);
  }

  /**
   * @dev sync tx from side chain
   */
  function _syncTx(address from, bytes32 txHash) internal {
    _verified[txHash] = from;
    emit SyncTx(txHash);
  }

  /**
   * @dev upgrade function
   */
  function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner
  {}

  /**
   * @dev computes a sha3-256 hash of the serialized tx.
   */
  function _encodeUnit(Tx calldata t) internal returns (EncodedTx memory) {
    EncodedTx memory tmp;
    tmp.txType = RLPEncode.encodeUint8(t.txType);
    tmp.chainId = RLPEncode.encodeUint16(t.chainId);
    tmp.nonce = RLPEncode.encodeUint32(t.nonce);
    tmp.maxPriorityFeePerGas = RLPEncode.encodeUint48(t.maxPriorityFeePerGas);
    tmp.maxFeePerGas = RLPEncode.encodeUint48(t.maxFeePerGas);
    tmp.gasLimit = RLPEncode.encodeUint32(t.gasLimit);
    tmp.to = RLPEncode.encodeAddress(t.to);
    tmp.value = RLPEncode.encodeUint96(t.value);
    tmp.data = RLPEncode.encodeBytes(t.data);
    tmp.accessList = RLPEncode.encodeList(t.accessList);
    tmp.v = RLPEncode.encodeUint8(t.v);
    tmp.r = RLPEncode.encodeBytes32(t.r);
    tmp.s = RLPEncode.encodeBytes32(t.s);

    return tmp;
  }

  /**
   * @dev computes a sha3-256 hash of the serialized tx.
   */
  function _computeTxHash(EncodedTx memory t) internal returns (bytes32) {
    return
      keccak256(
        RLPEncode.concat(
          t.txType,
          RLPEncode.encode12List(
            [
              t.chainId,
              t.nonce,
              t.maxPriorityFeePerGas,
              t.maxFeePerGas,
              t.gasLimit,
              t.to,
              t.value,
              t.data,
              t.accessList,
              t.v,
              t.r,
              t.s
            ]
          )
        )
      );
  }

  /**
   * @dev
   */
  function _computeDataHash(EncodedTx memory t) internal returns (bytes32) {
    return
      keccak256(
        RLPEncode.concat(
          t.txType,
          RLPEncode.encode9List(
            [
              t.chainId,
              t.nonce,
              t.maxPriorityFeePerGas,
              t.maxFeePerGas,
              t.gasLimit,
              t.to,
              t.value,
              t.data,
              t.accessList
            ]
          )
        )
      );
  }

  function _bytes32ToBytes(bytes32 b) internal returns (bytes memory) {
    return abi.encodePacked(b);
  }
}
