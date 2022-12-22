import { expect } from "chai"
import { Chain, Common, Hardfork } from "@ethereumjs/common"
import { ethers } from "hardhat"
import { bigIntToUnpaddedBuffer, bufArrToArr } from "@ethereumjs/util"
import { AccessListEIP2930Transaction, AccessListEIP2930TxData, FeeMarketEIP1559Transaction, Transaction, TransactionFactory } from "@ethereumjs/tx"
import { RollUpgradable } from "../typechain-types/contracts/RollUpgradable"
import { randomBytes } from "crypto"
import { keccak256, RLP } from "ethers/lib/utils"


const privateKey_ = randomBytes(32);

function calculateSigRecovery(v: bigint, chainId?: bigint): bigint {
  if (v === BigInt(0) || v === BigInt(1)) return v

  if (chainId === undefined) {
    return v - BigInt(27)
  }
  return v - (chainId * BigInt(2) + BigInt(35))
}

function isValidSigRecovery(recovery: bigint): boolean {
  return recovery === BigInt(0) || recovery === BigInt(1)
}

describe("rollUpgradable", async function () {
  let rollUpgradable: RollUpgradable
  this.beforeEach(async () => {
    const RollUpgradable = await ethers.getContractFactory("RollUpgradable")
    rollUpgradable = await RollUpgradable.deploy()
    const accounts = await ethers.getSigners()
    rollUpgradable.initialize(accounts[0].address,4)
  })

  // legacy transaction
  it("Should verify legacy transaction success", async () => {

    const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Istanbul })
    const txData = {
      nonce: '0x00',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x2710',
      to: '0x0000000000000000000000000000000000000000',
      value: '0x00',
      data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
    }

    const tx = Transaction.fromTxData(txData, { common })
    const signedTx = tx.sign(privateKey_)
    let { v, r, s } = signedTx
    const recovery = calculateSigRecovery(v!, common.chainId())
    if(isValidSigRecovery(recovery)){
      const rollUpTx ={
        rlpTx:RLP.encode(bufArrToArr(tx.getMessageToSign(false))),
        v: recovery,
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }
      await rollUpgradable.verifyTxSet([rollUpTx]);
    }else{
      throw new Error('Invalid signature v value')
    }
  })

  // AccessListEIP2930Transaction
  it("Should verify accessListEIP2930Transaction success", async () => {
    const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.Berlin })
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
    }
    
    const tx = AccessListEIP2930Transaction.fromTxData(txData, { common })
    const signedTx = tx.sign(privateKey_)
    let { v, r, s } = signedTx        
   
    const rollUpTx ={
      rlpTx:"0x"+tx.getMessageToSign(false).toString('hex'),
      v: v!.toString(),
      r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
      s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
    }
    await rollUpgradable.verifyTxSet([rollUpTx]);
  })
  // FeeMarketEIP1559Tx
  it("Should verify FeeMarketEIP1559Tx success", async () => {
    const common = new Common({ chain: Chain.Rinkeby, hardfork: Hardfork.London })
    const txData = {
      type: "0x02",
      chainId: "0x04",
      nonce: "0x00",
      maxPriorityFeePerGas: "0x01",
      maxFeePerGas: "0xff",
      gasLimit: "0x02625a00",
      to: "0xcccccccccccccccccccccccccccccccccccccccc",
      value: "0x0186a0",
      data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      accessList: [],
    }

    const tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common })
    const signedTx = tx.sign(privateKey_)
    let { v, r, s } = signedTx
    const rollUpTx ={
      rlpTx:"0x"+tx.getMessageToSign(false).toString('hex'),
      v: v!.toString(),
      r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
      s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
    }
    await rollUpgradable.verifyTxSet([rollUpTx]);
  })

  // it("Should verify tx set success", async () => {
  //   const txData1 = {
  //     type: "0x02",
  //     chainId: "0x01",
  //     nonce: "0x00",
  //     maxPriorityFeePerGas: "0x01",
  //     maxFeePerGas: "0xff",
  //     gasLimit: "0x02625a00",
  //     to: "0xcccccccccccccccccccccccccccccccccccccccc",
  //     value: "0x0186a0",
  //     data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  //     accessList: [],
  //   }
  //   const txData2 = {
  //     type: "0x02",
  //     chainId: "0x01",
  //     nonce: "0x01",
  //     maxPriorityFeePerGas: "0x01",
  //     maxFeePerGas: "0xff",
  //     gasLimit: "0x02625a00",
  //     to: "0xcccccccccccccccccccccccccccccccccccccccc",
  //     value: "0x0186a0",
  //     data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  //     accessList: [],
  //   }
  //   const txData3 = {
  //     type: "0x02",
  //     chainId: "0x01",
  //     nonce: "0x02",
  //     maxPriorityFeePerGas: "0x01",
  //     maxFeePerGas: "0xff",
  //     gasLimit: "0x02625a00",
  //     to: "0xcccccccccccccccccccccccccccccccccccccccc",
  //     value: "0x0186a0",
  //     data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  //     accessList: [],
  //   }
   
  //   const tx1 = FeeMarketEIP1559Transaction.fromTxData(txData1, { common })
  //   const signedTx1 = tx1.sign(privateKey_)

  //   const tx2 = FeeMarketEIP1559Transaction.fromTxData(txData2, { common })
  //   const signedTx2 = tx2.sign(privateKey_)

  //   const tx3 = FeeMarketEIP1559Transaction.fromTxData(txData3, { common })
  //   const signedTx3 = tx3.sign(privateKey_)

  //   let t1, t2, t3
  //   {
  //     let { v, r, s } = signedTx1
  //     const rollUpTx1 = {
  //       rlpTx:"0x"+signedTx1.getMessageToSign(false).toString('hex'),
  //       v: v!.toString(),
  //       r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
  //       s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
  //     }
  //     t1 = rollUpTx1
  //   }
  //   {
  //     let { v, r, s } = signedTx2
  //     const rollUpTx2 = {
  //       rlpTx:"0x"+signedTx2.getMessageToSign(false).toString('hex'),
  //       v: v!.toString(),
  //       r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
  //       s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
  //     }
  //     t2 = rollUpTx2
  //   }
  //   {
  //     let { v, r, s } = signedTx3
  //     const rollUpTx3 = {
  //       rlpTx:"0x"+signedTx3.getMessageToSign(false).toString('hex'),
  //       v: v!.toString(),
  //       r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
  //       s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
  //     }

  //     t3 = rollUpTx3
  //   }

  //   const res = await rollUpgradable.verifyTxSet([t1,t2,t3])
  // })
})





