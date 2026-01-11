"use client"

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Code, Search, PlusCircle, LogOut, LayoutDashboard, Database, Globe, Lock, Zap, ArrowLeft, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function CommunityPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [publicCount, setPublicCount] = useState(0)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [allPublicContracts, setAllPublicContracts] = useState<any[]>([])

    useEffect(() => {
        const initData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user || null)

            // Fetch All Public Contracts initially
            const { data: publicContracts, count: pCount } = await supabase
                .from('contracts')
                .select('*', { count: 'exact' })
                .eq('is_public', true)
                .order('created_at', { ascending: false })

            if (publicContracts) setAllPublicContracts(publicContracts)
            setPublicCount(pCount || 0)
            setLoading(false)
        }
        initData()

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null)
        })

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([])
                setSearching(false)
                return
            }

            setSearching(true)
            const { data } = await supabase
                .from('contracts')
                .select('*')
                .or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`)
                .eq('is_public', true)
                .limit(10)

            if (data) setSearchResults(data)
            setSearching(false)
        }

        const timer = setTimeout(performSearch, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}`,
            },
        })
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    const createContract = async () => {
        if (!user) {
            handleLogin()
            return
        }

        const hashId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)

        const { data, error } = await supabase.from('contracts').insert({
            id: hashId,
            name: "Untitled Contract",
            owner_id: user.id,
            is_public: false,
            source_code: `pragma cashscript ^0.12.0;

contract Unlock(int value) {
    function unlock(int input) {
        require(input == value);
    }
}`,
            artifact_json: {}
        }).select().single()

        if (data) {
            router.push(`/c/${data.id}/edit`)
        } else {
            console.error("Error creating contract:", error)
        }
    }

    const contractsToDisplay = searchQuery.length >= 2 ? searchResults : allPublicContracts

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f10] flex flex-col items-center justify-center text-white font-sans">
                <Loader2 className="w-12 h-12 animate-spin text-[#5ae6b9] mb-4" />
                <p className="text-gray-500 animate-pulse font-bold uppercase tracking-widest text-[10px]">Accessing Registry...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f0f10] text-white font-sans selection:bg-[#5ae6b9]/30">
            {/* Navbar */}
            <nav className="border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-[100]">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => router.push('/')}>
                        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="CashLabs" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">CashLabs</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer text-[#5ae6b9] transition-colors group">
                            <span className="text-sm font-bold uppercase tracking-widest">Community</span>
                            <Badge className="bg-[#5ae6b9]/10 text-[#5ae6b9] border-none font-black px-2 py-0">{publicCount}</Badge>
                        </div>
                        {user && (
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:text-[#5ae6b9] transition-colors group"
                                onClick={() => router.push('/dashboard')}
                            >
                                <span className="text-sm font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100">My Contracts</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                className="text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-all px-0"
                                onClick={() => router.push('/dashboard')}
                            >
                                Dashboard
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-2xl focus-visible:ring-0 p-0 overflow-hidden border border-white/10 hover:border-[#5ae6b9]/50">
                                        <Avatar className="h-full w-full rounded-none">
                                            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                            <AvatarFallback className="bg-gradient-to-br from-[#5ae6b9] to-[#3dbd91] font-bold">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 bg-[#161618] border-white/10 text-white shadow-2xl rounded-2xl p-2" align="end">
                                    <DropdownMenuLabel className="p-4">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-black leading-none">{user.user_metadata?.full_name || user.email}</p>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 rounded-xl p-3 gap-3" onClick={() => router.push('/dashboard')}>
                                        <LayoutDashboard className="h-4 w-4 text-[#5ae6b9]" />
                                        <span className="font-bold text-xs uppercase tracking-widest">Dashboard</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 rounded-xl p-3 gap-3 text-red-400" onClick={handleLogout}>
                                        <LogOut className="h-4 w-4" />
                                        <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Button
                            onClick={handleLogin}
                            className="bg-[#5ae6b9] hover:bg-[#48d4a6] text-black font-black px-8 py-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#5ae6b9]/20"
                        >
                            Login
                        </Button>
                    )}
                </div>
            </nav>

            <main className="container mx-auto px-4 py-20">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 border-b border-white/5 pb-10">
                    <div className="space-y-4">
                        <Button variant="ghost" onClick={() => router.push('/')} className="hover:bg-white/5 rounded-xl transition-all -ml-4 px-4 text-white/40 mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                        <h1 className="text-5xl font-black tracking-tighter">Community <span className="text-[#5ae6b9]">Registry</span></h1>
                        <p className="text-white/30 font-bold uppercase text-[10px] tracking-[0.3em]">Explore production-grade smart contracts</p>
                    </div>

                    <div className="w-full max-w-xl flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-grow group w-full">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-[#5ae6b9] transition-colors" />
                            <Input
                                type="text"
                                placeholder="Filter by name or ID..."
                                className="w-full pl-12 h-14 bg-[#161618] border-white/5 focus:border-[#5ae6b9]/50 rounded-2xl transition-all placeholder:text-white/10 font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={createContract}
                            className="h-14 px-8 bg-[#5ae6b9] text-black hover:bg-[#48d4a6] active:scale-95 transition-all font-black text-sm rounded-2xl flex items-center gap-2 whitespace-nowrap shadow-lg shadow-[#5ae6b9]/10"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create Contract
                        </Button>
                    </div>
                </div>

                {searching ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <span className="font-black uppercase tracking-widest text-sm">Querying Database...</span>
                    </div>
                ) : contractsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {contractsToDisplay.map((c) => (
                            <div
                                key={c.id}
                                className="group bg-[#161618] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#5ae6b9]/30 transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col"
                                onClick={() => router.push(`/c/${c.id}`)}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-[#5ae6b9] transition-all">
                                    <Code className="w-8 h-8" />
                                </div>
                                <div className="mb-6 flex items-center justify-between">
                                    <Badge className="bg-[#5ae6b9]/10 text-[#5ae6b9] border-none font-black text-[9px] uppercase tracking-widest py-1 px-3">Public</Badge>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/10">{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-2xl font-black mb-3 group-hover:text-[#5ae6b9] transition-colors line-clamp-1">{c.name}</h3>
                                <p className="text-white/30 text-sm font-medium line-clamp-3 mb-8 leading-relaxed">
                                    {c.description || "An institutional-grade smart contract powered by CashScript logic architecture."}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                            <Database className="w-3 h-3 text-[#5ae6b9]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Ref: {c.id.substring(0, 8)}</span>
                                    </div>
                                    <Button variant="ghost" className="text-[#5ae6b9] group-hover:translate-x-1 transition-transform p-0 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-transparent">
                                        Inspect
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 bg-[#161618] rounded-[3rem] border border-white/5 border-dashed">
                        <span className="text-4xl mb-6">🔍</span>
                        <h3 className="text-2xl font-black tracking-tighter mb-2">No contracts found</h3>
                        <p className="text-white/20 font-bold uppercase text-[10px] tracking-widest">Try adjusting your search filters</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-20 text-center border-t border-white/5 bg-[#0f0f10]">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <img src="/logo.png" alt="CashLabs" className="w-6 h-6 opacity-40" />
                    <span className="font-black text-white/20 tracking-tighter text-xl">CashLabs</span>
                </div>
                <p className="text-white/20 font-bold text-xs tracking-widest uppercase">The Premier Suite for Bitcoin Cash Engineers</p>
            </footer>
        </div>
    )
}
