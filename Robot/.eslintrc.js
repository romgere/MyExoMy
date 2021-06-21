module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  parser: 'babel-eslint',
  rules: {
    // ES6
    'array-bracket-spacing': ['error', 'never'],
    'arrow-parens': ['error', 'always'],
    'brace-style': ['error', '1tbs', { 'allowSingleLine': false }],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': ['error', {
      'before': false,
      'after': true
    }],
    'comma-style': ['error', 'last'],
    'curly': 'error',
    'dot-location': ['error', 'property'],
    'dot-notation': 'error',
    'eol-last': ['error', 'always'],
    'func-call-spacing': 'error',
    'generator-star-spacing': ['error', { before: false, after: true }],
    'indent': ['error', 2],
    'key-spacing': ['error', {
      'beforeColon': false,
      'afterColon': true
    }],
    'keyword-spacing': ['error', {
      'overrides': {
        'catch': {
          'after': false
        }
      }
    }],
    'max-statements-per-line': ['error', { 'max': 1 }],
    'new-cap': ['error'],
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'error',
    'no-duplicate-imports': 'error',
    'no-empty': ['error'],
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'no-return-await': 'error',
    'no-trailing-spaces': 'error',
    'no-useless-concat': 'error',
    'no-useless-rename': 'error',
    'no-var': 'error',
    'object-shorthand': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'one-var': ['error', {
      'uninitialized': 'always',
      'initialized': 'never'
    }],
    'operator-linebreak': ['error', 'before'],
    'prefer-destructuring': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'semi-spacing': ['error', {
      'before': false,
      'after': true
    }],
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': ['error', {
      'words': false,
      'nonwords': false
    }],
    'spaced-comment': ['error', 'always']
  },
  overrides: [
    // testem config file
    {
      files: ['scripts/**.js'],
      rules: {
        'no-await-in-loop': 'off'
      }
    }
  ]
}
