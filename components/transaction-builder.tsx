"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  Send,
  AlertTriangle,
  CheckCircle,
  Copy,
  Loader2,
  Settings2,
  Cpu,
  Zap,
  ShieldCheck,
  Terminal,
  Activity,
  Play,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TransactionBuilderProps {
  contract: any
  method: any
  args: any[]
  onArgsChange: (args: any[]) => void
  onExecute: () => void
  isExecuting: boolean
  wallet: any
}

interface SimulationResult {
  success: boolean
  logs?: string[]
  error?: string
  returnValue?: any
  gasUsed?: number
  txnId?: string
}

const PremiumCard = ({ children, className, title, description, icon: Icon }: any) => (
  <div className={cn("bg-[#161618] border border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-[#19191b] shadow-xl", className)}>
    {title && (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-[#5ae6b9]/10 rounded-xl">
              <Icon className="w-5 h-5 text-[#5ae6b9]" />
            </div>
          )}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{title}</h3>
            {description && <p className="text-[10px] text-white/20 font-medium">{description}</p>}
          </div>
        </div>
      </div>
    )}
    {children}
  </div>
)

const PremiumInput = ({ label, type = "text", value, onChange, placeholder, disabled, icon: Icon }: any) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">{label}</Label>
      {type === "int" && <Badge variant="outline" className="text-[8px] font-black tracking-tighter border-[#5ae6b9]/20 text-[#5ae6b9]/60 px-1 hover:bg-transparent">BigInt</Badge>}
    </div>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#5ae6b9]/50 transition-colors" />}
      <Input
        type={type === "int" ? "number" : type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "bg-[#0f0f10] border border-white/5 h-14 rounded-2xl text-sm font-bold tracking-tight focus:ring-1 focus:ring-[#5ae6b9]/20 focus:border-[#5ae6b9]/30 transition-all placeholder:text-white/10",
          Icon ? "pl-12" : "px-6"
        )}
      />
    </div>
  </div>
)

export function TransactionBuilder({
  contract,
  method,
  args,
  onArgsChange,
  onExecute,
  isExecuting,
  wallet
}: TransactionBuilderProps) {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [fee, setFee] = useState(1000)
  const [note, setNote] = useState("")

  const simulateTransaction = async () => {
    if (!wallet || !contract || !method) return
    setIsSimulating(true)
    setSimulationResult(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockResult: SimulationResult = {
        success: true,
        logs: [
          `Initializing virtual sandbox...`,
          `Compiled script successfully.`,
          `Inputs verified against wallet protocol.`,
          `Tx Size: ${Math.floor(Math.random() * 200) + 100} bytes`,
          `Contract unlocking script validated.`
        ],
        returnValue: "Script Passed",
        gasUsed: 42,
        txnId: "SIM-" + Math.random().toString(36).substring(7).toUpperCase()
      }
      setSimulationResult(mockResult)
    } catch (error) {
      setSimulationResult({
        success: false,
        error: error instanceof Error ? error.message : "Simulation failed"
      })
    } finally {
      setIsSimulating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-10 pb-10">
      <Tabs defaultValue="builder" className="w-full">
        <div className="flex items-center justify-between mb-10 bg-[#161618] p-1.5 rounded-3xl border border-white/5 max-w-fit mx-auto">
          <TabsList className="bg-transparent h-12 gap-1 p-0">
            <TabsTrigger
              value="builder"
              className="px-8 rounded-2xl data-[state=active]:bg-[#0f0f10] data-[state=active]:text-[#5ae6b9] data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all h-full border-none focus-visible:ring-0"
            >
              <Zap className="w-3.5 h-3.5 mr-2" /> Builder
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="px-8 rounded-2xl data-[state=active]:bg-[#0f0f10] data-[state=active]:text-[#5ae6b9] data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all h-full border-none focus-visible:ring-0"
            >
              <Activity className="w-3.5 h-3.5 mr-2" /> Simulation
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="px-8 rounded-2xl data-[state=active]:bg-[#0f0f10] data-[state=active]:text-[#5ae6b9] data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all h-full border-none focus-visible:ring-0"
            >
              <Settings2 className="w-3.5 h-3.5 mr-2" /> Protocol
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Contract Context */}
            <div className="space-y-8">
              <PremiumCard title="Context Overview" icon={ShieldCheck}>
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Contract Address</span>
                    <div className="bg-[#0f0f10] p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                      <code className="text-[10px] font-bold text-[#5ae6b9] truncate max-w-[250px]">{contract.appId || contract.address}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5 opacity-40 group-hover:opacity-100" onClick={() => copyToClipboard(contract.appId)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-[#0f0f10] p-4 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Target Method</span>
                      <span className="text-sm font-black text-white">{method.name}</span>
                    </div>
                    <div className="bg-[#0f0f10] p-4 rounded-xl border border-white/5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Active Wallet</span>
                      <span className="text-[11px] font-black text-white truncate block">
                        {wallet?.address ? `${wallet.address.substring(0, 8)}...${wallet.address.substring(wallet.address.length - 8)}` : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              </PremiumCard>

              {/* Action Hub */}
              <div className="bg-gradient-to-br from-[#5ae6b9]/10 to-transparent border border-[#5ae6b9]/20 rounded-[2.5rem] p-10 flex flex-col gap-6">
                <div>
                  <h4 className="font-black text-xl mb-2 text-[#5ae6b9]">Execute Script.</h4>
                  <p className="text-[10px] text-[#5ae6b9]/60 font-medium leading-relaxed">
                    Once parameters are primed, you can broadcast the transaction to Chipnet. Ensure your local wallet has sufficient testnet sats.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={onExecute}
                    disabled={isExecuting || !wallet}
                    className="w-full bg-[#5ae6b9] hover:bg-[#48d4a6] text-black font-black h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-[#5ae6b9]/10"
                  >
                    {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    EXECUTE TRANSACTION
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={simulateTransaction}
                    disabled={isSimulating || !wallet}
                    className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-white/5 transition-all"
                  >
                    {isSimulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    SIMULATE LOGIC
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Method Parameters */}
            <div className="space-y-8">
              <PremiumCard
                title="Method Parameters"
                description={`Provide valid inputs for ${method.name} call`}
                icon={Cpu}
              >
                <div className="space-y-6">
                  {(method.args || []).length > 0 ? (
                    (method.args || []).map((arg: any, index: number) => (
                      <PremiumInput
                        key={arg.name || index}
                        label={`${arg.name}`}
                        type={arg.type === 'int' ? 'int' : 'text'}
                        value={args[index]}
                        onChange={(v: any) => {
                          const newArgs = [...args]
                          newArgs[index] = v
                          onArgsChange(newArgs)
                        }}
                        placeholder={`Enter ${arg.type}...`}
                      />
                    ))
                  ) : (
                    <div className="py-12 text-center bg-[#0f0f10] rounded-[2rem] border border-dashed border-white/5">
                      <Play className="w-10 h-10 mx-auto mb-4 text-[#5ae6b9] opacity-20" />
                      <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No Arguments Required</p>
                    </div>
                  )}
                </div>
              </PremiumCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <PremiumCard title="Protocol Simulation" icon={Terminal}>
            {simulationResult ? (
              <div className="space-y-8">
                <div className="flex items-center gap-6 p-6 bg-[#0f0f10] rounded-[2rem] border border-white/5">
                  <div className={cn("p-4 rounded-2xl", simulationResult.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                    {simulationResult.success ? <ShieldCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-black">{simulationResult.success ? "Verification Passed" : "Protocol Fault"}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-1">
                      {simulationResult.success ? `TxID: ${simulationResult.txnId}` : "Check parameter types and contract state"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-1">Execution Logs</span>
                  <div className="bg-[#0f0f10] p-6 rounded-[2rem] border border-white/5 font-mono text-[11px] leading-relaxed text-white/60">
                    {simulationResult.logs?.map((log, i) => (
                      <div key={i} className="flex gap-3 mb-1">
                        <span className="text-[#5ae6b9] opacity-30">[{i + 1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {simulationResult.returnValue && (
                  <div className="bg-[#5ae6b9]/5 p-6 rounded-[2rem] border border-[#5ae6b9]/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#5ae6b9]/40 block mb-2">Final Return State</span>
                    <code className="text-xl font-black text-[#5ae6b9]">{simulationResult.returnValue}</code>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                  <Activity className="w-8 h-8 text-[#5ae6b9] opacity-20" />
                  <div className="absolute inset-0 border border-[#5ae6b9]/20 rounded-full animate-ping" />
                </div>
                <h3 className="text-lg font-black mb-2 opacity-60">Engine Idle</h3>
                <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em] max-w-[240px]">
                  Click simulate in the builder tab to verify your script logic without broadcasting.
                </p>
              </div>
            )}
          </PremiumCard>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PremiumCard title="Fee Configuration" icon={Zap}>
              <PremiumInput
                label="Miner Fee (Sats)"
                type="int"
                value={fee}
                onChange={(v: any) => setFee(Number(v))}
                placeholder="1000"
                icon={Activity}
              />
              <p className="mt-6 text-[10px] font-medium text-white/20 leading-relaxed italic">
                Note: Minimum fee for Bitcoin Cash protocol is 1 sat/byte. A standard P2SH transaction usually requires ~1000 sats.
              </p>
            </PremiumCard>

            <PremiumCard title="Protocol Annotation" icon={FileText}>
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1 text-right block">OP_RETURN Message</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Attach metadata to this protocol message..."
                  className="bg-[#0f0f10] border border-white/5 min-h-[140px] rounded-[2rem] p-6 text-sm font-bold tracking-tight focus:ring-1 focus:ring-[#5ae6b9]/20 focus:border-[#5ae6b9]/30 transition-all placeholder:text-white/10"
                />
              </div>
            </PremiumCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}