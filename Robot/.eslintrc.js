module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  extends: [
    '../eslint-common.js'
  ],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
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
