module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["jest", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error", // Enforce Prettier formatting
    "no-console": "off", // Allow console.log (useful in backend)
    "import/extensions": "off",
  },
  overrides: [
    {
      files: ["tests/**/*.js"],
      env: {
        jest: true,
      },
      rules: {
        "no-unused-expressions": "off", // allows expect().toBeTruthy()
      },
    },
  ],
};
