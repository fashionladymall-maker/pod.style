import {
  assignUserToExperiment,
  generateExperimentReportPlaceholder,
  getFeatureFlagValue,
  resetExperimentsCacheForTests,
  type ExperimentDefinition,
} from "@/lib/experiments";
import { resetRemoteConfigForTests } from "@/lib/remote-config";
import { resetAnalyticsForTests } from "@/lib/analytics";

describe("experiments", () => {
  beforeEach(() => {
    resetExperimentsCacheForTests();
    resetRemoteConfigForTests();
    resetAnalyticsForTests();
    delete process.env.EXPERIMENTS_CONFIG;
    delete process.env.FEATURE_FLAGS;
    delete process.env.FEATURE_FLAG_SAMPLE_FLAG;
  });

  it("assigns the same user consistently to a variant", () => {
    const experiment: ExperimentDefinition = {
      key: "feed-ab-test",
      defaultVariant: "control",
      variants: [
        { id: "control", weight: 1 },
        { id: "variant", weight: 1 },
      ],
      description: "Test feed adjustments",
      overrides: {},
    };

    const firstAssignment = assignUserToExperiment(experiment, "user-123");
    const secondAssignment = assignUserToExperiment(experiment, "user-123");

    expect(firstAssignment.variant.id).toBe(secondAssignment.variant.id);
    expect(firstAssignment.reason).toBe("weighted");
  });

  it("respects explicit overrides when assigning variants", () => {
    const experiment: ExperimentDefinition = {
      key: "feed-ab-test",
      defaultVariant: "control",
      variants: [
        { id: "control", weight: 1 },
        { id: "variant", weight: 1 },
      ],
      overrides: {
        "vip-user": "variant",
      },
    };

    const assignment = assignUserToExperiment(experiment, "vip-user");
    expect(assignment.variant.id).toBe("variant");
    expect(assignment.reason).toBe("override");
  });

  it("reads feature flags from environment fallback values", async () => {
    process.env.FEATURE_FLAGS = JSON.stringify({
      betaMode: true,
    });

    const evaluation = await getFeatureFlagValue("betaMode", false, { forceRefresh: true });
    expect(evaluation.value).toBe(true);
    expect(evaluation.source).toBe("env");
  });

  it("falls back to direct feature flag environment variables", async () => {
    process.env.FEATURE_FLAG_SAMPLE_FLAG = "true";

    const evaluation = await getFeatureFlagValue("sample-flag", false, { forceRefresh: true });
    expect(evaluation.value).toBe(true);
    expect(evaluation.source).toBe("env");
  });

  it("produces a placeholder experiment report using env configuration", async () => {
    process.env.EXPERIMENTS_CONFIG = JSON.stringify({
      experiments: [
        {
          key: "feed-ab-test",
          defaultVariant: "control",
          variants: [
            { id: "control", weight: 1 },
            { id: "variant", weight: 1 },
          ],
        },
      ],
    });

    const report = await generateExperimentReportPlaceholder();
    expect(report.experiments).toHaveLength(1);
    expect(report.experiments[0].key).toBe("feed-ab-test");
    expect(report.notes.length).toBeGreaterThan(0);
  });
});

