"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"

import { Sidebar } from "@/components/sidebar"
import { CodeEditorDynamic } from "@/components/code-editor-dynamic"
const CodeEditor = CodeEditorDynamic as any;
import { WebContainerTerminal } from "@/components/webcontainer-terminal"
import AIChat from "@/components/ai-chat"
import { BuildToolbar } from "@/components/build-toolbar"
import { BuildPanel } from "@/components/build-panel"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WalletPanel } from "@/components/wallet-panel"
import { TutorialPanel } from "@/components/tutorial-panel"
import { ArtifactsPanel } from "@/components/artifacts-panel"
import { ProgramsPanel } from "@/components/programs-panel"
import { SettingsPanel } from "@/components/settings-panel"
import { ArtifactFileViewerPanel } from "@/components/artifact-file-viewer-panel"
import { Pencil } from "lucide-react"

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TransactionBuilder } from "@/components/transaction-builder"

interface Wallet {
  address: string
  balance: number
  privateKey: string
  mnemonic: string
  transactions: any[]
  bchPrice: number
}

export default function CashLabsIDE({ initialFiles, selectedTemplate, selectedTemplateName, projectId }: { initialFiles: any, selectedTemplate: string, selectedTemplateName: string, projectId?: string }) {
  const [currentFiles, setCurrentFiles] = useState<any>(initialFiles);
  const [contractName, setContractName] = useState(selectedTemplateName);
  const [isEditingName, setIsEditingName] = useState(false);

  const getAllFileContents = (tree: any, currentPath: string = '') => {
    let contents: Record<string, string> = {};
    for (const key in tree) {
      const newPath = currentPath ? `${currentPath}/${key}` : key;
      if (tree[key].file) {
        contents[newPath] = tree[key].file.contents;
      } else if (tree[key].directory) {
        contents = { ...contents, ...getAllFileContents(tree[key].directory, newPath) };
      }
    }
    return contents;
  };

  const [activeFile, setActiveFile] = useState("");
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => getAllFileContents(currentFiles));
  const [sidebarSection, setSidebarSection] = useState("explorer")
  const [showWallet, setShowWallet] = useState(false)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [activeArtifactFile, setActiveArtifactFile] = useState<string | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployArgs, setDeployArgs] = useState<any[]>([]);
  const [currentDeployFilename, setCurrentDeployFilename] = useState<string | null>(null);
  const [contractArgs, setContractArgs] = useState<any[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'deploying' | 'success' | 'error' | null>(null);
  const [deployedAppId, setDeployedAppId] = useState<string>('');
  const [isMethodsModalOpen, setIsMethodsModalOpen] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [executeArgs, setExecuteArgs] = useState<any[]>([]);

  // Layout state
  const [showAIChat, setShowAIChat] = useState(false)
  const [showBuildPanel, setShowBuildPanel] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [isReady, setIsReady] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const { toast } = useToast();
  const [deployedContracts, setDeployedContracts] = useState<any[]>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      try {
        return JSON.parse(localStorage.getItem("deployedContracts") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    setCurrentFiles(initialFiles);
    setFileContents(getAllFileContents(initialFiles));
    setIsReady(true);

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const savedWallet = localStorage.getItem("bch-wallet")
      if (savedWallet) {
        try {
          const parsedWallet = JSON.parse(savedWallet)
          if (parsedWallet && typeof parsedWallet.address === 'string') {
            setWallet(parsedWallet)
          } else {
            console.error("Invalid wallet data in localStorage:", parsedWallet)
            if (typeof localStorage.removeItem === 'function') localStorage.removeItem("bch-wallet")
          }
        } catch (error) {
          console.error("Error parsing wallet from localStorage:", error)
          if (typeof localStorage.removeItem === 'function') localStorage.removeItem("bch-wallet")
        }
      }
    }

    if (typeof window !== 'undefined' && selectedTemplate === 'PuyaTs') {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedContract = urlParams.get('contract');
      if (encodedContract) {
        loadContract(encodedContract);
      }
    }
  }, [initialFiles, selectedTemplate]);

  const loadContract = async (encoded: string) => {
    try {
      handleTerminalOutput("Loading contract...");

      const response = await fetch('/api/load-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encoded })
      });

      const result = await response.json();

      if (result.success && result.code) {
        const updatedFiles = { ...currentFiles };
        const newFileContents = { ...fileContents };

        updatedFiles[result.filename] = {
          file: { contents: result.code }
        };

        newFileContents[result.filename] = result.code;

        setCurrentFiles(updatedFiles);
        setFileContents(newFileContents);
        openFile(result.filename);
        handleTerminalOutput(`Contract loaded: ${result.filename}`);
      } else {
        handleTerminalOutput(`Failed to load contract: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('[LOAD-CONTRACT] Error:', error);
      handleTerminalOutput(`Failed to load contract: ${error.message || error}`);
    }
  };

  const handleTerminalOutput = useCallback((data: string) => {
    setTerminalOutput((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${data}`]);
    // Auto-scroll to bottom
    const terminalElement = document.getElementById('terminal-output-container');
    if (terminalElement) {
      setTimeout(() => {
        terminalElement.scrollTop = terminalElement.scrollHeight;
      }, 10);
    }
  }, []);

  const createWallet = async () => {
    try {
      const { TestNetWallet } = (await import("mainnet-js")) as any
      const account = await TestNetWallet.newRandom()

      const newWallet = {
        address: account.cashaddr || "",
        balance: 0,
        privateKey: account.privateKeyWif || "",
        mnemonic: account.mnemonic || "",
        transactions: [],
        bchPrice: 0,
      }


      setWallet(newWallet as any)
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem("bch-wallet", JSON.stringify(newWallet))
      }

      console.log("Wallet created! To fund with test BCH, visit:")
      console.log(`https://chipnet.imaginary.cash/`)
    } catch (error) {
      console.error("Error creating wallet:", error)
    }
  }

  const openFile = (filePath: string) => {
    if (!openFiles.includes(filePath)) {
      setOpenFiles((prev) => [...prev, filePath])
    }
    setActiveFile(filePath)
  }

  const closeFile = (filePath: string) => {
    const newOpenFiles = openFiles.filter((f) => f !== filePath)
    setOpenFiles(newOpenFiles)

    if (activeFile === filePath) {
      const currentIndex = openFiles.indexOf(filePath)
      const nextFile = newOpenFiles[currentIndex] || newOpenFiles[currentIndex - 1] || newOpenFiles[0]
      setActiveFile(nextFile || "")
    }
  }

  const createFile = async (filePath: string) => {
    setFileContents((prev) => ({ ...prev, [filePath]: "" }));
    setOpenFiles((prev) => [...prev, filePath]);
    setActiveFile(filePath);
  };

  const renameFile = async (oldPath: string, newPath: string) => {
    const content = fileContents[oldPath] || '';
    setFileContents((prev) => {
      const updated = { ...prev };
      updated[newPath] = content;
      delete updated[oldPath];
      return updated;
    });
    setOpenFiles((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
    if (activeFile === oldPath) {
      setActiveFile(newPath);
    }
  };

  const deleteFile = async (filePath: string) => {
    setFileContents((prev) => {
      const updated = { ...prev };
      delete updated[filePath];
      return updated;
    });
    closeFile(filePath);
  };

  const handleStop = () => {
    setIsBuilding(false)
  }

  const handleClearLogs = () => {
    setTerminalOutput([])
  }

  const handleCashScriptBuild = async () => {
    setIsBuilding(true);
    setTerminalOutput([]); // Clear previous output
    handleTerminalOutput("🚀 Initializing CashScript Build System...");
    handleTerminalOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      // Small delay to ensure state is settled
      await new Promise(resolve => setTimeout(resolve, 50));

      const cashFiles = Object.keys(fileContents)
        .filter(path => path.toLowerCase().endsWith('.cash'));

      handleTerminalOutput(`📁 Found ${cashFiles.length} source file(s)`);
      if (cashFiles.length === 0) {
        handleTerminalOutput("❌ No .cash files found!");
        handleTerminalOutput("💡 Tip: Files should end with .cash (e.g., contracts/mycontract.cash)");
        setIsBuilding(false);
        return;
      }

      // 2. COMPILATION PHASE
      handleTerminalOutput("🔨 Compiling contracts...");

      let successCount = 0;
      let errorCount = 0;

      // Deep clone currentFiles to avoid mutating state directly
      const updatedFiles = JSON.parse(JSON.stringify(currentFiles));
      if (!updatedFiles.artifacts) updatedFiles.artifacts = { directory: {} };
      if (!updatedFiles.artifacts.directory) updatedFiles.artifacts.directory = {};

      const newFileContents = { ...fileContents };

      for (const filePath of cashFiles) {
        const filename = filePath.split('/').pop() || filePath;
        const sourceCode = fileContents[filePath];

        if (!sourceCode || sourceCode.trim() === '') {
          handleTerminalOutput(`⚠️  Skipping empty file: ${filename}`);
          continue;
        }

        handleTerminalOutput(`📄 Processing: ${filename}`);

        try {
          const response = await fetch('/api/cashscript/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceCode, filename })
          });

          const result = await response.json();

          if (result.ok && result.artifact) {
            const contractName = result.contractName || filename.replace(/\.cash$/i, '');
            const artifactFilename = `${contractName}.json`;
            const infoFilename = `${contractName}.info.txt`;
            const artifactContent = JSON.stringify(result.artifact, null, 2);

            updatedFiles.artifacts.directory[artifactFilename] = {
              file: { contents: artifactContent }
            };
            newFileContents[`artifacts/${artifactFilename}`] = artifactContent;

            const infoContent = [
              `Contract: ${contractName}`,
              `Compiled: ${new Date().toLocaleString()}`,
              `Bytes: ${result.bytesize} | Ops: ${result.opcount}`,
              `Functions: ${result.abi?.map((f: any) => f.name).join(', ') || 'none'}`
            ].join('\n');

            updatedFiles.artifacts.directory[infoFilename] = {
              file: { contents: infoContent }
            };
            newFileContents[`artifacts/${infoFilename}`] = infoContent;

            handleTerminalOutput(`   ✅ Compiled ${contractName}`);
            successCount++;
          } else {
            handleTerminalOutput(`   ❌ Error compiling ${filename}: ${result.error || 'Unknown'}`);
            errorCount++;
          }
        } catch (err: any) {
          handleTerminalOutput(`   ❌ Network Error: ${err.message}`);
          errorCount++;
        }
      }

      setCurrentFiles(updatedFiles);
      setFileContents(newFileContents);

      handleTerminalOutput("");
      handleTerminalOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      handleTerminalOutput(`🎉 Build Finished: ${successCount} success, ${errorCount} errors`);

      if (successCount > 0 && projectId) {
        await saveProject(updatedFiles);
      }

    } catch (error: any) {
      handleTerminalOutput(`🛑 Critical error: ${error.message || error}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleTealScriptBuild = handleCashScriptBuild;

  const handleBuild = async () => {
    setShowBuildPanel(true);
    console.log(`[BUILD] Starting build for template: ${selectedTemplate}`);

    if (selectedTemplate === 'CashScript') {
      await handleCashScriptBuild();
      return;
    }

    handleTerminalOutput("No build process needed for this template.");
  };

  const handleTest = async () => {
    handleTerminalOutput("Tests not implemented yet.");
  };

  const handleDeploy = async () => {
    handleTerminalOutput("Use the artifacts panel to deploy contracts.");
  };

  const handleDownloadSnapshot = async () => {
    setIsBuilding(true);
    handleTerminalOutput("Creating snapshot...");
    try {
      const jsonData = JSON.stringify(currentFiles, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate}-snapshot.json`;
      a.click();

      URL.revokeObjectURL(url);
      handleTerminalOutput("Snapshot downloaded successfully.");
    } catch (error) {
      console.error("Snapshot failed:", error);
      handleTerminalOutput(`Snapshot failed: ${error}`);
    } finally {
      setIsBuilding(false);
    }
  }

  const handleGenerateClient = async () => {
    handleTerminalOutput("Client generation not implemented yet.");
  };

  const executeDeploy = async (filename: string, args: any[]) => {
    setIsDeploying(true);
    setDeployStatus('deploying');
    console.log(`[DEPLOY] Starting deployment for ${filename} with args:`, args);
    handleTerminalOutput(`\n🚀 Deploying contract: ${filename}`);

    try {
      const artifactPath = `artifacts/${filename}`;
      const fileContent = fileContents[artifactPath] || fileContents[filename] || '';
      if (!fileContent) {
        throw new Error(`Artifact file ${filename} not found`);
      }

      const artifact = JSON.parse(fileContent);

      if (!wallet) {
        throw new Error("Wallet not connected. Please create a wallet first.");
      }

      // Check for CashScript artifact
      if (artifact.contractName && artifact.bytecode && artifact.abi) {
        handleTerminalOutput(`📋 Contract: ${artifact.contractName}`);
        handleTerminalOutput(`📍 Constructor args required: ${artifact.constructorInputs.length}`);

        // Import CashScript SDK dynamically
        const { Contract, ElectrumNetworkProvider } = await import('cashscript');

        // Create network provider
        const provider = new ElectrumNetworkProvider('chipnet');
        handleTerminalOutput(`🌐 Network: chipnet (testnet)`);

        // Create contract instance with provided args
        const contract = new Contract(artifact, args, { provider });

        const address = contract.address;
        const tokenAddress = contract.tokenAddress;
        const bytesize = contract.bytesize;
        const opcount = contract.opcount;

        handleTerminalOutput(`\n✅ Contract deployed successfully!`);
        handleTerminalOutput(`   Address: ${address}`);
        handleTerminalOutput(`   Token Address: ${tokenAddress}`);
        handleTerminalOutput(`   Size: ${bytesize} bytes, ${opcount} opcodes`);

        // Get initial balance
        const balance = await contract.getBalance();
        handleTerminalOutput(`   Balance: ${balance} satoshis`);

        // Save deployed contract info
        const deployed = {
          contractName: artifact.contractName,
          address,
          appId: address, // Alias for UI compatibility
          tokenAddress,
          artifact: filename,
          artifactData: artifact, // Store full artifact for persistence
          args,
          time: Date.now(),
          methods: artifact.abi.map((fn: any) => ({
            name: fn.name,
            args: fn.inputs || []
          })),
          bytesize,
          opcount,
        };

        const prevData = (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function')
          ? localStorage.getItem("deployedContracts")
          : "[]";
        const prev = JSON.parse(prevData || "[]");
        const updated = [deployed, ...prev];
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
          localStorage.setItem("deployedContracts", JSON.stringify(updated));
        }
        setDeployedContracts(updated);
        setDeployedAppId(address);
        setDeployStatus('success');

        toast({
          title: "✅ Contract Deployed!",
          description: `${artifact.contractName} deployed to ${address.substring(0, 20)}...`,
          duration: 5000
        });

        handleTerminalOutput(`\n📝 To interact with this contract:`);
        handleTerminalOutput(`   1. Send BCH to: ${address}`);
        handleTerminalOutput(`   2. Use the SDK to call contract functions`);
        handleTerminalOutput(`   Available functions: ${artifact.abi.map((f: any) => f.name).join(', ')}`);

      } else {
        throw new Error("Invalid artifact format. Expected CashScript artifact with contractName, bytecode, and abi.");
      }

    } catch (error: any) {
      console.error("[DEPLOY] Failed:", error);
      handleTerminalOutput(`\n❌ Deployment failed: ${error.message}`);
      setDeployStatus('error');
      toast({
        title: "❌ Deployment Failed",
        description: error.message || String(error),
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsDeploying(false);
      setIsDeployModalOpen(false);
    }
  };

  const deployArtifact = async (filename: string, passedArtifact?: any) => {
    console.log("[DEPLOY] deployArtifact called:", filename);
    try {
      let artifact = passedArtifact;

      if (!artifact) {
        const artifactPath = `artifacts/${filename}`;
        const fileContent = fileContents[artifactPath] || fileContents[filename] || '';
        if (!fileContent) {
          throw new Error(`Artifact file ${filename} not found`);
        }
        artifact = JSON.parse(fileContent);
      }

      console.log("[DEPLOY] Parsed artifact:", artifact);

      // Check if it's a CashScript artifact
      if (artifact.contractName && artifact.constructorInputs && artifact.abi) {
        console.log("[DEPLOY] CashScript artifact detected");

        // If no constructor inputs needed, deploy directly
        if (!artifact.constructorInputs || artifact.constructorInputs.length === 0) {
          console.log("[DEPLOY] No constructor args needed");
          await executeDeploy(filename, []);
          return;
        }

        // Set up constructor args modal
        setCurrentDeployFilename(filename);
        setContractArgs(artifact.constructorInputs);

        // Initialize args with default values based on type
        const initialArgs = artifact.constructorInputs.map((input: any) => {
          const type = input.type || '';
          if (type === 'int') return 0;
          if (type === 'bool') return false;
          if (type === 'pubkey') return wallet?.address ? `<your pubkey>` : '';
          if (type === 'bytes20') return wallet?.address ? `<pubkey hash>` : '';
          if (type === 'sig') return '<signature>';
          if (type.startsWith('bytes')) return '';
          return '';
        });
        setDeployArgs(initialArgs);
        setIsDeployModalOpen(true);

      } else {
        // Legacy format or no args needed
        console.log("[DEPLOY] Non-CashScript or no args needed");
        await executeDeploy(filename, []);
      }
    } catch (error: any) {
      console.error("[DEPLOY] Failed:", error);
      setDeployStatus('error');
      toast({
        title: "❌ Deployment Failed",
        description: error.message || String(error),
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const saveProject = async (updatedFiles?: any) => {
    if (!projectId) return;
    const filesToSave = updatedFiles || currentFiles;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          file_structure: filesToSave,
          name: contractName
        })
      });

      if (response.ok) {
        handleTerminalOutput('Project saved successfully');
      } else {
        handleTerminalOutput('Failed to save project');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      handleTerminalOutput('Failed to save project');
    }
  };

  const handleSave = async () => {
    if (!activeFile || !fileContents[activeFile]) return;

    try {
      handleTerminalOutput(`Saved: ${activeFile}`);
      if (window && (window as any).clearUnsavedFile) {
        (window as any).clearUnsavedFile(activeFile);
      }
      if (projectId) {
        await saveProject();
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      handleTerminalOutput(`Failed to save: ${activeFile}`);
    }
  };

  const handleSidebarSectionChange = (section: string) => {
    if (section === 'ai-chat') {
      setShowAIChat(true);
      return;
    }
    if (section === 'build-panel') {
      setShowBuildPanel(true);
      return;
    }
    setSidebarSection(section);
  };

  const executeMethod = async () => {
    if (!selectedContract || !selectedMethod) return;
    setIsDeploying(true);
    handleTerminalOutput(`\n🚀 Preparing to execute: ${selectedMethod.name}`);

    try {
      // 1. OBTAIN ARTIFACT
      let artifact = selectedContract.artifactData;

      if (!artifact) {
        const artifactPath = `artifacts/${selectedContract.artifact}`;
        const filename = selectedContract.artifact;
        const fileContent = fileContents[artifactPath] || fileContents[filename] || '';

        if (fileContent) {
          artifact = JSON.parse(fileContent);
        } else {
          // Deep search in fileContents
          const foundKey = Object.keys(fileContents).find(k => k.endsWith(filename));
          if (foundKey) {
            artifact = JSON.parse(fileContents[foundKey]);
          }
        }
      }

      if (!artifact) {
        throw new Error(`Contract artifact (${selectedContract.artifact}) could not be located in workspace or local storage.`);
      }

      if (!wallet) {
        throw new Error("Wallet not connected. Private key required for execution.");
      }

      // 2. INITIALIZE SDK
      const { Contract, ElectrumNetworkProvider, SignatureTemplate } = await import('cashscript');
      const provider = new ElectrumNetworkProvider('chipnet');

      // Re-instantiate contract
      // selectedContract.args contains construction arguments
      const contract = new Contract(artifact, selectedContract.args || [], { provider });

      if (contract.address !== selectedContract.address) {
        handleTerminalOutput(`⚠️  Warning: Derived address (${contract.address}) does not match deployment address (${selectedContract.address}). Check constructor arguments.`);
      }

      // 3. PROCESS ARGUMENTS
      const processedArgs = executeArgs.map((val, i) => {
        const argInfo = selectedMethod.args[i];
        if (!argInfo) return val;

        const type = argInfo.type;
        handleTerminalOutput(`   Mapping arg [${argInfo.name}] (${type}): ${val}`);

        if (type === 'sig') {
          return new SignatureTemplate(wallet.privateKey);
        }
        if (type === 'pubkey') {
          return new SignatureTemplate(wallet.privateKey).getPublicKey();
        }
        if (type === 'int') {
          try {
            return BigInt(val);
          } catch {
            throw new Error(`Invalid integer value for ${argInfo.name}: ${val}`);
          }
        }
        if (type === 'bool') {
          return val === 'true' || val === '1';
        }
        // Bytes handling (e.g. 0x...)
        if (type.startsWith('bytes') && typeof val === 'string' && val.startsWith('0x')) {
          // cashscript handles 0x strings automatically in many cases, but let's be safe
          return val;
        }

        return val;
      });

      // 4. BUILD & SEND TRANSACTION
      handleTerminalOutput(`📡 Broadcasting to Chipnet...`);

      const func = (contract.unlock as any)[selectedMethod.name];
      if (typeof func !== 'function') {
        throw new Error(`Method ${selectedMethod.name} not found on contract instance.`);
      }

      const tx = func(...processedArgs);

      // We send 1000 satoshis (dust/small amount) to the user's wallet to ensure 
      // the transaction has at least one output and valid fee calculation.
      // This is common for non-covenant/simple contract calls.
      const txDetails = await tx.to(wallet.address, BigInt(1000)).send();

      handleTerminalOutput(`✅ Transaction confirmed!`);
      handleTerminalOutput(`   TXID: ${txDetails.txid}`);
      handleTerminalOutput(`   Explorer: https://chipnet.imaginary.cash/tx/${txDetails.txid}`);

      toast({
        title: "Success: Method Executed",
        description: `${selectedMethod.name} successful! TXID: ${txDetails.txid.substring(0, 8)}...`
      });

    } catch (error: any) {
      console.error("[CASHSCRIPT] Execution Error:", error);

      // Nice error handling for common CashScript failures
      let errorMessage = error.message || String(error);

      if (errorMessage.includes('FailedRequireError')) {
        handleTerminalOutput(`❌ Contract Requirement Failed:`);
        if (error.requireStatement) {
          handleTerminalOutput(`   Location: Line ${error.requireStatement.line}`);
          handleTerminalOutput(`   Reason: ${error.requireStatement.message || 'Specific requirement not met'}`);
          errorMessage = `Contract failed at line ${error.requireStatement.line}: ${error.requireStatement.message || 'Check inputs'}`;
        }
      } else if (errorMessage.includes('insufficient priority') || errorMessage.includes('insufficient funds')) {
        handleTerminalOutput(`❌ Wallet Error: Insufficient funds to pay for transaction.`);
        errorMessage = "Your wallet has insufficient funds. Please fund it at the Chipnet Faucet.";
      } else {
        handleTerminalOutput(`❌ Error: ${errorMessage}`);
      }

      toast({
        title: "Execution Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
      setIsExecuteModalOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background-color)", color: "var(--text-color)" }}>
      {/* Title Bar */}
      <div className="h-9 flex items-center justify-between px-4 text-sm border-b flex-shrink-0" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <span className="font-medium" style={{ color: "var(--text-color)" }}>CashLabs IDE</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              autoFocus
              className="bg-[#1e1e1e] border border-white/10 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#5ae6b9]/50 w-48"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                saveProject();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false);
                  saveProject();
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded transition-colors" onClick={() => setIsEditingName(true)}>
              <span className="font-bold text-sm tracking-tight text-white/80 group-hover:text-white">{contractName}</span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-all text-[#5ae6b9]" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {wallet && wallet.address ? (
            <button
              onClick={() => setShowWallet(!showWallet)}
              className="px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
              style={{ backgroundColor: "var(--button-color)", color: "black" }}
            >
              Wallet: {`${String(wallet.address.substring(0, 10))}...` || "Invalid Address"}
            </button>
          ) : (
            <button
              onClick={createWallet}
              className="px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
              style={{ backgroundColor: "var(--button-color)", color: "black" }}
            >
              Create Wallet
            </button>
          )}
        </div>
      </div>

      {/* Build Toolbar */}
      <BuildToolbar
        onBuild={handleBuild}
        onTest={handleTest}
        onDeploy={handleDeploy}
        onGenerateClient={handleGenerateClient}
        isBuilding={isBuilding}
        onStop={handleStop}
        isWebContainerReady={isReady}
        onSave={handleSave}
      />

      {/* Main Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full border-r" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
            <Sidebar
              activeSection={sidebarSection}
              onSectionChange={handleSidebarSectionChange}
              activeFile={activeFile}
              onFileSelect={openFile}
              webcontainer={null}
              onCreateFile={createFile}
              onRenameFile={renameFile}
              onDeleteFile={deleteFile}
              isWebContainerReady={isReady}
              fileStructure={currentFiles}
              onArtifactFileSelect={setActiveArtifactFile}
              deployedContracts={deployedContracts}
              onContractSelect={(contract) => {
                setSelectedContract(contract);
                setIsMethodsModalOpen(true);
              }}
              onBuild={handleBuild}
              isBuilding={isBuilding}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Content Area */}
        <ResizablePanel defaultSize={showBuildPanel ? 50 : 80}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor Area */}
            <ResizablePanel defaultSize={70}>
              <ResizablePanelGroup direction="horizontal">
                {/* Code Editor */}
                <ResizablePanel defaultSize={showWallet ? 70 : 100}>
                  {activeArtifactFile ? (
                    <ArtifactFileViewerPanel
                      filePath={activeArtifactFile}
                      fileContents={fileContents}
                      selectedTemplate={selectedTemplate}
                      onDeploy={deployArtifact}
                      onClose={() => setActiveArtifactFile(null)}
                    />
                  ) : sidebarSection === "tutorials" ? (
                    <TutorialPanel />
                  ) : (sidebarSection === "artifacts" || sidebarSection === "build") ? (
                    <ArtifactsPanel webcontainer={null} onDeploy={deployArtifact} fileContents={fileContents} />
                  ) : sidebarSection === "programs" ? (
                    <ProgramsPanel
                      deployedContracts={deployedContracts}
                      onContractSelect={(contract) => {
                        setSelectedContract(contract);
                        setIsMethodsModalOpen(true);
                      }}
                    />
                  ) : sidebarSection === "settings" ? (
                    <SettingsPanel />
                  ) : (
                    <CodeEditor
                      activeFile={activeFile}
                      openFiles={openFiles}
                      fileContents={fileContents}
                      onFileSelect={setActiveFile}
                      onFileClose={closeFile}
                      onFileContentChange={async (filePath: string, content: string) => {
                        setFileContents((prev) => {
                          const updated = { ...prev, [filePath]: content };
                          return updated;
                        });
                      }}
                      onSave={handleSave}
                      webcontainer={null}
                      template={selectedTemplate.toLowerCase() as 'pyteal' | 'tealscript' | 'puyapy' | 'puyats'}
                    />
                  )}
                </ResizablePanel>

                {/* Wallet Panel */}
                {showWallet && wallet && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                      <div className="h-full border-l" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
                        <WalletPanel wallet={wallet} onClose={() => setShowWallet(false)} />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle />

            {/* Bottom Panel - Terminal */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="horizontal">
                {/* Build Terminal */}
                <ResizablePanel defaultSize={showAIChat ? 50 : 100}>
                  <div className="h-full border-t" style={{ backgroundColor: "var(--background-color)", borderColor: "var(--border-color)" }}>
                    <WebContainerTerminal
                      title="BUILD TERMINAL"
                      webcontainer={null}
                      output={terminalOutput}
                      onAddOutput={handleTerminalOutput}
                    />
                  </div>
                </ResizablePanel>

                {/* AI Chat Panel */}
                {showAIChat && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={50} minSize={30}>
                      <div className="h-full border-t border-l" style={{ backgroundColor: "var(--background-color)", borderColor: "var(--border-color)" }}>
                        <AIChat
                          title="AI Chat"
                          selectedTemplate={selectedTemplate}
                          activeFile={activeFile}
                          fileContent={activeFile ? fileContents[activeFile] : undefined}
                          onFileUpdate={async (filePath: string, content: string) => {
                            setFileContents((prev) => ({ ...prev, [filePath]: content }));
                          }}
                          onClose={() => setShowAIChat(false)}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Build Panel */}
        {showBuildPanel && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full border-l" style={{ backgroundColor: "var(--background-color)", borderColor: "var(--border-color)" }}>
                <div className="h-full flex flex-col">
                  <div className="h-9 bg-[#2d2d30] flex items-center justify-between px-3 text-xs font-medium uppercase tracking-wide border-b border-[#3e3e42] flex-shrink-0">
                    <span className="text-[#cccccc]">Build Panel</span>
                    <button
                      onClick={() => setShowBuildPanel(false)}
                      className="text-[#cccccc] hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1">
                    <BuildPanel
                      isBuilding={isBuilding}
                      buildOutput={terminalOutput}
                      onBuild={handleBuild}
                      onTest={handleTest}
                      onDeploy={handleDeploy}
                      onStop={handleStop}
                      onClearLogs={handleClearLogs}
                      artifacts={currentFiles.artifacts ? Object.keys(currentFiles.artifacts.directory).map(name => ({ name, size: 'Unknown' })) : []}
                      onDownloadSnapshot={handleDownloadSnapshot}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <Dialog open={isDeployModalOpen} onOpenChange={setIsDeployModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Contract: {currentDeployFilename}</DialogTitle>
            <DialogDescription>
              Please provide the arguments for the `createApplication` method.
            </DialogDescription>
          </DialogHeader>
          {isDeploying ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                {contractArgs.map((arg, index) => {
                  const argType = arg.type || arg.struct || 'string';
                  const isUint = typeof argType === 'string' && argType.includes('uint');
                  return (
                    <div className="grid grid-cols-4 items-center gap-4" key={arg.name || index}>
                      <Label htmlFor={`arg-${index}`} className="text-right">
                        {arg.name} ({argType})
                      </Label>
                      <Input
                        id={`arg-${index}`}
                        value={deployArgs[index] || ''}
                        onChange={(e) => {
                          const newArgs = [...deployArgs];
                          const value = isUint ? Number(e.target.value) : e.target.value;
                          newArgs[index] = value;
                          setDeployArgs(newArgs);
                        }}
                        className="col-span-3"
                        type={isUint ? 'number' : 'text'}
                      />
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (currentDeployFilename) {
                    executeDeploy(currentDeployFilename, deployArgs);
                  }
                }}>
                  Deploy
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMethodsModalOpen} onOpenChange={setIsMethodsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Methods</DialogTitle>
            <DialogDescription>
              Select a method to execute for contract: {selectedContract?.appId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {(selectedContract?.methods || (selectedContract as any)?.functions?.map((f: string) => ({ name: f, args: [] })) || []).map((method: any) => (
              <div key={method.name} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{method.name}</span>
                    <Badge className="text-xs border border-input bg-background">
                      {method.args.length} args
                    </Badge>
                  </div>
                  <Button onClick={() => {
                    setSelectedMethod(method);
                    setExecuteArgs(method.args.map(() => ''));
                    setIsExecuteModalOpen(true);
                    setIsMethodsModalOpen(false);
                  }}>
                    Execute
                  </Button>
                </div>
                {method.args.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Arguments:</span>
                    <div className="mt-1 space-y-1">
                      {method.args.map((arg: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="font-mono text-xs">• {arg.name}:</span>
                          <span className="text-xs">{arg.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExecuteModalOpen} onOpenChange={setIsExecuteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Builder</DialogTitle>
            <DialogDescription>
              Build and execute transactions for your smart contract
            </DialogDescription>
          </DialogHeader>
          {selectedContract && selectedMethod && (
            <TransactionBuilder
              contract={selectedContract}
              method={selectedMethod}
              args={executeArgs}
              onArgsChange={setExecuteArgs}
              onExecute={executeMethod}
              isExecuting={isDeploying}
              wallet={wallet}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deployStatus !== null} onOpenChange={(open) => !open && setDeployStatus(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deployStatus === 'deploying' && 'Deploying Contract'}
              {deployStatus === 'success' && '✅ Deployment Successful!'}
              {deployStatus === 'error' && '❌ Deployment Failed'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            {deployStatus === 'deploying' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm text-muted-foreground">Deploying to TestNet...</p>
              </>
            )}
            {deployStatus === 'success' && (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-lg font-medium mb-2">Contract Deployed!</p>
                <p className="text-sm text-muted-foreground mb-2">Contract Address:</p>
                <p className="text-xs font-mono bg-[#1e1e1e] px-3 py-2 rounded break-all mb-4">{deployedAppId}</p>
                <Button
                  onClick={() => {
                    // Copy address to clipboard
                    navigator.clipboard.writeText(deployedAppId || '');
                  }}
                  variant="outline"
                  className="w-full mb-2"
                >
                  Copy Address
                </Button>
                <Button
                  onClick={() => {
                    // Open BCH explorer
                    const explorerUrl = `https://chipnet.chaingraph.cash/address/${deployedAppId}`;
                    window.open(explorerUrl, '_blank');
                    setDeployStatus(null);
                  }}
                  className="w-full"
                >
                  View on Explorer
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  )
}