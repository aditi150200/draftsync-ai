export function applyOperation(text, operation) {
  const { index, deleteCount, insertText } = operation;
  if (!Number.isInteger(index) || index < 0 || index > text.length) {
    throw new Error("Operation index is outside the document");
  }
  if (!Number.isInteger(deleteCount) || deleteCount < 0 || index + deleteCount > text.length) {
    throw new Error("Operation delete range is outside the document");
  }
  return text.slice(0, index) + insertText + text.slice(index + deleteCount);
}

export function transformOperation(incoming, committed) {
  const transformed = { ...incoming };
  const delta = committed.insertText.length - committed.deleteCount;

  if (committed.index < transformed.index ||
      (committed.index === transformed.index && committed.clientId < transformed.clientId)) {
    transformed.index = Math.max(committed.index, transformed.index + delta);
  }
  return transformed;
}

export function singleSpanDiff(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  return { index: start, deleteCount: beforeEnd - start, insertText: after.slice(start, afterEnd) };
}

