import * as vscode from "vscode";

export class ClipPreviewController {
  private needUndo = false;
  private generation = 0;
  private chain: Promise<void> = Promise.resolve();

  get isActive(): boolean {
    return this.needUndo;
  }

  show(value: string): Promise<void> {
    return this.enqueue(() => this.showInternal(value));
  }

  clear(): Promise<void> {
    return this.enqueue(() => this.clearInternal());
  }

  finalizePaste(
    value: string,
    setClipboardValue: (value: string) => Promise<unknown>
  ): Promise<void> {
    return this.enqueue(() =>
      this.finalizePasteInternal(value, setClipboardValue)
    );
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.chain = this.chain.then(task, task);
    return this.chain;
  }

  private isStale(gen: number): boolean {
    return gen !== this.generation;
  }

  private async showInternal(value: string): Promise<void> {
    const gen = this.generation;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    if (this.needUndo) {
      await vscode.commands.executeCommand("undo");
      this.needUndo = false;
      if (this.isStale(gen)) {
        return;
      }
    }

    const applyReplace = async () => {
      const success = await editor.edit(
        edit => {
          for (const selection of editor.selections) {
            edit.replace(selection, value);
          }
        },
        { undoStopAfter: false, undoStopBefore: false }
      );

      if (!success || this.isStale(gen)) {
        if (success) {
          await vscode.commands.executeCommand("undo");
        }
        return;
      }

      this.needUndo = true;
    };

    if (editor.selections.every(s => s.isEmpty)) {
      const selections: vscode.Selection[] = [];
      const inserted = await editor.edit(
        edit => {
          for (const selection of editor.selections) {
            edit.insert(selection.start, " ");
            selections.push(
              new vscode.Selection(
                selection.start.line,
                selection.start.character,
                selection.start.line,
                selection.start.character + 1
              )
            );
          }
        },
        { undoStopAfter: false, undoStopBefore: false }
      );

      if (this.isStale(gen)) {
        if (inserted) {
          await vscode.commands.executeCommand("undo");
        }
        return;
      }

      if (inserted && selections.length > 0) {
        editor.selections = selections;
      }
      await applyReplace();
      return;
    }

    await applyReplace();
  }

  private async clearInternal(): Promise<void> {
    this.generation++;
    if (!this.needUndo) {
      return;
    }
    await vscode.commands.executeCommand("undo");
    this.needUndo = false;
  }

  private async finalizePasteInternal(
    value: string,
    setClipboardValue: (value: string) => Promise<unknown>
  ): Promise<void> {
    this.generation++;
    await setClipboardValue(value);

    if (this.needUndo) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.selections = editor.selections.map(
          s => new vscode.Selection(s.end, s.end)
        );
      } else {
        await vscode.commands.executeCommand("cancelSelection");
      }
      this.needUndo = false;
      return;
    }

    await vscode.commands.executeCommand(
      "workbench.action.focusActiveEditorGroup"
    );
    await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
  }
}
