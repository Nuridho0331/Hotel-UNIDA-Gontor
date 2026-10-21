
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),

  // Pengecualian sementara untuk file yang
  // masih perlu refactor React Hooks.
  {
    files: [
      "src/app/admin/amenities/page.tsx",
      "src/app/admin/room-types/page.tsx",
      "src/app/admin/rooms/page.tsx",
      "src/app/my-reservation/[id]/page.tsx",
      "src/app/rooms/[id]/page.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
