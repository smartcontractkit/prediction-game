// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract MockSwapRouter {
  struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
  }

  event ExactInputSingleCalledWith(uint256 amountIn, uint256 amountOutMinimum);

  function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
    amountOut = params.amountIn;
    emit ExactInputSingleCalledWith(params.amountIn, params.amountOutMinimum);
  }
}
