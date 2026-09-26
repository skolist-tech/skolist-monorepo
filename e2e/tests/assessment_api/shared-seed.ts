import { test as base } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * Specs that sit the shared JEE/NEET seed papers take this lock so only one
 * of them runs at a time. Isolated specs (own teacher/student pair) do not.
 */
const lockDir = path.resolve(__dirname, "../../.e2e-shared-seed.lock");
const pidFile = path.join(lockDir, "pid");

function pidAlive(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireSharedSeedLock() {
  for (;;) {
    try {
      fs.mkdirSync(lockDir);
      fs.writeFileSync(pidFile, String(process.pid));
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        throw error;
      }
      try {
        const pid = Number(fs.readFileSync(pidFile, "utf8"));
        if (!pidAlive(pid)) {
          fs.rmSync(lockDir, { recursive: true, force: true });
          continue;
        }
      } catch {
        fs.rmSync(lockDir, { recursive: true, force: true });
        continue;
      }
      await sleep(50);
    }
  }
}

function releaseSharedSeedLock() {
  try {
    const pid = Number(fs.readFileSync(pidFile, "utf8"));
    if (pid === process.pid) {
      fs.rmSync(lockDir, { recursive: true, force: true });
    }
  } catch {
    // lock already gone
  }
}

export const test = base.extend<{ _sharedSeedLock: void }>({
  _sharedSeedLock: [
    async ({}, use) => {
      await acquireSharedSeedLock();
      try {
        await use();
      } finally {
        releaseSharedSeedLock();
      }
    },
    { auto: true, timeout: 10 * 60 * 1000 },
  ],
});

export { expect } from "@playwright/test";
