import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { exampleId, userId } = await req.json();

        if (!exampleId || !userId) {
            return NextResponse.json({ error: 'Missing exampleId or userId' }, { status: 400 });
        }

        // 1. Fetch the example
        const { data: example, error: fetchError } = await supabaseAdmin
            .from('scraper_contracts')
            .select('*')
            .eq('id', exampleId)
            .single();

        if (fetchError || !example) {
            return NextResponse.json({ error: 'Example not found' }, { status: 404 });
        }

        // 2. Decode the code if it's base64 (as per our contribution logic)
        let finalCode = example.source_code;
        try {
            // Double check if it looks like base64
            if (example.source_code && !example.source_code.includes(' ')) {
                finalCode = Buffer.from(example.source_code, 'base64').toString('utf8');
            }
        } catch (e) {
            console.warn('Code was not base64 encoded or failed to decode');
        }

        // 3. Create a new contract in the 'contracts' table
        const hashId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

        const { data: newContract, error: insertError } = await supabaseAdmin
            .from('contracts')
            .insert({
                id: hashId,
                name: example.name || "Imported Example",
                owner_id: userId,
                is_public: false,
                source_code: finalCode,
                description: example.explanation || "Imported from CashLabs Examples",
                artifact_json: {}
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, contractId: newContract.id });

    } catch (error: any) {
        console.error('[IMPORT-EXAMPLE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
