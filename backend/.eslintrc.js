module.exports = {
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Genel JavaScript kuralları
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'no-console': 'off', // Backend'de console.log kullanılabilir
    'no-debugger': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    indent: ['warn', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-before-blocks': ['error', 'always'],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'spaced-comment': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'no-trailing-spaces': 'error',

    // Error handling kuralları
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-undef': 'error',
    'no-unused-expressions': 'error',
    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-empty': 'error',
    'no-extra-semi': 'error',
    'no-irregular-whitespace': 'error',
    'valid-typeof': 'error',

    // Performance kuralları - Backend için uyarlanmış
    'no-await-in-loop': 'warn', // Backend'de loop'lar için warning
    'no-async-promise-executor': 'error',
    'no-inner-declarations': 'error',
    'no-loop-func': 'error',
  },

  // ✅ PERFORMANCE: Comprehensive ignore patterns
  ignorePatterns: [
    // ✅ Build/dist directories
    'dist/',
    'build/',
    'node_modules/',

    // ✅ Cache directories
    '**/.cache/**',
    '**/tmp/**',
    '**/.eslintcache',

    // ✅ Log files
    '**/*.log',
    '**/logs/**',

    // ✅ Test coverage
    'coverage/**',
    '**/*.coverage',

    // ✅ IDE files
    '**/.vscode/**',
    '**/.cursor/**',

    // ✅ Generated files
    '**/*.min.js',
    '**/*.map',
    '**/*.bundle.js',

    // ✅ Documentation
    '**/*.md',
    'docs/**',

    // 🚀 Environment files are now VISIBLE (development needs access)
    // '**/.env*', // Disabled - Cursor AI needs access to .env files

    // ✅ Database exports
    '**/*.sql',
    '**/*.dump',
    '**/*.db',

    // ✅ Scripts
    'scripts/**',
  ],
};
