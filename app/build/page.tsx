"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FlowBuilder } from "@/components/flow-builder"
import { TerminalBuild } from "@/components/terminalbuild"
import { toast } from "@/hooks/use-toast"
import { Code, Zap, Home, Play, Download, Trash2, TerminalIcon, WalletIcon } from "lucide-react"
import Link from "next/link"
import { WalletPanel } from "@/components/wallet-panel"
import { generateCode } from "../../lib/code-generator"

interface Wallet {
  address: string
  balance: number
  privateKey: string
  mnemonic: string
  transactions: any[]
  bchPrice: number
}

export default function BuildPage() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState("")
  const [activeTab, setActiveTab] = useState("transactions")
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showWallet, setShowWallet] = useState(false)
  const [wallet, setWallet] = useState<Wallet | null>(null)

  const getWallet = () => {
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
  }

  useEffect(() => {
    getWallet()
  }, [])

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

      setWallet(newWallet)
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem("bch-wallet", JSON.stringify(newWallet))
      }

      console.log("Wallet created! To fund with test BCH, use the Faucet button or visit:")
      console.log(`https://chipnet.imaginary.cash/`)
    } catch (error) {
      console.error("Error creating wallet:", error)
    }
  }

  const handleRun = async () => {
    setTerminalOutput("") // Clear previous output
    setIsTerminalOpen(true) // Open terminal

    toast({
      title: "Running Flow",
      description: "Your Bitcoin Cash flow is being executed...",
      duration: 3000,
    })

    const generatedCode = generateCode(nodes, edges)

    // Capture console.log output
    let capturedOutput = ""
    const originalConsoleLog = console.log
    console.log = (...args) => {
      capturedOutput += args.join(" ") + "\n"
      originalConsoleLog.apply(console, args)
    }

    try {
      // Execute the generated code
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const mainnetJs = await import("mainnet-js")
      const runnableCode = new AsyncFunction('mainnetJs', generatedCode);

      await runnableCode(mainnetJs);

      setTerminalOutput(capturedOutput)
      toast({
        title: "Flow Execution Complete",
        description: "Check terminal for output.",
        duration: 3000,
      })
    } catch (error: any) {
      setTerminalOutput(capturedOutput + `\nError: ${error.message}`)
      toast({
        title: "Flow Execution Failed",
        description: error.message,
        duration: 5000,
        variant: "destructive",
      })
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: "var(--background-color)", color: "var(--text-color)" }}>
      {/* New Top Bar */}
      <div className="h-9 flex items-center justify-between px-4 text-sm border-b flex-shrink-0" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <span className="font-medium" style={{ color: "var(--text-color)" }}>CashFlow</span>
        </div>
        <div className="flex items-center gap-2">
          {wallet && wallet.address ? (
            <button
              onClick={() => setShowWallet(!showWallet)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}
            >
              Wallet: {`${String(wallet.address.substring(0, 15))}...` || "Invalid Address"}
            </button>
          ) : (
            <button
              onClick={createWallet}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}
            >
              Create Wallet
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 py-2 border-b flex items-center justify-center gap-8" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
            <TabsList className="grid w-full max-w-md grid-cols-1 backdrop-blur-lg" style={{ backgroundColor: "var(--background-color)" }}>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-[var(--button-color)]">
                <Zap className="h-4 w-4 mr-2" />
                Transactions
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {/* Run Flow Button */}
              <Button onClick={handleRun} className="font-semibold px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded" size="sm" title="Run Flow">
                <Play className="h-4 w-4 mr-2" />
                Run Flow
              </Button>
              {/* Export Button */}
              <Button
                onClick={() => {
                  const generatedCode = generateCode(nodes, edges)
                  const dataBlob = new Blob([generatedCode], { type: "text/javascript" })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement("a")
                  link.href = url
                  link.download = `bch-script-${Date.now()}.js`
                  link.click()
                  URL.revokeObjectURL(url)
                  toast({
                    title: "Code Exported",
                    description: "Your Bitcoin Cash script has been exported as a .js file",
                    duration: 3000,
                  })
                }}
                size="sm"
                style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}
                title="Export Flow"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Delete Button */}
              <Button
                onClick={() => {
                  if (selectedNode) {
                    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
                    setEdges((eds) =>
                      eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id),
                    )
                    setSelectedNode(null)
                    toast({
                      title: "Node Deleted",
                      description: "Selected node has been removed",
                      duration: 2000,
                    })
                  } else {
                    toast({
                      title: "No Node Selected",
                      description: "Please select a node to delete",
                      duration: 2000,
                    })
                  }
                }}
                size="sm"
                style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}
                title="Delete Selected Node"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="transactions" className="flex-1 m-0 overflow-hidden">
            <FlowBuilder
              type="transaction"
              key="transaction"
              onFlowChange={(newNodes, newEdges) => {
                setNodes(newNodes);
                setEdges(newEdges);
              }}
              onNodeSelect={setSelectedNode}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Terminal Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">

        <Button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-200`}
          style={{
            backgroundColor: isTerminalOpen ? "var(--button-color)" : "var(--sidebar-color)",
            color: "var(--text-color)",
            border: "1px solid var(--border-color)",
          }}
          size="sm"
        >
          <TerminalIcon className="h-4 w-4 mr-2" />
          Terminal
        </Button>
      </div>

      {/* Wallet Panel */}
      {showWallet && wallet && (
        <div
          className="fixed right-0 top-0 h-full border-l flex-shrink-0 overflow-hidden"
          style={{ width: `320px`, backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}
        >
          <WalletPanel wallet={wallet} onClose={() => setShowWallet(false)} />
        </div>
      )}

      {/* Terminal */}
      <TerminalBuild isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} output={terminalOutput} />
    </div>
  )
}