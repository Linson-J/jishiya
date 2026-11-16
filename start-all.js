'use strict';
// Starts everything for local development with one command:  node start-all.js
//   MySQL (dev instance, port 3307) -> API (5000) -> admin (5173) -> landing (3000)
// Open http://localhost:3000  (landing)  and  http://localhost:3000/admin-panel  (admin).
const { spawn, spawnSync } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');

const root = __dirname;
const MYSQL_BIN = process.env.MYSQLD || 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin';
const MYSQLD = path.join(MYSQL_BIN, 'mysqld.exe');
const MYSQL = path.join(MYSQL_BIN, 'mysql.exe');
// Kept on C: — the J: drive breaks InnoDB undo files on this machine.
const DATADIR = process.env.DEV_DB_DIR || path.join(os.homedir(), 'jishya-devdb');
const DB_PORT = 3307;
const children = [];

const log = (m) => console.log(`[start-all] ${m}`);
const open = (port) =>
  new Promise((res) => {
    const s = net.connect(port, '127.0.0.1');
    s.on('connect', () => (s.destroy(), res(true)));
    s.on('error', () => res(false));
  });
async function waitFor(port, label, tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await open(port)) return log(`${label} ready on :${port}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${label} did not start`);
}
function run(name, cwd, cmd, args) {
  const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32' && cmd === 'npm' });
  p.on('exit', (c) => log(`${name} exited (${c})`));
  children.push(p);
  return p;
}

async function main() {
  if (!(await open(DB_PORT))) {
    const fresh = !fs.existsSync(path.join(DATADIR, 'mysql'));
    fs.mkdirSync(DATADIR, { recursive: true });
    if (fresh) {
      log('initialising dev database…');
      spawnSync(MYSQLD, ['--no-defaults', '--initialize-insecure', `--datadir=${DATADIR}`], { stdio: 'ignore' });
    }
    run('mysql', root, MYSQLD, ['--no-defaults', `--datadir=${DATADIR}`, `--port=${DB_PORT}`, '--mysqlx=OFF', '--console']);
    await waitFor(DB_PORT, 'MySQL');
    if (fresh) {
      log('loading schema…');
      const sql = fs.readFileSync(path.join(root, 'backend', 'database', 'schema.sql'));
      spawnSync(MYSQL, ['-uroot', `-P${DB_PORT}`, '-h127.0.0.1', '--default-character-set=utf8mb4'], { input: sql, stdio: ['pipe', 'inherit', 'inherit'] });
    }
  } else log(`MySQL already running on :${DB_PORT}`);

  if (!(await open(5000))) run('api', path.join(root, 'backend'), 'npm', ['start']);
  await waitFor(5000, 'API');
  if (!(await open(5173))) run('admin', path.join(root, 'admin'), 'npm', ['run', 'dev']);
  if (!(await open(3000))) run('landing', path.join(root, 'landing'), 'npm', ['run', 'dev']);
  await waitFor(3000, 'Landing');
  log('Landing: http://localhost:3000   Admin: http://localhost:3000/admin-panel');
}

function shutdown() {
  children.forEach((c) => c.kill());
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
main().catch((e) => (console.error(e.message), shutdown()));
