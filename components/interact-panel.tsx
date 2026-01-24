"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Zap,
    Box,
    ExternalLink,
    History,
    Activity,
    Plus,
    Search,
    ChevronRight,
    Database,
    Smartphone,
    Info
} from "lucide-react"

interface DeployedInstance {
    id: string;
    name: string;
    address: string;
    artifact_json: any;
    created_at: string;
    project_id: string;
}

interface InteractPanelProps {
    projectId?: string;
    onSelect: (instance: DeployedInstance) => void;
    selectedInstanceId?: string;
}

export function InteractPanel({ projectId, onSelect, selectedInstanceId }: InteractPanelProps) {
    const [instances, setInstances] = useState<DeployedInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchInstances = async () => {
            setLoading(true);
            const query = supabase
                .from('deployed_instances')
                .select('*')
                .order('created_at', { ascending: false });

            if (projectId) {
                query.eq('project_id', projectId);
            }

            const { data, error } = await query;
            if (data) setInstances(data);
            setLoading(false);
        };

        fetchInstances();

        // Subscribe to new deployments
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'deployed_instances' },
                (payload) => {
                    if (!projectId || payload.new.project_id === projectId) {
                        setInstances(prev => [payload.new as DeployedInstance, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    const filteredInstances = instances.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            <div className="p-4 border-b border-white/5 bg-[#252526]">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#5ae6b9] flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4" /> Deployed Instances
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                    <input
                        type="text"
                        placeholder="Filter instances..."
                        className="w-full bg-[#1e1e1e] border border-white/5 h-8 pl-8 pr-3 rounded-lg text-xs font-bold focus:outline-none focus:border-[#5ae6b9]/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {loading ? (
                        <div className="p-10 text-center opacity-20">
                            <Zap className="w-8 h-8 animate-pulse mx-auto mb-2 text-[#5ae6b9]" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Scanning Chain...</p>
                        </div>
                    ) : filteredInstances.length === 0 ? (
                        <div className="p-8 text-center bg-[#252526]/50 rounded-xl border border-dashed border-white/5 m-2">
                            <Info className="w-6 h-6 mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">No active deployments found for this project</p>
                            <p className="text-[9px] text-white/20 mt-2">Deploy your contract to see it here.</p>
                        </div>
                    ) : (
                        filteredInstances.map((instance) => (
                            <div
                                key={instance.id}
                                className={`group p-3 rounded-xl cursor-pointer transition-all border ${selectedInstanceId === instance.id
                                        ? 'bg-[#5ae6b9]/10 border-[#5ae6b9]/30'
                                        : 'bg-[#252526] border-transparent hover:border-white/10'
                                    }`}
                                onClick={() => onSelect(instance)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedInstanceId === instance.id ? 'bg-[#5ae6b9] animate-pulse' : 'bg-white/20'}`} />
                                        <span className="text-[11px] font-black tracking-tight truncate group-hover:text-[#5ae6b9] transition-colors">{instance.name}</span>
                                    </div>
                                    <Badge className="bg-white/5 text-[8px] font-black uppercase tracking-tighter h-4 px-1">Chipnet</Badge>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[9px] font-mono text-white/30">
                                        <span>{instance.address.substring(0, 12)}...{instance.address.substring(34)}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 p-0 hover:text-[#5ae6b9]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(instance.address);
                                                }}
                                            >
                                                <Plus className="w-3 h-3 rotate-45" />
                                            </Button>
                                            <a
                                                href={`https://chipnet.imaginary.cash/address/${instance.address}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-[#5ae6b9]"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-[#252526] border-t border-white/5">
                <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-3 h-3 text-[#5ae6b9]" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Interaction Mode</span>
                    </div>
                    <p className="text-[9px] text-white/30 leading-relaxed">
                        Select a deployed instance to load its ABI and execute methods directly from the IDE console.
                    </p>
                </div>
            </div>
        </div>
    )
}
