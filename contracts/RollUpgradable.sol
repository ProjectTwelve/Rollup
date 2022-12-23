// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import './RollUpStorage.sol';
import './interfaces/IRollUpgradable.sol';
import './access/SafeOwnableUpgradeable.sol';
import './libraries/RLPReader.sol';
import './libraries/CommonError.sol';


contract RollUpgradable is RollUpStorage, IRollUpgradable, SafeOwnableUpgradeable, UUPSUpgradeable {
  using RLPReader for RLPReader.RLPItem;
  using RLPReader for bytes;

  /**
   * @dev verify tx set
   * @param txs pending transaction
   */
  function verifyTxSet(Tx[] calldata txs) external virtual override returns (bool) {
    uint chainId;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes32 rlpTxHash;
    uint len = txs.length;
    address singer;
    for (uint i = 0; i < len; i++) {
      Tx calldata t = txs[i];
      (rlpTxHash, chainId, v, r, s, singer) = _decodeTx(t);
      if (_verified[rlpTxHash] != address(0)) revert CommonError.TxAleadyExists(rlpTxHash,_verified[rlpTxHash]);
        
      if (_verifyTx(rlpTxHash, chainId, v, r, s, singer)) {
        _syncTx(singer, rlpTxHash);
      }
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
   * @dev get side chain id
   */
  function getChainId() public view virtual override returns (uint) {
    return _chainId;
  }

  /**
   * @dev check if the transaction has been verified,is so return (true,singer) otherwise return (false,0x00)
   */
  function isVerified(bytes32 hash) public view virtual override returns (bool, address) {
    return (_verified[hash] != address(0), _verified[hash]);
  }

  /**
   * @dev verify tx from side chain
   */
  function _verifyTx(
    bytes32 dataHash,
    uint256 chainId,
    uint8 v,
    bytes32 r,
    bytes32 s,
    address singer
  ) internal view returns (bool) {
    if (chainId != _chainId) revert CommonError.SidechainIdNotMatch();
    // ecrecover
    uint8 _v = v == 1 || v == 0 ? 27 + v : v;
    
    
    if (singer != ECDSA.recover(dataHash, _v, r, s)) revert CommonError.FailedVerifyTx();
    return true;
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
  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  function _decodeTx(Tx calldata t) internal pure returns (bytes32, uint256, uint8, bytes32, bytes32, address) {
    bytes memory rlpTx = t.rlpTx;
    RLPReader.RLPItem memory raw = rlpTx.toRlpItem();
    if (RLPReader.isList(raw)) {
      RLPReader.RLPItem[] memory ls = raw.toList();
      return (keccak256(t.rlpTx), ls[6].toUint(), t.v, t.r, t.s, t.singer);
    } else {
      return (keccak256(t.rlpTx), RLPReader.getChainId(t.rlpTx[1:]), t.v, t.r, t.s, t.singer);
    }
  }

}
