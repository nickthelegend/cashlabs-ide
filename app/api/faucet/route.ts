import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { cashaddr } = await req.json();

        if (!cashaddr) {
            return NextResponse.json({ error: 'Missing cashaddr' }, { status: 400 });
        }

        console.log(`[FAUCET] Funding requested for: ${cashaddr}`);

        const response = await fetch('https://rest-unstable.mainnet.cash/faucet/get_testnet_bch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cashaddr }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Log the error but maybe the faucet is just dry or rate limited
            console.error('[FAUCET] Remote error:', data);
            return NextResponse.json({ error: data.message || 'Faucet error' }, { status: response.status });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[FAUCET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
