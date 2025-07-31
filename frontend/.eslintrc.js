module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier', // Prettier formatting rules disable
  ],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // ===== PRETTIER FORMATTING RULES (DISABLED) =====
    indent: 'off', // Prettier handles indentation
    quotes: 'off', // Prettier handles quotes
    semi: 'off', // Prettier handles semicolons
    'comma-dangle': 'off', // Prettier handles trailing commas
    'max-len': 'off', // Prettier handles line length

    // React kuralları - React 17+ uyumlu
    'react/jsx-uses-react': 'off', // React 17+ için gerekli değil
    'react/react-in-jsx-scope': 'off', // React 17+ için gerekli değil
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-key': 'error',
    'react/prop-types': 'off', // TypeScript kullanmıyoruz
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off', // Türkçe karakterler için
    'react/jsx-pascal-case': 'warn',
    'react/jsx-closing-bracket-location': 'off', // Prettier handles bracket location
    'react/jsx-curly-spacing': ['error', 'never'],
    'react/jsx-equals-spacing': ['error', 'never'],
    'react/jsx-indent': 'off', // Prettier handles JSX indentation
    'react/jsx-indent-props': 'off', // Prettier handles JSX props indentation
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
    'react/jsx-no-comment-textnodes': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/no-array-index-key': 'off', // Performans için kapatıldı
    'react/no-children-prop': 'error',
    'react/no-danger': 'warn',
    'react/no-deprecated': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': 'error',
    'react/no-unknown-property': 'error',
    'react/self-closing-comp': 'error',

    // React Hooks kuralları
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Accessibility kuralları - Proje uyumlu
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'warn',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'off', // Form UX için gerekli
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',

    // Genel JavaScript kuralları - MMM Proje standartları
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_|^React$',
        ignoreRestSiblings: true,
      },
    ],
    'no-console': 'off', // Development'ta kullanılabilir
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

    // Performance kuralları - MMM Proje standartları
    'no-await-in-loop': 'warn',
    'no-async-promise-executor': 'error',
    'no-inner-declarations': 'error',
    'no-loop-func': 'error',
    'no-redeclare': 'error',

    // Best practices
    'array-callback-return': 'error',
    'consistent-return': 'warn',
    'dot-notation': 'error',
    'no-alert': 'off', // Development'ta confirm kullanılabilir
    'no-caller': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-floating-decimal': 'error',
    'no-implied-eval': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-object': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-return-assign': 'off', // Arrow function'larda kullanılabilir
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-void': 'error',
    'no-with': 'error',
    radix: 'off', // parseInt için radix zorunlu değil
    'wrap-iife': ['error', 'any'],
    yoda: 'error',

    // Switch case kuralları
    'no-case-declarations': 'error',
    'default-case': 'warn',

    // Function hoisting - Daha esnek
    'no-use-before-define': [
      'warn',
      {
        functions: false, // Function hoisting'e izin ver
        classes: true,
        variables: false, // Variable hoisting'e izin ver
      },
    ],
  },
  ignorePatterns: [
    // ✅ Build/dist directories
    'build/',
    'dist/',
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

    // ✅ Static files
    'public/',
    'serviceWorker.js',
    'setupTests.js',
  ],
};
