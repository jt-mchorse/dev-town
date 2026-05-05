export interface TypingSnippet {
  id: string;
  text: string;
  hint: string;
}

export const SNIPPETS: TypingSnippet[] = [
  {
    id: "filter_map",
    hint: "ts: filter then map",
    text: "const ids = items.filter(i => i.active).map(i => i.id);",
  },
  {
    id: "fetch_json",
    hint: "ts: fetch + json",
    text: "const data = await fetch(url).then(r => r.json());",
  },
  {
    id: "py_comprehension",
    hint: "py: list comprehension",
    text: "evens = [n for n in range(20) if n % 2 == 0]",
  },
  {
    id: "py_dict_get",
    hint: "py: dict default",
    text: "value = config.get('timeout', 30)",
  },
  {
    id: "ts_async_iter",
    hint: "ts: for-await",
    text: "for await (const chunk of stream) total += chunk.length;",
  },
  {
    id: "ts_record_init",
    hint: "ts: typed record init",
    text: "const counts: Record<string, number> = {};",
  },
  {
    id: "react_hook",
    hint: "react: useEffect cleanup",
    text: "useEffect(() => { const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);",
  },
  {
    id: "sql_join",
    hint: "sql: inner join",
    text: "SELECT u.id, p.title FROM users u JOIN posts p ON p.user_id = u.id;",
  },
];

export function rollSnippet(): TypingSnippet {
  return SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
}

export function rewardForTyping(durationMs: number, errors: number, length: number): number {
  if (length === 0) return 0;
  const seconds = Math.max(durationMs / 1000, 1);
  const accuracy = Math.max(0, length - errors) / length;
  const cps = length / seconds;
  // baseline: ~5 cps with 100% accuracy => 12 credits
  const score = cps * 2.4 * accuracy;
  return Math.max(0, Math.round(score));
}
