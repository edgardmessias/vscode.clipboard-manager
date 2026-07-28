import { vi } from "vitest";

class EventEmitter<T> {
  private listeners: Array<(value: T) => void> = [];

  event = (listener: (value: T) => void) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      },
    };
  };

  fire(value: T) {
    this.listeners.forEach(listener => listener(value));
  }

  dispose() {
    this.listeners = [];
  }
}

class Disposable {
  dispose = vi.fn();

  static from(...disposables: Disposable[]) {
    return {
      dispose: vi.fn(() => {
        disposables.forEach(d => d.dispose());
      }),
    };
  }
}

class Selection {
  constructor(
    public start: { line: number; character: number },
    public end: { line: number; character: number }
  ) {}
}

class Range {
  constructor(
    public start: { line: number; character: number },
    public end: { line: number; character: number }
  ) {}
}

class Location {
  constructor(
    public uri: { fsPath: string },
    public range: Range
  ) {}
}

const window = {
  createOutputChannel: vi.fn(),
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showQuickPick: vi.fn(),
  showTextDocument: vi.fn(),
  onDidChangeWindowState: vi.fn(),
};

const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
  }),
  openTextDocument: vi.fn(),
  onDidChangeConfiguration: vi.fn(),
};

const extensions = {
  getExtension: vi.fn(),
};

const commands = {
  executeCommand: vi.fn(),
  registerCommand: vi.fn(),
};

const env = {
  clipboard: {
    readText: vi.fn().mockResolvedValue(""),
    writeText: vi.fn().mockResolvedValue(undefined),
  },
};

export {
  commands,
  Disposable,
  env,
  EventEmitter,
  extensions,
  Location,
  Range,
  Selection,
  window,
  workspace,
};
