// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import {FunctionsClientInterface} from "../dev/interfaces/FunctionsClientInterface.sol";

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

  function sendRequest(uint64, bytes calldata, uint32) external pure returns (bytes32) {
    return bytes32(0);
  }

  function fulfillRequest(address client, bytes32 requestId, bytes calldata data) external {
    FunctionsClientInterface(client).handleOracleFulfillment(requestId, data, "");
  }
}
