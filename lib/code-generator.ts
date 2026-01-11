import type { Node, Edge } from '@xyflow/react';

export const generateCode = (nodes: Node[], edges: Edge[]): string => {
  if (nodes.length === 0) {
    return `// No nodes found in the flow. Add nodes to generate code.`;
  }
  let code = `import { DefaultWallet } from 'mainnet-js';\n\n`;
  code += `// Bitcoin Cash network configuration\n`;
  code += `// Use 'chipnet' for testnet, 'mainnet' for production\n`;
  code += `const network = 'chipnet';\n\n`;

  // Generate account setups
  let storedMnemonic = "";
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const savedWallet = localStorage.getItem("bch-wallet");
      if (savedWallet) {
        const parsedWallet = JSON.parse(savedWallet);
        if (parsedWallet && parsedWallet.mnemonic) {
          storedMnemonic = parsedWallet.mnemonic;
        }
      }
    }
  } catch (error) {
    console.error("Error parsing wallet from localStorage:", error);
  }

  const accountNodes = nodes.filter(node => node.type === 'account');
  accountNodes.forEach(node => {
    const mnemonic = (node.data as any).config?.mnemonic || storedMnemonic || "PASTE YOUR MNEMONIC HERE";
    code += `// Wallet from node: ${(node.data as any).label || 'Account'}\n`;
    code += `const wallet_${node.id.replace(/-/g, '_')} = await DefaultWallet.fromMnemonic("${mnemonic}", { network });\n`;
  });
  code += '\n';

  code += `async function main() {\n`;

  // Topological sort to process nodes in correct order
  const sortedNodes = topologicalSort(nodes, edges);

  for (const node of sortedNodes) {
    const sourceEdges = edges.filter(edge => edge.target === node.id);
    const sourceNodes = sourceEdges.map(edge => nodes.find(n => n.id === edge.source));

    switch (node.type) {
      case "payment": {
        const senderNode = sourceNodes.find(n => n?.type === 'account');
        if (!senderNode) continue;
        const receiver = (node.data as any).config?.receiver || "RECEIVER_BCH_ADDRESS";
        const amount = (node.data as any).config?.amount || 0;
        code += `    // Payment from ${senderNode.data.label || 'Account'}\n`;
        code += `    const receipt_${node.id.replace(/-/g, '_')} = await wallet_${senderNode.id.replace(/-/g, '_')}.send([\n`;
        code += `        { cashaddr: "${receiver}", value: ${amount}, unit: 'bch' }\n`;
        code += `    ]);\n`;
        code += `    console.log("Transaction ID:", receipt_${node.id.replace(/-/g, '_')}.txId);\n\n`;
        break;
      }
      case "assetCreate": {
        const creatorNode = sourceNodes.find(n => n?.type === 'account');
        if (!creatorNode) continue;
        const name = (node.data as any).config?.assetName || "My Custom Token";
        const symbol = (node.data as any).config?.unitName || "MYT";
        const amount = (node.data as any).config?.total || 1000;
        const decimals = (node.data as any).config?.decimals || 0;

        code += `    // Create Token (CashToken) from ${creatorNode.data.label || 'Account'}\n`;
        code += `    const tokenResponse_${node.id.replace(/-/g, '_')} = await wallet_${creatorNode.id.replace(/-/g, '_')}.tokenCreate({\n`;
        code += `        name: "${name}",\n`;
        code += `        symbol: "${symbol}",\n`;
        code += `        amount: ${amount},\n`;
        code += `        decimals: ${decimals}\n`;
        code += `    });\n`;
        code += `    console.log("New Token ID:", tokenResponse_${node.id.replace(/-/g, '_')}.tokenId);\n\n`;
        break;
      }
      case "assetTransfer": {
        const senderNode = sourceNodes.find(n => n?.type === 'account');
        if (!senderNode) continue;
        const receiver = (node.data as any).config?.receiver || "RECEIVER_BCH_ADDRESS";
        const amount = (node.data as any).config?.amount || 0;
        const tokenId = (node.data as any).config?.assetId || "TOKEN_ID";

        code += `    // Transfer Token from ${senderNode.data.label || 'Account'}\n`;
        code += `    const transferReceipt_${node.id.replace(/-/g, '_')} = await wallet_${senderNode.id.replace(/-/g, '_')}.tokenSend([\n`;
        code += `        { cashaddr: "${receiver}", amount: ${amount}, tokenId: "${tokenId}" }\n`;
        code += `    ]);\n`;
        code += `    console.log("Transfer TX ID:", transferReceipt_${node.id.replace(/-/g, '_')}.txId);\n\n`;
        break;
      }
      // Other nodes can be stubs for now
      default:
        if (node.type && ['signTxn', 'executeTxn', 'keyReg', 'assetFreeze'].includes(node.type)) {
          code += `    // Note: ${node.type} is handled implicitly by mainnet-js wallet methods\n\n`;
        }
        break;
    }
  }

  code += `}\n\n`;
  code += `main().catch(console.error);\n`;

  return code;
};

const topologicalSort = (nodes: Node[], edges: Edge[]): Node[] => {
  const sorted: Node[] = [];
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue = nodes.filter(node => inDegree.get(node.id) === 0);

  while (queue.length > 0) {
    const u = queue.shift()!;
    sorted.push(u);

    adj.get(u.id)?.forEach(vId => {
      inDegree.set(vId, (inDegree.get(vId) || 0) - 1);
      if (inDegree.get(vId) === 0) {
        const node = nodes.find(n => n.id === vId);
        if (node) queue.push(node);
      }
    });
  }

  return sorted;
};