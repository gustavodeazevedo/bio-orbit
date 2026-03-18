import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const resolveVersion = () => {
    const envSha =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        process.env.RENDER_GIT_COMMIT ||
        "";

    if (envSha) {
        return envSha.substring(0, 7);
    }

    try {
        const sha = execSync("git rev-parse --short HEAD", {
            stdio: ["ignore", "pipe", "ignore"],
        })
            .toString()
            .trim();
        return sha || `dev-${Date.now()}`;
    } catch {
        return `dev-${Date.now()}`;
    }
};

const versionPayload = {
    version: resolveVersion(),
    buildTime: new Date().toISOString(),
};

const outputDir = join(process.cwd(), "public");
const outputPath = join(outputDir, "version.json");

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(versionPayload, null, 2));

console.log("Generated version.json", versionPayload);
