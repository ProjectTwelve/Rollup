import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const owner = deployer;
  // TODO if sidechain is ready modify chainId to correct
  const chainId = 1

  // Be carefully: Check whether proxy contract is initialized successfully
  await deploy('RollUpgradable', {
    from: deployer,
    args: [],
    proxy: {
      proxyContract: 'ERC1967Proxy',
      proxyArgs: ['{implementation}', '{data}'],
      execute: {
        init: {
          methodName: 'initialize',
          args: [owner,chainId],
        },
      },
    },
    log: true,
  });
};
func.tags = ['RollUpgradable'];

export default func;
