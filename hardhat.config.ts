import { HardhatUserConfig, task } from 'hardhat/config';
import { addFlatTask } from './tools/flat';
import * as dotenv from 'dotenv';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-gas-reporter';
import 'hardhat-deploy';

dotenv.config();
addFlatTask();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const accounts = process.env.ACCOUNTS ? process.env.ACCOUNTS.split(',') : [];
// const addresses = process.env.ADDESSSES ? process.env.ADDESSSES.split(',') : [];
const deployer = process.env.DEPLOYER!;
const owner = process.env.OWNER!;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 44102,
      // temporary fork url
      accounts: accounts.map((a) => {
        return { privateKey: a, balance: '100000000000000000000000000000000000' };
      }),
      forking: {
        url: process.env.BNB_CHAIN_TEST_URL!,
        blockNumber: 26503965,
      },
      deploy: ['deploy/hardhat'],
    },
    bnbTest: {
      url: process.env.BNB_CHAIN_TEST_URL,
      chainId: 97,
      accounts,
      gas: 'auto',
      gasPrice: 'auto',
      deploy: ['deploy/bnbTest'],
      tags: ['test'],
    },
    bnbMain: {
      url: process.env.BNB_CHAIN_URL,
      chainId: 56,
      accounts,
      gas: 'auto',
      gasPrice: 'auto',
      deploy: ['deploy/bnbMain'],
      tags: ['production'],
    },
  },
  gasReporter: {
    enabled: false,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      bnbTest: deployer,
      bnbMain: deployer,
    },
    owner: {
      default: 0,
      bnbTest: owner,
      bnbMain: owner,
    },
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/',
      },
    ],
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BNBSCAN_API_KEY!,
      bsc: process.env.BNBSCAN_API_KEY!,
    },
  },
};

export default config;
