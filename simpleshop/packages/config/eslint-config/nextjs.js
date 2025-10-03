module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};

