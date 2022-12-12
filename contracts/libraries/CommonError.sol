// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

library CommonError {
    // pass zero address as args
    error ZeroAddressSet();
    // failed to compare the RLP encoded data with the original data after parsing 
    error RawDataNotMatch();
    // no permission to do something
    error NoPermission();
    // arrays are not allowed to be empty
    error ArrayCanNotEmpty();
    // failed to verify the original transaction from the sidechain
    error FailedVerifyTx();
}
