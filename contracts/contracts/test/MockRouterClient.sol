// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockRouterClient {
  function getFee(uint64, Client.EVM2AnyMessage memory) external pure returns (uint256 fee) {
    return 0;
  }

  event ClientCCIPSend(uint64 destinationChainSelector, bytes data);

  function ccipSend(
    uint64 destinationChainSelector,
    Client.EVM2AnyMessage calldata message
  ) external payable returns (bytes32) {
    emit ClientCCIPSend(destinationChainSelector, message.data);
    return bytes32(0);
  }
}
