// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import {IFunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/interfaces/IFunctionsClient.sol";

contract MockFunctionsOracle {
  function getRegistry() external view returns (address) {
    return address(this);
  }

  function getDONPublicKey() external pure returns (bytes memory) {
    return bytes("");
  }

  function estimateCost(uint64, bytes calldata, uint32, uint256) external pure returns (uint96) {
    return 0;
  }

  function sendRequest(uint64, bytes calldata, uint16, uint32, bytes32) external pure returns (bytes32) {
    return bytes32(0);
  }

  function fulfillRequest(address client, bytes32 requestId, bytes calldata data) external {
    IFunctionsClient(client).handleOracleFulfillment(requestId, data, "");
  }
}
