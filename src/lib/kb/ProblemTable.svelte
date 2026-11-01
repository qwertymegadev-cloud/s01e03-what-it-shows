<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, PROBLEM_TITLE, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  // tickets: problem → link to the ticket that tracks it.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const ref = (href: string) => href.replace(/^.*\/issues\//, '#');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake tag right</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr class:unplaced={g.problem === 'unplaced'}>
        <td><code>{g.problem}</code> {PROBLEM_TITLE[g.problem]}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.taggedRight} of {g.reports.length}</td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]}>{ref(tickets[g.problem] ?? '')}</a>{:else}none yet{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups as g (g.problem)}
  {#if g.reports.length <= 10}
    <p class="ids"><code>{g.problem}</code>: {g.reports.map((r) => r.id).join(', ')}</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .ids { color: var(--muted); font-size: 0.85em; }
  .unplaced td { background: var(--warn-bg); }
</style>
