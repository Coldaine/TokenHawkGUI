import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  {
    // Generated bundles: the Swarm Lab mount is built from sidecars/swarm-lab/src.
    ignores: ["public/sidecars/", "sidecars/swarm-lab/dist/"],
  },
  {
    extends: [...next],
  },
]);
