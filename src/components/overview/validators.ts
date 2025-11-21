import { analysisResultSchema } from './schemas';

export const validators = {
  analysisResult: {
    validate: (data: unknown) => {
      try {
        const result = analysisResultSchema.safeParse(data);
        if (!result.success) {
          return {
            success: false as const,
            error: {
              violations: result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
              })),
            },
          };
        }
        return { success: true as const, data: result.data };
      } catch (error) {
        return {
          success: false as const,
          error: {
            violations: [
              {
                field: 'unknown',
                message: error instanceof Error ? error.message : 'Unknown validation error',
              },
            ],
          },
        };
      }
    },
  },
};
