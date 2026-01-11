import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sourceCode, filename } = body

        if (!sourceCode) {
            return NextResponse.json({
                ok: false,
                error: 'Source code is required'
            }, { status: 400 })
        }

        console.log(`[CASHSCRIPT] Compiling ${filename || 'contract'}...`)

        // Dynamic import to handle ESM module
        const { compileString } = await import('cashc')

        // Compile the CashScript source code to artifact
        const artifact = compileString(sourceCode)

        console.log(`[CASHSCRIPT] Compilation successful: ${artifact.contractName}`)
        console.log(`[CASHSCRIPT] Bytecode: ${artifact.bytecode.substring(0, 100)}...`)

        // Calculate bytecode stats
        const opcodes = artifact.bytecode.split(' ')
        const opcount = opcodes.filter((op: string) => op.startsWith('OP_')).length

        return NextResponse.json({
            ok: true,
            artifact,
            contractName: artifact.contractName,
            constructorInputs: artifact.constructorInputs,
            abi: artifact.abi,
            bytecode: artifact.bytecode,
            source: artifact.source,
            compiler: artifact.compiler,
            bytesize: opcodes.length,
            opcount,
        })

    } catch (error: any) {
        console.error('[CASHSCRIPT] Compilation error:', error)

        // Parse error message for better user feedback
        let errorMessage = error.message || 'Compilation failed'

        // CashScript errors often contain line/column info
        if (error.location) {
            errorMessage = `Line ${error.location.start.line}: ${errorMessage}`
        }

        return NextResponse.json({
            ok: false,
            error: errorMessage,
            details: error.toString()
        }, { status: 400 })
    }
}
