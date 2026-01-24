import { NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/embed';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { messages, template } = await req.json();
        const lastMessage = messages[messages.length - 1].text;

        // 1. Generate embedding for user query
        const queryEmbedding = await getEmbedding(lastMessage);

        // 2. Search for relevant context in the 'context' table
        const { data: contextResults, error: contextError } = await supabaseAdmin.rpc('match_context', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
        });

        if (contextError) {
            console.error('Error fetching context:', contextError);
        }

        const contextText = contextResults
            ?.map((item: any) => item.content)
            .join('\n---\n') || 'No additional context found.';

        // 3. Prepare prompt for Mistral
        const systemPrompt = `You are an expert CashScript developer for Bitcoin Cash. 
Use the provided context to answer building smart contracts.
Context from knowledge base:
${contextText}

Guidelines:
1. Always generate complete, working code.
2. Use markdown with language tags (e.g., \`\`\`cashscript).
3. Explain the logic briefly after the code.
4. If the context isn't helpful, use your general knowledge of CashScript and Bitcoin Cash.
5. Be concise and professional.`;

        const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

        const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-medium', // Using a better model for chat
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map((m: any) => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.text
                    }))
                ]
            })
        });

        if (!mistralRes.ok) {
            const errorText = await mistralRes.text();
            return NextResponse.json({ error: `AI error: ${errorText}` }, { status: 500 });
        }

        const data = await mistralRes.json();
        const aiResponse = data.choices[0].message.content;

        return NextResponse.json({ response: aiResponse });

    } catch (error: any) {
        console.error('[CHAT-API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
