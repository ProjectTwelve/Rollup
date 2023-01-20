import { Chain, Common, Hardfork } from '@ethereumjs/common';
import { ethers } from 'hardhat';
import { Address, bigIntToUnpaddedBuffer, bufArrToArr } from '@ethereumjs/util';
import { AccessListEIP2930Transaction, FeeMarketEIP1559Transaction, Transaction } from '@ethereumjs/tx';
import { RollUpgradable } from '../typechain-types/contracts/RollUpgradable';
import { randomBytes } from 'crypto';
import { RLP } from 'ethers/lib/utils';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

const privateKey_ = randomBytes(32);

function calculateSigRecovery(v: bigint, chainId?: bigint): bigint {
  if (v === BigInt(0) || v === BigInt(1)) return v;

  if (chainId === undefined) {
    return v - BigInt(27);
  }
  return v - (chainId * BigInt(2) + BigInt(35));
}

function isValidSigRecovery(recovery: bigint): boolean {
  return recovery === BigInt(0) || recovery === BigInt(1);
}

describe('rollUpgradable', async function () {
  let rollUpgradable: RollUpgradable;
  this.beforeEach(async () => {
    const RollUpgradable = await ethers.getContractFactory('RollUpgradable');
    rollUpgradable = await RollUpgradable.deploy();
    const accounts = await ethers.getSigners();
    rollUpgradable.initialize(accounts[0].address, 4);
  });

  // legacy transaction
  it('Should verify legacy transaction success', async () => {
    const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Istanbul });
    const txData = {
      nonce: '0x00',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x2710',
      to: '0x0000000000000000000000000000000000000000',
      value: '0x00',
      data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
    };

    const tx = Transaction.fromTxData(txData, { common });
    const signedTx = tx.sign(privateKey_);
    const { v, r, s } = signedTx;
    const singer = Address.fromPublicKey(signedTx.getSenderPublicKey()).toString();
    const recovery = calculateSigRecovery(v!, common.chainId());
    if (isValidSigRecovery(recovery)) {
      const rollUpTx = {
        rlpTx: RLP.encode(bufArrToArr(tx.getMessageToSign(false))),
        v: recovery,
        r: '0x' + bigIntToUnpaddedBuffer(r!).toString('hex'),
        s: '0x' + bigIntToUnpaddedBuffer(s!).toString('hex'),
        singer,
      };
      await rollUpgradable.verifyTxSet([rollUpTx]);
    } else {
      throw new Error('Invalid signature v value');
    }
  });

  // AccessListEIP2930Transaction
  it('Should verify accessListEIP2930Transaction success', async () => {
    const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Berlin });
    const txData = {
      data: '0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      gasLimit: '0x02625a00',
      gasPrice: '0x01',
      nonce: '0x00',
      to: '0xcccccccccccccccccccccccccccccccccccccccc',
      value: '0x0186a0',
      chainId: '0x04',
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000101',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            '0x00000000000000000000000000000000000000000000000000000000000060a7',
          ],
        },
      ],
      type: '0x01',
    };

    const tx = AccessListEIP2930Transaction.fromTxData(txData, { common });
    const signedTx = tx.sign(privateKey_);
    const { v, r, s } = signedTx;
    const singer = Address.fromPublicKey(signedTx.getSenderPublicKey()).toString();
    const rollUpTx = {
      rlpTx: '0x' + tx.getMessageToSign(false).toString('hex'),
      v: v!.toString(),
      r: '0x' + bigIntToUnpaddedBuffer(r!).toString('hex'),
      s: '0x' + bigIntToUnpaddedBuffer(s!).toString('hex'),
      singer,
    };
    await rollUpgradable.verifyTxSet([rollUpTx]);
  });
  // // FeeMarketEIP1559Tx
  it('Should verify FeeMarketEIP1559Tx success', async () => {
    const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.London });
    const txData = {
      type: '0x02',
      chainId: '0x04',
      nonce: '0x00',
      maxPriorityFeePerGas: '0x01',
      maxFeePerGas: '0xff',
      gasLimit: '0x02625a00',
      to: '0xcccccccccccccccccccccccccccccccccccccccc',
      value: '0x0186a0',
      data: '0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      accessList: [],
    };

    const tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common });
    const signedTx = tx.sign(privateKey_);
    const singer = Address.fromPublicKey(signedTx.getSenderPublicKey()).toString();
    const { v, r, s } = signedTx;
    const rollUpTx = {
      rlpTx: '0x' + tx.getMessageToSign(false).toString('hex'),
      v: v!.toString(),
      r: '0x' + bigIntToUnpaddedBuffer(r!).toString('hex'),
      s: '0x' + bigIntToUnpaddedBuffer(s!).toString('hex'),
      singer,
    };
    await rollUpgradable.verifyTxSet([rollUpTx]);
  });

  it('Should publish a transaction successfully', async () => {
    const txHash = BigNumber.from(ethers.utils.randomBytes(32)).toHexString();

    expect(await rollUpgradable.isTxPublished(txHash)).to.be.eq(false);

    await expect(rollUpgradable.publishTx(txHash)).to.be.emit(rollUpgradable, 'PublishTx').withArgs(txHash);

    expect(await rollUpgradable.isTxPublished(txHash)).to.be.eq(true);
  });

  it('Should publish a existed transaction fail', async () => {
    const txHash = BigNumber.from(ethers.utils.randomBytes(32)).toHexString();

    await expect(rollUpgradable.publishTx(txHash)).to.be.emit(rollUpgradable, 'PublishTx').withArgs(txHash);

    await expect(rollUpgradable.publishTx(txHash)).to.be.revertedWithCustomError(rollUpgradable, 'TxAlreadyPublished');
  });
});
