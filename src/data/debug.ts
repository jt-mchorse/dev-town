export interface DebugChallenge {
  id: string;
  language: "ts" | "py";
  prompt: string;
  lines: string[];
  buggyLineIndex: number;
  explanation: string;
}

export const DEBUG_CHALLENGES: DebugChallenge[] = [
  {
    id: "off_by_one",
    language: "ts",
    prompt: "Find the bug. Function should sum the first n integers (0..n-1).",
    lines: [
      "function sumTo(n: number) {",
      "  let total = 0;",
      "  for (let i = 0; i <= n; i++) {",
      "    total += i;",
      "  }",
      "  return total;",
      "}",
    ],
    buggyLineIndex: 2,
    explanation: "Off-by-one: i <= n includes n itself. Should be i < n.",
  },
  {
    id: "py_mutable_default",
    language: "py",
    prompt: "Find the bug. Each call should start with an empty list.",
    lines: [
      "def append_item(item, bucket=[]):",
      "    bucket.append(item)",
      "    return bucket",
      "",
      "first  = append_item('a')",
      "second = append_item('b')",
      "# 'second' unexpectedly equals ['a','b']",
    ],
    buggyLineIndex: 0,
    explanation: "Mutable default args are shared across calls. Use bucket=None and create [] inside.",
  },
  {
    id: "promise_no_await",
    language: "ts",
    prompt: "Find the bug. Should log the user's name.",
    lines: [
      "async function load(id: string) {",
      "  const user = fetchUser(id);",
      "  console.log(user.name);",
      "  return user;",
      "}",
    ],
    buggyLineIndex: 1,
    explanation: "Missing await — `user` is a Promise, so `.name` is undefined.",
  },
  {
    id: "shallow_copy",
    language: "ts",
    prompt: "Find the bug. clone() should let callers mutate without touching the original.",
    lines: [
      "function clone(obj: { tags: string[] }) {",
      "  const copy = { ...obj };",
      "  return copy;",
      "}",
      "// caller mutates copy.tags and sees original.tags also change",
    ],
    buggyLineIndex: 1,
    explanation: "Spread is a shallow copy — `tags` is still the same array reference.",
  },
  {
    id: "py_int_div",
    language: "py",
    prompt: "Find the bug. Should compute the average as a float.",
    lines: [
      "def average(nums):",
      "    if not nums:",
      "        return 0",
      "    return sum(nums) // len(nums)",
    ],
    buggyLineIndex: 3,
    explanation: "// is integer division. Should be / for a float result.",
  },
];

export function rollDebug(): DebugChallenge {
  return DEBUG_CHALLENGES[Math.floor(Math.random() * DEBUG_CHALLENGES.length)];
}

export const DEBUG_REWARD = 12;
