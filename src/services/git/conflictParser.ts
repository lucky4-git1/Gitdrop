export interface ConflictBlock {
  id: string;
  startLine: number;
  endLine: number;
  currentBranch: string;
  incomingBranch: string;
  currentText: string;
  incomingText: string;
}

export interface ParsedConflictFile {
  hasConflicts: boolean;
  conflicts: ConflictBlock[];
}

export function parseConflicts(content: string): ParsedConflictFile {
  const lines = content.split('\n');
  const conflicts: ConflictBlock[] = [];
  let inConflict = false;
  let isCurrent = false;
  let isIncoming = false;

  let startLine = 0;
  let currentBranch = 'HEAD';
  let incomingBranch = 'incoming';
  const currentLines: string[] = [];
  const incomingLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      isCurrent = true;
      isIncoming = false;
      startLine = i + 1;
      currentBranch = line.substring(7).trim() || 'HEAD';
      currentLines.length = 0;
      incomingLines.length = 0;
    } else if (line.startsWith('=======') && inConflict) {
      isCurrent = false;
      isIncoming = true;
    } else if (line.startsWith('>>>>>>>') && inConflict) {
      incomingBranch = line.substring(7).trim() || 'incoming';
      conflicts.push({
        id: `conflict-${conflicts.length + 1}`,
        startLine,
        endLine: i + 1,
        currentBranch,
        incomingBranch,
        currentText: currentLines.join('\n'),
        incomingText: incomingLines.join('\n'),
      });
      inConflict = false;
      isCurrent = false;
      isIncoming = false;
    } else if (inConflict) {
      if (isCurrent) {
        currentLines.push(line);
      } else if (isIncoming) {
        incomingLines.push(line);
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

export function hasConflictMarkers(content: string): boolean {
  return content.includes('<<<<<<<') && content.includes('=======') && content.includes('>>>>>>>');
}

export function resolveAcceptCurrent(content: string): string {
  const regex = /<<<<<<<[^\n]*\n([\s\S]*?)=======\n[\s\S]*?>>>>>>>[^\n]*\n?/g;
  return content.replace(regex, '$1');
}

export function resolveAcceptIncoming(content: string): string {
  const regex = /<<<<<<<[^\n]*\n[\s\S]*?=======\n([\s\S]*?)>>>>>>>[^\n]*\n?/g;
  return content.replace(regex, '$1');
}

export function resolveAcceptBoth(content: string): string {
  const regex = /<<<<<<<[^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>[^\n]*\n?/g;
  return content.replace(regex, '$1$2');
}
