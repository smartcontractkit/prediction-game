// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {ResultsConsumer} from "./ResultsConsumer.sol";
import {NativeTokenSender} from "./ccip/NativeTokenSender.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

// Configuration parameters for initializing the contract
struct Config {
  address oracle; // The address of the Chainlink Function oracle
  address ccipRouter; // The address of the Chainlink CCIP router
  address link; // The address of the LINK token
  address weth9Token; // The address of the WETH9 token
  address exchangeToken; // The address of the exchange token used to transfer native tokens
  address uniswapV3Router; // The address of the Uniswap V3 router
  uint64 subscriptionId; // The ID of the Chainlink Functions subscription
  uint64 destinationChainSelector; // The chain selector for the winnings transfer destination chain
  uint32 gasLimit; // The gas limit for the Chainlink Functions request callback
  bytes secrets; // The secrets for the Chainlink Functions request
  string source; // The source code for the Chainlink Functions request
}

/// @title SportsPredictionGame
/// @notice A contract for predicting sports results with a native token
/// @dev Designed to be used with Chainlink Functions, Chainlink Automation, and Chainlink CCIP
contract SportsPredictionGame is ResultsConsumer, NativeTokenSender, AutomationCompatibleInterface {
  /// @notice The minimum amount of tokens that can be wagered
  uint256 private constant MIN_WAGER = 0.00001 ether;
  /// @notice The maximum amount of tokens that can be wagered
  uint256 private constant MAX_WAGER = 0.01 ether;
  /// @notice The delay after a game starts before it can be resolved
  uint256 private constant GAME_RESOLVE_DELAY = 2 hours;

  /// @notice Mapping of game IDs to game data
  mapping(uint256 => Game) private games;
  /// @notice Mapping of user addresses to game IDs to predictions
  mapping(address => mapping(uint256 => Prediction[])) private predictions;

  /// @notice Mapping of game IDs to Chainlink Functions request IDs
  mapping(uint256 => bytes32) private pendingRequests;

  /// @notice List of game IDs that have not been resolved
  uint256[] private activeGames;
  /// @notice List of game IDs that have been resolved
  uint256[] private resolvedGames;

  // STRUCTS

  struct Game {
    uint256 sportId; // The ID of the sport
    uint256 externalId; // The ID of the game on the external sports API
    uint256 timestamp; // The timestamp of the game start time
    uint256 homeWagerAmount; // The total amount of tokens wagered on the home team
    uint256 awayWagerAmount; // The total amount of tokens wagered on the away team
    bool resolved; // Whether or not the game has finished and the result has been set
    Result result; // The result of the game
  }

  struct Prediction {
    uint256 gameId; // The ID of the game
    Result result; // The predicted result
    uint256 amount; // The amount of tokens wagered
    bool claimed; // Whether or not the winnings have been claimed
  }

  enum Result {
    None, // The game has not been resolved or the result is a draw
    Home, // The home team won
    Away // The away team won
  }

  // EVENTS

  event GameRegistered(uint256 indexed gameId);
  event GameResolved(uint256 indexed gameId, Result result);
  event Predicted(address indexed user, uint256 indexed gameId, Result result, uint256 amount);
  event Claimed(address indexed user, uint256 indexed gameId, uint256 amount);

  // ERRORS

  error GameAlreadyRegistered();
  error TimestampInPast();
  error GameNotRegistered();
  error GameIsResolved();
  error GameAlreadyStarted();
  error InsufficientValue();
  error ValueTooHigh();
  error InvalidResult();
  error GameNotResolved();
  error GameNotReadyToResolve();
  error ResolveAlreadyRequested();
  error NothingToClaim();

  // CONSTRUCTOR

  constructor(
    Config memory config
  )
    ResultsConsumer(config.oracle, config.subscriptionId, config.source, config.secrets, config.gasLimit)
    NativeTokenSender(
      config.ccipRouter,
      config.link,
      config.weth9Token,
      config.exchangeToken,
      config.uniswapV3Router,
      config.destinationChainSelector
    )
  {}

  // ACTIONS

  /// @notice Predict the result of a game with native tokens
  /// @param gameId The ID of the game
  /// @param result The predicted result
  /// @dev The game must be registered, not resolved, and not started
  function predict(uint256 gameId, Result result) public payable {
    Game memory game = games[gameId];
    uint256 wagerAmount = msg.value;

    // Check if the prediction is valid
    if (game.externalId == 0) revert GameNotRegistered();
    if (game.resolved) revert GameIsResolved();
    if (game.timestamp < block.timestamp) revert GameAlreadyStarted();
    if (wagerAmount < MIN_WAGER) revert InsufficientValue();
    if (wagerAmount > MAX_WAGER) revert ValueTooHigh();

    // Update the game pool amounts
    if (result == Result.Home) games[gameId].homeWagerAmount += wagerAmount;
    else if (result == Result.Away) games[gameId].awayWagerAmount += wagerAmount;
    else revert InvalidResult();

    // Add the prediction to the user's list of predictions
    predictions[msg.sender][gameId].push(Prediction(gameId, result, wagerAmount, false));
    emit Predicted(msg.sender, gameId, result, wagerAmount);
  }

  /// @notice Register a game and predict the result in one transaction
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @param timestamp The timestamp of the game start time
  /// @param result The predicted result
  function registerAndPredict(uint256 sportId, uint256 externalId, uint256 timestamp, Result result) external payable {
    uint256 gameId = _registerGame(sportId, externalId, timestamp);
    predict(gameId, result);
  }

  /// @notice Claim winnings for a game
  /// @param gameId The ID of the game
  /// @param transfer Whether or not to transfer the winnings to another chain
  /// @dev Works for multiple predictions per user
  function claim(uint256 gameId, bool transfer) external {
    Game memory game = games[gameId];
    address user = msg.sender;

    if (!game.resolved) revert GameNotResolved();

    // Calculate the total winnings and mark the predictions as claimed
    uint256 totalWinnings = 0;
    Prediction[] memory userPredictions = predictions[user][gameId];
    for (uint256 i = 0; i < userPredictions.length; i++) {
      Prediction memory prediction = userPredictions[i];
      // Skip if the prediction has already been claimed
      if (prediction.claimed) continue;
      if (game.result == Result.None) {
        // For a draw, the user gets their tokens back
        totalWinnings += prediction.amount;
      } else if (prediction.result == game.result) {
        // Calculate the winnings for correct predictions
        uint256 winnings = calculateWinnings(gameId, prediction.amount, prediction.result);
        totalWinnings += winnings;
      }
      predictions[user][gameId][i].claimed = true;
    }

    if (totalWinnings == 0) revert NothingToClaim();

    // Claim winnings depending on the transfer parameter
    if (transfer) {
      // Transfer the winnings to the user on the another chain
      _sendTransferRequest(user, totalWinnings);
    } else {
      // Transfer the winnings to the user on the same chain
      payable(user).transfer(totalWinnings);
    }

    emit Claimed(user, gameId, totalWinnings);
  }

  // INTERNAL

  /// @notice Register a game in the contract
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @param timestamp The timestamp of the game start time
  /// @return gameId The ID of the game used in the contract
  function _registerGame(uint256 sportId, uint256 externalId, uint256 timestamp) internal returns (uint256 gameId) {
    gameId = getGameId(sportId, externalId);

    // Check if the game can be registered
    if (games[gameId].externalId != 0) revert GameAlreadyRegistered();
    if (timestamp < block.timestamp) revert TimestampInPast();

    // Store the game data
    games[gameId] = Game(sportId, externalId, timestamp, 0, 0, false, Result.None);
    // Add the game to the active games list
    activeGames.push(gameId);

    emit GameRegistered(gameId);
  }

  /// @notice Request the result of a game from the external sports API
  /// @param gameId The ID of the game
  /// @dev Uses Chainlink Functions via the ResultsConsumer contract
  function _requestResolve(uint256 gameId) internal {
    Game memory game = games[gameId];

    // Check if the game can be resolved
    if (pendingRequests[gameId] != 0) revert ResolveAlreadyRequested();
    if (game.externalId == 0) revert GameNotRegistered();
    if (game.resolved) revert GameIsResolved();
    if (!readyToResolve(gameId)) revert GameNotReadyToResolve();

    // Request the result of the game via ResultsConsumer contract
    // Store the Chainlink Functions request ID to prevent duplicate requests
    pendingRequests[gameId] = _requestResult(game.sportId, game.externalId);
  }

  /// @notice Process the result of a game from the external sports API
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @param response The result of the game
  /// @dev Called back by the ResultsConsumer contract when the result is received
  function _processResult(uint256 sportId, uint256 externalId, bytes memory response) internal override {
    uint256 gameId = getGameId(sportId, externalId);
    Result result = Result(uint256(bytes32(response)));
    _resolveGame(gameId, result);
  }

  /// @notice Resolve a game with a final result
  /// @param gameId The ID of the game
  /// @param result The result of the game
  /// @dev Removes the game from the active games list
  function _resolveGame(uint256 gameId, Result result) internal {
    // Store the game result and mark the game as finished
    games[gameId].result = result;
    games[gameId].resolved = true;

    // Add the game to the finished games list
    resolvedGames.push(gameId);
    _removeFromActiveGames(gameId);

    emit GameResolved(gameId, result);
  }

  /// @notice Remove a game from the active games list
  /// @param gameId The ID of the game
  function _removeFromActiveGames(uint256 gameId) internal {
    uint256 index;
    for (uint256 i = 0; i < activeGames.length; i++) {
      if (activeGames[i] == gameId) {
        index = i;
        break;
      }
    }
    for (uint256 i = index; i < activeGames.length - 1; i++) {
      activeGames[i] = activeGames[i + 1];
    }
    activeGames.pop();
  }

  // GETTERS

  /// @notice Get the ID of a game used in the contract
  /// @param sportId The ID of the sport
  /// @param externalId The ID of the game on the external sports API
  /// @return gameId The ID of the game used in the contract
  /// @dev The game ID is a unique number combining of the sport ID and the external ID
  function getGameId(uint256 sportId, uint256 externalId) public pure returns (uint256) {
    return (sportId << 128) | externalId;
  }

  /// @notice Get the data of a game
  /// @param gameId The ID of the game
  function getGame(uint256 gameId) external view returns (Game memory) {
    return games[gameId];
  }

  /// @notice Get the data of all active games
  /// @return activeGamesArray An array of all active games data
  function getActiveGames() public view returns (Game[] memory) {
    Game[] memory activeGamesArray = new Game[](activeGames.length);
    for (uint256 i = 0; i < activeGames.length; i++) {
      activeGamesArray[i] = games[activeGames[i]];
    }
    return activeGamesArray;
  }

  /// @notice Get the data of all user predictions for active games
  /// @param user The address of the user
  /// @return userPredictions An array of all user predictions for active games
  function getActivePredictions(address user) external view returns (Prediction[] memory) {
    uint256 totalPredictions = 0;
    for (uint256 i = 0; i < activeGames.length; i++) {
      totalPredictions += predictions[user][activeGames[i]].length;
    }
    uint256 index = 0;
    Prediction[] memory userPredictions = new Prediction[](totalPredictions);
    for (uint256 i = 0; i < activeGames.length; i++) {
      Prediction[] memory gamePredictions = predictions[user][activeGames[i]];
      for (uint256 j = 0; j < gamePredictions.length; j++) {
        userPredictions[index] = gamePredictions[j];
        index++;
      }
    }
    return userPredictions;
  }

  /// @notice Get the data of all user predictions for resolved games
  /// @param user The address of the user
  /// @return userPredictions An array of all user predictions for resolved games
  function getPastPredictions(address user) external view returns (Prediction[] memory) {
    uint256 totalPredictions = 0;
    for (uint256 i = 0; i < resolvedGames.length; i++) {
      totalPredictions += predictions[user][resolvedGames[i]].length;
    }
    uint256 index = 0;
    Prediction[] memory userPredictions = new Prediction[](totalPredictions);
    for (uint256 i = 0; i < resolvedGames.length; i++) {
      Prediction[] memory gamePredictions = predictions[user][resolvedGames[i]];
      for (uint256 j = 0; j < gamePredictions.length; j++) {
        userPredictions[index] = gamePredictions[j];
        index++;
      }
    }
    return userPredictions;
  }

  /// @notice Check if a user predicted a game correctly
  /// @param user The address of the user
  /// @param gameId The ID of the game
  /// @param predictionIdx The index of the prediction
  /// @return correct Whether or not the prediction was correct
  /// @dev The prediction must be for a resolved game
  function isPredictionCorrect(address user, uint256 gameId, uint32 predictionIdx) external view returns (bool) {
    Game memory game = games[gameId];
    if (!game.resolved) return false;
    Prediction memory prediction = predictions[user][gameId][predictionIdx];
    return prediction.result == game.result;
  }

  /// @notice Calculate the projected winnings for a prediction at the current time
  /// @param gameId The ID of the game
  /// @param wager The amount of tokens wagered
  /// @param result The predicted result
  /// @return winnings The projected winnings
  /// @dev The game must be registered
  function calculateWinnings(uint256 gameId, uint256 wager, Result result) public view returns (uint256) {
    Game memory game = games[gameId];
    // Calculate the total amount of tokens wagered on the game
    uint256 totalWager = game.homeWagerAmount + game.awayWagerAmount;
    // Calculate the winnings based on the result and the total amount of tokens wagered
    uint256 winnings = (wager * totalWager) / (result == Result.Home ? game.homeWagerAmount : game.awayWagerAmount);
    return winnings;
  }

  /// @notice Check if a game is ready to be resolved
  /// @param gameId The ID of the game
  /// @return ready Whether or not the game is ready to be resolved
  /// @dev The game must be registered and not resolved
  /// @dev Used by Chainlink Automation to determine if a game result should be requested
  function readyToResolve(uint256 gameId) public view returns (bool) {
    return games[gameId].timestamp + GAME_RESOLVE_DELAY < block.timestamp;
  }

  // CHAINLINK AUTOMATION

  /// @notice Check if any games are ready to be resolved
  /// @dev Called by Chainlink Automation to determine if a game result should be requested
  function checkUpkeep(bytes memory) public view override returns (bool, bytes memory) {
    // Get all games that can be resolved
    Game[] memory activeGamesArray = getActiveGames();
    // Check if any game is ready to be resolved and have not already been requested
    for (uint256 i = 0; i < activeGamesArray.length; i++) {
      uint256 gameId = getGameId(activeGamesArray[i].sportId, activeGamesArray[i].externalId);
      if (readyToResolve(gameId) && pendingRequests[gameId] == 0) {
        // Signal that a game is ready to be resolved to Chainlink Automation
        return (true, abi.encodePacked(gameId));
      }
    }
    return (false, "");
  }

  /// @notice Request the result of a game
  /// @dev Called back by Chainlink Automation when a game is ready to be resolved
  function performUpkeep(bytes calldata data) external override {
    uint256 gameId = abi.decode(data, (uint256));
    _requestResolve(gameId);
  }

  // OWNER

  /// @notice Delete a failed Chainlink Functions request to restart the game resolve process
  /// @param gameId The ID of the game
  /// @dev Manual intervention required or the automation will retry indefinitely
  function deletePendingRequest(uint256 gameId) external onlyOwner {
    delete pendingRequests[gameId];
  }
}
