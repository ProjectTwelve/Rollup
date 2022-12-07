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
  function verifyTxSet(
    Tx[] calldata txs
  ) external virtual override returns (bool) {
    uint256 len = txs.length;
    if (len == 0) revert CommonError.ArrayCanNotEmpty();

    for (uint i = 0; i < len; i++) {
      Tx calldata t = txs[i];

      // skip if transaction already verified
      bytes32 txHash = _computeTxHash(t);
      if (_isVerified[txHash]) {
        continue;
      }
      bytes32 dataHash = keccak256(_rlpEncdeTx(t));
      if(!_verifyTx(dataHash, t.from, t.chainId, t.v, t.r, t.s))
        revert CommonError.FailedVerifyTx();
      _syncTx(_computeTxHash(t));
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
    address singer,
    uint chainId,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal view returns (bool) {
    // check if the transaction is from the target chain
    if (_chainId != chainId) revert CommonError.chainIdNotMatch();

    // ecrecover
    uint8 _v = v == 1 || v == 0 ? 27 + v : v;
    return singer == ECDSA.recover(dataHash, _v, r, s);
  }

  /**
   * @dev sync tx from side chain
   */
  function _syncTx(bytes32 txHash) internal {
    _isVerified[txHash] = true;
    emit SyncTx(txHash);
  }

  /**
   * @dev upgrade function
   */
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  /**
   * @dev computes a sha3-256 hash of the serialized tx.
   */
  function _computeTxHash(Tx calldata t) internal pure returns (bytes32) {
    bytes memory txType = RLPEncode.encodeUint(t.txType);
    bytes[] memory tmp = new bytes[](12);
    tmp[0] = RLPEncode.encodeUint(t.chainId);
    tmp[1] = RLPEncode.encodeUint(t.nonce);
    tmp[2] = RLPEncode.encodeUint(t.maxPriorityFeePerGas);
    tmp[3] = RLPEncode.encodeUint(t.maxFeePerGas);
    tmp[4] = RLPEncode.encodeUint(t.gasLimit);
    tmp[5] = RLPEncode.encodeAddress(t.to);
    tmp[6] = RLPEncode.encodeUint(t.value);
    tmp[7] = RLPEncode.encodeBytes(t.data);
    tmp[8] = RLPEncode.encodeList(t.accessList);
    tmp[9] = RLPEncode.encodeUint(t.v);
    tmp[10] = RLPEncode.encodeBytes(_bytes32ToBytes(t.r));
    tmp[11] = RLPEncode.encodeBytes(_bytes32ToBytes(t.s));

    return keccak256(RLPEncode.concat(txType, RLPEncode.encodeList(tmp)));
  }

  /**
   * @dev RLP encodes the signed part of tx
   */
  function _rlpEncdeTx(Tx calldata t) internal pure returns (bytes memory) {
    bytes memory txType = RLPEncode.encodeUint(t.txType);
    bytes[] memory tmp = new bytes[](9);
    tmp[0] = RLPEncode.encodeUint(t.chainId);
    tmp[1] = RLPEncode.encodeUint(t.nonce);
    tmp[2] = RLPEncode.encodeUint(t.maxPriorityFeePerGas);
    tmp[3] = RLPEncode.encodeUint(t.maxFeePerGas);
    tmp[4] = RLPEncode.encodeUint(t.gasLimit);
    tmp[5] = RLPEncode.encodeAddress(t.to);
    tmp[6] = RLPEncode.encodeUint(t.value);
    tmp[7] = RLPEncode.encodeBytes(t.data);
    tmp[8] = RLPEncode.encodeList(t.accessList);

    return RLPEncode.concat(txType, RLPEncode.encodeList(tmp));
  }

  function _bytes32ToBytes(bytes32 b)internal pure returns (bytes memory){
    bytes memory tmp = new bytes(32);
    for(uint i=0;i<32;i++){
        tmp[i] = b[i];
    }
    return tmp;
  }
}
