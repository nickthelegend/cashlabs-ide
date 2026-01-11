/**
 * CashScript Template Files
 * Smart contracts for Bitcoin Cash
 */

/** @satisfies {import('@webcontainer/api').FileSystemTree} */
export const tealScriptFiles = {
  contracts: {
    directory: {
      "Helloworld.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Hello World Contract
 * A simple contract that requires a specific greeting message.
 */
contract Helloworld(string greeting) {
    // Anyone can call this function if they know the greeting
    function hello(string message) {
        require(message == greeting);
    }
}
`,
        },
      },
      "TransferWithTimeout.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Transfer With Timeout
 * Allows receiver to claim funds, or sender can reclaim after timeout.
 */
contract TransferWithTimeout(pubkey sender, pubkey receiver, int timeout) {
    // Receiver can claim the funds with their signature
    function transfer(sig receiverSig) {
        require(checkSig(receiverSig, receiver));
    }

    // Sender can reclaim after timeout period
    function timeout(sig senderSig) {
        require(checkSig(senderSig, sender));
        require(tx.age >= timeout);
    }
}
`,
        },
      },
      "Escrow.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Escrow Contract
 * An arbiter can release funds to either buyer or seller.
 */
contract Escrow(pubkey arbiter, pubkey buyer, pubkey seller) {
    // Arbiter can release funds to buyer or seller
    function spend(sig arbiterSig, pubkey spendingPK) {
        require(checkSig(arbiterSig, arbiter));
        require(spendingPK == buyer || spendingPK == seller);
    }
}
`,
        },
      },
      "P2PKH.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Pay to Public Key Hash (P2PKH)
 * Standard BCH locking script as a CashScript contract.
 */
contract P2PKH(bytes20 pkh) {
    function spend(pubkey pk, sig s) {
        require(hash160(pk) == pkh);
        require(checkSig(s, pk));
    }
}
`,
        },
      },
      "Announcement.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Announcement Contract
 * Store arbitrary data on the blockchain via OP_RETURN.
 */
contract Announcement() {
    // Anyone can create an announcement
    function announce() {
        // The message is stored in a separate OP_RETURN output
        require(tx.outputs.length == 1);
    }
}
`,
        },
      },
      "Vault.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Vault Contract
 * Time-locked savings with emergency recovery.
 */
contract Vault(pubkey owner, pubkey recoverer, int lockTime) {
    // Owner can spend after lock time
    function withdraw(sig ownerSig) {
        require(checkSig(ownerSig, owner));
        require(tx.time >= lockTime);
    }
    
    // Emergency recovery by trusted party
    function recover(sig recovererSig) {
        require(checkSig(recovererSig, recoverer));
    }
}
`,
        },
      },
      "Mecenas.cash": {
        file: {
          contents: `pragma cashscript ^0.12.0;

/**
 * Mecenas (Patreon-style) Contract
 * Allows recurring payments to a recipient.
 */
contract Mecenas(bytes20 recipient, bytes20 funder, int pledge, int period) {
    function receive() {
        // Check that the first output sends to recipient
        require(tx.outputs[0].lockingBytecode == new LockingBytecodeP2PKH(recipient));
        
        // Check pledge amount
        require(tx.outputs[0].value >= pledge);
        
        // Ensure proper time between pledges
        require(tx.age >= period);
    }
    
    function reclaim(pubkey pk, sig s) {
        require(hash160(pk) == funder);
        require(checkSig(s, pk));
    }
}
`,
        },
      },
    },
  },
  scripts: {
    directory: {
      "deploy.js": {
        file: {
          contents: `/**
 * Deploy CashScript Contract
 * Compiles and deploys a CashScript contract to the BCH network.
 */

import { compileFile } from 'cashscript';
import { TestNetWallet, Wallet } from 'mainnet-js';
import { Contract, ElectrumNetworkProvider } from 'cashscript';

async function deploy() {
  console.log("=== Deploy CashScript Contract ===\\n");
  
  // Compile the contract
  const artifact = compileFile("contracts/Helloworld.cash");
  console.log("Contract compiled:", artifact.contractName);
  
  // Create a wallet for deployment
  const wallet = await TestNetWallet.newRandom();
  console.log("Wallet:", wallet.cashaddr);
  
  // Get testnet funds
  try {
    await wallet.getTestnetSatoshis();
    console.log("Funded from faucet");
  } catch (e) {
    console.error("Faucet error:", e.message);
  }
  
  // Create network provider
  const provider = new ElectrumNetworkProvider('testnet4');
  
  // Create contract instance with constructor arguments
  const contract = new Contract(artifact, ["Hello BCH!"], { provider });
  
  console.log("Contract address:", contract.address);
  console.log("Contract token address:", contract.tokenAddress);
  
  // Get contract balance
  const balance = await contract.getBalance();
  console.log("Contract balance:", balance, "satoshis");
  
  // Fund the contract
  const fundTx = await wallet.send([{
    cashaddr: contract.address,
    value: 10000,
    unit: 'sat'
  }]);
  console.log("Funded contract:", fundTx.txId);
  
  // Call contract function
  // const tx = await contract.functions.hello("Hello BCH!").send();
  // console.log("Contract called:", tx.txid);
}

deploy().catch(console.error);
`,
        },
      },
      "interact.js": {
        file: {
          contents: `/**
 * Interact with CashScript Contracts
 */

import { compileFile, Contract, ElectrumNetworkProvider } from 'cashscript';
import { TestNetWallet } from 'mainnet-js';

async function interact() {
  console.log("=== Interact with Contract ===\\n");
  
  // Compile P2PKH contract
  const artifact = compileFile("contracts/P2PKH.cash");
  
  // Create wallet
  const wallet = await TestNetWallet.newRandom();
  const pubkeyHash = wallet.publicKeyHash; // 20-byte hash
  
  // Create network provider
  const provider = new ElectrumNetworkProvider('testnet4');
  
  // Create contract with wallet's public key hash
  const contract = new Contract(artifact, [pubkeyHash], { provider });
  
  console.log("P2PKH Contract:", contract.address);
  console.log("Standard Address:", wallet.cashaddr);
  
  // They should be equivalent!
  
  // Get UTXOs
  const utxos = await contract.getUtxos();
  console.log("UTXOs:", utxos.length);
  
  // Create transaction to spend from contract
  // const tx = await contract.functions
  //   .spend(wallet.publicKey, new SignatureTemplate(wallet.privateKey))
  //   .to(recipientAddress, 1000)
  //   .send();
}

interact().catch(console.error);
`,
        },
      },
    },
  },
  "package.json": {
    file: {
      contents: `{
  "name": "cashscript-project",
  "type": "module",
  "scripts": {
    "build": "cashc contracts/*.cash --output artifacts",
    "deploy": "node scripts/deploy.js",
    "interact": "node scripts/interact.js"
  },
  "dependencies": {
    "cashscript": "^0.9.3",
    "mainnet-js": "latest"
  }
}`,
    },
  },
  "README.md": {
    file: {
      contents: `# CashScript Bitcoin Cash Project

Build smart contracts for Bitcoin Cash using CashScript.

## Contracts Included

- **Helloworld**: Simple greeting contract
- **TransferWithTimeout**: Time-locked transfers
- **Escrow**: Three-party escrow with arbiter
- **P2PKH**: Standard pay-to-public-key-hash
- **Announcement**: Store data with OP_RETURN
- **Vault**: Time-locked savings
- **Mecenas**: Recurring payments (Patreon-style)

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Compile contracts:
   \`\`\`bash
   npm run build
   \`\`\`

3. Deploy to testnet:
   \`\`\`bash
   npm run deploy
   \`\`\`

## CashScript Syntax

\`\`\`cashscript
pragma cashscript ^0.9.0;

contract MyContract(pubkey owner) {
    function spend(sig ownerSig) {
        require(checkSig(ownerSig, owner));
    }
}
\`\`\`

## Documentation

- [CashScript Docs](https://cashscript.org/)
- [CashScript Playground](https://playground.cashscript.org/)
- [Bitcoin Cash Docs](https://bch.info/)
`,
    },
  },
}