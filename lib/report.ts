import type { z } from "zod";
import type { submissionSchema } from "./validation.ts";
import { summarize, coverageScore } from "./nutrition.ts";
export function reportPayload(data: z.infer<typeof submissionSchema>) {
  const { analysis, catalogVersion } = data;
  const total = summarize(analysis.items, catalogVersion);
  if ("reportVersion" in data)
    return {
      reportVersion: 2 as const,
      analysis,
      catalogVersion,
      meal: {
        eatenAt: data.meal.eatenAt,
        mealType: data.meal.mealType,
        targets: data.meal.targets,
      },
      nutrients: total.nutrients,
      incomplete: total.unmatched > 0,
    };
  return {
    analysis,
    settings: data.settings,
    catalogVersion,
    totals: total,
    score: coverageScore(total.nutrients, data.settings.targets),
  };
}
