import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const editablePrefixes = ['src/content/layouts/', 'src/content/projects/'];

export function assertFeatureBranch(branch: string) {
  if (branch === 'main' || !branch.startsWith('feature/')) {
    throw new Error('The visual editor saves only feature branches.');
  }
}

export function assertEditablePath(path: string) {
  if (path.includes('..') || !editablePrefixes.some((prefix) => path.startsWith(prefix))) {
    throw new Error(`The visual editor cannot modify ${path}.`);
  }
}

export async function getCurrentBranch(root: string) {
  const { stdout } = await execFileAsync('git', ['branch', '--show-current'], { cwd: root });
  return stdout.trim();
}

export async function commitEditorFiles(root: string, files: string[], message: string) {
  const branch = await getCurrentBranch(root);
  assertFeatureBranch(branch);
  if (!message.trim()) throw new Error('A commit message is required.');
  files.forEach(assertEditablePath);
  await execFileAsync('git', ['add', '--', ...files], { cwd: root });
  const { stdout } = await execFileAsync('git', ['diff', '--cached', '--name-only'], { cwd: root });
  const staged = stdout.split(/\r?\n/).filter(Boolean);
  staged.forEach(assertEditablePath);
  if (staged.some((file) => !files.includes(file))) {
    throw new Error('The visual editor refused to include unrelated staged files.');
  }
  await execFileAsync('git', ['commit', '-m', message.trim(), '--', ...files], { cwd: root });
}
