import { IFileSystem } from '@/types/filesystem';
import { ProjectFramework, ProjectInfo } from '@/types/project';

/**
 * Deterministically inspects a directory using IFileSystem to detect
 * the project framework, total file count, size, and whether .git is initialized.
 */
export async function detectProject(
  fs: IFileSystem,
  folderName: string = 'my-project'
): Promise<ProjectInfo> {
  const detectedFiles: string[] = [];
  let filesCount = 0;
  let totalSizeBytes = 0;
  let isGit = false;

  // Check if .git exists
  isGit = await fs.exists('.git');

  // Traverse files up to depth 3 to avoid infinite deep search in large node_modules
  async function scanDir(currentPath: string, depth: number): Promise<void> {
    if (depth > 3) return;

    let entries: string[] = [];
    try {
      entries = await fs.readdir(currentPath);
    } catch {
      return;
    }

    for (const name of entries) {
      if (name === '.git') continue;

      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          // Skip scanning node_modules, target, etc. recursively for detection to keep it ultra fast
          if (name !== 'node_modules' && name !== '.next' && name !== 'dist' && name !== 'target') {
            await scanDir(fullPath, depth + 1);
          }
        } else {
          filesCount++;
          totalSizeBytes += stat.size;
          if (depth === 0) {
            detectedFiles.push(name);
          }
        }
      } catch {
        // continue
      }
    }
  }

  await scanDir('', 0);

  // Deterministic Framework Detection
  let framework: ProjectFramework = 'Generic';

  const hasFile = (pattern: RegExp) => detectedFiles.some((f) => pattern.test(f));

  if (hasFile(/^vite\.config\.(js|ts|mjs|cjs)$/)) {
    if (hasFile(/^package\.json$/)) {
      // Check package.json contents if possible
      try {
        const pkg = await fs.readFile('package.json', { encoding: 'utf8' });
        if (typeof pkg === 'string') {
          if (pkg.includes('"vue"')) framework = 'Vue / Vite';
          else if (pkg.includes('"svelte"')) framework = 'Svelte / SvelteKit';
          else framework = 'React / Vite';
        }
      } catch {
        framework = 'React / Vite';
      }
    } else {
      framework = 'React / Vite';
    }
  } else if (hasFile(/^next\.config\.(js|mjs|ts)$/)) {
    framework = 'Next.js';
  } else if (hasFile(/^Cargo\.toml$/)) {
    framework = 'Rust / Cargo';
  } else if (hasFile(/^go\.mod$/)) {
    framework = 'Go';
  } else if (hasFile(/^(requirements\.txt|pyproject\.toml|Pipfile)$/)) {
    framework = 'Python';
  } else if (hasFile(/^pom\.xml$/)) {
    framework = 'Java / Maven';
  } else if (hasFile(/^(build\.gradle|build\.gradle\.kts)$/)) {
    framework = 'Java / Gradle';
  } else if (hasFile(/^composer\.json$/)) {
    framework = 'PHP / Composer';
  } else if (hasFile(/^package\.json$/)) {
    if (hasFile(/^tsconfig\.json$/)) {
      framework = 'TypeScript';
    } else {
      framework = 'Node.js';
    }
  } else if (hasFile(/^index\.html$/)) {
    framework = 'Static HTML/JS';
  }

  return {
    name: folderName,
    path: '/',
    filesCount,
    totalSizeBytes,
    isGit,
    framework,
    detectedFiles,
  };
}
