// What a big ticket holds once you read it: one problem per fix, not one per subject line.
// causes.ts tells the two flips apart by tenant and channel. A report the desk read as a one-day
// move (desk-notes.json) is not a flip at all: no parser or hint fix touches it, so it is its own problem.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export const PROBLEM_TITLE: Record<Problem, string> = {
  parser: 'Shared parser reads day-first dates month first',
  hint: 'booking-v3 form hints MM/DD/YYYY, then reads the date day first',
  'one-day': 'Booking lands one day early, not flipped',
  unplaced: 'No tenant on file: cause unknown',
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // How many of these intake tagged with the problem's own name: its guess was right this often.
  taggedRight: number;
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        taggedRight: rs.filter((r) => r.meta.intakeTag === problem).length,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
