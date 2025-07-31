const js = require('@eslint/js');

module.exports = [
  // Ignore patterns (ESLint 9.x format)
  {
    ignores: [
      'node_modules/**',
      'logs/**',
      '*.log',
      'coverage/**',
      '.eslintcache',
      '*.tmp',
      '*.temp',
      'temp-*',
      '*.generated.js',
      '*.db',
      '*.sqlite',
      'scripts/output/**',
      'scripts/temp/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // Güvenlik kuralları
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Kod kalitesi kuralları
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Backend'de console.log normal
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],

      // Node.js specific kuralları
      'no-undef': 'error',
      'no-unused-expressions': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-irregular-whitespace': 'error',
      'valid-typeof': 'error',

      // Async/await kuralları
      'require-await': 'warn',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',

      // Error handling kuralları
      'handle-callback-err': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Switch case kuralları
      'no-case-declarations': 'error',
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      'no-console': 'off', // Script dosyalarında console.log kullanılabilir
      'no-await-in-loop': 'off', // Script'lerde sequential processing normal
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', 'jest.setup.js'],
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-await-in-loop': 'off', // Test setup'da sequential operations normal
    },
  },
];
