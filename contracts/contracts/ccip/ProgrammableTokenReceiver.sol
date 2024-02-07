// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ProgrammableTokenReceiver
abstract contract ProgrammableTokenReceiver is CCIPReceiver, OwnerIsCreator {
  // Custom errors to provide more descriptive revert messages.
  error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
  error NothingToWithdraw(); // Used when trying to withdraw Ether but there's nothing to withdraw.
  error FailedToWithdrawEth(address owner, address target, uint256 value); // Used when the withdrawal of Ether fails.
  error SourceChainNotWhitelisted(uint64 sourceChainSelector); // Used when the source chain has not been whitelisted by the contract owner.
  error SenderNotWhitelisted(address sender); // Used when the sender has not been whitelisted by the contract owner.

  // Event emitted when a message is received from another chain.
  event MessageReceived(
    bytes32 indexed messageId, // The unique ID of the CCIP message.
    uint64 indexed sourceChainSelector, // The chain selector of the source chain.
    address sender, // The address of the sender from the source chain.
    bytes data, // The data that was received.
    address token, // The token address that was transferred.
    uint256 tokenAmount // The token amount that was transferred.
  );

  // Mapping to keep track of whitelisted source chains.
  mapping(uint64 => bool) public whitelistedSourceChains;

  // Mapping to keep track of whitelisted senders.
  mapping(address => bool) public whitelistedSenders;

  /// @notice Constructor initializes the contract with the router address.
  /// @param _router The address of the router contract.
  constructor(address _router) CCIPReceiver(_router) {}

  /// @dev Modifier that checks if the chain with the given sourceChainSelector is whitelisted.
  /// @param _sourceChainSelector The selector of the destination chain.
  modifier onlyWhitelistedSourceChain(uint64 _sourceChainSelector) {
    if (!whitelistedSourceChains[_sourceChainSelector]) revert SourceChainNotWhitelisted(_sourceChainSelector);
    _;
  }

  /// @dev Modifier that checks if the chain with the given sourceChainSelector is whitelisted.
  /// @param _sender The address of the sender.
  modifier onlyWhitelistedSenders(address _sender) {
    if (!whitelistedSenders[_sender]) revert SenderNotWhitelisted(_sender);
    _;
  }

  /// @dev Whitelists a chain for transactions.
  /// @notice This function can only be called by the owner.
  /// @param _sourceChainSelector The selector of the source chain to be whitelisted.
  function whitelistSourceChain(uint64 _sourceChainSelector) external onlyOwner {
    whitelistedSourceChains[_sourceChainSelector] = true;
  }

  /// @dev Denylists a chain for transactions.
  /// @notice This function can only be called by the owner.
  /// @param _sourceChainSelector The selector of the source chain to be denylisted.
  function denylistSourceChain(uint64 _sourceChainSelector) external onlyOwner {
    whitelistedSourceChains[_sourceChainSelector] = false;
  }

  /// @dev Whitelists a sender.
  /// @notice This function can only be called by the owner.
  /// @param _sender The address of the sender.
  function whitelistSender(address _sender) external onlyOwner {
    whitelistedSenders[_sender] = true;
  }

  /// @dev Denylists a sender.
  /// @notice This function can only be called by the owner.
  /// @param _sender The address of the sender.
  function denySender(address _sender) external onlyOwner {
    whitelistedSenders[_sender] = false;
  }

  /// handle a received message
  function _ccipReceive(
    Client.Any2EVMMessage memory any2EvmMessage
  )
    internal
    override
    onlyWhitelistedSourceChain(any2EvmMessage.sourceChainSelector) // Make sure source chain is whitelisted
    onlyWhitelistedSenders(abi.decode(any2EvmMessage.sender, (address))) // Make sure the sender is whitelisted
  {
    bytes32 messageId = any2EvmMessage.messageId;
    bytes memory data = any2EvmMessage.data;
    address tokenAddress = any2EvmMessage.destTokenAmounts[0].token;
    uint256 tokenAmount = any2EvmMessage.destTokenAmounts[0].amount;

    _onTokenReceived(messageId, data, tokenAddress, tokenAmount);

    emit MessageReceived(
      messageId,
      any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
      abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
      data,
      any2EvmMessage.destTokenAmounts[0].token,
      any2EvmMessage.destTokenAmounts[0].amount
    );
  }

  /// @notice This function is called when a token with message data is received from another chain
  /// @param messageId The unique ID of the CCIP message
  /// @param data The data that was sent with the message
  /// @param tokenAddress The address of the token that was transferred
  /// @param tokenAmount The amount of tokens that were transferred
  /// @dev This function should be implemented by the contract inheriting from this contract
  function _onTokenReceived(
    bytes32 messageId,
    bytes memory data,
    address tokenAddress,
    uint256 tokenAmount
  ) internal virtual;

  /// @notice Allows the contract owner to withdraw the entire balance of Ether from the contract.
  /// @dev This function reverts if there are no funds to withdraw or if the transfer fails.
  /// It should only be callable by the owner of the contract.
  /// @param _beneficiary The address to which the Ether should be sent.
  function withdraw(address _beneficiary) public onlyOwner {
    // Retrieve the balance of this contract
    uint256 amount = address(this).balance;

    // Revert if there is nothing to withdraw
    if (amount == 0) revert NothingToWithdraw();

    // Attempt to send the funds, capturing the success status and discarding any return data
    (bool sent, ) = _beneficiary.call{value: amount}("");

    // Revert if the send failed, with information about the attempted transfer
    if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
  }

  /// @notice Allows the owner of the contract to withdraw all tokens of a specific ERC20 token.
  /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
  /// @param _beneficiary The address to which the tokens will be sent.
  /// @param _token The contract address of the ERC20 token to be withdrawn.
  function withdrawToken(address _beneficiary, address _token) public onlyOwner {
    // Retrieve the balance of this contract
    uint256 amount = IERC20(_token).balanceOf(address(this));

    // Revert if there is nothing to withdraw
    if (amount == 0) revert NothingToWithdraw();

    IERC20(_token).transfer(_beneficiary, amount);
  }
}
