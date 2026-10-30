export type WorkflowType =
  | 'PRE_MISSION_SITE_SELECTION'
  | 'POST_MISSION_VERIFICATION'
  | 'INDEPENDENT_AUDIT'
  | 'REAL_TIME_ONBOARD'
  | 'TRAINING_DATA_GENERATION';

export interface WorkflowRecommendation {
  workflow: WorkflowType;
  title: string;
  description: string;
  primaryMethod: 'CV' | 'YOLO' | 'BOTH';
  reasoning: string;
  caveats: string[];
}

export function getWorkflowRecommendation(
  workflow: WorkflowType
): WorkflowRecommendation {
  switch (workflow) {
    case 'PRE_MISSION_SITE_SELECTION':
      return {
        workflow,
        title: 'Pre-Mission Site Selection',
        description: 'Determining whether a landing site is safe for a future mission',
        primaryMethod: 'CV',
        reasoning:
          'Classical CV is conservative (detects more hazards) and ' +
          'deterministic (hash-verified). For safety-critical site ' +
          'selection, use the conservative method.',
        caveats: [
          'CV may over-detect small features that are not actual hazards',
          'YOLO result is shown for reference only',
          'Neither method is ISRO-certified',
        ],
      };

    case 'POST_MISSION_VERIFICATION':
      return {
        workflow,
        title: 'Post-Mission Verification',
        description:
          'Reconstructing descent telemetry and validating touchdown conditions against orbital data',
        primaryMethod: 'BOTH',
        reasoning:
          'Cross-check both methods to verify agreement on major terrain morphology ' +
          'and ensure both classical CV and YOLO detect identical major crater structures.',
        caveats: [
          'Post-mission verification relies on orbital illumination conditions matching descent imagery',
          'Discrepancies between CV and YOLO should be reviewed with calibrated PDS4 data products',
          'Neither method is certified for real-time mission telemetry',
        ],
      };

    case 'INDEPENDENT_AUDIT':
      return {
        workflow,
        title: 'Independent Audit',
        description:
          'Third-party mission safety verification and cryptographic audit trail inspection',
        primaryMethod: 'BOTH',
        reasoning:
          'Independent audit requires both the hash-verified deterministic CV result ' +
          'for cryptographic integrity and an independent AI benchmark check for defense-in-depth.',
        caveats: [
          'YOLO sidecar results are non-deterministic and excluded from cryptographic hash chains',
          'Audit reports must clearly distinguish verified CV ledger from experimental AI inference',
          'Audit conclusions are advisory and not ISRO flight certifications',
        ],
      };

    case 'REAL_TIME_ONBOARD':
      return {
        workflow,
        title: 'Real-Time Onboard Simulation',
        description:
          'Simulated onboard lander compute environment with bounded execution latency',
        primaryMethod: 'CV',
        reasoning:
          'CPU-only, strictly deterministic execution without neural network runtime ' +
          'dependencies, floating-point ambiguity, or network access on the lander.',
        caveats: [
          'LunarSafe is ground-segment software and does NOT run on actual flight hardware',
          'Real-time descent guidance is performed by dedicated onboard LHDAC avionics',
          'Execution latency on flight rad-hard processors will differ from workstation benchmarks',
        ],
      };

    case 'TRAINING_DATA_GENERATION':
      return {
        workflow,
        title: 'Training Data Generation',
        description:
          'Generating high-confidence ground-truth crater and boulder annotations for machine learning models',
        primaryMethod: 'CV',
        reasoning:
          'Deterministic classical CV labels provide reproducible, verifiable ground ' +
          'truth to train future YOLO and deep learning crater detection models.',
        caveats: [
          'Automated CV labels should be verified against LOLA/LROC benchmark crops before model training',
          'Morphological threshold tuning directly impacts hazard boundary contours',
          'Class labels are limited to classical geometric and photometric criteria',
        ],
      };
  }
}
