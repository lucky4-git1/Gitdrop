export type ProjectFramework =
  | 'React / Vite'
  | 'Next.js'
  | 'Vue / Vite'
  | 'Svelte / SvelteKit'
  | 'Node.js'
  | 'TypeScript'
  | 'Rust / Cargo'
  | 'Go'
  | 'Python'
  | 'Java / Maven'
  | 'Java / Gradle'
  | 'PHP / Composer'
  | 'Static HTML/JS'
  | 'Generic';

export interface ProjectInfo {
  name: string;
  path: string;
  filesCount: number;
  totalSizeBytes: number;
  isGit: boolean;
  framework: ProjectFramework;
  description?: string;
  detectedFiles: string[];
}
