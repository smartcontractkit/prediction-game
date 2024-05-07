# Sports Prediction Game: Contracts

This directory is a Hardhat project which is based on the [Chainlink Functions Hardhat Starter Kit](https://github.com/smartcontractkit/functions-hardhat-starter-kit).

It contains the smart contracts for the sports prediction game:

- [`SportsPredictionGame.sol`](./contracts/SportsPredictionGame.sol) - the main contract which handles the game logic
- [`ResultsConsumer.sol`](./contracts/ResultsConsumer.sol) - requests and receives the results using Chainlink Functions
- [`NativeTokenSender.sol`](./contracts/ccip/NativeTokenSender.sol) - swaps and sends tokens across chains using Chainlink CCIP
- [`NativeTokenReceiver.sol`](./contracts/ccip/NativeTokenReceiver.sol) - receives and swaps tokens across chains using Chainlink CCIP

Additionally, it contains the Chainlink Functions [script](./sports-api.js) executed by each node of the DON which requests the results from the Sports API.

## Supported Networks

- Optimism Sepolia
- Avalanche Fuji

All required configuration for supported networks is located in the [`networks.js`](./networks.js) file in the root of this repository.

## Steps

1.  Open this directory in your command line, then run `npm install` to install all dependencies.<br><br>
2.  Aquire a Github personal access token which allows reading and writing Gists.
    1. Visit [https://github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) and click "Generate new token"
    2. Name the token and enable read & write access for Gists from the "Account permissions" drop-down menu. Do not enable any additional permissions.
    3. Click "Generate token" and copy the resulting personal access token for step 4.<br><br>
3.  Set the required environment variables.
    1. Set an encryption password for your environment variables to a secure password by running:<br>`npx env-enc set-pw`<br>
    2. Use the command `npx env-enc set` to set the required environment variables (see [Environment Variable Management](#environment-variable-management)):
       - _GITHUB_API_TOKEN_ for your Github token obtained from step 3
       - _PRIVATE_KEY_ for your development wallet
       - _OPTIMISM_SEPOLIA_RPC_URL_, _AVALANCHE_FUJI_RPC_URL_ for the network that you intend to use
       - _API_KEY_ for the sports results API. Obtain one [here](https://dashboard.api-football.com/register).
    3. If desired, the `<explorer>_API_KEY` can be set in order to verify contracts, along with any values used in the _secrets_ object in _Functions-request-config.js_ such as `COINMARKETCAP_API_KEY`.<br><br>
4.  Test an end-to-end request and fulfillment locally by simulating it using:<br>`npx hardhat functions-simulate`<br><br>
5.  Run the unit tests by running:<br>`npx hardhat test`<br><br>
6.  Before deploying the contract a new Functions billing subscription must be created and funded to be able to request sports results. You can do it from the Functions web interface at [https://functions.chain.link](https://functions.chain.link).<br><br>
7.  Deploy and configure the game contract to an actual blockchain network by running:<br>`npx hardhat deploy-game --network network_name_here --destination network_name_here --subid your_sub_id --verify true`
    - `network` is the network where the game contract will be deployed. It must match the names given in the `networks` object in `./networks.js`.
    - `destination` is the network where the winnings receiver contract will be deployed
    - `subid` is the subscription ID used to pay for the request, created by you at functions.chain.link. Create this before you run the above command.
    - `verify` is an optional flag which can be set to `true` to verify the deployed contract code<br>
      **Note**: Before running the command, make sure that:
      - Your wallet has a sufficient native token balance on both networks for the deployment and transaction fees.
      - Yoyr wallet LINK balance is sufficient to fund the contract so it can pay the CCIP transfer fees. The amount is specified in the `networks.js` file under each network `fundAmount` property.
      - `<explorer>_API_KEY` is set if using `--verify true`, depending on which network is used.<br><br>
8.  In order for the registered games in the contract to be updated with results from the sports API automatically, the game contract must be registered as an upkeep with a custom logic trigger. Follow the steps at [https://automation.chain.link](https://automation.chain.link).<br>**Note**: Make sure the gas limit is set to 3,000,000.<br><br>

## Deployments

Optimism Sepolia

- Game contract: [`0x31015944A2719Da19531Ced7ed72e9DD6761A478`](https://sepolia-optimism.etherscan.io/address/0x31015944A2719Da19531Ced7ed72e9DD6761A478)
- Functions subscription: [`177`](https://functions.chain.link/optimism-sepolia/177)
- Automation upkeep: [`112557321685295299629771618321084972343709241235617405730580214266603599595202`](https://automation.chain.link/optimism-sepolia/112557321685295299629771618321084972343709241235617405730580214266603599595202)
- CCIP Token Receiver contract on Avalanche Fuji: [`0xB9bb8BfD3540E44b8eAaC9d5Dfc31B9D8E898C03`](https://testnet.snowtrace.io/address/0xB9bb8BfD3540E44b8eAaC9d5Dfc31B9D8E898C03)

Polygon Mumbai (Deprecated)

- Game contract: [`0x837acF842c9D99004A4b4fa1C250Fe3ca0c3ce63`](https://mumbai.polygonscan.com/address/0x837acF842c9D99004A4b4fa1C250Fe3ca0c3ce63)
- Functions subscription: [`1328`](https://functions.chain.link/mumbai/1328)
- Automation upkeep: [`108769264368126231420985110258970292714464487200997462556194899554304873592241`](https://automation.chain.link/mumbai/108769264368126231420985110258970292714464487200997462556194899554304873592241)
- CCIP Token Receiver contract on Avalanche Fuji: [`0x812F700f90348E4b297ED8818CBda1ddCf7F25eC`](https://testnet.snowtrace.io/address/0x812F700f90348E4b297ED8818CBda1ddCf7F25eC)

---

Content below is general knowledge from [function-hardhat-starter-kit](https://github.com/smartcontractkit/functions-hardhat-starter-kit).

- [Sports Prediction Game: Contracts](#sports-prediction-game-contracts)
  - [Supported Networks](#supported-networks)
  - [Steps](#steps)
  - [Deployments](#deployments)
- [Environment Variable Management](#environment-variable-management)
  - [Environment Variable Management Commands](#environment-variable-management-commands)
- [Request Configuration](#request-configuration)
  - [JavaScript Code](#javascript-code)
    - [Functions Library](#functions-library)
  - [Off-chain Secrets](#off-chain-secrets)
- [Gas Spikes](#gas-spikes)

# Environment Variable Management

This repo uses the NPM package `@chainlink/env-enc` for keeping environment variables such as wallet private keys, RPC URLs, and other secrets encrypted at rest. This reduces the risk of credential exposure by ensuring credentials are not visible in plaintext.

By default, all encrypted environment variables will be stored in a file named `.env.enc` in the root directory of this repo.

First, set the encryption password by running the command `npx env-enc set-pw`.
The password must be set at the beginning of each new session.
If this password is lost, there will be no way to recover the encrypted environment variables.

Run the command `npx env-enc set` to set and save environment variables.
These variables will be loaded into your environment when the `config()` method is called at the top of `hardhat.config.js`.
Use `npx env-enc view` to view all currently saved environment variables.
When pressing _ENTER_, the terminal will be cleared to prevent these values from remaining visible.
Running `npx env-enc remove VAR_NAME_HERE` deletes the specified environment variable.
The command `npx env-enc remove-all` deletes the entire saved environment variable file.

When running this command on a Windows machine, you may receive a security confirmation prompt. Enter `r` to proceed.

> **NOTE:** When you finish each work session, close down your terminal to prevent your encryption password from becoming exposes if your machine is compromised.

## Environment Variable Management Commands

The following commands accept an optional `--path` flag followed by a path to the desired encrypted environment variable file.
If one does not exist, it will be created automatically by the `npx env-enc set` command.

The `--path` flag has no effect on the `npx env-enc set-pw` command as the password is stored as an ephemeral environment variable for the current terminal session.

| Command                     | Description                                                                                                                                       | Parameters            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `npx env-enc set-pw`        | Sets the password to encrypt and decrypt the environment variable file **NOTE:** On Windows, this command may show a security confirmation prompt |                       |
| `npx env-enc set`           | Sets and saves variables to the encrypted environment variable file                                                                               |                       |
| `npx env-enc view`          | Shows all currently saved variables in the encrypted environment variable file                                                                    |                       |
| `npx env-enc remove <name>` | Removes a variable from the encrypted environment variable file                                                                                   | `name`: Variable name |
| `npx env-enc remove-all`    | Deletes the encrypted environment variable file                                                                                                   |                       |

# Request Configuration

Chainlink Functions requests can be configured by modifying values in the `requestConfig` object found in the _Functions-request-config.js_ file located in the root of this repository.

| Setting Name         | Description                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `codeLocation`       | This specifies where the JavaScript code for a request is located. Currently, only the `Location.Inline` option is supported (represented by the value `0`). This means the JavaScript string is provided directly in the on-chain request instead of being referenced via a URL.                                                                                     |
| `codeLanguage`       | This specifies the language of the source code which is executed in a request. Currently, only `JavaScript` is supported (represented by the value `0`).                                                                                                                                                                                                              |
| `source`             | This is a string containing the source code which is executed in a request. This must be valid JavaScript code that returns a Buffer. See the [JavaScript Code](#javascript-code) section for more details.                                                                                                                                                           |
| `secrets`            | This is an object which contains secret values that are injected into the JavaScript source code and can be accessed using the name `secrets`. This object can only contain string values. This object will be automatically encrypted by the tooling using the DON public key before making request. Any DON member can use these secrets when processing a request. |
| `perNodeSecrets`     | This is an array of `secrets` objects that enables the optional ability to assign a separate set of secrets for each node in the DON. DON members can only use the set of secrets which they have been assigned.                                                                                                                                                      |
| `walletPrivateKey`   | This is the EVM private key. It is used to generate a signature for the encrypted secrets such that the secrets cannot be reused by an unauthorized 3rd party.                                                                                                                                                                                                        |
| `args`               | This is an array of strings which contains values that are injected into the JavaScript source code and can be accessed using the name `args`. This provides a convenient way to set modifiable parameters within a request.                                                                                                                                          |
| `expectedReturnType` | This specifies the expected return type of a request. It has no on-chain impact, but is used by the CLI to decode the response bytes into the specified type. The options are `uint256`, `int256`, `string`, or `Buffer`.                                                                                                                                             |
| `secretsURLs`        | This is an array of URLs where encrypted secrets can be fetched when a request is executed. This array is converted into a space-separated string, encrypted using the DON public key, and used as the `secrets` parameter on-chain. If any URLs are provided, automatic Gist uploading will be disabled in favor of the provided URLs.                               |

## JavaScript Code

The JavaScript source code for a Functions request can use vanilla Node.js features, but _cannot_ use any `require` statements or imported modules other than the built-in modules `buffer`, `crypto`, `querystring`, `string_decoder`, `url`, and `util`.

It must return a JavaScript Buffer which represents the response bytes that are sent back to the requesting contract.
Encoding functions are provided in the [Functions library](#functions-library).
Additionally, the script must return in **less than 10 seconds** or it will be terminated and send back an error to the requesting contract.

In order to make HTTP requests, the source code must use the `Functions.makeHttpRequest` function from the exposed [Functions library](#functions-library).
Asynchronous code with top-level `await` statements is supported, as shown in the file _API-request-example.js_.

### Functions Library

The `Functions` library is injected into the JavaScript source code and can be accessed using the name `Functions`.

In order to make HTTP requests, only the `Functions.makeHttpRequest` function can be used. All other methods of accessing the Internet are restricted.
The function takes an object with the following parameters.

```
{
  url: String with the URL to which the request is sent,
  method (optional): String specifying the HTTP method to use which can be either 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', or 'OPTIONS' (defaults to 'GET'),
  headers (optional): Object with headers to use in the request,
  params (optional): Object with URL query parameters,
  data (optional): Object which represents the body sent with the request,
  timeout (optional): Number with the maximum request duration in ms (defaults to 5000 ms),
  responseType (optional): String specifying the expected response type which can be either 'json', 'arraybuffer', 'document', 'text' or 'stream' (defaults to 'json'),
}
```

The function returns a promise that resolves to either a success response object or an error response object.

A success response object will have the following parameters.

```
{
  error: false,
  data: Response data sent by the server,
  status: Number representing the response status,
  statusText: String representing the response status,
  headers: Object with response headers sent by the server,
}
```

An error response object will have the following parameters.

```
{
  error: true,
  message (may be undefined): String containing error message,
  code (may be undefined): String containing an error code,
  response (may be undefined): Object containing response sent from the server,
}
```

This library also exposes functions for encoding JavaScript values into Buffers which represent the bytes that a returned on-chain.

- `Functions.encodeUint256` takes a positive JavaScript integer number and returns a Buffer of 32 bytes representing a `uint256` type in Solidity.
- `Functions.encodeInt256` takes a JavaScript integer number and returns a Buffer of 32 bytes representing a `int256` type in Solidity.
- `Functions.encodeString` takes a JavaScript string and returns a Buffer representing a `string` type in Solidity.

Remember, it is not required to use these encoding functions. The JavaScript code must only return a Buffer which represents the `bytes` array that is returned on-chain.

## Off-chain Secrets

Instead of using encrypted secrets written directly on the blockchain, encrypted secrets are hosted off-chain and be fetched by DON nodes via HTTP when a request is initiated. This allows encrypted secrets to be deleted when they are no longer in use. By default, the tooling automatically uploads secrets to private Github Gists and deletes them once a request is fulfilled unless the secrets are being used for an `AutomatedFunctionsConsumer.sol` contract. If integrating with Chainlink Automation, it is recommended to delete the secrets Gist manually once it is not longer in use. Note that if there are URL(s) provided for the `secretsURLs` parameter in _Functions_request_config.js_, automatic Gist uploading will be disabled in favor of using the provided URL(s).

Additionally, per-node secrets allow a separate set of secrets to be assigned to each node in the DON. Each node will not be able to decrypt the set of secrets belonging to another node. Optionally, a set of default secrets encrypted with the DON public key can be used as a fallback by any DON member who does not have a set of secrets assigned to them. This handles the case where a new member is added to the DON, but the assigned secrets have not yet been updated.

To use per-node assigned secrets, enter a list of secrets objects into `perNodeSecrets` in _Functions-request-config.js_. The number of objects in the array must correspond to the number of nodes in the DON. Default secrets can be entered into the `secrets` parameter of `Functions-request-config.js`. Each secrets object must have the same set of entries, but the values for each entry can be different (ie: `[ { apiKey: '123' }, { apiKey: '456' }, ... ]`). If the per-node secrets feature is not desired, `perNodeSecrets` can be left empty and a single set of secrets can be entered for `secrets`.

If you prefer to host secrets elsewhere instead of having them automatically uploaded to a Github Gist, generate the encrypted secrets JSON file by running the command `npx hardhat functions-build-offchain-secrets --network network_name_here`. This will output the file _offchain-secrets.json_ which can be uploaded to any other hosting service that allows the JSON file to be fetched via URL.
Once the JSON file is uploaded, enter the URL(s) where the JSON file is hosted into `secretsURLs`. Multiple URLs can be entered as a fallback in case any of the URLs are offline. Each URL should host the exact same JSON file. The tooling will automatically pack the secrets URL(s) into a space-separated string and encrypt the string using the DON public key so no 3rd party can view the URLs. Finally, this encrypted string of URLs is used in the `secrets` parameter when making an on-chain request.

URLs which host secrets must be available every time a request is executed by DON nodes. For optimal security, it is recommended to expire the URLs when the off-chain secrets are no longer in use.

# Gas Spikes

When on-chain traffic is high, transaction gas prices can spike unexpectedly. This may decrease the accuracy of the estimated requests costs or cause transactions to fail.
In order to mitigate these problems, ensure your billing subscription balance has a sufficient buffer of two or more times the expected request cost in LINK.
Additionally, you can manually set a hardcoded transaction gas price in the HardHat tooling by modifying the `gasPrice` parameter in the _networks.js_ config file for a particular network.
