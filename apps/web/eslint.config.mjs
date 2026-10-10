import nextVitals from "eslint-config-next/core-web-vitals";
import react from "@trustexam/config/eslint/react";

// Next's rules first so the shared TypeScript parser and rules win for every file.
const config = [...nextVitals, ...react, { ignores: ["next-env.d.ts"] }];

export default config;
