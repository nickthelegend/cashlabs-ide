"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, Box, Search, ArrowRight, Zap, Database, ExternalLink, Loader2 } from "lucide-react"

export default function ExamplesPage() {
    const router = useRouter()
    const [examples, setExamples] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchExamples = async () => {
            try {
                const response = await fetch("/api/examples")
                const data = await response.json()
                if (Array.isArray(data)) {
                    setExamples(data)
                }
            } catch (error) {
                console.error("Error fetching examples:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchExamples()
    }, [])

    const filteredExamples = examples.filter(ex =>
        ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.explanation?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#0f0f10] text-white font-sans selection:bg-[#5ae6b9]/30">
            {/* Navbar Minimal */}
            <nav className="border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-[100]">
                <div className="flex items-center gap-4 cursor-pointer group" onClick={() => router.push('/')}>
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-black tracking-tighter">CashLabs <span className="text-[#5ae6b9]">Examples</span></span>
                </div>
                <Button
                    variant="ghost"
                    className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100"
                    onClick={() => router.push('/')}
                >
                    Back to Home
                </Button>
            </nav>

            <main className="container mx-auto px-4 py-20">
                {/* Hero */}
                <div className="flex flex-col items-center text-center mb-20">
                    <Badge className="bg-[#5ae6b9]/10 text-[#5ae6b9] border-none font-black text-[10px] uppercase tracking-widest mb-6 px-4 py-1">
                        Curated Library
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 max-w-3xl">
                        Smart Contract <br />
                        <span className="text-[#5ae6b9] italic underline decoration-white/10">Reference Library.</span>
                    </h1>
                    <p className="text-white/40 max-w-xl font-medium leading-relaxed">
                        High-quality, verified CashScript examples scraped and contributed by the community. Learn, import, and build faster.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-16 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search by contract name or logic..."
                        className="w-full bg-[#161618] border border-white/5 h-16 pl-16 pr-6 rounded-2xl text-lg font-bold placeholder:text-white/10 focus:outline-none focus:border-[#5ae6b9]/50 transition-all shadow-2xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <Loader2 className="w-10 h-10 animate-spin text-[#5ae6b9] mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Compiling Knowledge Base...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredExamples.map((ex) => (
                            <div
                                key={ex.id}
                                className="group bg-[#161618] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#5ae6b9]/40 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col"
                                onClick={() => router.push(`/examples/${ex.id}`)}
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-[#5ae6b9]/5 border border-[#5ae6b9]/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-[#5ae6b9]" />
                                    </div>
                                    <Badge className="bg-white/5 text-white/40 border-none font-bold text-[9px] uppercase">Example #{ex.id}</Badge>
                                </div>

                                <h3 className="text-2xl font-black mb-4 group-hover:text-[#5ae6b9] transition-colors line-clamp-1">{ex.name || "Untitled Contract"}</h3>

                                <p className="text-white/30 text-sm font-medium line-clamp-3 mb-8 leading-relaxed">
                                    {ex.explanation || "No documentation provided."}
                                </p>

                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Database className="w-3 h-3 text-[#5ae6b9]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Mainnet Ready</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[#5ae6b9] font-black uppercase text-[10px] tracking-widest translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                        View Code <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredExamples.length === 0 && (
                    <div className="text-center py-40">
                        <h2 className="text-2xl font-black opacity-20">No matching examples found.</h2>
                    </div>
                )}
            </main>
        </div>
    )
}
