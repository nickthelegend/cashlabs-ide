/**
 * Mainnet-js Template Files
 * Template for building Bitcoin Cash applications using mainnet-js SDK
 */

/** @satisfies {import('@webcontainer/api').FileSystemTree} */
export const puyaPyfiles = {
  "index.js": {
    file: {
      contents: `/**
 * Mainnet-js Bitcoin Cash Example
 * This example demonstrates wallet creation, balance checking, and transactions.
 */

import { TestNetWallet, Wallet } from 'mainnet-js';

async function main() {
  console.log("=== Bitcoin Cash with Mainnet-js ===\\n");

  // Create a new testnet wallet
  const wallet = await TestNetWallet.newRandom();
  console.log("New Wallet Created:");
  console.log("  Address:", wallet.cashaddr);
  console.log("  TokenAddress:", wallet.tokenaddr);
  console.log("  Mnemonic:", wallet.mnemonic);

  // Get wallet balance
  const balance = await wallet.getBalance();
  console.log("\\nBalance:");
  console.log("  BCH:", balance.bch);
  console.log("  Satoshis:", balance.sat);
  console.log("  USD:", balance.usd);

  // Request testnet coins from faucet
  console.log("\\nRequesting testnet coins from faucet...");
  try {
    const txId = await wallet.getTestnetSatoshis();
    console.log("  Faucet TxID:", txId);
    
    // Wait for new balance
    const newBalance = await wallet.getBalance();
    console.log("  New Balance:", newBalance.sat, "satoshis");
  } catch (error) {
    console.log("  Faucet error:", error.message);
  }

  // Watch for incoming transactions
  console.log("\\nWatching for transactions...");
  const cancelWatch = await wallet.watchAddress((txHash) => {
    console.log("  New transaction:", txHash);
  });

  // Example: Send BCH (uncomment to use)
  // const txData = await wallet.send([
  //   {
  //     cashaddr: "bchtest:qq...",
  //     value: 1000,
  //     unit: "sat",
  //   }
  // ]);
  // console.log("Transaction sent:", txData.txId);

  // Example: Send OP_RETURN data
  // const { OpReturnData } = await import('mainnet-js');
  // const opReturnTx = await wallet.send([
  //   OpReturnData.from("Hello Bitcoin Cash!")
  // ]);
  // console.log("OP_RETURN sent:", opReturnTx.txId);

  console.log("\\n=== Done ===");
}

main().catch(console.error);
`,
    },
  },
  "wallet-example.js": {
    file: {
      contents: `/**
 * Advanced Wallet Operations
 * Demonstrates named wallets, watch-only wallets, and balance monitoring
 */

import { TestNetWallet, BaseWallet } from 'mainnet-js';

async function advancedWalletOperations() {
  // Named wallet (persisted)
  // Note: Requires storage provider setup
  // const namedWallet = await TestNetWallet.named('user:1234');
  
  // Watch-only wallet (no private key)
  const watchOnlyAddress = "bchtest:qqc3ddc6pe3xfyp2xfxdwqmp8p2z8elahylz9tcknh";
  const watchWallet = await TestNetWallet.watchOnly(watchOnlyAddress);
  console.log("Watching address:", watchWallet.cashaddr);
  
  // Get balance
  const balance = await watchWallet.getBalance();
  console.log("Balance:", balance);
  
  // Watch for balance changes
  const cancelWatch = await watchWallet.watchBalance((newBalance) => {
    console.log("Balance changed:", newBalance);
  });
  
  // Wait for a specific balance
  // const targetBalance = await watchWallet.waitForBalance(10000, 'sat');
  // console.log("Target balance reached:", targetBalance);
  
  // Restore from mnemonic
  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const restoredWallet = await TestNetWallet.fromSeed(mnemonic);
  console.log("Restored wallet:", restoredWallet.cashaddr);
  
  // Restore from WIF
  // const wif = "cNfsPtqN2bMRS7vH5qd8tR8GMvgXyL5BjnGAKgZ8DYEiCrCCQcP6";
  // const wifWallet = await TestNetWallet.fromWIF(wif);
  
  console.log("Advanced wallet operations complete!");
}

advancedWalletOperations().catch(console.error);
`,
    },
  },
  "cashtokens-example.js": {
    file: {
      contents: `/**
 * CashTokens Example
 * Demonstrates fungible and non-fungible token operations
 */

import { TestNetWallet, NFTCapability, TokenSendRequest, TokenMintRequest } from 'mainnet-js';

async function cashTokensExample() {
  // Create a funded wallet first
  const wallet = await TestNetWallet.newRandom();
  console.log("Wallet:", wallet.cashaddr);
  console.log("Token Address:", wallet.tokenaddr);
  
  // Request testnet coins for gas
  try {
    await wallet.getTestnetSatoshis();
    console.log("Funded from faucet");
  } catch (e) {
    console.log("Faucet error:", e.message);
    return;
  }
  
  // Create a new token (Genesis)
  console.log("\\nCreating new token...");
  const genesisResult = await wallet.tokenGenesis({
    amount: 1000n,                      // Fungible token amount
    commitment: "genesis",              // NFT commitment
    capability: NFTCapability.minting,  // Minting capability
    value: 1000,                        // Satoshi value
  });
  
  const tokenId = genesisResult.tokenIds[0];
  console.log("Token created!");
  console.log("  Token ID:", tokenId);
  console.log("  TxID:", genesisResult.txId);
  
  // Get token balance
  const tokenBalance = await wallet.getTokenBalance(tokenId);
  console.log("  Token Balance:", tokenBalance.toString());
  
  // Mint new NFTs
  console.log("\\nMinting new NFTs...");
  const mintResult = await wallet.tokenMint(
    tokenId,
    [
      new TokenMintRequest({
        cashaddr: wallet.cashaddr,
        commitment: "nft-001",
        capability: NFTCapability.none,
        value: 1000,
      }),
      new TokenMintRequest({
        cashaddr: wallet.cashaddr,
        commitment: "nft-002",
        capability: NFTCapability.mutable,
        value: 1000,
      }),
    ],
    true // Reduce fungible amount
  );
  console.log("NFTs minted:", mintResult.txId);
  
  // Send tokens
  // const sendResult = await wallet.send([
  //   new TokenSendRequest({
  //     cashaddr: recipientAddress,
  //     amount: 100n,
  //     tokenId: tokenId,
  //   }),
  // ]);
  
  // Get all token balances
  const allBalances = await wallet.getAllTokenBalances();
  console.log("\\nAll Token Balances:", allBalances);
  
  // Get NFT count
  const nftCount = await wallet.getNftTokenBalance(tokenId);
  console.log("NFT Count:", nftCount);
}

cashTokensExample().catch(console.error);
`,
    },
  },
  "package.json": {
    file: {
      contents: `{
  "name": "mainnet-js-template",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "wallet": "node wallet-example.js",
    "tokens": "node cashtokens-example.js"
  },
  "dependencies": {
    "mainnet-js": "latest"
  }
}`,
    },
  },
  "README.md": {
    file: {
      contents: `# Mainnet-js Bitcoin Cash Project

Build Bitcoin Cash applications using the mainnet-js SDK.

## Features

- **Wallet Management**: Create, restore, and manage BCH wallets
- **Transactions**: Send and receive BCH
- **CashTokens**: Create and manage fungible and non-fungible tokens
- **OP_RETURN**: Store arbitrary data on the blockchain
- **Watch-only**: Monitor addresses without private keys

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the main example:
   \`\`\`bash
   npm start
   \`\`\`

3. Try other examples:
   \`\`\`bash
   npm run wallet
   npm run tokens
   \`\`\`

## Documentation

- [Mainnet-js Docs](https://mainnet.cash/tutorial/)
- [CashTokens Spec](https://github.com/bitjson/cashtokens)
- [Bitcoin Cash Docs](https://bch.info/)
`,
    },
  },
}
