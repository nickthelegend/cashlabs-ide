"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Box, History, Smartphone, ArrowLeft, Lock, Unlock, Loader2, Globe, AlertCircle } from 'lucide-react'
import { TransactionBuilder } from '@/components/transaction-builder'
import Editor from "@monaco-editor/react";
import { useToast } from '@/components/ui/use-toast'

export default function ContractPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const [contract, setContract] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMethod, setSelectedMethod] = useState<any>(null)
    const [executeArgs, setExecuteArgs] = useState<any[]>([])
    const { toast } = useToast()

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user || null)

            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setContract(data)
                if (data.artifact_json?.abi?.length > 0) {
                    setSelectedMethod(data.artifact_json.abi[0])
                }
            }
            setLoading(false)
        }
        init()
    }, [id])

    const toggleVisibility = async () => {
        if (!user || !contract || user.id !== contract.owner_id) return

        const newVisibility = !contract.is_public
        const { error } = await supabase
            .from('contracts')
            .update({ is_public: newVisibility })
            .eq('id', id)

        if (!error) {
            setContract({ ...contract, is_public: newVisibility })
            toast({
                title: "Visibility Updated",
                description: `Contract is now ${newVisibility ? 'Public' : 'Private'}.`,
            })
        } else {
            toast({
                title: "Error",
                description: "Failed to update visibility.",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white font-sans">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#58ba53]" />
                    <p className="text-gray-400 animate-pulse font-medium tracking-tight">Fetching contract data...</p>
                </div>
            </div>
        )
    }

    if (!contract) {
        return (
            <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-4">Contract not found</h1>
                <p className="text-gray-400 mb-8">This contract may have been deleted or is set to private.</p>
                <Button onClick={() => router.push('/')} variant="outline" className="border-[#333] hover:bg-[#252526]">Go Home</Button>
            </div>
        )
    }

    const isOwner = user && user.id === contract.owner_id

    const handleExecute = () => {
        toast({
            title: "Connect Wallet",
            description: "Please use the IDE to execute methods with a real wallet.",
            variant: "default"
        })
    }

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-white font-sans selection:bg-[#58ba53]/30">
            {/* Header */}
            <header className="border-b border-[#333] bg-[#252526] px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="hover:bg-[#333] rounded-xl transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight leading-none">{contract.name}</h1>
                            {contract.is_public ? (
                                <Badge variant="secondary" className="bg-[#58ba53]/10 text-[#58ba53] border border-[#58ba53]/20 flex items-center gap-1 py-1 px-3 rounded-lg shadow-sm">
                                    <Globe className="w-3 h-3" /> Public
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1 py-1 px-3 rounded-lg shadow-sm">
                                    <Lock className="w-3 h-3" /> Private
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-1.5 opacity-60">Hash: {contract.id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isOwner && (
                        <>
                            <Button variant="outline" onClick={toggleVisibility} className="border-[#333] hover:bg-[#333] rounded-xl flex items-center gap-2 transition-all active:scale-95">
                                {contract.is_public ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                {contract.is_public ? "Make Private" : "Make Public"}
                            </Button>
                            <Button className="bg-[#58ba53] hover:bg-[#469e42] text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#58ba53]/20 border-transparent" onClick={() => router.push(`/c/${id}/edit`)}>
                                Open in IDE
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Side (8 cols): Info & Code */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="bg-[#252526] border-[#333] text-white shadow-2xl rounded-3xl overflow-hidden border-opacity-50">
                        <CardHeader className="pb-4 border-b border-[#333]/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-[#58ba53]" /> Contract Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] opacity-60">Created Date</p>
                                <p className="text-sm font-semibold text-gray-200">{new Date(contract.created_at).toLocaleDateString()} at {new Date(contract.created_at).toLocaleTimeString()}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] opacity-60">Network Environment</p>
                                <div className="text-sm font-semibold flex items-center gap-2.5 text-gray-200">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#58ba53] shadow-[0_0_8px_rgba(88,186,83,0.5)] animate-pulse" /> Chipnet (BCH Testnet)
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1.5 pt-2">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] opacity-60">Developer Description</p>
                                <p className="text-sm text-gray-400 leading-relaxed font-normal">
                                    {contract.description || "No description provided for this contract."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="code" className="w-full">
                        <TabsList className="bg-[#252526] text-gray-500 border border-[#333] rounded-2xl p-1 h-auto mb-6 inline-flex relative overflow-hidden">
                            <TabsTrigger value="code" className="rounded-xl px-8 py-3 data-[state=active]:bg-[#333] data-[state=active]:text-white transition-all font-bold text-sm">
                                <Code className="w-4 h-4 mr-2.5" /> Source Code
                            </TabsTrigger>
                            <TabsTrigger value="abi" className="rounded-xl px-8 py-3 data-[state=active]:bg-[#333] data-[state=active]:text-white transition-all font-bold text-sm">
                                <Box className="w-4 h-4 mr-2.5" /> Application ABI
                            </TabsTrigger>
                            <TabsTrigger value="deployments" className="rounded-xl px-8 py-3 data-[state=active]:bg-[#333] data-[state=active]:text-white transition-all font-bold text-sm">
                                <History className="w-4 h-4 mr-2.5" /> Deployment Logs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="code" className="mt-0 ring-offset-0 focus-visible:ring-0">
                            <Card className="bg-[#252526] border-[#333] rounded-[2rem] overflow-hidden shadow-2xl border-opacity-50">
                                <div className="bg-[#1e1e1e] p-2 flex items-center gap-2 border-b border-[#333]">
                                    <div className="flex gap-1.5 pl-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                    </div>
                                    <span className="text-[10px] text-gray-600 font-mono ml-4 uppercase tracking-widest">{contract.name}.cash</span>
                                </div>
                                <Editor
                                    height="500px"
                                    defaultLanguage="javascript"
                                    value={contract.source_code}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                        padding: { top: 24, bottom: 24 },
                                        cursorStyle: 'line',
                                        renderLineHighlight: 'none',
                                        fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace'
                                    }}
                                />
                            </Card>
                        </TabsContent>

                        <TabsContent value="abi" className="mt-0 ring-offset-0 focus-visible:ring-0">
                            <Card className="bg-[#252526] border-[#333] p-8 font-mono text-xs overflow-auto max-h-[500px] rounded-[2rem] shadow-2xl text-gray-500 scrollbar-hide border-opacity-50">
                                <pre className="whitespace-pre-wrap leading-relaxed tracking-tight">{JSON.stringify(contract.artifact_json || { "info": "Compile in IDE to generate artifact data." }, null, 2)}</pre>
                            </Card>
                        </TabsContent>

                        <TabsContent value="deployments" className="mt-0 ring-offset-0 focus-visible:ring-0">
                            <div className="bg-[#252526] rounded-[2rem] p-20 text-center text-gray-600 border border-[#333] shadow-inner border-opacity-50">
                                <div className="bg-[#333]/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <History className="w-8 h-8 opacity-40 text-[#58ba53]" />
                                </div>
                                <p className="font-bold text-gray-400 text-lg mb-2 tracking-tight">Deployment Logs Empty</p>
                                <p className="text-sm max-w-md mx-auto leading-relaxed opacity-60 font-medium">Any production or testnet deployments triggered through CashLabs will be immutably logged here for auditing.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Side (4 cols): Execution UI */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-[#252526] border-[#333] text-white shadow-2xl rounded-3xl border-opacity-50 sticky top-24 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#58ba53] to-transparent opacity-50" />
                        <CardHeader className="pb-4 pt-8">
                            <CardTitle className="flex items-center gap-3 text-lg font-black tracking-tight">
                                <div className="p-2 bg-[#58ba53]/10 rounded-xl">
                                    <Smartphone className="w-5 h-5 text-[#58ba53]" />
                                </div>
                                Interaction Console
                            </CardTitle>
                            <CardDescription className="text-[11px] font-medium text-gray-500 uppercase tracking-widest pl-11">
                                Functional Testing Interface
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 px-6 pb-8">
                            {contract.artifact_json?.abi ? (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Available Methods</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {contract.artifact_json.abi.map((method: any) => (
                                                <Badge
                                                    key={method.name}
                                                    variant={selectedMethod?.name === method.name ? "default" : "outline"}
                                                    className={`cursor-pointer px-4 py-2 transition-all rounded-xl active:scale-90 font-bold text-xs ${selectedMethod?.name === method.name
                                                        ? 'bg-[#58ba53] hover:bg-[#469e42] text-white shadow-xl shadow-[#58ba53]/30 border-transparent scale-105'
                                                        : 'border-[#333] hover:bg-[#333] text-gray-500 hover:text-white'
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedMethod(method)
                                                        setExecuteArgs([])
                                                    }}
                                                >
                                                    {method.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedMethod ? (
                                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 pt-4 border-t border-[#333]/50">
                                            <TransactionBuilder
                                                contract={{ appId: contract.id, address: contract.id }}
                                                method={selectedMethod}
                                                args={executeArgs}
                                                onArgsChange={setExecuteArgs}
                                                onExecute={handleExecute}
                                                isExecuting={false}
                                                wallet={null}
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-12 border-2 border-dashed border-[#333]/50 rounded-2xl text-center bg-[#252526]/30 group">
                                            <p className="text-xs text-gray-600 italic font-medium group-hover:text-gray-400 transition-colors">Select a method above to initialize console</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-10 text-center bg-[#1e1e1e]/50 rounded-[2rem] border border-[#333] border-dashed">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                                        <AlertCircle className="w-6 h-6 text-yellow-500/60" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-300 mb-2 tracking-tight">Missing Deployment ABI</p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">To enable the execution console, open this project in the IDE, compile the source code, and perform an initial deployment.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Developer Metadata Sidecard */}
                    <div className="p-8 bg-gradient-to-br from-[#252526] to-[#1e1e1e] border border-[#333] rounded-[2rem] shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#58ba53] mb-5 border-b border-[#58ba53]/10 pb-4 flex items-center gap-2">
                            <Database className="w-3 h-3" /> Blockchain Details
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[#333]/20 p-3 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Compiler</span>
                                <span className="text-[10px] font-mono text-[#58ba53] bg-[#58ba53]/10 px-2 py-0.5 rounded">cashc@0.12.1</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#333]/20 p-3 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol</span>
                                <span className="text-[10px] font-mono text-gray-400">P2SH-32 / VM 2023</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Database({ className }: { className?: string }) {
    return (
        <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" className={className}>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    )
}
