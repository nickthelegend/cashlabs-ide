"use client"

import React from "react"
import { TransactionBuilder } from "./transaction-builder"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, Play, ArrowLeft, Smartphone } from "lucide-react"

interface ContractInteractionViewProps {
    contract: any
    selectedMethod: any
    onMethodSelect: (method: any) => void
    executeArgs: any[]
    onArgsChange: (args: any[]) => void
    onExecute: () => void
    isExecuting: boolean
    wallet: any
    onBack?: () => void
}

export function ContractInteractionView({
    contract,
    selectedMethod,
    onMethodSelect,
    executeArgs,
    onArgsChange,
    onExecute,
    isExecuting,
    wallet,
    onBack
}: ContractInteractionViewProps) {
    if (!contract) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0f0f10]">
                <div className="w-16 h-16 bg-[#5ae6b9]/5 rounded-3xl flex items-center justify-center mb-6 border border-[#5ae6b9]/10">
                    <Smartphone className="w-8 h-8 text-[#5ae6b9] opacity-40" />
                </div>
                <h2 className="text-xl font-black mb-2">No Instance Selected</h2>
                <p className="text-sm text-white/40 max-w-md">
                    Select a deployed contract instance from the <b>Interact</b> sidebar to start building and executing transactions.
                </p>
            </div>
        )
    }

    const methods = contract.methods || []

    return (
        <div className="h-full flex flex-col bg-[#0f0f10]">
            {/* Header Area */}
            <div className="p-6 border-b border-white/5 bg-[#161618] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#5ae6b9]/10 rounded-2xl">
                        <Code className="w-6 h-6 text-[#5ae6b9]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">{contract.contractName || "Contract Interface"}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-white/30 truncate max-w-[200px]">{contract.appId || contract.address}</span>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-4 border-white/10 text-white/40 px-1">Chipnet</Badge>
                        </div>
                    </div>
                </div>

                {selectedMethod && (
                    <Button variant="ghost" onClick={onBack} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Methods
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                {!selectedMethod ? (
                    <div className="h-full p-8 max-w-4xl mx-auto overflow-y-auto">
                        <div className="flex items-center gap-2 mb-8">
                            <Play className="w-4 h-4 text-[#5ae6b9]" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Available Methods</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {methods.map((method: any) => (
                                <div
                                    key={method.name}
                                    className="bg-[#161618] border border-white/5 p-6 rounded-[2rem] hover:border-[#5ae6b9]/30 transition-all cursor-pointer group flex flex-col justify-between h-full"
                                    onClick={() => onMethodSelect(method)}
                                >
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-lg font-black group-hover:text-[#5ae6b9] transition-colors">{method.name}</span>
                                            <Badge className="bg-white/5 text-[9px] font-bold uppercase">{method.args?.length || 0} args</Badge>
                                        </div>
                                        <div className="space-y-1.5 opacity-40">
                                            {(method.args || []).map((arg: any, i: number) => (
                                                <div key={i} className="text-[10px] font-mono flex items-center gap-2">
                                                    <span className="text-[#5ae6b9]">•</span>
                                                    <span>{arg.name}:</span>
                                                    <span className="text-white/60">{arg.type}</span>
                                                </div>
                                            ))}
                                            {(!method.args || method.args.length === 0) && (
                                                <span className="text-[10px] italic">No arguments required</span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full border-white/5 bg-white/5 hover:bg-white/10 group-hover:border-[#5ae6b9]/20 group-hover:text-[#5ae6b9] text-[10px] font-black tracking-widest uppercase transition-all"
                                    >
                                        Prepare Call
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto bg-[#0f0f10] p-8">
                        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TransactionBuilder
                                contract={contract}
                                method={selectedMethod}
                                args={executeArgs}
                                onArgsChange={onArgsChange}
                                onExecute={onExecute}
                                isExecuting={isExecuting}
                                wallet={wallet}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
