/**
 * Mainnet-js Wrapper for Bitcoin Cash Operations
 * This module provides a clean API for wallet management, transactions, and smart contracts.
 * 
 * Available wallet classes:
 * - Wallet: for mainnet
 * - TestNetWallet: for testnet
 * - RegTestWallet: for regtest
 */

// Types for BCH operations
export interface BCHWallet {
    address: string;
    balance: number;
    privateKey: string;
    mnemonic: string;
    transactions: any[];
    bchPrice: number;
}

export interface SendRequest {
    cashaddr: string;
    value: number;
    unit: 'bch' | 'sat' | 'usd';
}

export interface TransactionResult {
    txId: string;
    balance?: {
        bch: number;
        sat: number;
        usd: number;
    };
}

export type NetworkType = 'mainnet' | 'testnet' | 'regtest';

/**
 * Get the appropriate wallet class for the network
 */
async function getWalletClass(network: NetworkType = 'testnet') {
    const mainnetJs = (await import("mainnet-js")) as any;
    switch (network) {
        case 'mainnet':
            return mainnetJs.Wallet;
        case 'testnet':
            return mainnetJs.TestNetWallet;
        case 'regtest':
            return mainnetJs.RegTestWallet;
        default:
            return mainnetJs.TestNetWallet;
    }
}

/**
 * Create a new random wallet
 */
export async function createWallet(network: NetworkType = 'testnet'): Promise<BCHWallet> {
    const WalletClass = await getWalletClass(network);
    const account = await WalletClass.newRandom();

    return {
        address: account.cashaddr || "",
        balance: 0,
        privateKey: account.privateKeyWif || "",
        mnemonic: account.mnemonic || "",
        transactions: [],
        bchPrice: 0,
    };
}

/**
 * Restore wallet from mnemonic
 */
export async function restoreFromMnemonic(
    mnemonic: string,
    derivationPath?: string,
    network: NetworkType = 'testnet'
): Promise<BCHWallet> {
    const WalletClass = await getWalletClass(network);
    const account = await WalletClass.fromSeed(mnemonic, derivationPath);

    return {
        address: account.cashaddr || "",
        balance: 0,
        privateKey: account.privateKeyWif || "",
        mnemonic: mnemonic,
        transactions: [],
        bchPrice: 0,
    };
}

/**
 * Restore wallet from WIF (private key)
 */
export async function restoreFromWIF(wif: string, network: NetworkType = 'testnet'): Promise<BCHWallet> {
    const WalletClass = await getWalletClass(network);
    const account = await WalletClass.fromWIF(wif);

    return {
        address: account.cashaddr || "",
        balance: 0,
        privateKey: wif,
        mnemonic: "",
        transactions: [],
        bchPrice: 0,
    };
}

/**
 * Get wallet balance
 */
export async function getBalance(
    address: string,
    network: NetworkType = 'testnet'
): Promise<{ bch: number; sat: number; usd: number }> {
    const WalletClass = await getWalletClass(network);
    const wallet = await WalletClass.watchOnly(address);
    const balance = await wallet.getBalance();

    return {
        bch: balance.bch || 0,
        sat: balance.sat || 0,
        usd: balance.usd || 0,
    };
}

/**
 * Send BCH to an address
 */
export async function sendBCH(
    privateKey: string,
    requests: SendRequest[],
    network: NetworkType = 'testnet'
): Promise<TransactionResult> {
    const WalletClass = await getWalletClass(network);
    const wallet = await WalletClass.fromWIF(privateKey);

    const txData = await wallet.send(requests);

    return {
        txId: txData.txId,
        balance: txData.balance,
    };
}

/**
 * Send all BCH to an address
 */
export async function sendMax(
    privateKey: string,
    toAddress: string,
    network: NetworkType = 'testnet'
): Promise<TransactionResult> {
    const WalletClass = await getWalletClass(network);
    const wallet = await WalletClass.fromWIF(privateKey);

    const txData = await wallet.sendMax(toAddress);

    return {
        txId: txData.txId,
        balance: txData.balance,
    };
}

/**
 * Send OP_RETURN data
 */
export async function sendOpReturn(
    privateKey: string,
    message: string,
    network: NetworkType = 'testnet'
): Promise<TransactionResult> {
    const mainnetJs = (await import("mainnet-js")) as any;
    const WalletClass = await getWalletClass(network);
    const wallet = await WalletClass.fromWIF(privateKey);

    const txData = await wallet.send([mainnetJs.OpReturnData.from(message)]);

    return {
        txId: txData.txId,
        balance: txData.balance,
    };
}

/**
 * Get testnet satoshis from faucet (testnet only)
 */
export async function getTestnetSatoshis(privateKey: string): Promise<string> {
    const { TestNetWallet } = (await import("mainnet-js")) as any;
    const wallet = await TestNetWallet.fromWIF(privateKey);

    const txId = await wallet.getTestnetSatoshis();
    return txId;
}

/**
 * Return testnet satoshis to faucet (testnet only)
 */
export async function returnTestnetSatoshis(privateKey: string): Promise<TransactionResult> {
    const { TestNetWallet } = (await import("mainnet-js")) as any;
    const wallet = await TestNetWallet.fromWIF(privateKey);

    const result = await wallet.returnTestnetSatoshis();
    return {
        txId: result.txId,
        balance: result.balance,
    };
}

/**
 * Watch for incoming transactions
 */
export async function watchAddress(
    address: string,
    callback: (txHash: string) => void,
    network: NetworkType = 'testnet'
): Promise<() => Promise<void>> {
    const WalletClass = await getWalletClass(network);
    const wallet = await WalletClass.watchOnly(address);

    return await wallet.watchAddress(callback);
}

/**
 * Wait for a specific balance
 */
export async function waitForBalance(
    address: string,
    targetBalance: number,
    unit: 'bch' | 'sat' | 'usd' = 'sat',
    network: NetworkType = 'testnet'
): Promise<{ bch: number; sat: number; usd: number }> {
    const WalletClass = await getWalletClass(network);
    const wallet = await WalletClass.watchOnly(address);

    return await wallet.waitForBalance(targetBalance, unit);
}

/**
 * Get BCH price from CoinGecko
 */
export async function getBCHPrice(): Promise<number> {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=usd"
        );
        const data = await response.json();
        return Number(data['bitcoin-cash'].usd);
    } catch (error) {
        console.error("Error fetching BCH price:", error);
        return 450; // Fallback price
    }
}

/**
 * Generate a QR code URL for an address
 */
export function getQRCodeUrl(address: string, size: number = 150): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${address}`;
}

/**
 * CashToken operations
 */
export const CashTokens = {
    /**
     * Create a new token (genesis)
     */
    async genesis(
        privateKey: string,
        options: {
            amount?: bigint;
            commitment?: string;
            capability?: 'none' | 'mutable' | 'minting';
            value?: number;
        },
        network: NetworkType = 'testnet'
    ): Promise<{ txId: string; tokenId: string }> {
        const mainnetJs = (await import("mainnet-js")) as any;
        const WalletClass = await getWalletClass(network);
        const wallet = await WalletClass.fromWIF(privateKey);

        const capabilityMap: Record<string, any> = {
            none: mainnetJs.NFTCapability.none,
            mutable: mainnetJs.NFTCapability.mutable,
            minting: mainnetJs.NFTCapability.minting,
        };

        const result = await wallet.tokenGenesis({
            amount: options.amount || 0n,
            commitment: options.commitment,
            capability: capabilityMap[options.capability || 'none'],
            value: options.value || 1000,
        });

        return {
            txId: result.txId,
            tokenId: result.tokenIds?.[0] || '',
        };
    },

    /**
     * Send tokens
     */
    async send(
        privateKey: string,
        tokenId: string,
        toAddress: string,
        amount: bigint,
        network: NetworkType = 'testnet'
    ): Promise<TransactionResult> {
        const mainnetJs = (await import("mainnet-js")) as any;
        const WalletClass = await getWalletClass(network);
        const wallet = await WalletClass.fromWIF(privateKey);

        const txData = await wallet.send([
            new mainnetJs.TokenSendRequest({
                cashaddr: toAddress,
                amount: amount,
                tokenId: tokenId,
            }),
        ]);

        return {
            txId: txData.txId,
            balance: txData.balance,
        };
    },

    /**
     * Get token balance
     */
    async getBalance(
        address: string,
        tokenId?: string,
        network: NetworkType = 'testnet'
    ): Promise<bigint> {
        const WalletClass = await getWalletClass(network);
        const wallet = await WalletClass.watchOnly(address);

        if (tokenId) {
            return await wallet.getTokenBalance(tokenId);
        }
        return 0n;
    },

    /**
     * Get all token balances
     */
    async getAllBalances(
        address: string,
        network: NetworkType = 'testnet'
    ): Promise<Record<string, bigint>> {
        const WalletClass = await getWalletClass(network);
        const wallet = await WalletClass.watchOnly(address);

        return await wallet.getAllTokenBalances();
    },
};
