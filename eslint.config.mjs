import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["public/r/**", "styles/build.css"] },
  ...tseslint.configs.recommended,
);
