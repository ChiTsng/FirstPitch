// Publish only the production build; keep the source checkout and its index intact.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const git = (args, options = {}) => execFileSync('git', args, {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options,
}).trim();

if (!existsSync(join(dist, 'index.html'))) throw new Error('Run npm run build first.');
const remote = git(['ls-remote', '--heads', 'origin', 'refs/heads/gh-pages']);
let parent;
if (remote) {
  git(['fetch', '--no-tags', 'origin', 'refs/heads/gh-pages']);
  parent = git(['rev-parse', 'FETCH_HEAD']);
}

const temporary = mkdtempSync(join(tmpdir(), 'firstpitch-pages-'));
try {
  writeFileSync(join(dist, '.nojekyll'), '');
  const env = {
    ...process.env,
    GIT_INDEX_FILE: join(temporary, 'index'),
    GIT_WORK_TREE: dist,
    GIT_AUTHOR_NAME: 'ChiTsng',
    GIT_AUTHOR_EMAIL: '30766952+ChiTsng@users.noreply.github.com',
    GIT_COMMITTER_NAME: 'ChiTsng',
    GIT_COMMITTER_EMAIL: '30766952+ChiTsng@users.noreply.github.com',
  };
  git(['read-tree', '--empty'], { env });
  git(['--work-tree', dist, 'add', '--all', '--', '.'], { env, cwd: dist });
  const tree = git(['write-tree'], { env });
  const source = git(['rev-parse', '--short', 'HEAD']);
  const commit = git(['-c', 'commit.gpgsign=false', 'commit-tree', tree,
    ...(parent ? ['-p', parent] : []), '-m', `Publish First Pitch (${source})`], { env });
  // A concurrent publication is rejected by a normal push; never force-push.
  git(['-c', 'push.followTags=false', 'push', 'origin', `${commit}:refs/heads/gh-pages`]);
  console.log('Published build: https://ChiTsng.github.io/FirstPitch/');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
