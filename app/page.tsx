"use client"

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Code, Search, PlusCircle, LogOut, LayoutDashboard, Database, Globe, Lock, Zap } from "lucide-react"
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

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [contractCount, setContractCount] = useState(0)
  const [publicCount, setPublicCount] = useState(0)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [featuredContracts, setFeaturedContracts] = useState<any[]>([])

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)

      // Fetch Total Stats
      const { count } = await supabase.from('contracts').select('*', { count: 'exact', head: true })
      setContractCount(count || 0)

      // Fetch Public Count
      const { count: pCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('is_public', true)
      setPublicCount(pCount || 0)

      // Fetch Featured (Public) Contracts
      const { data: featured } = await supabase
        .from('contracts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3)

      if (featured) setFeaturedContracts(featured)
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
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`)
        .eq('is_public', true)
        .limit(5)

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
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-[#5ae6b9] transition-colors group"
              onClick={() => router.push('/community')}
            >
              <span className="text-sm font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100">Community</span>
              <Badge className="bg-[#5ae6b9]/10 text-[#5ae6b9] border-none font-black px-2 py-0">{publicCount}</Badge>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-[#5ae6b9] transition-colors group"
              onClick={() => router.push('/examples')}
            >
              <span className="text-sm font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100">Examples</span>
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
          {loading ? (
            <div className="h-10 w-10 animate-pulse bg-white/5 rounded-full" />
          ) : user ? (
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

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-32 flex flex-col items-center">
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5ae6b9]/5 border border-[#5ae6b9]/10 text-[#5ae6b9] text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Zap className="w-3 h-3" /> Professional BCH Development
        </div>
        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] text-center max-w-4xl">
          Write Secure <br />
          <span className="text-[#5ae6b9] italic">Smart Contracts.</span>
        </h1>
        <p className="text-xl text-white/40 max-w-2xl mb-16 text-center leading-relaxed font-medium">
          The ultimate IDE for CashScript. Design, compile, and deploy institutional-grade smart contracts on the Bitcoin Cash network.
        </p>

        {/* Search & Action */}
        <div className="w-full max-w-4xl flex flex-col gap-6 items-center justify-center mb-32 relative">
          <div className="flex flex-col md:flex-row gap-4">
            {user ? (
              <Button
                onClick={createContract}
                className="h-20 px-10 bg-[#5ae6b9] text-black hover:bg-[#48d4a6] active:scale-95 transition-all font-black text-xl rounded-[2rem] flex items-center gap-3 shadow-2xl shadow-[#5ae6b9]/20"
              >
                <PlusCircle className="w-7 h-7" />
                Create Contract
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                className="h-20 px-10 bg-[#5ae6b9] text-black hover:bg-[#48d4a6] active:scale-95 transition-all font-black text-xl rounded-[2rem] flex items-center gap-3 shadow-2xl shadow-[#5ae6b9]/20"
              >
                <LogOut className="w-7 h-7" />
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Featured Contracts Section */}
        <div className="w-full max-w-6xl space-y-12">
          <div className="flex items-end justify-between border-b border-white/5 pb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter">Featured <span className="text-[#5ae6b9]">Registry</span></h2>
              <p className="text-white/30 font-bold uppercase text-[10px] tracking-[0.3em]">Top active community contracts</p>
            </div>
            <Button
              variant="ghost"
              className="text-[#5ae6b9] font-black uppercase text-[10px] tracking-widest hover:bg-[#5ae6b9]/10 rounded-xl"
              onClick={() => router.push('/community')}
            >
              View All Contracts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredContracts.length > 0 ? (
              featuredContracts.map((c) => (
                <div
                  key={c.id}
                  className="group bg-[#161618] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#5ae6b9]/30 transition-all cursor-pointer shadow-xl relative overflow-hidden"
                  onClick={() => router.push(`/c/${c.id}`)}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-[#5ae6b9] transition-all">
                    <Code className="w-8 h-8" />
                  </div>
                  <div className="mb-6 flex items-center justify-between">
                    <Badge className="bg-[#5ae6b9]/10 text-[#5ae6b9] border-none font-black text-[9px] uppercase tracking-widest py-1">Public</Badge>
                    <span className="text-[10px] font-mono text-white/10">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-3 group-hover:text-[#5ae6b9] transition-colors">{c.name}</h3>
                  <p className="text-white/30 text-sm font-medium line-clamp-2 mb-8 leading-relaxed">
                    {c.description || "Experimental smart contract powered by CashScript and CashLabs functionality."}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 border-2 border-[#161618]" />
                      <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#161618]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Audit Ready</span>
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-[#161618]/50 border border-white/5 h-64 rounded-[2.5rem] animate-pulse" />
              ))
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-32">
          <div className="bg-[#161618] p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center group hover:bg-[#5ae6b9]/5 transition-all">
            <Database className="w-8 h-8 text-[#5ae6b9] mb-6 group-hover:scale-110 transition-transform" />
            <span className="text-5xl font-black text-white mb-2 tracking-tighter">{contractCount}</span>
            <span className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">Total Deployments</span>
          </div>
          <div className="bg-[#161618] p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center group hover:bg-[#5ae6b9]/5 transition-all">
            <Globe className="w-8 h-8 text-[#5ae6b9] mb-6 group-hover:rotate-12 transition-transform" />
            <span className="text-5xl font-black text-white mb-2 tracking-tighter">Chipnet</span>
            <span className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">Validated Edge</span>
          </div>
          <div className="bg-[#161618] p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center group hover:bg-[#5ae6b9]/5 transition-all">
            <Lock className="w-8 h-8 text-[#5ae6b9] mb-6 group-hover:-rotate-12 transition-transform" />
            <span className="text-5xl font-black text-white mb-2 tracking-tighter">v0.12.1</span>
            <span className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">Compiler Version</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-white/5 bg-[#0f0f10]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo.png" alt="CashLabs" className="w-6 h-6 opacity-40" />
          <span className="font-black text-white/20 tracking-tighter text-xl">CashLabs</span>
        </div>
        <p className="text-white/20 font-bold text-xs tracking-widest uppercase">The Premier Suite for Bitcoin Cash Engineers</p>
        <div className="flex justify-center gap-12 mt-10">
          <a href="#" className="text-white/20 hover:text-[#5ae6b9] transition-colors font-black text-[10px] uppercase tracking-widest">Docs</a>
          <a href="#" className="text-white/20 hover:text-[#5ae6b9] transition-colors font-black text-[10px] uppercase tracking-widest">Privacy</a>
          <a href="#" className="text-white/20 hover:text-[#5ae6b9] transition-colors font-black text-[10px] uppercase tracking-widest">Terms</a>
        </div>
      </footer>
    </div>
  )
}
