import nextra from "nextra";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextra = nextra({
  contentDirBasePath: "/",
  search: { codeblocks: false },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  images: { unoptimized: true },
  trailingSlash: true,
  basePath:
    process.env.BASE_PATH ||
    (process.env.NODE_ENV === "production" ? "/stratum-rollbar-js" : ""),
};

export default withNextra(nextConfig);
