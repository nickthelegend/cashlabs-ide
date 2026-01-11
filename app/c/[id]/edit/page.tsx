"use client"

import { useEffect, useState, use } from 'react'
import CashLabsIDE from '@/components/cashlabs-ide'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [files, setFiles] = useState<any>(null)
    const [contractName, setContractName] = useState("Untitled Contract")
    const [error, setError] = useState<string | null>(null)

    const [isPublic, setIsPublic] = useState(false)

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const { data, error } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                if (!data) throw new Error("Contract not found")

                setContractName(data.name || "Untitled")
                setIsPublic(data.is_public || false)

                // Reconstruct file structure from source_code string if it's not already a JSON structure
                // In a more advanced version, we'd store the whole JSON structure in a separate column
                let projectFiles;
                try {
                    // Try to parse as JSON first (if we stored the whole structure in source_code)
                    projectFiles = JSON.parse(data.source_code)
                } catch (e) {
                    // Fallback to wrapping the raw string as a single .cash file
                    projectFiles = {
                        "contracts": {
                            directory: {
                                [`${data.name.replace(/\s+/g, '')}.cash`]: {
                                    file: {
                                        contents: data.source_code || ""
                                    }
                                }
                            }
                        },
                        "artifacts": { directory: {} }
                    }
                }

                setFiles(projectFiles)
            } catch (err: any) {
                console.error("Failed to load contract:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchContract()
    }, [id])

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#1e1e1e] text-white font-sans">
                <Loader2 className="w-12 h-12 animate-spin text-[#58ba53] mb-4" />
                <p className="text-gray-500 animate-pulse font-medium">Booting IDE environment...</p>
            </div>
        )
    }

    if (error || !files) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#1e1e1e] text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-4">Failed to initialize editor</h1>
                <p className="text-gray-400 mb-8">{error || "The contract could not be loaded."}</p>
                <div className="flex gap-4">
                    <Button onClick={() => router.push('/')} variant="outline" className="border-[#333]">Go Home</Button>
                    <Button onClick={() => window.location.reload()} className="bg-[#58ba53] hover:bg-[#469e42]">Try Again</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full overflow-hidden bg-[#1e1e1e]">
            <CashLabsIDE
                initialFiles={files}
                selectedTemplate="CashScript"
                selectedTemplateName={contractName}
                projectId={id}
                initialIsPublic={isPublic}
            />
        </div>
    )
}
