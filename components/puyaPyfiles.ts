export const puyaPyfiles = {
  "index.js": {
    file: {
      contents: `import { DefaultWallet } from 'mainnet-js';

async function run() {
    // Create a new wallet on Chipnet
    const wallet = await DefaultWallet.newRandom({ network: 'chipnet' });
    console.log("New Wallet Address:", wallet.cashaddr);
    console.log("Mnemonic:", wallet.mnemonic);

    // Get balance
    const balance = await wallet.getBalance();
    console.log("Balance:", balance.bch, "BCH");
}

run();
`,
    },
  },
  "package.json": {
    file: {
      contents: `{
  "name": "mainnet-js-template",
  "type": "module",
  "dependencies": {
    "mainnet-js": "latest"
  }
}`,
    },
  },
} 
