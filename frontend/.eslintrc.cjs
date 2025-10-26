module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.app.json',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'testing-library'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
    'prettier'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-floating-promises': 'error'
  }
};
