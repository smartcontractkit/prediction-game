// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title ResultsConsumer
/// @notice Requests and receives sports results using Chainlink Functions
abstract contract ResultsConsumer is FunctionsClient {
  using Functions for Functions.Request;

  /// @notice The source code for the sports API request
  string private source;
  /// @notice The secrets used in the sports API request
  bytes private secrets;
  /// @notice The subscription ID for Chainlink Functions
  uint64 private subscriptionId;
  /// @notice The gas limit for the sports API request callback
  uint32 private gasLimit;

  /// @notice The pending Functions requests
  mapping(bytes32 => PendingRequest) private pending;

  // STRUCTS

  struct PendingRequest {
    uint256 sportId;
    uint256 externalId;
  }

  // EVENTS

  event RequestedResult(uint256 sportId, uint256 externalId, bytes32 requestId);
  event ResultReceived(bytes32 requestId, bytes response);
  event NoPendingRequest();
  event RequestFailed(bytes response);

  // CONSTRUCTOR

  /// @notice Initializes the contract
  /// @param _oracle The address of the Chainlink Function oracle
  /// @param _subscriptionId The subscription ID for Chainlink Functions
  /// @param _source The source code for the Chainlink Functions request
  /// @param _secrets The secrets used in the Chainlink Functions request
  /// @param _gasLimit The gas limit for the Chainlink Functions request callback
  constructor(
    address _oracle,
    uint64 _subscriptionId,
    string memory _source,
    bytes memory _secrets,
    uint32 _gasLimit
  ) FunctionsClient(_oracle) {
    subscriptionId = _subscriptionId;
    source = _source;
    secrets = _secrets;
    gasLimit = _gasLimit;
  }

  // INTERNAL

  /// @notice Requests a sports result
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @return requestId The Chainlink Functions request ID
  function _requestResult(uint256 sportId, uint256 externalId) internal returns (bytes32 requestId) {
    // Prepare the arguments for the Chainlink Functions request
    string[] memory args = new string[](2);
    args[0] = Strings.toString(sportId);
    args[1] = Strings.toString(externalId);
    // Send the Chainlink Functions request
    requestId = _executeRequest(args);

    // Store the request and the associated data for the callback
    pending[requestId] = PendingRequest({sportId: sportId, externalId: externalId});
    emit RequestedResult(sportId, externalId, requestId);
  }

  /// @notice Sends a Chainlink Functions request
  /// @param args The arguments for the Chainlink Functions request
  /// @return requestId The Chainlink Functions request ID
  function _executeRequest(string[] memory args) internal returns (bytes32 requestId) {
    Functions.Request memory req;
    req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
    if (secrets.length > 0) {
      req.addRemoteSecrets(secrets);
    }
    if (args.length > 0) req.addArgs(args);
    requestId = sendRequest(req, subscriptionId, gasLimit);
  }

  /// @notice Processes the result of a sports API request
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @param response The response from the Chainlink Functions request
  /// @dev This function must be implemented by the child contract
  function _processResult(uint256 sportId, uint256 externalId, bytes memory response) internal virtual;

  // CHAINLINK FUNCTIONS

  /// @notice Receives the response to a Chainlink Functions request
  /// @param requestId The Chainlink Functions request ID
  /// @param response The response from the Chainlink Functions request
  /// @param err The error from the Chainlink Functions request
  /// @dev This function is called by the oracle
  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    PendingRequest memory request = pending[requestId];
    // Check if there is a sent request
    if (request.sportId == 0) {
      emit NoPendingRequest();
      return;
    }
    delete pending[requestId];
    // Check if the Functions script failed
    if (err.length > 0) {
      emit RequestFailed(err);
      return;
    }
    emit ResultReceived(requestId, response);

    // Call the child contract to process the result
    _processResult(request.sportId, request.externalId, response);
  }
}
