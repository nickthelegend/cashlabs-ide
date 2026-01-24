import { NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/embed';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

        if (!MISTRAL_API_KEY) {
            return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
        }

        // 1. Call Mistral to generate a response (explanation/documentation)
        const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'open-mistral-7b', // A standard mistral model
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert Bitcoin Cash smart contract developer. Explain the following code in detail, focusing on its security, functionality, and how it works.'
                    },
                    {
                        role: 'user',
                        content: `Explain this code:\n\n${code}`
                    }
                ]
            })
        });

        if (!mistralRes.ok) {
            const errorText = await mistralRes.text();
            throw new Error(`Mistral API error: ${errorText}`);
        }

        const mistralData = await mistralRes.json();
        const explanation = mistralData.choices[0].message.content;

        // 2. Chunk text into manageable pieces for embedding
        const chunks = chunkText(explanation, 800); // ~800 characters per chunk

        // 3. Embed chunks and store in Supabase (Vector Search)
        const results = [];
        for (const chunk of chunks) {
            const embedding = await getEmbedding(chunk);
            const { data, error } = await supabaseAdmin
                .from('context')
                .insert({
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        source: 'contribution',
                        type: 'code_explanation',
                        original_code_snippet: code.substring(0, 500)
                    }
                })
                .select();

            if (!error && data) results.push(data);
        }

        // 4. Store full contract and explanation in scraper_contracts (Full Archive)
        const base64Code = Buffer.from(code).toString('base64');
        const { error: scraperError } = await supabaseAdmin
            .from('scraper_contracts')
            .insert({
                source_code: base64Code,    // Encoded nicely as requested
                explanation: explanation,   // Full explanation without chunking
                metadata: {
                    encoding: 'base64',
                    timestamp: new Date().toISOString(),
                    original_length: code.length
                }
            });

        if (scraperError) {
            console.error('Error inserting into scraper_contracts:', scraperError);
        }

        return NextResponse.json({
            success: true,
            explanation,
            chunksCount: chunks.length,
            storedCount: results.length,
            scraperStored: !scraperError
        });

    } catch (error: any) {
        console.error('[CONTRIBUTE-API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

function chunkText(text: string, size: number): string[] {
    const chunks = [];
    const words = text.split(' ');
    let currentChunk = '';

    for (const word of words) {
        if ((currentChunk + word).length > size) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }
        currentChunk += word + ' ';
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
