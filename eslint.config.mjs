import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["public/r/**", "preview/styles/build.css", "preview/registry-preview.tsx"] },
  ...tseslint.configs.recommended,
);
