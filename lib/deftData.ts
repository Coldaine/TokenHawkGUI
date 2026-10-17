import { ActInfo, GhostLogEntry, ProgressiveCard, SkillSpectrumItem } from '@/types/presentation';

export const PRESENTATION_ACTS: ActInfo[] = [
  {
    id: 1,
    title: 'Living Topology & Division of Labor',
    subtitle: 'Disk-backed State & Deterministic Boundary',
    tRange: [0.0, 0.2],
    concept: 'Separation of Powers',
    mechanism: 'driver.sh dispatches Python wrapper scripts. The LLM translates and reasons, but never touches state or writes code directly into the execution environment.',
    receipt: 'tao-run-deft-aoi/driver.sh:18 -> scripts/init_stage.py:42',
    narrative: 'In production autonomous systems, giving an LLM direct shell or state access causes irreversible agent drift. NVIDIA DEFT strictly bounds the model as an ephemeral routing engine, flanked by immutable Python guards.',
  },
  {
    id: 2,
    title: 'The Immutable State Crystal',
    subtitle: 'Single Source of Truth (deft_state.json)',
    tRange: [0.2, 0.4],
    concept: 'Disk-Backed Determinism',
    mechanism: 'deft_state.json stores iteration count, active stage, and verified KPIs. Model write attempts are deflected by OS locks; only validated script commits can advance the state pointer.',
    receipt: 'scripts/commit_stage.py:64 [Atomic flock & SHA-256 state seal]',
    narrative: 'If the agent crashes, the process restarts instantaneously from the exact disk-backed checkpoint. No lost context, no hallucinated memory, and zero state desynchronization.',
  },
  {
    id: 3,
    title: 'Progressive Disclosure & Card Pack',
    subtitle: 'Just-In-Time Context Management',
    tRange: [0.4, 0.6],
    concept: 'Token-Efficient Cognitive Load',
    mechanism: 'Instead of dumping 50,000 tokens of pipeline documentation into prompt memory, concise modular cards are dynamically compiled and injected only when entering specific stages.',
    receipt: 'references/pipeline-and-state.md -> references/sdg.md:12',
    narrative: 'Progressive disclosure maintains razor-sharp reasoning by loading only the active stage specification. Context usage drops by 78%, completely eliminating attention saturation.',
  },
  {
    id: 4,
    title: 'The KPI Math Gate & Hallucination Shatter',
    subtitle: 'Evidence Verification & Metric Iris',
    tRange: [0.6, 0.8],
    concept: 'Zero-Tolerance Commit Gate',
    mechanism: 'commit_stage.py rigorously verifies physical disk artifacts (CSV logs, checkpoints, confusion matrices) and parses metric floats. Fabricated logs and TODOs are violently rejected.',
    receipt: 'scripts/commit_stage.py:112 [def verify_evidence(stage, artifacts)]',
    narrative: 'When the model hallucinates "Evaluation succeeded with 99% accuracy", the commit gate parses the real CSV file, catches the missing evidence tensor, shatters the assertion, and forces a rollback.',
  },
  {
    id: 5,
    title: 'Autonomous Sub-Skill Constellation',
    subtitle: 'Closed-Loop Multi-Agent Convergence',
    tRange: [0.8, 1.0],
    concept: 'Continuous Metric Optimization',
    mechanism: 'Evaluate -> Root Cause Analysis (RCA) -> Synthetic Data Generation (SDG) -> Hard Negative Mining -> Retrain cycles autonomously until target KPIs (FAR <= 0.01, Recall >= 0.98) are reached.',
    receipt: 'scripts/finalize_deft.py:90 [All KPI gates satisfied: Converged at iteration 4]',
    narrative: 'With all five sub-skills operating under strict script governance, the pipeline loops unattended overnight across clusters—scaling domain intelligence without human intervention.',
  },
];

export const PROGRESSIVE_CARDS: ProgressiveCard[] = [
  {
    id: 'card-core',
    title: 'State & Pipeline Architecture',
    fileName: 'references/pipeline-and-state.md',
    tokenCount: 1420,
    activeAct: 1,
    summary: 'Disk state schema, stage transition DAG, and lockfile specifications.',
    loaded: true,
  },
  {
    id: 'card-eval',
    title: 'Evaluation & Metric Extraction',
    fileName: 'references/evaluate.md',
    tokenCount: 880,
    activeAct: 2,
    summary: 'Calculates False Alarm Rate (FAR), Recall, and confusion tensors.',
    loaded: true,
  },
  {
    id: 'card-rca',
    title: 'Root Cause Defect Analysis',
    fileName: 'references/rca.md',
    tokenCount: 1150,
    activeAct: 3,
    summary: 'Clusters false positives into defect taxonomy classes for targeted SDG.',
    loaded: false,
  },
  {
    id: 'card-sdg',
    title: 'Synthetic Data Generation (SDG)',
    fileName: 'references/sdg.md',
    tokenCount: 1640,
    activeAct: 3,
    summary: 'Prompts Omniverse / synthetic generators for edge-case defect imagery.',
    loaded: false,
  },
  {
    id: 'card-mine',
    title: 'Hard Negative Mining',
    fileName: 'references/mine.md',
    tokenCount: 920,
    activeAct: 4,
    summary: 'Filters generated negatives against baseline embedding distances.',
    loaded: false,
  },
  {
    id: 'card-retrain',
    title: 'Active Retrain & Fine-Tuning',
    fileName: 'references/retrain.md',
    tokenCount: 1310,
    activeAct: 5,
    summary: 'Launches TAO training container with mixed real + synthetic batch weights.',
    loaded: false,
  },
];

export const INITIAL_GHOST_LOGS: GhostLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '02:14:18',
    stage: 'EVALUATE',
    verdict: 'REJECTED',
    pattern: 'Hallucinated Recall 0.999 without disk CSV',
    sourceFile: 'scripts/commit_stage.py',
    receiptLine: 88,
    reason: 'Model outputted simulated metric string. commit_stage.py looked for eval_output.csv on disk: ENOENT.',
  },
  {
    id: 'log-2',
    timestamp: '02:14:35',
    stage: 'EVALUATE',
    verdict: 'VERIFIED',
    pattern: 'Deterministic parse from run_eval.py output',
    sourceFile: 'scripts/commit_stage.py',
    receiptLine: 104,
    reason: 'Artifact verified: eval_summary.csv exists (SHA256: 8f4a1...). Parsed Recall: 0.942, FAR: 0.048.',
  },
  {
    id: 'log-3',
    timestamp: '02:16:02',
    stage: 'SDG',
    verdict: 'REJECTED',
    pattern: 'Placeholder comment found in execution stdout',
    sourceFile: 'scripts/commit_stage.py',
    receiptLine: 132,
    reason: 'Found forbidden phrase "# TODO: implement prompt synthesizer". Zero evidence produced.',
  },
  {
    id: 'log-4',
    timestamp: '02:17:44',
    stage: 'MINE',
    verdict: 'REJECTED',
    pattern: 'Unauthorized direct write to deft_state.json',
    sourceFile: 'scripts/init_stage.py',
    receiptLine: 41,
    reason: 'Direct filesystem write blocked: file descriptor locked by flock. State mutation rejected.',
  },
  {
    id: 'log-5',
    timestamp: '02:19:10',
    stage: 'GATE',
    verdict: 'VERIFIED',
    pattern: 'KPI threshold condition satisfied',
    sourceFile: 'scripts/finalize_deft.py',
    receiptLine: 76,
    reason: 'Target achieved: FAR <= 0.010 (Current: 0.009), Recall >= 0.980 (Current: 0.984).',
  },
];

export const SKILL_SPECTRUM: SkillSpectrumItem[] = [
  {
    id: 'spec-1',
    name: 'Prose Prompt Guides',
    type: 'prose',
    complexityWeight: 10,
    isTarget: false,
    summary: 'Static markdown files with behavioral recommendations. Zero state or execution guarantees.',
  },
  {
    id: 'spec-2',
    name: 'Checklist Validators',
    type: 'checklist',
    complexityWeight: 25,
    isTarget: false,
    summary: 'Step-by-step human verification lists. Subject to agent drift and skipped steps.',
  },
  {
    id: 'spec-3',
    name: 'Tool-Calling Wrappers',
    type: 'tool-assisted',
    complexityWeight: 50,
    isTarget: false,
    summary: 'Standard Function Calling. Model controls loop and can enter infinite retries or drop context.',
  },
  {
    id: 'spec-4',
    name: 'Air-Gap Scripted Containers',
    type: 'deft-runtime',
    complexityWeight: 75,
    isTarget: false,
    summary: 'Offline container with deterministic bash harness and local environment locks.',
  },
  {
    id: 'spec-5',
    name: 'tao-run-deft-aoi (Autonomous DEFT)',
    type: 'deft-runtime',
    complexityWeight: 100,
    isTarget: true,
    summary: 'Full heavy autonomous runtime: disk state machine, progressive card packs, evidence commit gates, and sub-skill constellation.',
  },
];

export const DIRECTOR_RECEIPTS = [
  {
    title: 'scripts/commit_stage.py — Evidence Gate Enforcement',
    language: 'python',
    code: `def commit_stage(stage_name: str, state_path: Path) -> bool:
    """Verifies physical disk artifacts before advancing state machine."""
    with FileLock(f"{state_path}.lock"):
        state = json.loads(state_path.read_text())
        
        # 1. Reject if model hallucinated metrics without disk CSV
        eval_csv = Path(f"outputs/{stage_name}/metrics.csv")
        if not eval_csv.exists():
            sys.stderr.write(f"CRITICAL: Evidence file {eval_csv} does not exist.\\n")
            sys.exit(1) # Zero-tolerance gate exit
            
        # 2. Strict floating-point metric parsing
        metrics = parse_metrics_csv(eval_csv)
        state["kpis"][stage_name] = metrics
        state["active_stage"] = GET_NEXT_STAGE[stage_name]
        
        # 3. Atomic commit with SHA-256 seal
        state["hash"] = hashlib.sha256(json.dumps(state, sort_keys=True).encode()).hexdigest()
        state_path.write_text(json.dumps(state, indent=2))
        return True`,
  },
  {
    title: 'driver.sh — Deterministic Shell Dispatcher',
    language: 'bash',
    code: `#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="deft_state.json"
echo "[DEFT] Initializing autonomous loop from disk state..."
python3 scripts/init_stage.py --state "$STATE_FILE"

while true; do
    STAGE=$(jq -r '.active_stage' "$STATE_FILE")
    if [[ "$STAGE" == "GATE_CONVERGED" ]]; then
        echo "[DEFT] Target KPIs achieved. Finalizing model artifact."
        python3 scripts/finalize_deft.py --state "$STATE_FILE"
        break
    fi
    
    echo "[DEFT] Executing stage: $STAGE"
    python3 "scripts/stages/\${STAGE,,}.py" --state "\$STATE_FILE"
    
    # Commit gate verifies artifacts before continuing
    python3 scripts/commit_stage.py --stage "$STAGE" --state "$STATE_FILE"
done`,
  },
  {
    title: 'deft_state.json — Schema & Sealed Checkpoint',
    language: 'json',
    code: `{
  "iteration": 3,
  "max_iterations": 6,
  "active_stage": "MINE",
  "locked": true,
  "kpis": {
    "far": 0.0124,
    "far_target": 0.0100,
    "recall": 0.9812,
    "recall_target": 0.9800,
    "f1_score": 0.9843
  },
  "evidence_verified": true,
  "checkpoint_hash": "a8f9c1e402b8d4e9124f",
  "sub_skills": {
    "evaluate": "PASS",
    "rca": "PASS",
    "sdg": "PASS",
    "mine": "RUNNING",
    "retrain": "PENDING"
  }
}`,
  },
];
