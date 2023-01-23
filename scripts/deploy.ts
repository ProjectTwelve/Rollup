import { ethers } from 'hardhat';
import { RollUpgradable } from '../typechain-types/contracts/RollUpgradable';

async function main() {
  const rollUpBefore = (await ethers.getContractAt(
    'RollUpgradable',
    '0x5f0983517D37FEB7Eb9b5823862B5c22fB5D5E1c',
  )) as RollUpgradable;

  const owner = await ethers.getSigner('0xfed03676c595dd1f1c6716a446cd44b4c90ad290');

  const rollUpF = await ethers.getContractFactory('RollUpgradable');
  const implementation = await rollUpF.deploy();

  await rollUpBefore.connect(owner).upgradeTo(implementation.address);

  console.log('Owner after upgrade: ' + (await rollUpBefore.owner()));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
