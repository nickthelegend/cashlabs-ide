/** @satisfies {import('@webcontainer/api').FileSystemTree} */
export const tealScriptFiles = {
  contracts: {
    directory: {
      "Helloworld.cash": {
        file: {
          contents: `pragma cashscript ^0.9.0;

contract Helloworld(string greeting) {
    function hello(string message) {
        require(message == greeting);
    }
}
`,
        },
      },
      "TransferWithTimeout.cash": {
        file: {
          contents: `pragma cashscript ^0.9.0;

contract TransferWithTimeout(pubkey sender, pubkey receiver, int timeout) {
    function transfer(sig receiverSig) {
        require(checkSig(receiverSig, receiver));
    }

    function timeout(sig senderSig) {
        require(checkSig(senderSig, sender));
        require(tx.age >= timeout);
    }
}
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
  "dependencies": {
    "cashscript": "^0.9.3",
    "mainnet-js": "latest"
  },
  "scripts": {
    "build": "cashc contracts/*.cash --output artifacts",
    "deploy": "node deploy.js"
  }
}`,
    },
  },
  "README.md": {
    file: {
      contents: `# CashLabs Bitcoin Cash Project

This project demonstrates how to build and deploy Bitcoin Cash smart contracts using CashScript.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Compile the contract:
   \`\`\`bash
   npm run build
   \`\`\`

3. Deploy to Chipnet:
   \`\`\`bash
   npm run deploy
   \`\`\`
`,
    },
  },
} 