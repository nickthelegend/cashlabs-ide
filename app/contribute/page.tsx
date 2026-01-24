"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Code, Sparkles, BookOpen, Search } from "lucide-react"
import { draculaTheme } from "@/lib/dracula-theme"
import { Sidebar } from "@/components/sidebar"
import Link from "next/link"

export default function ContributePage() {
    const [code, setCode] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [explanation, setExplanation] = useState<string | null>(null)
    const { toast } = useToast()

    const handleEditorDidMount = (editor: any, monaco: any) => {
        monaco.editor.defineTheme('dracula', {
            ...draculaTheme
        });
        monaco.editor.setTheme('dracula');
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            toast({
                title: "Empty Code",
                description: "Please provide some code to contribute.",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        setExplanation(null)

        try {
            const response = await fetch("/api/contribute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
            })

            const data = await response.json()

            if (response.ok) {
                setExplanation(data.explanation)
                toast({
                    title: "Contribution Successful!",
                    description: `Code explanation generated and stored in vector database. Chunks: ${data.chunksCount}`,
                })
            } else {
                throw new Error(data.error || "Failed to submit contribution")
            }
        } catch (error: any) {
            toast({
                title: "Contribution Failed",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d1117] text-white overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-[#30363d] flex items-center justify-between px-6 bg-[#161b22]">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6" />
                        <span className="font-bold tracking-tight text-xl">CashLabs <span className="text-[#58a6ff]">Contribute</span></span>
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="border-[#30363d] hover:bg-[#21262d]">
                        <Link href="/">Back to IDE</Link>
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Code Input */}
                <div className="flex-1 flex flex-col border-r border-[#30363d]">
                    <div className="p-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                            <Code className="w-4 h-4" />
                            <span>Submit Source Code for Vector Indexing</span>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !code.trim()}
                            className="bg-[#238636] hover:bg-[#2ea043] text-white"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            {isSubmitting ? "Processing..." : "Contribute Code"}
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language="cashscript"
                            theme="dracula"
                            value={code}
                            onMount={handleEditorDidMount}
                            onChange={(v) => setCode(v || "")}
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20 },
                            }}
                        />
                    </div>
                </div>

                {/* Right Side: Preview/Result */}
                <div className="w-1/3 flex flex-col bg-[#0d1117] overflow-y-auto">
                    {!explanation && !isSubmitting ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8b949e]">
                            <div className="w-16 h-16 rounded-full bg-[#161b22] flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-[#d29922]" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">Build the Knowledge Base</h3>
                            <p className="max-w-xs text-sm leading-relaxed">
                                Submit well-documented Bitcoin Cash smart contracts. Our AI will analyze them, generate detailed explanations, and index them into a searchable vector database.
                            </p>
                            <div className="mt-8 grid grid-cols-1 gap-4 w-full text-left">
                                <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]">
                                    <div className="flex items-center gap-2 mb-2 text-white text-sm font-semibold">
                                        <BookOpen className="w-4 h-4 text-[#58a6ff]" />
                                        Documentation
                                    </div>
                                    <p className="text-xs text-[#8b949e]">AI generates comprehensive explanations for your functions and logic.</p>
                                </div>
                                <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]">
                                    <div className="flex items-center gap-2 mb-2 text-white text-sm font-semibold">
                                        <Search className="w-4 h-4 text-[#3fb950]" />
                                        Semantic Search
                                    </div>
                                    <p className="text-xs text-[#8b949e]">Embeddings make your code searchable via natural language prompts.</p>
                                </div>
                            </div>
                        </div>
                    ) : isSubmitting ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8b949e]">
                            <Loader2 className="w-12 h-12 animate-spin text-[#58a6ff] mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Analyzing Code...</h3>
                            <p className="text-sm">Mistral is generating deep insights while Hugging Face embeds the knowledge.</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-[#d29922]" />
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">AI Analysis Result</h3>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-6 shadow-2xl">
                                    <div className="whitespace-pre-wrap text-[#c9d1d9] leading-relaxed">
                                        {explanation}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 p-4 rounded-lg bg-[#238636]/10 border border-[#238636]/30 text-[#3fb950] text-sm flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-[#3fb950] flex items-center justify-center text-black font-bold shrink-0">✓</div>
                                <div>
                                    <strong>Successfully Indexed!</strong>
                                    <p className="text-xs mt-1 text-[#3fb950]/80">This knowledge is now part of the CashLabs vector memory and can be retrieved during AI chat sessions.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
