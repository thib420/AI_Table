import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow unused variables (common during development)
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Allow any types (we can fix these gradually)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Allow missing dependencies in React hooks (we can fix these gradually)
      "react-hooks/exhaustive-deps": "warn",
      
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
