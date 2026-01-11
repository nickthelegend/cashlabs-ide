"use client"

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, PlusCircle, Globe, Lock, Trash2, Edit3, ArrowLeft, Loader2, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [contracts, setContracts] = useState<any[]>([])

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/')
                return
            }
            setUser(session.user)

            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('owner_id', session.user.id)
                .order('created_at', { ascending: false })

            if (data) setContracts(data)
            setLoading(false)
        }
        init()
    }, [])

    const deleteContract = async (id: string) => {
        if (!confirm("Are you sure you want to delete this contract?")) return

        const { error } = await supabase.from('contracts').delete().eq('id', id)
        if (!error) {
            setContracts(contracts.filter(c => c.id !== id))
            toast({ title: "Contract Deleted" })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex flex-col items-center justify-center text-white font-sans">
                <Loader2 className="w-12 h-12 animate-spin text-[#5ae6b9] mb-4" />
                <p className="text-gray-500 animate-pulse font-bold uppercase tracking-widest text-[10px]">Syncing Workspace...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] text-white font-sans selection:bg-[#5ae6b9]/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="hover:bg-white/5 rounded-xl transition-all">
                        <ArrowLeft className="w-5 h-5 text-white/40" />
                    </Button>
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="CashLabs" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter">Your Dashboard</h1>
                    </div>
                </div>
                <Button
                    onClick={() => router.push('/')}
                    className="bg-[#5ae6b9] hover:bg-[#48d4a6] text-black font-black rounded-xl flex items-center gap-2 shadow-lg shadow-[#5ae6b9]/10"
                >
                    <PlusCircle className="w-4 h-4" />
                    New Project
                </Button>
            </header>

            <main className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tighter">Recent <span className="text-[#5ae6b9]">Projects</span></h2>
                        <p className="text-white/30 font-bold uppercase text-[10px] tracking-[0.3em]">Management Console</p>
                    </div>
                    <div className="bg-[#161618] px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-6 shadow-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Total Registry</span>
                            <span className="text-2xl font-black text-[#5ae6b9] leading-none mt-1">{contracts.length}</span>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <Database className="text-[#5ae6b9] w-6 h-6 opacity-50" />
                    </div>
                </div>

                {contracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#161618] rounded-[3rem] border border-white/5 border-dashed">
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8">
                            <PlusCircle className="w-12 h-12 text-white/10" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 tracking-tighter">No projects detected</h3>
                        <p className="text-white/30 mb-10 max-w-xs text-center font-medium">Initialize your first multi-sig or smart contract logic to begin.</p>
                        <Button
                            onClick={() => router.push('/')}
                            className="bg-white text-black hover:bg-gray-200 font-black px-12 py-8 rounded-[2rem] transition-all active:scale-95 shadow-2xl"
                        >
                            Start Building Now
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {contracts.map((contract) => (
                            <Card key={contract.id} className="bg-[#161618] border-white/5 hover:border-[#5ae6b9]/30 transition-all group rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
                                <CardHeader className="p-8 pb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        {contract.is_public ? (
                                            <Badge variant="secondary" className="bg-[#5ae6b9]/10 text-[#5ae6b9] border-none font-black text-[9px] uppercase tracking-widest py-1 px-3 rounded-lg">
                                                <Globe className="w-3 h-3 mr-1" /> Public
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-none font-black text-[9px] uppercase tracking-widest py-1 px-3 rounded-lg">
                                                <Lock className="w-3 h-3 mr-1" /> Private
                                            </Badge>
                                        )}
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/10">Hash: {contract.id.substring(0, 8)}</span>
                                    </div>
                                    <CardTitle className="text-2xl font-black group-hover:text-[#5ae6b9] transition-colors line-clamp-1">{contract.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-sm text-white/30 font-medium leading-relaxed mt-2">
                                        {contract.description || "Experimental smart contract powered by CashScript and CashLabs functionality."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between bg-white/[0.02] p-8">
                                    <div className="flex gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-[#5ae6b9]/10 hover:text-[#5ae6b9] rounded-xl transition-all"
                                            onClick={() => router.push(`/c/${contract.id}/edit`)}
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
                                            onClick={() => deleteContract(contract.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <Button
                                        className="bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest px-6"
                                        onClick={() => router.push(`/c/${contract.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
