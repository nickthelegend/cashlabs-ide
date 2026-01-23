"use client"

import { useState, useEffect } from "react"
import { X, Send, RefreshCw, ExternalLink, Copy, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import QRCode from "react-qr-code"

interface Transaction {
  id: string
  "tx-type": string
  "round-time": number
  "payment-transaction"?: {
    amount: number
    receiver: string
  }
  "asset-transfer-transaction"?: {
    amount: number
    receiver: string
  }
  "application-transaction"?: {
    "application-id": number
  }
  sender: string
  "confirmed-round": number
}

interface WalletPanelProps {
  wallet?: {
    address: string
    balance: number
    privateKey: string
    mnemonic: string
    transactions?: Transaction[]
    algoPrice?: number
    type?: 'local' | 'walletconnect'
  }
  onClose: () => void
}

export function WalletPanel({ wallet, onClose }: WalletPanelProps) {
  const { toast } = useToast()
  const [sendAmount, setSendAmount] = useState("")
  const [sendAddress, setSendAddress] = useState("")
  const [opReturnMessage, setOpReturnMessage] = useState("")
  const [bchPrice, setBchPrice] = useState(0)
  const [realBalance, setRealBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')

  const handleFaucet = async () => {
    if (!wallet?.address) return
    setIsLoading(true)
    setError(null)
    try {
      // Use the mainnet.cash REST API faucet
      const response = await fetch('https://rest-unstable.mainnet.cash/faucet/get_testnet_bch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cashaddr: wallet.address,
        }),
      })

      const data = await response.json()

      if (data.txId) {
        toast({
          title: "Faucet Success",
          description: `Successfully requested test BCH. TxID: ${data.txId}`,
        })
        setTimeout(refreshData, 3000)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        toast({
          title: "Faucet Request Sent",
          description: "Check your balance in a few seconds.",
        })
        setTimeout(refreshData, 3000)
      }
    } catch (error) {
      console.error("Faucet error:", error)
      setError("Faucet error: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  // Algorand Network URLs
  const NETWORK_CONFIG = {
    testnet: {
      indexer: "https://rest.mainnet.cash",
      algod: "https://rest.mainnet.cash",
      explorer: "https://blockchair.com/bitcoin-cash"
    },
    mainnet: {
      indexer: "https://rest.mainnet.cash",
      algod: "https://rest.mainnet.cash",
      explorer: "https://blockchair.com/bitcoin-cash"
    }
  }

  const currentNetwork = NETWORK_CONFIG[network]

  const handleSendOpReturn = async () => {
    if (!wallet?.address || !opReturnMessage) return
    if (wallet.type === 'walletconnect') {
      toast({ title: "WalletConnect", description: "Direct OP_RETURN not yet supported for WalletConnect in this panel.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const { TestNetWallet, OpReturnData } = (await import("mainnet-js")) as any
      const w = await TestNetWallet.fromWIF(wallet.privateKey)
      const txData = await w.send([
        OpReturnData.from(opReturnMessage)
      ])
      toast({
        title: "OP_RETURN Sent",
        description: `Message sent. TxID: ${txData.txId}`,
      })
      setOpReturnMessage("")
      setTimeout(refreshData, 2000)
    } catch (error) {
      console.error("OP_RETURN error:", error)
      setError("OP_RETURN error: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBchPrice = async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=usd")
      const data = await response.json()
      setBchPrice(Number(data['bitcoin-cash'].usd))
    } catch (error) {
      console.error("Error fetching BCH price:", error)
      // Fallback price
      setBchPrice(450)
    }
  }

  const fetchBalanceAndTransactions = async () => {
    if (!wallet?.address) return

    setIsLoading(true)
    setError(null)

    try {
      const { TestNetWallet } = (await import("mainnet-js")) as any
      const w = await TestNetWallet.watchOnly(wallet.address)
      const balance = await w.getBalance()

      setRealBalance(Number(balance.sat))

      // Simplified transaction fetching
      setTransactions([])
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch wallet data")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchBalanceAndTransactions()
    setIsRefreshing(false)
  }

  const handleBackupAccount = () => {
    if (wallet) {
      const walletData = {
        address: wallet.address,
        mnemonic: wallet.mnemonic,
        privateKey: wallet.privateKey,
      };
      const json = JSON.stringify(walletData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bch_wallet_${wallet.address.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    fetchBchPrice()
  }, [])

  useEffect(() => {
    if (wallet?.address) {
      fetchBalanceAndTransactions()
    }
  }, [wallet?.address, network])

  if (!wallet || !wallet.address) {
    return null
  }

  const getFormattedAddress = () => {
    if (!wallet?.address) return "";
    const cleanAddr = wallet.address.includes(':') ? wallet.address.split(':')[1] : wallet.address;
    const prefix = network === 'mainnet' ? 'bitcoincash' : 'bchtest';
    return `${prefix}:${cleanAddr}`;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(getFormattedAddress())
  }

  const getTransactionType = (tx: Transaction) => {
    if (tx["tx-type"] === "pay") return "Payment"
    if (tx["tx-type"] === "axfer") return "Asset Transfer"
    if (tx["tx-type"] === "appl") return "Application"
    return tx["tx-type"] || "Unknown"
  }

  const getTransactionAmount = (tx: Transaction) => {
    if (tx["payment-transaction"]) {
      const amount = tx["payment-transaction"].amount
      return amount > 0 ? `+${(amount / 1000000).toFixed(6)}` : `${(amount / 1000000).toFixed(6)}`
    }
    if (tx["asset-transfer-transaction"]) {
      const amount = tx["asset-transfer-transaction"].amount
      return amount > 0 ? `+${amount}` : `${amount}`
    }
    if (tx["application-transaction"]) {
      const fee = (tx as any).fee || 1000
      return `-${(fee / 1000000).toFixed(6)}`
    }
    return "N/A"
  }

  const getTransactionDirection = (tx: Transaction) => {
    if (tx.sender === wallet.address) {
      return "out"
    }
    return "in"
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const [isSendOpen, setIsSendOpen] = useState(false)

  const handleSend = async () => {
    if (!wallet?.address || !sendAmount || !sendAddress) return
    if (wallet.type === 'walletconnect') {
      toast({ title: "WalletConnect", description: "Direct sending not yet supported for WalletConnect in this panel.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { TestNetWallet } = (await import("mainnet-js")) as any
      const w = await TestNetWallet.fromWIF(wallet.privateKey)

      const txData = await w.send([
        {
          cashaddr: sendAddress,
          value: Number(sendAmount),
          unit: 'bch',
        }
      ]);

      if (txData.txId) {
        toast({
          title: "Success",
          description: `Sent ${sendAmount} BCH. TxID: ${txData.txId}`,
        })
        setIsSendOpen(false)
        setSendAmount("")
        setSendAddress("")
        refreshData()
      }
    } catch (error) {
      console.error("Error sending BCH:", error)
      setError(error instanceof Error ? error.message : "Failed to send BCH")
    } finally {
      setIsLoading(false)
    }
  }

  const balanceInBch = (realBalance !== null ? realBalance : wallet.balance) / 100000000
  const balanceInUSD = balanceInBch * bchPrice

  return (
    <div className="h-full bg-[#252526] flex flex-col">
      {/* Header */}
      <div className="h-8 bg-[#2d2d30] flex items-center justify-between px-3 text-xs font-medium border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <span>WALLET</span>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as 'testnet' | 'mainnet')}
            className="bg-[#1e1e1e] text-[#cccccc] border border-[#3e3e42] rounded px-1 text-xs"
          >
            <option value="testnet">TestNet</option>
            <option value="mainnet">MainNet</option>
          </select>
        </div>
        <Button variant="ghost" size="icon" className="w-4 h-4" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Wallet Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Bitcoin Cash Wallet</div>
              <div className="text-xs text-[#969696] flex items-center gap-1">
                <span className="truncate" title={getFormattedAddress()}>
                  {getFormattedAddress()}
                </span>
                <Button variant="ghost" size="icon" className="w-3 h-3 flex-shrink-0" onClick={copyAddress}>
                  <Copy className="w-2 h-2" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading balance...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{balanceInBch.toFixed(8)} BCH</div>
                {bchPrice > 0 && <div className="text-sm text-[#969696]">${balanceInUSD.toFixed(2)} USD</div>}
                {bchPrice > 0 && <div className="text-xs text-[#969696]">1 BCH = ${bchPrice.toFixed(2)}</div>}
                {realBalance !== null && (
                  <div className="text-xs text-green-400 mt-1">✓ Live data</div>
                )}
                {realBalance === null && !isLoading && (
                  <div className="text-xs text-yellow-400 mt-1">⚠ Using cached data</div>
                )}
              </>
            )}
            {error && (
              <div className="text-xs text-red-500 mt-1 bg-red-500/10 p-2 rounded whitespace-pre-wrap">{error}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mb-4">
            {isSendOpen ? (
              <div className="space-y-2 p-3 bg-[#1e1e1e] rounded border border-[#3e3e42]">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#969696] uppercase">Recipient Address</label>
                  <input
                    className="w-full bg-[#2d2d30] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white"
                    placeholder="Enter BCH address..."
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#969696] uppercase">Amount (BCH)</label>
                  <input
                    className="w-full bg-[#2d2d30] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white"
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                    onClick={handleSend}
                    disabled={isLoading || !sendAddress || !sendAmount}
                  >
                    Confirm Send
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs h-8"
                    onClick={() => setIsSendOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 h-9"
                  onClick={() => setIsSendOpen(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
                {network === 'testnet' && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
                    onClick={handleFaucet}
                    disabled={isLoading}
                  >
                    Faucet
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-[#3e3e42] text-[#cccccc] hover:bg-[#37373d] h-9"
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}

            {wallet.type !== 'walletconnect' && (
              <Button
                variant="outline"
                className="w-full border-[#3e3e42] text-[#cccccc] hover:bg-[#37373d] h-9"
                onClick={handleBackupAccount}
              >
                <Download className="w-4 h-4 mr-2" />
                Backup Account
              </Button>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-lg border border-[#3e3e42] mb-6">
            <div className="w-32 h-32 mb-2 rounded bg-white p-2 flex items-center justify-center">
              <QRCode
                value={getFormattedAddress()}
                size={112}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <div className="text-[10px] text-[#969696] font-mono break-all text-center px-2">
              {getFormattedAddress()}
            </div>
          </div>

          {/* OP_RETURN */}
          <div className="space-y-2 p-3 bg-[#1e1e1e] rounded border border-[#3e3e42] mb-6">
            <label className="text-[10px] text-[#969696] uppercase font-bold">Store Data (OP_RETURN)</label>
            <textarea
              className="w-full bg-[#2d2d30] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white h-16 resize-none"
              placeholder="Enter message to store on BCH..."
              value={opReturnMessage}
              onChange={(e) => setOpReturnMessage(e.target.value)}
            />
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs font-semibold"
              onClick={handleSendOpReturn}
              disabled={isLoading || !opReturnMessage}
            >
              Send Data Transaction
            </Button>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Recent Transactions</h3>
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs text-[#969696] pb-2 border-b border-[#3e3e42]">
              <span>Type</span>
              <span>Amount</span>
              <span>Direction</span>
              <span>Time</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Loading transactions...</span>
              </div>
            ) : transactions.length > 0 ? (
              transactions.slice(0, 10).map((tx, index) => {
                const direction = getTransactionDirection(tx)
                return (
                  <div key={tx.id || index} className="grid grid-cols-4 gap-2 text-xs py-2 hover:bg-[#2a2d2e] rounded px-1">
                    <span className="text-[#569cd6]">{getTransactionType(tx)}</span>
                    <span className={direction === 'in' ? 'text-green-400' : 'text-red-400'}>
                      {getTransactionAmount(tx)}
                    </span>
                    <span className={direction === 'in' ? 'text-green-400' : 'text-red-400'}>
                      {direction === 'in' ? '↗' : '↘'}
                    </span>
                    <span>{formatTime(tx["round-time"])}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-xs text-[#969696] text-center py-4">
                {error ? "Failed to load transactions" : "No transactions found"}
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              className="text-xs text-[#569cd6]"
              onClick={() => window.open(`https://blockdozer.com/address/${wallet.address}`, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View on Blockdozer
            </Button>
          </div>
        </div>
      </div>
    </div >
  )
}
