//SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import 'forge-std/Test.sol';
import 'forge-std/Vm.sol';
import 'forge-std/console.sol';

import { RollUpgradable } from 'contracts/RollUpgradable.sol';

import { ERC1967Proxy } from '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';

import { UUPSUpgradeable } from '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';

contract VerifyNewOwner is Test {
  uint256 bnbChainFork;

  RollUpgradable private _newImplementation;
  UUPSUpgradeable private _proxy;

  function setUp() public {
    string memory bnbChainRpcUrl = vm.envString('BNB_CHAIN_URL');

    bnbChainFork = vm.createFork(bnbChainRpcUrl);
    vm.selectFork(bnbChainFork);
    // select a specific number
    vm.rollFork(25174100);

    _newImplementation = new RollUpgradable();

    _proxy = UUPSUpgradeable(0x80697eE36B4cc09a7F1dDFC30B2C6447Cc2F2785);
  }

  function testOwnerNotChangeAfterUpgrade() public {
    address oldOwner = RollUpgradable(address(_proxy)).owner();
    vm.prank(oldOwner);
    _proxy.upgradeTo(address(_newImplementation));

    address newOwner = RollUpgradable(address(_proxy)).owner();

    assertEq(oldOwner, newOwner);
  }

  function testUpgradeToNewSuccess() public {
    vm.rollFork(25174632);
    _newImplementation = RollUpgradable(0xba7F98483CB6470e5671be33f8C2AE7d311347Bd);

    address oldOwner = RollUpgradable(address(_proxy)).owner();
    vm.prank(oldOwner);
    _proxy.upgradeTo(address(_newImplementation));

    address newOwner = RollUpgradable(address(_proxy)).owner();
    assertEq(oldOwner, newOwner);
  }
}
