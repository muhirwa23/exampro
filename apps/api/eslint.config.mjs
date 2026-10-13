import base from "@trustexam/config/eslint/base";

export default [
  ...base,
  // Nest modules are empty classes carrying a @Module decorator.
  { rules: { "@typescript-eslint/no-extraneous-class": ["error", { allowWithDecorator: true }] } },
];
