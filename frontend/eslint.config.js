const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsxA11y = require('eslint-plugin-jsx-a11y');

module.exports = [
  js.configs.recommended,
  {
    // Ignore patterns - build klasörü ve diğer dosyaları hariç tut
    ignores: [
      'build/**',
      'dist/**',
      'node_modules/**',
      '**/*.min.js',
      '**/*.map',
      'coverage/**',
      '.env*',
      'public/**',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React kuralları
      'react/jsx-uses-react': 'off', // React 17+ için gerekli değil
      'react/react-in-jsx-scope': 'off', // React 17+ için gerekli değil
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-key': 'error',
      'react/no-unescaped-entities': 'off', // Türkçe karakterler için kapatıldı
      'react/prop-types': 'off', // TypeScript kullanmıyoruz
      'react/display-name': 'off',
      'react/jsx-pascal-case': 'warn', // warn olarak değiştirdik
      'react/jsx-closing-bracket-location': 'warn',
      'react/jsx-closing-tag-location': 'off', // Indentation uyumsuzlukları için kapatıldı
      'react/jsx-curly-spacing': ['error', 'never'],
      'react/jsx-equals-spacing': ['error', 'never'],
      'react/jsx-first-prop-new-line': ['warn', 'multiline-multiprop'],
      'react/jsx-indent': ['warn', 2],
      'react/jsx-indent-props': ['warn', 2],
      'react/jsx-max-props-per-line': ['warn', { maximum: 1, when: 'multiline' }],
      'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-literals': 'off',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-wrap-multilines': 'warn',
      'react/no-array-index-key': 'off', // Çok fazla warning veriyor, kapatıldı
      'react/no-children-prop': 'error',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unknown-property': 'error',
      'react/prefer-es6-class': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
      'react/sort-comp': 'error',

      // React Hooks kuralları
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility kuralları
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',

      // Genel JavaScript kuralları
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_|^React$',
        ignoreRestSiblings: true,
      }],
      'no-console': 'off', // Development'ta console.log kullanılabilir
      'no-debugger': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'indent': ['warn', 2, { SwitchCase: 1 }], // warn olarak değiştirdik
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'computed-property-spacing': ['error', 'never'],
      'func-call-spacing': ['error', 'never'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': ['error', 'always'],
      'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'space-unary-ops': ['error', { words: true, nonwords: false }],
      'spaced-comment': ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],

      // Error handling kuralları
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Import/Export kuralları
      'no-undef': 'error',
      'no-unused-expressions': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-irregular-whitespace': 'error',
      'valid-typeof': 'error',

      // Async/await kuralları
      'require-await': 'off', // Async function'larda await zorunlu değil
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',

      // Switch case kuralları
      'no-case-declarations': 'error',
      'default-case': 'warn',

      // Performance kuralları
      'no-inner-declarations': 'error',
      'no-loop-func': 'error',
      'no-new-wrappers': 'error',
      'no-redeclare': 'error',
      'no-shadow': 'off', // Çok fazla warning veriyor, kapatıldı

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
      'radix': 'off', // parseInt için radix zorunlu değil
      'wrap-iife': ['error', 'any'],
      'yoda': 'error',

      // Function hoisting kuralları - daha esnek
      'no-use-before-define': ['warn', {
        functions: false, // Function hoisting'e izin ver
        classes: true,
        variables: false, // Variable hoisting'e izin ver
      }],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'react/display-name': 'off',
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    files: ['src/pages/**/*.{js,jsx}'],
    rules: {
      'react/jsx-max-props-per-line': 'off', // Sayfa component'larında daha esnek
      'jsx-a11y/no-autofocus': 'off', // Form sayfalarında autofocus kullanılabilir
    },
  },
  {
    files: ['src/components/**/*.{js,jsx}'],
    rules: {
      'react/prop-types': 'warn', // Component'larda prop-types önerilir
      'react/display-name': 'warn',
    },
  },
];
