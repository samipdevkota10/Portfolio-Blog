import fs from "node:fs/promises";
import path from "node:path";

import { retrieveRelevantSources } from "@/lib/ai/retrieval";

type EvalCase = {
  question: string;
  expectedSource: string;
};

async function main() {
  const raw = await fs.readFile(path.join(process.cwd(), "evals", "portfolio-chat.json"), "utf8");
  const dataset = JSON.parse(raw) as EvalCase[];

  const results = await Promise.all(
    dataset.map(async (item) => {
      const sources = await retrieveRelevantSources(item.question, 3);
      const passed = sources.some((source) => source.slug === item.expectedSource);
      return {
        ...item,
        passed,
        matches: sources.map((source) => source.slug),
      };
    }),
  );

  const passed = results.filter((result) => result.passed).length;
  console.log(JSON.stringify({ total: results.length, passed, results }, null, 2));

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
