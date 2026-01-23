export const cashscriptLanguageDefinition = {
    defaultToken: '',
    tokenPostfix: '.cash',

    keywords: [
        'if', 'else', 'require', 'pragma', 'new', 'this', 'constant',
        'contract', 'function'
    ],

    typeKeywords: [
        'int', 'bool', 'string', 'pubkey', 'sig', 'datasig', 'byte', 'bytes'
    ],

    operators: [
        '&&', '||', '!', '==', '!=', '<', '>', '<=', '>=',
        '+', '-', '*', '/', '%', '++', '--', '&', '|', '^'
    ],

    // Common BCH units/time
    constants: [
        'true', 'false',
        'seconds', 'minutes', 'hours', 'days', 'weeks',
        'satoshis', 'sats', 'finney', 'bits', 'bitcoin'
    ],

    // Global variables/functions
    builtins: [
        'tx', 'abs', 'min', 'max', 'within',
        'ripemd160', 'sha1', 'sha256', 'hash160', 'hash256',
        'checkSig', 'checkMultiSig', 'checkDataSig', 'date',
        'LockingBytecodeP2PKH', 'LockingBytecodeP2SH20', 'LockingBytecodeP2SH32', 'LockingBytecodeNullData',
        'length', 'split', 'reverse', 'slice', 'log'
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    tokenizer: {
        root: [
            // Identifiers and keywords
            [/[a-zA-Z_]\w*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@typeKeywords': 'type',
                    '@constants': 'constant',
                    '@builtins': 'predefined',
                    '@default': 'identifier'
                }
            }],

            // Comments
            { include: '@whitespace' },

            // Numbers
            [/\b0[xX][a-fA-F0-9]+\b/, 'number.hex'],
            [/\d+/, 'number'],

            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
            [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],

            // Symbols and Operators
            [/[{}()\[\]]/, '@brackets'],
            [/@symbols/, {
                cases: {
                    '@operators': 'operator',
                    '@default': ''
                }
            }],

            // Punctuation
            [/[;,.]/, 'delimiter'],
        ],

        whitespace: [
            [/[ \t\r\n]+/, 'white'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
        ],

        comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],
            ["\\*/", 'comment', '@pop'],
            [/[\/*]/, 'comment']
        ],

        string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
        ],

        string_single: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
        ],
    },
};
