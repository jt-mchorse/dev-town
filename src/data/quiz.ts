export type QuizTier = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  tier: QuizTier;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "softmax",
    tier: "easy",
    prompt: "What does softmax produce?",
    options: [
      "A vector that sums to 1, interpretable as probabilities",
      "A vector with all entries non-negative integers",
      "A scalar bounded between -1 and 1",
      "A sparse one-hot vector by definition",
    ],
    correctIndex: 0,
    explanation: "Softmax exponentiates and normalizes — the result is a valid probability distribution.",
  },
  {
    id: "overfit",
    tier: "easy",
    prompt: "Train loss keeps falling but val loss starts rising. What's happening?",
    options: ["Underfitting", "Overfitting", "Vanishing gradients", "Class imbalance"],
    correctIndex: 1,
    explanation: "Classic overfit: model memorizes train data, generalization on val degrades.",
  },
  {
    id: "regularization",
    tier: "easy",
    prompt: "Which is NOT a regularization technique?",
    options: ["Dropout", "Weight decay", "Batch normalization", "Increasing learning rate"],
    correctIndex: 3,
    explanation: "Cranking the LR isn't regularization — it usually just makes training unstable.",
  },
  {
    id: "rag",
    tier: "medium",
    prompt: "In RAG, what does the retriever return to the LLM?",
    options: [
      "Pre-computed answers from a cache",
      "Top-k context passages judged relevant to the query",
      "The user's chat history only",
      "Fine-tuned model weights",
    ],
    correctIndex: 1,
    explanation: "RAG = Retrieval-Augmented Generation. Retriever finds relevant chunks; the LLM grounds its answer in them.",
  },
  {
    id: "attention",
    tier: "medium",
    prompt: "In a transformer, what does scaled dot-product attention do?",
    options: [
      "Picks one token to focus on, ignores the rest",
      "Computes weighted averages of value vectors based on query/key similarity",
      "Sorts tokens alphabetically",
      "Replaces each token with its embedding",
    ],
    correctIndex: 1,
    explanation: "softmax(QK^T / sqrt(d)) V — weights values by query/key similarity.",
  },
  {
    id: "batch_size",
    tier: "medium",
    prompt: "Doubling batch size with the same total training tokens generally…",
    options: [
      "Halves wall-clock time and improves loss equally",
      "Reduces gradient noise; often needs LR adjustment for same final loss",
      "Has no effect on training dynamics",
      "Always lowers final loss",
    ],
    correctIndex: 1,
    explanation: "Bigger batches = smoother gradients; LR should typically scale with batch size to match SGD dynamics.",
  },
  {
    id: "embeddings",
    tier: "medium",
    prompt: "Cosine similarity between two embeddings is high when…",
    options: [
      "Their magnitudes are equal regardless of direction",
      "Their angle is small (vectors point similar directions)",
      "Their L2 distance is high",
      "They contain identical token IDs",
    ],
    correctIndex: 1,
    explanation: "Cosine similarity ignores magnitude — it's about direction.",
  },
  {
    id: "evals",
    tier: "hard",
    prompt: "Why prefer pairwise preference evals over absolute scoring for LLM outputs?",
    options: [
      "Pairwise is faster to compute",
      "Humans judge relative quality more consistently than absolute scores",
      "It needs no rubric",
      "It eliminates labeler bias entirely",
    ],
    correctIndex: 1,
    explanation: "Inter-rater reliability is much higher on 'A vs B' than on 'rate A on a 5-point scale'.",
  },
  {
    id: "lora",
    tier: "hard",
    prompt: "LoRA fine-tuning works by…",
    options: [
      "Replacing the base model's weights entirely",
      "Adding small low-rank update matrices to selected layers and training only those",
      "Quantizing weights to int4",
      "Distilling from a teacher model",
    ],
    correctIndex: 1,
    explanation: "Trainable rank-r matrices A,B such that ΔW = AB. Cheap to train, easy to merge or swap.",
  },
  {
    id: "context",
    tier: "hard",
    prompt: "An LLM with a 128k context window has higher latency on long prompts because…",
    options: [
      "Disk reads grow linearly with prompt length",
      "Self-attention is quadratic in sequence length unless special techniques are used",
      "The decoder always has to re-tokenize",
      "Each token requires its own GPU",
    ],
    correctIndex: 1,
    explanation: "Vanilla self-attention is O(n²) in sequence length. Flash attention, sliding window, etc. help.",
  },
  {
    id: "json_mode",
    tier: "hard",
    prompt: "Best mitigation when an LLM occasionally returns malformed JSON?",
    options: [
      "Lower the temperature to 0.0 and call it done",
      "Constrained decoding / structured output schemas backed by validation + retry",
      "Increase max_tokens",
      "Train a new model from scratch",
    ],
    correctIndex: 1,
    explanation: "Temperature alone won't fix it. Use structured output (grammar/schema) and validate.",
  },
];

export const TIER_REWARD: Record<QuizTier, number> = {
  easy: 4,
  medium: 8,
  hard: 14,
};

export const TIER_LABEL: Record<QuizTier, string> = {
  easy: "Junior Tier",
  medium: "Mid Tier",
  hard: "Staff Tier",
};
