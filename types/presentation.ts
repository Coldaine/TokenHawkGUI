export interface ActInfo {
  id: number;
  title: string;
  subtitle: string;
  tRange: [number, number];
  concept: string;
  mechanism: string;
  receipt: string;
  narrative: string;
}

export type SkillStage = 'EVALUATE' | 'RCA' | 'SDG' | 'MINE' | 'RETRAIN' | 'GATE';

export interface DeftState {
  iteration: number;
  maxIterations: number;
  activeStage: SkillStage;
  locked: boolean;
  kpis: {
    far: number;
    farTarget: number;
    recall: number;
    recallTarget: number;
    f1Score: number;
    loss: number;
  };
  evidenceVerified: boolean;
  checkpointHash: string;
  lastCommitExitCode: number;
}

export interface GhostLogEntry {
  id: string;
  timestamp: string;
  stage: SkillStage;
  verdict: 'REJECTED' | 'VERIFIED';
  pattern: string;
  sourceFile: string;
  receiptLine: number;
  reason: string;
}

export interface ProgressiveCard {
  id: string;
  title: string;
  fileName: string;
  tokenCount: number;
  activeAct: number;
  summary: string;
  loaded: boolean;
}

export interface SkillSpectrumItem {
  id: string;
  name: string;
  type: 'prose' | 'checklist' | 'tool-assisted' | 'deft-runtime';
  complexityWeight: number; // 0 - 100
  isTarget: boolean;
  summary: string;
}
