import { applyOperation, transformOperation } from "./collaboration.js";

export class DocumentStore {
  constructor(initialText = "") {
    this.text = initialText;
    this.version = 0;
    this.history = [];
  }

  snapshot() {
    return { text: this.text, version: this.version };
  }

  commit(operation) {
    if (operation.baseVersion < 0 || operation.baseVersion > this.version) {
      throw new Error("Invalid base version");
    }
    let next = { ...operation };
    for (const committed of this.history.slice(operation.baseVersion)) {
      next = transformOperation(next, committed);
    }
    this.text = applyOperation(this.text, next);
    this.version += 1;
    const recorded = { ...next, version: this.version };
    this.history.push(recorded);
    return { ...this.snapshot(), operation: recorded };
  }
}

