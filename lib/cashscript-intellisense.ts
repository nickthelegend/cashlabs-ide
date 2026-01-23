import * as monaco from 'monaco-editor';

// Data extracted from the provided VS Code extension code
export const GLOBAL_FUNCTIONS = {
    abs: {
        code: 'int abs(int a)',
        codeDesc: 'Returns the absolute value of argument `a`.',
    },
    min: {
        code: 'int min(int a, int b)',
        codeDesc: 'Returns the minimum value of arguments `a` and `b`.',
    },
    max: {
        code: 'int max(int a, int b)',
        codeDesc: 'Returns the maximum value of arguments `a` and `b`.',
    },
    within: {
        code: 'bool within(int x, int lower, int upper)',
        codeDesc: 'Returns `true` if and only if `x >= lower && x < upper`.',
    },
    ripemd160: {
        code: 'bytes20 ripemd160(any x)',
        codeDesc: 'Returns the RIPEMD-160 hash of argument `x`.',
    },
    sha1: {
        code: 'bytes20 sha1(any x)',
        codeDesc: 'Returns the SHA-1 hash of argument `x`.',
    },
    sha256: {
        code: 'bytes32 sha256(any x)',
        codeDesc: 'Returns the SHA-256 hash of argument `x`.',
    },
    hash160: {
        code: 'bytes20 hash160(any x)',
        codeDesc: 'Returns the RIPEMD-160 hash of the SHA-256 hash of argument `x`.',
    },
    hash256: {
        code: 'bytes32 hash256(any x)',
        codeDesc: 'Returns the double SHA-256 hash of argument `x`.',
    },
    checkSig: {
        code: 'bool checkSig(sig s, pubkey pk)',
        codeDesc:
            'Checks that transaction signature `s` is valid for the current transaction and matches with public key `pk`.',
    },
    checkMultiSig: {
        code: 'bool checkMultiSig(sig[] sigs, pubkey[] pks)',
        codeDesc: 'Performs a multi-signature check using a list of transaction signatures and public keys.',
    },
    checkDataSig: {
        code: 'bool checkDataSig(datasig s, bytes msg, pubkey pk)',
        codeDesc: 'Checks that sig `s` is a valid signature for message `msg` and matches with public key `pk`.',
    },
    require: {
        code: 'require(bool expression, string debugMessage?)',
        codeDesc:
            'Puts a constraint on the `expression` failing the script execution if expression resolves to false. `debugMessage` will be present in the error log of the debug evaluation of the script. Has no effect in production.',
    },
    'console.log': {
        code: 'console.log(...args)',
        codeDesc: 'Logs primitve data or variable values to debug console. Has no effect in production.',
    },
    'date': {
        code: 'int date(string dateString)',
        codeDesc: 'Converts date string to timestamp',
    }
};

export const INSTANTIATIONS = {
    LockingBytecodeP2PKH: {
        code: 'new LockingBytecodeP2PKH(bytes20 pkh): bytes25',
        codeDesc: 'Creates new P2PKH locking bytecode for the public key hash `pkh`.',
    },
    LockingBytecodeP2SH20: {
        code: 'new LockingBytecodeP2SH20(bytes20 scriptHash): bytes23',
        codeDesc:
            'Creates new P2SH20 locking bytecode for the script hash, where `scriptHash` is the hash160() of your script.',
    },
    LockingBytecodeP2SH32: {
        code: 'new LockingBytecodeP2SH32(bytes32 scriptHash): bytes35',
        codeDesc:
            'Creates new P2SH32 locking bytecode for the script hash, where `scriptHash` is the hash256() of your script.',
    },
    LockingBytecodeNullData: {
        code: 'new LockingBytecodeNullData(bytes[] chunks): bytes',
        codeDesc: 'Creates new OP_RETURN locking bytecode with `chunks` as its OP_RETURN data.',
    },
};

export const TYPECASTS = {
    int: {
        code: 'int int( v )',
        codeDesc: 'Converts to int',
    },
    string: {
        code: 'string string( v )',
        codeDesc: 'Converts to string',
    },
    bytes: {
        code: 'bytes bytes( v )',
        codeDesc: 'Converts to bytes',
    },
    bool: {
        code: 'bool bool( v )',
        codeDesc: 'Converts to bool',
    },
    date: {
        code: 'int date(" YYYY-MM-DDThh:mm:ss ")',
        codeDesc: 'Converts implicit date to timestamp',
    },
};

export const LANGUAGE: Record<string, { code: string; codeDesc: string }> = { ...GLOBAL_FUNCTIONS, ...INSTANTIATIONS };

export const DOT_COMPLETIONS: Record<string, { label: string; kind: monaco.languages.CompletionItemKind }[]> = {
    tx: [
        { label: 'version', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'locktime', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'inputs', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'outputs', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'time', kind: monaco.languages.CompletionItemKind.Field },
    ],
    inputs: [
        { label: 'length', kind: monaco.languages.CompletionItemKind.Field },
    ],
    inputs_indexed: [
        { label: 'value', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'lockingBytecode', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'outpointTransactionHash', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'outpointIndex', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'unlockingBytecode', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'sequenceNumber', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'tokenCategory', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'nftCommitment', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'tokenAmount', kind: monaco.languages.CompletionItemKind.Field },
    ],
    outputs: [
        { label: 'length', kind: monaco.languages.CompletionItemKind.Field },
    ],
    outputs_indexed: [
        { label: 'value', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'lockingBytecode', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'tokenCategory', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'nftCommitment', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'tokenAmount', kind: monaco.languages.CompletionItemKind.Field },
    ],
    this: [
        { label: 'activeInputIndex', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'activeBytecode', kind: monaco.languages.CompletionItemKind.Field },
        { label: 'age', kind: monaco.languages.CompletionItemKind.Field }
    ],
    console: [
        { label: 'log', kind: monaco.languages.CompletionItemKind.Field },
    ],
};

export function registerCashScriptIntelliSense(monaco: typeof import('monaco-editor')) {
    const languageId = 'cashscript';

    // 1. Completion Provider
    monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.'],
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const word = model.getWordUntilPosition(position);
            const range: monaco.IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            // Handle dot completions
            if (textUntilPosition.endsWith('.')) {
                const re = /(\w+)(\[.+\])?\.$/;
                const match = textUntilPosition.match(re);
                if (match) {
                    let keyword = match[1];
                    if (match[2]) keyword += '_indexed';

                    const completions = DOT_COMPLETIONS[keyword] || [];
                    return {
                        suggestions: completions.map(c => ({
                            ...c,
                            range,
                            insertText: c.label
                        }))
                    };
                }
                return { suggestions: [] };
            }

            // Default completions
            const suggestions: monaco.languages.CompletionItem[] = [];

            // Global Functions
            Object.entries(GLOBAL_FUNCTIONS).forEach(([name, data]) => {
                suggestions.push({
                    label: name,
                    kind: monaco.languages.CompletionItemKind.Function,
                    detail: data.code,
                    documentation: data.codeDesc,
                    insertText: name,
                    range
                });
            });

            // Instantiations
            Object.entries(INSTANTIATIONS).forEach(([name, data]) => {
                suggestions.push({
                    label: name,
                    kind: monaco.languages.CompletionItemKind.Class,
                    detail: data.code,
                    documentation: data.codeDesc,
                    insertText: name,
                    range
                });
            });

            // Types & Constants
            const types = ['int', 'bool', 'string', 'byte', 'bytes', 'pubkey', 'sig', 'datasig', 'true', 'false', 'constant'];
            types.forEach(type => {
                suggestions.push({
                    label: type,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: type,
                    range
                });
            });

            const globalConstants = ['sats', 'satoshis', 'finney', 'bit', 'bitcoin', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'tx', 'this'];
            globalConstants.forEach(c => {
                suggestions.push({
                    label: c,
                    kind: monaco.languages.CompletionItemKind.Constant,
                    insertText: c,
                    range
                });
            });

            // Variable completions from current text
            const fullText = model.getValue();
            const varRe = /(int|bool|string|pubkey|sig|datasig|byte|bytes|bytes[0-9]+)\s+(\w+)/g;
            const seenVars = new Set<string>();

            let match;
            while ((match = varRe.exec(fullText)) !== null) {
                const varName = match[2];
                if (!seenVars.has(varName)) {
                    suggestions.push({
                        label: varName,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        detail: match[1],
                        insertText: varName,
                        range
                    });
                    seenVars.add(varName);
                }
            }

            return { suggestions };
        }
    });

    // 2. Hover Provider
    monaco.languages.registerHoverProvider(languageId, {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const data = LANGUAGE[word.word] || TYPECASTS[word.word as keyof typeof TYPECASTS];
            if (data) {
                return {
                    contents: [
                        { value: '```cashscript\n' + data.code + '\n```' },
                        { value: data.codeDesc }
                    ]
                };
            }

            // Member hovers
            const memberHovers: Record<string, { code: string; desc: string }> = {
                split: { code: '[s1, s2] sequence.split(int i)', desc: 'Splits the sequence at the specified index and returns a tuple with the two resulting sequences.' },
                reverse: { code: 'any sequence.reverse()', desc: 'Reverses the sequence.' },
                slice: { code: 'any sequence.slice(int start, int end)', desc: 'Returns a new sequence containing the elements from start to end.' },
                length: { code: 'int sequence.length', desc: 'Returns the length of the sequence.' }
            };

            if (memberHovers[word.word]) {
                return {
                    contents: [
                        { value: '```cashscript\n' + memberHovers[word.word].code + '\n```' },
                        { value: memberHovers[word.word].desc }
                    ]
                };
            }

            // Check for variables to show their type
            const fullText = model.getValue();
            const varMatch = new RegExp(`\\b(int|bool|string|pubkey|sig|datasig|byte|bytes\\d*)\\s+${word.word}\\b`).exec(fullText);
            if (varMatch) {
                return {
                    contents: [
                        { value: '```cashscript\n' + `${varMatch[1]} ${word.word}` + '\n```' }
                    ]
                };
            }

            return null;
        }
    });

    // 3. Signature Help Provider
    monaco.languages.registerSignatureHelpProvider(languageId, {
        signatureHelpTriggerCharacters: ['(', ','],
        provideSignatureHelp: (model, position) => {
            const lineContent = model.getLineContent(position.lineNumber).substring(0, position.column);
            const lastOpenParen = lineContent.lastIndexOf('(');
            if (lastOpenParen === -1) return null;

            const beforeParen = lineContent.substring(0, lastOpenParen).trim();
            const words = beforeParen.split(/\s+/);
            const funcName = words[words.length - 1];

            const data = LANGUAGE[funcName] || TYPECASTS[funcName as keyof typeof TYPECASTS];
            if (!data) return null;

            return {
                value: {
                    signatures: [{
                        label: data.code,
                        documentation: data.codeDesc,
                        parameters: [] // We could parse parameters here for better UX
                    }],
                    activeSignature: 0,
                    activeParameter: 0
                },
                dispose: () => { }
            };
        }
    });
}
