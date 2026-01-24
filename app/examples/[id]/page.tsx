"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, ArrowLeft, Zap, Database, Download, Loader2, Sparkles, ExternalLink } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useToast } from "@/components/ui/use-toast"

export default function ExampleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const id = params?.id
    const [example, setExample] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchExample = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user || null)

                // We fetch all and filter or fetch single via API
                // For efficiency, let's just fetch all or create a single route. 
                // I created /api/examples but should probably have a single route.
                // Let's use supabase directly for detail if allowed, or fetch from /api/examples
                const response = await fetch("/api/examples")
                const data = await response.json()
                const match = data.find((item: any) => item.id.toString() === id)

                if (match) {
                    // Decode source code if it's base64
                    let decodedCode = match.source_code;
                    try {
                        if (match.source_code && !match.source_code.includes(' ')) {
                            decodedCode = Buffer.from(match.source_code, 'base64').toString('utf8');
                        }
                    } catch (e) {
                        console.warn('Decoding failed');
                    }
                    setExample({ ...match, source_code: decodedCode })
                }
            } catch (error) {
                console.error("Error fetching example:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchExample()
    }, [id])

    const handleImport = async () => {
        if (!user) {
            toast({
                title: "Login Required",
                description: "Please login to import this contract into your workspace.",
            })
            return
        }

        setImporting(true)
        try {
            const res = await fetch("/api/examples/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exampleId: id, userId: user.id })
            })

            const data = await res.json()
            if (data.success) {
                toast({
                    title: "Import Successful!",
                    description: "Example has been added to your projects.",
                })
                router.push(`/c/${data.contractId}/edit`)
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast({
                title: "Import Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setImporting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 animate-spin text-[#5ae6b9] mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Loading Example Project...</p>
            </div>
        )
    }

    if (!example) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-black mb-4">Example not found</h1>
                <Button onClick={() => router.push('/examples')}>Back to Registry</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] text-white font-sans selection:bg-[#5ae6b9]/30 pb-20">
            {/* Header */}
            <nav className="border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-[100]">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/examples')} className="hover:bg-white/5 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tight leading-none">{example.name || "Untitled Example"}</h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1">Registry ID: {example.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        className="bg-[#5ae6b9] hover:bg-[#48d4a6] text-black font-black px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#5ae6b9]/20"
                        onClick={handleImport}
                        disabled={importing}
                    >
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Open in IDE
                    </Button>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Code */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-[#161618] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="bg-[#1f1f21] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5 mr-4">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                    </div>
                                    <Code className="w-4 h-4 text-[#5ae6b9]" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">contract.cash</span>
                                </div>
                                <Badge variant="outline" className="border-white/10 text-white/40 text-[9px] uppercase font-bold">Read-Only View</Badge>
                            </div>
                            <div className="p-0 overflow-hidden text-sm">
                                <SyntaxHighlighter
                                    language="javascript"
                                    style={vscDarkPlus}
                                    customStyle={{
                                        margin: 0,
                                        padding: '2rem',
                                        backgroundColor: 'transparent',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.6',
                                    }}
                                    codeTagProps={{
                                        style: {
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        }
                                    }}
                                >
                                    {example.source_code}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    </div>

                    {/* Right: Docs */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-[#161618] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Sparkles className="w-32 h-32 text-[#5ae6b9]" />
                            </div>

                            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                <div className="p-2 bg-[#5ae6b9]/10 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-[#5ae6b9]" />
                                </div>
                                AI Review
                            </h3>

                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-white/60 leading-relaxed font-medium whitespace-pre-wrap">
                                    {example.explanation || "No AI explanation available for this example."}
                                </p>
                            </div>

                            <div className="mt-12 pt-10 border-t border-white/5 space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Security Status</span>
                                    <Badge className="bg-green-500/10 text-green-500 border-none px-3 font-bold">Standard</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Added Date</span>
                                    <span className="text-xs font-bold text-white/40">{new Date(example.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Reference Type</span>
                                    <span className="text-xs font-bold text-white/40">Scraped Code</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#5ae6b9]/10 to-transparent border border-[#5ae6b9]/20 rounded-[2.5rem] p-10">
                            <h4 className="font-black text-lg mb-4 text-[#5ae6b9]">Build with this.</h4>
                            <p className="text-xs text-[#5ae6b9]/60 font-medium leading-relaxed mb-8">
                                Importing this contract will create a private copy in your workspace. You'll be able to edit, compile, and deploy it to Chipnet immediately.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-[#5ae6b9]/50 text-[#5ae6b9] hover:bg-[#5ae6b9]/10 rounded-xl font-black uppercase text-[10px] tracking-widest"
                                onClick={handleImport}
                                disabled={importing}
                            >
                                Start Engineering
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
