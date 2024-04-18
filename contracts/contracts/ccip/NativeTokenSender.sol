// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ProgrammableTokenSender} from "./ProgrammableTokenSender.sol";
import {IV3SwapRouter} from "../interfaces/IV3SwapRouter.sol";

/// @title NativeTokenSender
/// @notice Sends native token transfer request to another chain
/// @dev Uses Uniswap V3 to swap native token to exchange token which is supported by CCIP
abstract contract NativeTokenSender is ProgrammableTokenSender {
  /// @notice The fee for swapping native token to exchange token
  uint24 private constant POOL_FEE = 3000;

  /// @notice The address of the exchange token used to transfer value across chains
  /// @dev In real-world scenarios, it should be pegged to the native token or a stablecoin
  /// @dev This token must be supported by the CCIP router
  address private exchangeToken;
  /// @notice The address of the WETH9 token
  address private weth9Token;
  /// @notice The address of the Uniswap V3 router
  address private uniswapV3Router;
  /// @notice The selector of the destination chain
  /// @dev Check the CCIP docs for the list of chain selectors
  uint64 private destinationChainSelector;
  /// @notice The address of NativeTokenReceiver contract on the destination chain
  address private destinationContractReceiver;

  // EVENTS

  event TransferRequestSent(bytes32 indexed requestId, address indexed to, uint256 amount);

  // ERRORS

  error NoDestinationContractReceiver();

  // CONSTRUCTOR

  /// @notice Initializes the contract
  /// @param _router The address of the CCIP router contract
  /// @param _link The address of the LINK token contract
  /// @param _weth9Token The address of the WETH9 token
  /// @param _exchangeToken The address of the exchange token
  /// @param _uniswapV3Router The address of the Uniswap V3 router
  /// @param _destinationChainSelector The selector of the destination chain
  constructor(
    address _router,
    address _link,
    address _weth9Token,
    address _exchangeToken,
    address _uniswapV3Router,
    uint64 _destinationChainSelector
  ) ProgrammableTokenSender(_router, _link) {
    weth9Token = _weth9Token;
    exchangeToken = _exchangeToken;
    uniswapV3Router = _uniswapV3Router;
    destinationChainSelector = _destinationChainSelector;
    whitelistedDestinationChains[_destinationChainSelector] = true;
  }

  // INTERNAL

  /// @notice Sends a transfer request to the destination chain
  /// @param _to The address of the receiver on the destination chain
  /// @param _amount The amount of native token to transfer
  /// @return requestId The ID of the CCIP message that was sent
  function _sendTransferRequest(address _to, uint256 _amount) internal returns (bytes32 requestId) {
    if (destinationContractReceiver == address(0)) revert NoDestinationContractReceiver();
    // Swap native token to exchange token
    uint256 exchangeTokenAmount = _swapNativeToExchangeToken(_amount);
    // Send the transfer request to CCIP
    requestId = _sendMessagePayLINK(
      destinationChainSelector,
      destinationContractReceiver,
      abi.encode(_to),
      exchangeToken,
      exchangeTokenAmount
    );
    emit TransferRequestSent(requestId, _to, _amount);
  }

  /// @notice Swaps native token to exchange token
  /// @param _nativeTokenAmount The amount of native token to swap
  /// @return exchangeTokenAmount The amount of exchange token received
  function _swapNativeToExchangeToken(uint256 _nativeTokenAmount) internal returns (uint256 exchangeTokenAmount) {
    IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter.ExactInputSingleParams({
      tokenIn: weth9Token,
      tokenOut: exchangeToken,
      fee: POOL_FEE,
      recipient: address(this),
      amountIn: _nativeTokenAmount,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    });
    exchangeTokenAmount = IV3SwapRouter(uniswapV3Router).exactInputSingle{value: _nativeTokenAmount}(params);
  }

  // OWNER

  /// @notice Sets the address of the destination contract receiver
  /// @param _destinationContractReceiver The address of the destination contract receiver
  /// @dev This function can only be called by the owner
  function setDestinationContractReceiver(address _destinationContractReceiver) external onlyOwner {
    destinationContractReceiver = _destinationContractReceiver;
  }
}
