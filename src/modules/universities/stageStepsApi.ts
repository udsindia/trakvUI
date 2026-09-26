import { httpClient } from "@/shared/services/http/client";

/** Stage name → its reference steps, in order. */
export type StageSteps = Record<string, string[]>;

export const stageStepsApi = {
  forUniversity: async (universityId: string): Promise<StageSteps> => {
    const response = await httpClient.get<StageSteps>(
      `/universities/${universityId}/stage-steps`,
    );
    return response.data ?? {};
  },

  /**
   * Replaces the steps under one stage. Replace rather than patch: position is uniquely
   * indexed, so reordering row by row would collide with itself.
   */
  replaceForStage: async (
    universityId: string,
    stageName: string,
    steps: string[],
  ): Promise<string[]> => {
    const response = await httpClient.put<string[]>(
      `/universities/${universityId}/stage-steps`,
      steps,
      { params: { stageName } },
    );
    return response.data ?? [];
  },
};
