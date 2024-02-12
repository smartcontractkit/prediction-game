// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ProgrammableTokenReceiver} from "./ProgrammableTokenReceiver.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";

/// @title NativeTokenReceiver
/// @notice Receives native token transfer request from another chain
/// @dev Uses Uniswap V3 to swap exchange token to native token
contract NativeTokenReceiver is ProgrammableTokenReceiver {
  /// @notice The fee for swapping exchange token to native token
  uint24 private constant POOL_FEE = 3000;

  /// @notice The address of the exchange token used to transfer value across chains
  /// @dev In real-world scenarios, it should be pegged to the native token or a stablecoin
  /// @dev This token must be supported by the CCIP router
  address private exchangeToken;
  /// @notice The address of the WETH9 token
  address private weth9Token;
  /// @notice The address of the Uniswap V3 router
  address private uniswapV3Router;

  // EVENTS

  event TransferRequestFulfilled(address indexed to, uint256 amount);

  // ERRORS

  error InvalidTokenAddress(address tokenAddress);
  error FailedToTransferNativeToken(address recipient);

  // CONSTRUCTOR

  /// @notice Initializes the contract
  /// @param _router The address of the CCIP router contract
  /// @param _weth9Token The address of the WETH9 token
  /// @param _exchangeToken The address of the exchange token
  /// @param _uniswapV3Router The address of the Uniswap V3 router
  /// @param _sourceContractSender The address of the NativeTokenSender contract on the source chain
  /// @param _sourceChainSelector The selector of the source chain
  constructor(
    address _router,
    address _weth9Token,
    address _exchangeToken,
    address _uniswapV3Router,
    address _sourceContractSender,
    uint64 _sourceChainSelector
  ) ProgrammableTokenReceiver(_router) {
    weth9Token = _weth9Token;
    exchangeToken = _exchangeToken;
    uniswapV3Router = _uniswapV3Router;
    whitelistedSourceChains[_sourceChainSelector] = true;
    whitelistedSenders[_sourceContractSender] = true;
  }

  // INTERNAL

  /// @notice Receives the token transfer and swaps it to native token
  /// @param data The data containing the address of the token recipient
  /// @param tokenAddress The address of the token that was transferred
  /// @param tokenAmount The amount of token that was transferred
  function _onTokenReceived(bytes32, bytes memory data, address tokenAddress, uint256 tokenAmount) internal override {
    if (tokenAddress != exchangeToken) revert InvalidTokenAddress(tokenAddress);

    // Swap exchange token to native token
    address tokenRecipient = abi.decode(data, (address));
    uint256 nativeTokenAmount = _swapExchangeTokenToNative(tokenAmount);

    // Transfer native token to the recipient
    (bool success, ) = tokenRecipient.call{value: nativeTokenAmount}("");
    if (!success) revert FailedToTransferNativeToken(tokenRecipient);

    emit TransferRequestFulfilled(tokenRecipient, nativeTokenAmount);
  }

  /// @notice Swaps exchange token to native token
  /// @param _exchangeTokenAmount The amount of exchange token to swap
  /// @return nativeTokenAmount The amount of native token received
  function _swapExchangeTokenToNative(uint256 _exchangeTokenAmount) internal returns (uint256 nativeTokenAmount) {
    // Approve the Uniswap V3 router to spend the exchange token
    TransferHelper.safeApprove(exchangeToken, uniswapV3Router, _exchangeTokenAmount);
    // Swap the exchange token to wrapped native token
    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
      tokenIn: exchangeToken,
      tokenOut: weth9Token,
      fee: POOL_FEE,
      recipient: address(this),
      deadline: block.timestamp,
      amountIn: _exchangeTokenAmount,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    });
    nativeTokenAmount = ISwapRouter(uniswapV3Router).exactInputSingle(params);
    // Swap the wrapped native token to native token
    IWETH9(weth9Token).withdraw(nativeTokenAmount);
  }

  /// @notice Allows the contract to receive native token
  /// @dev This is needed for the contract to withdraw the native token from WETH9
  receive() external payable {}
}
