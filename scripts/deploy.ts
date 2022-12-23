import { ethers } from 'hardhat';

async function main() {
  const RollUpgradable = await ethers.getContractFactory('RollUpgradable');
  const rollUpgradable = await RollUpgradable.deploy();

  console.log('rollUpgradable deployed to:', rollUpgradable.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
