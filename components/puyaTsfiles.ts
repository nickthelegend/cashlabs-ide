/**
 * Libauth Template Files
 * Low-level cryptographic library for Bitcoin Cash
 */

export const puyaTsfiles = {
  "index.ts": {
    file: {
      contents: `/**
 * Libauth Bitcoin Cash Example
 * Low-level cryptographic operations for BCH
 */

import {
  hexToBin,
  binToHex,
  sha256,
  ripemd160,
  hash160,
  hash256,
  instantiateSecp256k1,
  generatePrivateKey,
  deriveHdPublicKey,
  encodeCashAddress,
  CashAddressNetworkPrefix,
} from '@bitauth/libauth';

async function main() {
  console.log("=== Libauth Bitcoin Cash Example ===\\n");

  // Initialize secp256k1
  const secp256k1 = await instantiateSecp256k1();
  
  // Generate a random private key
  const privateKey = generatePrivateKey();
  console.log("Private Key (hex):", binToHex(privateKey));
  
  // Derive public key
  const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
  if (typeof publicKey === 'string') {
    console.error("Error deriving public key:", publicKey);
    return;
  }
  console.log("Public Key (hex):", binToHex(publicKey));
  
  // Create address using hash160
  const publicKeyHash = hash160(publicKey);
  console.log("Public Key Hash:", binToHex(publicKeyHash));
  
  // Encode as CashAddress
  const address = encodeCashAddress({
    prefix: CashAddressNetworkPrefix.mainnet,
    type: 'p2pkh',
    hash: publicKeyHash,
  });
  console.log("CashAddress:", address);
  
  // Hashing examples
  const message = new TextEncoder().encode("Hello Bitcoin Cash!");
  console.log("\\n=== Hashing Examples ===");
  console.log("Message:", "Hello Bitcoin Cash!");
  console.log("SHA256:", binToHex(sha256.hash(message)));
  console.log("RIPEMD160:", binToHex(ripemd160.hash(message)));
  console.log("Hash160:", binToHex(hash160(message)));
  console.log("Hash256:", binToHex(hash256(message)));
  
  // Signing example
  const messageHash = sha256.hash(message);
  const signature = secp256k1.signMessageHashSchnorr(privateKey, messageHash);
  if (typeof signature === 'string') {
    console.error("Error signing:", signature);
    return;
  }
  console.log("\\n=== Schnorr Signature ===");
  console.log("Signature:", binToHex(signature));
  
  // Verify signature
  const isValid = secp256k1.verifySignatureSchnorr(signature, publicKey, messageHash);
  console.log("Signature Valid:", isValid);
  
  console.log("\\n=== Done ===");
}

main().catch(console.error);
`,
    },
  },
  "transaction-builder.ts": {
    file: {
      contents: `/**
 * Transaction Builder with Libauth
 * Build and sign BCH transactions at a low level
 */

import {
  hexToBin,
  binToHex,
  sha256,
  hash256,
  instantiateSecp256k1,
  encodeTransaction,
  decodeTransaction,
  TransactionCommon,
  Output,
  Input,
} from '@bitauth/libauth';

async function buildTransaction() {
  console.log("=== Transaction Builder Example ===\\n");
  
  const secp256k1 = await instantiateSecp256k1();
  
  // Example: Build a simple transaction structure
  // Note: This is a conceptual example. Real transactions require UTXOs
  
  const exampleTransaction: TransactionCommon = {
    version: 2,
    locktime: 0,
    inputs: [
      {
        outpointIndex: 0,
        outpointTransactionHash: hexToBin(
          "0000000000000000000000000000000000000000000000000000000000000001"
        ),
        sequenceNumber: 0xffffffff,
        unlockingBytecode: new Uint8Array(),
      },
    ],
    outputs: [
      {
        lockingBytecode: hexToBin("76a914000000000000000000000000000000000000000088ac"),
        valueSatoshis: BigInt(10000),
      },
    ],
  };
  
  // Encode transaction
  const encodedTx = encodeTransaction(exampleTransaction);
  console.log("Encoded Transaction:", binToHex(encodedTx));
  
  // Transaction hash (txid)
  const txHash = hash256(encodedTx);
  console.log("Transaction Hash:", binToHex(txHash.reverse())); // Reverse for display
  
  // Decode it back
  const decoded = decodeTransaction(encodedTx);
  if (typeof decoded === 'string') {
    console.error("Decode error:", decoded);
    return;
  }
  console.log("Decoded successfully!");
  console.log("  Version:", decoded.version);
  console.log("  Inputs:", decoded.inputs.length);
  console.log("  Outputs:", decoded.outputs.length);
}

buildTransaction().catch(console.error);
`,
    },
  },
  "script-vm.ts": {
    file: {
      contents: `/**
 * Bitcoin Cash Script VM
 * Execute and debug BCH scripts with libauth
 */

import {
  hexToBin,
  binToHex,
  createVirtualMachineBCH,
  OpcodesBCH,
  generateBytecodeMap,
  disassembleBytecode,
  assembleBytecode,
} from '@bitauth/libauth';

async function scriptExample() {
  console.log("=== Bitcoin Cash Script VM ===\\n");
  
  // Create the BCH virtual machine
  const vm = createVirtualMachineBCH();
  
  // Example: Simple script evaluation
  // OP_1 OP_2 OP_ADD OP_3 OP_EQUAL
  const script = hexToBin("51525393559487");
  
  console.log("Script (hex):", binToHex(script));
  
  // Disassemble the script
  const disassembled = disassembleBytecode(OpcodesBCH, script);
  console.log("Disassembled:", disassembled);
  
  // Parse opcodes
  console.log("\\nOpcodes breakdown:");
  console.log("  OP_1 (0x51): Push 1 to stack");
  console.log("  OP_2 (0x52): Push 2 to stack");
  console.log("  OP_ADD (0x93): Add top two stack items");
  console.log("  OP_3 (0x53): Push 3 to stack");
  console.log("  OP_EQUAL (0x87): Check if top two items equal");
  
  // Common opcodes reference
  console.log("\\n=== Common BCH Opcodes ===");
  console.log("OP_DUP (0x76): Duplicate top stack item");
  console.log("OP_HASH160 (0xa9): SHA256 then RIPEMD160");
  console.log("OP_EQUALVERIFY (0x88): OP_EQUAL then OP_VERIFY");
  console.log("OP_CHECKSIG (0xac): Verify signature");
  console.log("OP_RETURN (0x6a): Mark output as unspendable");
  
  // P2PKH script pattern
  console.log("\\n=== P2PKH Template ===");
  console.log("Locking: OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG");
  console.log("Unlocking: <sig> <pubKey>");
}

scriptExample().catch(console.error);
`,
    },
  },
  "package.json": {
    file: {
      contents: `{
  "name": "libauth-template",
  "type": "module",
  "scripts": {
    "start": "npx tsx index.ts",
    "tx": "npx tsx transaction-builder.ts",
    "script": "npx tsx script-vm.ts"
  },
  "dependencies": {
    "@bitauth/libauth": "^3.0.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}`,
    },
  },
  "README.md": {
    file: {
      contents: `# Libauth Bitcoin Cash Project

Low-level cryptographic operations for Bitcoin Cash using @bitauth/libauth.

## Features

- **Key Generation**: Generate private keys and derive public keys
- **Hashing**: SHA256, RIPEMD160, Hash160, Hash256
- **Signing**: ECDSA and Schnorr signatures
- **Script VM**: Execute and debug BCH scripts
- **Transaction Building**: Construct transactions at a low level

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
   npm run tx       # Transaction building
   npm run script   # Script VM
   \`\`\`

## Documentation

- [Libauth GitHub](https://github.com/bitauth/libauth)
- [Bitcoin Cash Script](https://documentation.cash/)
`,
    },
  },
}