# Session logs

One file per day, named `YYYY-MM-DD.md`, append-only history of what changed
that day.

**Convention:**

- Each session log opens with a one-line summary.
- Then a `## Done` section with bullet points of every notable change. Each
  bullet links to the file(s) touched and explains the *why*, not just the *what*.
- Then a `## Decisions` section — anything that shifts direction (a phase
  goal, an architecture call, a deferred-forever item).
- Then a `## Open` section — things spotted during the session that didn't get
  done. These should also flow into [`docs/project.md`](../project.md) under "Open work".

Live state lives in [`docs/project.md`](../project.md). The session logs are
historical record only — re-read the project.md for "where are we now."
