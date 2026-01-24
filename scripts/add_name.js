const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env manually since this is a standalone script
const envPath = path.resolve(__dirname, '../.env');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
envConfig.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const MISTRAL_API_KEY = env.MISTRAL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MISTRAL_API_KEY) {
    console.error('Missing environment variables in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getNameFromMistral(sourceCode, explanation) {
    try {
        const prompt = `
Analyze this Bitcoin Cash (CashScript) smart contract and provide a short, professional, and descriptive name (2-4 words maximum).
The name should reflect the contract's primary purpose. 

Source Code:
${sourceCode}

Additional Context:
${explanation}

Return ONLY the name as a string, no quotes, no explanation, no markdown.
`;

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content.trim();
        }
        return null;
    } catch (error) {
        console.error('Error calling Mistral:', error);
        return null;
    }
}

async function main() {
    console.log('--- Starting Contract Naming Job ---');

    // 1. Fetch contracts with NULL names
    const { data: contracts, error } = await supabase
        .from('scraper_contracts')
        .select('id, source_code, explanation')
        .is('name', null);

    if (error) {
        console.error('Error fetching contracts:', error);
        return;
    }

    console.log(`Found ${contracts.length} unnamed contracts.`);

    for (const contract of contracts) {
        console.log(`Processing ID: ${contract.id}...`);

        // 2. Decode source code (assuming base64)
        let decodedSource = contract.source_code;
        try {
            decodedSource = Buffer.from(contract.source_code, 'base64').toString('utf8');
        } catch (e) {
            console.warn(`Could not decode base64 for ID ${contract.id}, using raw source.`);
        }

        // 3. Get name from Mistral
        const newName = await getNameFromMistral(decodedSource, contract.explanation);

        if (newName) {
            console.log(`Generated Name: ${newName}`);

            // 4. Update row
            const { error: updateError } = await supabase
                .from('scraper_contracts')
                .update({ name: newName })
                .eq('id', contract.id);

            if (updateError) {
                console.error(`Failed to update ID ${contract.id}:`, updateError);
            } else {
                console.log(`Successfully named ID ${contract.id}`);
            }
        } else {
            console.log(`Could not generate name for ID ${contract.id}`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('--- Job Complete ---');
}

main();
