import { useCallback, useEffect, useRef } from "react";
import { postToHost } from "./vscode";

const PREVIEW_DELAY_MS = 350;

export function useClipPreviewHover(previewEnabled: boolean) {
  const timerRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearPreview = useCallback(() => {
    cancelPending();
    if (activeIdRef.current === null) {
      return;
    }
    activeIdRef.current = null;
    postToHost({ type: "clip/preview/clear" });
  }, [cancelPending]);

  const onPasteEnter = useCallback(
    (id: string) => {
      if (!previewEnabled) {
        return;
      }
      cancelPending();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        activeIdRef.current = id;
        postToHost({ type: "clip/preview", id });
      }, PREVIEW_DELAY_MS);
    },
    [cancelPending, previewEnabled]
  );

  const onPasteLeave = useCallback(() => {
    if (!previewEnabled) {
      return;
    }
    clearPreview();
  }, [clearPreview, previewEnabled]);

  const onPasteClick = useCallback(
    (id: string) => {
      cancelPending();
      activeIdRef.current = null;
      postToHost({ type: "clip/paste", id });
    },
    [cancelPending]
  );

  useEffect(() => {
    return () => {
      cancelPending();
      if (activeIdRef.current !== null) {
        activeIdRef.current = null;
        postToHost({ type: "clip/preview/clear" });
      }
    };
  }, [cancelPending]);

  return { onPasteEnter, onPasteLeave, onPasteClick, clearPreview };
}
