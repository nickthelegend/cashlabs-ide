/**
 * CashScript SDK Wrapper
 * Provides utilities for compiling, instantiating, and interacting with CashScript contracts.
 */

// Types based on CashScript artifact specification
export interface AbiInput {
    name: string;
    type: string;
}

export interface AbiFunction {
    name: string;
    inputs: AbiInput[];
}

export interface Artifact {
    contractName: string;
    constructorInputs: AbiInput[];
    abi: AbiFunction[];
    bytecode: string;
    source: string;
    compiler: {
        name: string;
        version: string;
    };
    updatedAt: string;
}

export interface ContractInfo {
    address: string;
    tokenAddress: string;
    bytecode: string;
    bytesize: number;
    opcount: number;
}

export interface Utxo {
    txid: string;
    vout: number;
    satoshis: bigint;
    token?: {
        amount: bigint;
        category: string;
        nft?: {
            capability: 'none' | 'mutable' | 'minting';
            commitment: string;
        };
    };
}

/**
 * Compile CashScript source code to artifact
 * This function calls the API endpoint that uses compileString
 */
export async function compileCashScript(
    sourceCode: string,
    filename?: string
): Promise<{ ok: boolean; artifact?: Artifact; error?: string }> {
    try {
        const response = await fetch('/api/cashscript/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceCode,
                filename,
            }),
        });

        const result = await response.json();
        return result;
    } catch (error: any) {
        return {
            ok: false,
            error: error.message || 'Compilation failed',
        };
    }
}

/**
 * Generate example instantiation code for a contract
 */
export function generateInstantiationCode(artifact: Artifact): string {
    const constructorArgs = artifact.constructorInputs
        .map((input, i) => {
            switch (input.type) {
                case 'pubkey':
                    return `pubkey${i + 1} // ${input.name}: pubkey`;
                case 'bytes20':
                    return `pubkeyHash${i + 1} // ${input.name}: bytes20`;
                case 'bytes32':
                    return `hash${i + 1} // ${input.name}: bytes32`;
                case 'int':
                    return `0n // ${input.name}: int`;
                case 'bool':
                    return `true // ${input.name}: bool`;
                case 'string':
                    return `"example" // ${input.name}: string`;
                case 'sig':
                    return `signatureTemplate${i + 1} // ${input.name}: sig`;
                default:
                    return `arg${i + 1} // ${input.name}: ${input.type}`;
            }
        })
        .join(',\n    ');

    return `import { Contract, ElectrumNetworkProvider, SignatureTemplate } from 'cashscript';
import artifact from './${artifact.contractName}.json' with { type: 'json' };

// Initialize network provider (use 'mainnet' for production)
const provider = new ElectrumNetworkProvider('chipnet');

// Constructor arguments for ${artifact.contractName}
const constructorArgs = [
    ${constructorArgs}
];

// Create contract instance
const contract = new Contract(artifact, constructorArgs, { provider });

// Contract info
console.log('Contract address:', contract.address);
console.log('Token address:', contract.tokenAddress);
console.log('Bytecode size:', contract.bytesize, 'bytes');
console.log('Op count:', contract.opcount);

// Get balance and UTXOs
const balance = await contract.getBalance();
const utxos = await contract.getUtxos();
console.log('Balance:', balance, 'satoshis');
console.log('UTXOs:', utxos);
`;
}

/**
 * Generate example transaction code for a contract function
 */
export function generateTransactionCode(
    artifact: Artifact,
    functionName: string
): string {
    const func = artifact.abi.find((f) => f.name === functionName);
    if (!func) {
        return `// Function "${functionName}" not found in contract`;
    }

    const funcArgs = func.inputs
        .map((input, i) => {
            if (input.type === 'sig') {
                return `new SignatureTemplate(privateKey)`;
            }
            return `arg${i + 1} // ${input.name}: ${input.type}`;
        })
        .join(', ');

    return `import { TransactionBuilder, SignatureTemplate } from 'cashscript';

// Assuming 'contract' is already instantiated...

// Get contract UTXOs
const utxos = await contract.getUtxos();
const selectedUtxo = utxos[0];

// Create the transaction
const txDetails = await new TransactionBuilder({ provider })
  .addInput(selectedUtxo, contract.unlock.${functionName}(${funcArgs}))
  .addOutput({
    to: recipientAddress,
    amount: 1000n, // Amount in satoshis
  })
  .send();

console.log('Transaction ID:', txDetails.txid);
console.log('Transaction hex:', txDetails.hex);
`;
}

/**
 * Parse CashScript type to description
 */
export function getTypeDescription(type: string): string {
    const typeMap: Record<string, string> = {
        pubkey: '33-byte compressed public key',
        bytes20: '20-byte hash (e.g., public key hash)',
        bytes32: '32-byte hash',
        bytes: 'Variable-length byte array',
        int: 'Integer (bigint in JS)',
        bool: 'Boolean value',
        string: 'UTF-8 string',
        sig: 'Signature (provided via SignatureTemplate)',
    };
    return typeMap[type] || type;
}

/**
 * CashScript data types for reference
 */
export const CashScriptTypes = {
    primitives: ['int', 'bool', 'string', 'pubkey', 'sig', 'datasig'],
    bytes: ['bytes', 'bytes1', 'bytes2', 'bytes4', 'bytes8', 'bytes20', 'bytes32'],
    description: {
        int: 'Signed integer with arbitrary precision',
        bool: 'Boolean true or false',
        string: 'UTF-8 encoded string',
        pubkey: '33-byte compressed ECDSA public key',
        sig: 'ECDSA or Schnorr signature',
        datasig: 'Data signature (without sighash type)',
        bytes: 'Variable-length byte array',
        bytes20: '20-byte array (common for public key hashes)',
        bytes32: '32-byte array (common for transaction/block hashes)',
    },
};

/**
 * CashScript built-in functions for reference
 */
export const CashScriptBuiltins = {
    arithmetic: ['abs', 'min', 'max', 'within'],
    hashing: ['ripemd160', 'sha1', 'sha256', 'hash160', 'hash256'],
    signature: ['checkSig', 'checkMultiSig', 'checkDataSig'],
    introspection: [
        'tx.version',
        'tx.locktime',
        'tx.inputs',
        'tx.outputs',
        'tx.time',
        'tx.age',
    ],
    output: ['tx.outputs[i].value', 'tx.outputs[i].lockingBytecode'],
    input: ['tx.inputs[i].value', 'tx.inputs[i].lockingBytecode', 'tx.inputs[i].outpointHash'],
};
