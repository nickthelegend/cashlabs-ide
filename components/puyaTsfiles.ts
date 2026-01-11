export const puyaTsfiles = {
  contracts: {
    directory: {
      "Escrow.cash": {
        file: {
          contents: `pragma cashscript ^0.9.0;

contract Escrow(pubkey arbiter, pubkey buyer, pubkey seller) {
    function spend(sig arbiterSig, pubkey spendingPK) {
        require(checkSig(arbiterSig, arbiter));
        require(spendingPK == buyer || spendingPK == seller);
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
  "name": "advanced-cashscript-project",
  "dependencies": {
    "cashscript": "^0.9.3",
    "mainnet-js": "latest"
  }
}`,
    },
  },
} 