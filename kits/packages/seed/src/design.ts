import scenes from "../recipe/design-scenes.json" with { type: "json" };

export interface SparklineDesignDay {
  date: string;
  label: string;
  value: number;
}

export interface SparklineDesignScene {
  source: string;
  context: string;
  days: SparklineDesignDay[];
  failures: number[];
}

/** A fixed synthetic handoff scene, independent of the Fieldline record corpus. */
export function getSparklineDesignScene(): SparklineDesignScene {
  return structuredClone(scenes.sparkline);
}

export interface ConfidenceDesignField {
  id: string;
  label: string;
  value: string;
  confidence: number | null;
  reasons: string[];
}

export interface ConfidenceBadgeDesignScene {
  source: string;
  context: string;
  rows: ConfidenceDesignField[];
  updatedRows: ConfidenceDesignField[];
}

/** A fixed extraction scenario, including a second data-prop revision. */
export function getConfidenceBadgeDesignScene(): ConfidenceBadgeDesignScene {
  return structuredClone(scenes.confidenceBadge);
}

export interface DiffDesignReply {
  title: string;
  before: string;
  after: string;
}

export interface DiffDesignCrm {
  title: string;
  agent: string;
  before: Record<string, string>;
  after: Record<string, string>;
}

export interface DiffViewerDesignScene {
  source: string;
  context: string;
  reply: DiffDesignReply;
  updatedReply: DiffDesignReply;
  crm: DiffDesignCrm;
  updatedCrm: DiffDesignCrm;
}

/** Fixed reply/CRM proposals and a replacement revision; no live writes occur. */
export function getDiffViewerDesignScene(): DiffViewerDesignScene {
  return structuredClone(scenes.diffViewer);
}
