import { expect } from "chai"
import { Chain, Common, Hardfork } from "@ethereumjs/common"
import { ethers } from "hardhat"
import { bigIntToUnpaddedBuffer, bufArrToArr } from "@ethereumjs/util"
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx"
import { RollUpgradable } from "../typechain-types/contracts/RollUpgradable"
import { randomBytes } from "crypto"

const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
const privateKey_ = randomBytes(32);

describe("rollUpgradable", async function () {
  let rollUpgradable: RollUpgradable
  this.beforeEach(async () => {
    const RollUpgradable = await ethers.getContractFactory("RollUpgradable")
    rollUpgradable = await RollUpgradable.deploy()
    const accounts = await ethers.getSigners()
    rollUpgradable.initialize(accounts[0].address, 1)
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
    const rawTxHash = signedTx.hash().toString("hex")
    let { v, r, s } = signedTx;
    const rollUpTx = {
      txType: 2,
      chainId: 1,
      nonce: 0,
      maxPriorityFeePerGas: 1,
      maxFeePerGas: 255,
      gasLimit: 40000000,
      to: "0xcccccccccccccccccccccccccccccccccccccccc",
      value: 100000,
      data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      accessList: [],
      v: v!.toString(),
      r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
      s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
    }
    console.log("from: ",  signedTx.getSenderAddress().toString())
    const res = await rollUpgradable.verifyTxSet([rollUpTx])
    let txHash;
    (await res.wait()).events!.forEach(async (x) => {
      if (x.event === "SyncTx") {
        txHash = x.args!.txHash
      }
    })
    expect(await txHash).to.be.equal("0x" + rawTxHash)
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
        txType: 2,
        chainId: 1,
        nonce: 0,
        maxPriorityFeePerGas: 1,
        maxFeePerGas: 255,
        gasLimit: 40000000,
        to: "0xcccccccccccccccccccccccccccccccccccccccc",
        value: 100000,
        data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        accessList: [],
        v: v!.toString(),
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }
      t1 = rollUpTx1
    }
    {
      let { v, r, s } = signedTx2
      const rollUpTx2 = {
        txType: 2,
        chainId: 1,
        nonce: 1,
        maxPriorityFeePerGas: 1,
        maxFeePerGas: 255,
        gasLimit: 40000000,
        to: "0xcccccccccccccccccccccccccccccccccccccccc",
        value: 100000,
        data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        accessList: [],
        v: v!.toString(),
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }
      t2 = rollUpTx2
    }
    {
      let { v, r, s } = signedTx3
      const rollUpTx3 = {
        txType: 2,
        chainId: 1,
        nonce: 2,
        maxPriorityFeePerGas: 1,
        maxFeePerGas: 255,
        gasLimit: 40000000,
        to: "0xcccccccccccccccccccccccccccccccccccccccc",
        value: 100000,
        data: "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        accessList: [],
        v: v!.toString(),
        r: "0x" + bigIntToUnpaddedBuffer(r!).toString("hex"),
        s: "0x" + bigIntToUnpaddedBuffer(s!).toString("hex"),
      }

      t3 = rollUpTx3
    }

    const res = await rollUpgradable.verifyTxSet([t1, t2, t3])
  })
})
