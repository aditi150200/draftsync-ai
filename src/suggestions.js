const vagueTerms = ["very", "really", "things", "stuff", "basically"];

export function analyzeWriting(text) {
  const suggestions = [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);

  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (words.length > 28) {
      suggestions.push({
        type: "clarity",
        title: "Shorten this sentence",
        evidence: `Sentence ${index + 1} contains ${words.length} words.`,
        recommendation: "Split it into two sentences so the main point lands faster."
      });
    }
  });

  const lower = text.toLowerCase();
  vagueTerms.forEach(term => {
    const matches = lower.match(new RegExp(`\\b${term}\\b`, "g"));
    if (matches?.length) {
      suggestions.push({
        type: "precision",
        title: `Replace “${term}”`,
        evidence: `Found ${matches.length} use${matches.length > 1 ? "s" : ""}.`,
        recommendation: "Use a specific noun, number, or stronger modifier."
      });
    }
  });

  const passive = text.match(/\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/gi) || [];
  if (passive.length) {
    suggestions.push({
      type: "voice",
      title: "Consider active voice",
      evidence: `Detected ${passive.length} possible passive construction${passive.length > 1 ? "s" : ""}.`,
      recommendation: "Name the actor and lead with the action where appropriate."
    });
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    score: Math.max(35, 100 - suggestions.length * 9),
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 220)),
    suggestions: suggestions.slice(0, 6)
  };
}

