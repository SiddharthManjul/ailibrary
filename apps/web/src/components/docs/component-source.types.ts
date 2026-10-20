/** Plain data passed from the server loader to the documentation source viewer. */
export interface ComponentSourceFile {
  path: string;
  language: string;
  code: string;
  kind: "example" | "component" | "dependency";
}

export interface ComponentSourceBundle {
  slug: string;
  registryName: string;
  files: ComponentSourceFile[];
  primitives: string[];
  dependencies: string[];
}
