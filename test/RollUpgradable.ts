import { expect } from "chai"
import { Chain, Common, Hardfork } from "@ethereumjs/common"
import { ethers } from "hardhat"
import { bigIntToUnpaddedBuffer, bufArrToArr } from "@ethereumjs/util"
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx"
import { RollUpgradable } from "../typechain-types/contracts/RollUpgradable"
import { randomBytes } from "crypto"
import { keccak256, RLP } from "ethers/lib/utils"

const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
const privateKey_ = randomBytes(32);

describe("rollUpgradable", async function () {
  let rollUpgradable: RollUpgradable
  this.beforeEach(async () => {
    const RollUpgradable = await ethers.getContractFactory("RollUpgradable")
    rollUpgradable = await RollUpgradable.deploy()
    const accounts = await ethers.getSigners()
    rollUpgradable.initialize(accounts[0].address)
  })

  it("Should verify single tx success", async () => {
    const txData = {
      type: "0x02",
      chainId: "0x01",
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
      rlpTxHash:"0x"+signedTx.hash().toString('hex'),
      v: v!.toString(),
      r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
      s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
    }
    const res = await rollUpgradable.verifyTxSet([rollUpTx]);
  })

  it("Should verify tx set success", async () => {
    const txData1 = {
      type: "0x02",
      chainId: "0x01",
      nonce: "0x00",
      maxPriorityFeePerGas: "0x01",
      maxFeePerGas: "0xff",
      gasLimit: "0x02625a00",
      to: "0xcccccccccccccccccccccccccccccccccccccccc",
      value: "0x0186a0",
      data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      accessList: [],
    }
    const txData2 = {
      type: "0x02",
      chainId: "0x01",
      nonce: "0x01",
      maxPriorityFeePerGas: "0x01",
      maxFeePerGas: "0xff",
      gasLimit: "0x02625a00",
      to: "0xcccccccccccccccccccccccccccccccccccccccc",
      value: "0x0186a0",
      data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      accessList: [],
    }
    const txData3 = {
      type: "0x02",
      chainId: "0x01",
      nonce: "0x02",
      maxPriorityFeePerGas: "0x01",
      maxFeePerGas: "0xff",
      gasLimit: "0x02625a00",
      to: "0xcccccccccccccccccccccccccccccccccccccccc",
      value: "0x0186a0",
      data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      accessList: [],
    }
    const privateKey = Buffer.from(
      "cf53da8e2fab30a115e2f8eadc4b774b9ef025b3b9cde5342e9ad90b47d7dbc3",
      "hex"
    )
    const tx1 = FeeMarketEIP1559Transaction.fromTxData(txData1, { common })
    const signedTx1 = tx1.sign(privateKey)

    const tx2 = FeeMarketEIP1559Transaction.fromTxData(txData2, { common })
    const signedTx2 = tx2.sign(privateKey)

    const tx3 = FeeMarketEIP1559Transaction.fromTxData(txData3, { common })
    const signedTx3 = tx3.sign(privateKey)

    let t1, t2, t3
    {
      let { v, r, s } = signedTx1
      const rollUpTx1 = {
        rlpTxHash:"0x"+signedTx1.hash().toString('hex'),
        v: v!.toString(),
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }
      t1 = rollUpTx1
    }
    {
      let { v, r, s } = signedTx2
      const rollUpTx2 = {
        rlpTxHash:"0x"+signedTx2.hash().toString('hex'),
        v: v!.toString(),
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }
      t2 = rollUpTx2
    }
    {
      let { v, r, s } = signedTx3
      const rollUpTx3 = {
        rlpTxHash:"0x"+signedTx3.hash().toString('hex'),
        v: v!.toString(),
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }

      t3 = rollUpTx3
    }

    const res = await rollUpgradable.verifyTxSet([t1, t2, t3])
  })
})





