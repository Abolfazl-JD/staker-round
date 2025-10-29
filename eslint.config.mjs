import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default tseslint.config(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    ignores: ["node_modules", "dist"],
    rules: {
      eqeqeq: "error",
      // TODO: Figure these out later
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "@typescript-eslint/strict-boolean-expressions": ["error"],
      camelcase: ["error", { allow: [] }],
      "object-shorthand": "error",
      "prefer-const": "error",
      "sort-imports": [
        "error",
        { ignoreDeclarationSort: true, allowSeparatedGroups: true },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      curly: 2,
    },
  },
);

