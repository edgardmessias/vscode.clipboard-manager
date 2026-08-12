import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipDetail, ClipSummary } from "./messages";
import { useClipPreviewHover } from "./useClipPreviewHover";
import { onHostMessage, postToHost } from "./vscode";
import { Icon, IconButton } from "./components/Icons";
import { SettingsView } from "./components/SettingsView";

type Screen = "history" | "settings";

interface ContextMenuState {
  x: number;
  y: number;
  clipId: string;
}

interface ClipRowProps {
  clip: ClipSummary;
  index: number;
  expanded: boolean;
  detail?: ClipDetail;
  onToggleExpand: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, clipId: string) => void;
  onPasteEnter: (id: string) => void;
  onPasteLeave: () => void;
  onPasteClick: (id: string) => void;
}

function formatMeta(clip: ClipSummary): string {
  const parts = [new Date(clip.createdAt).toLocaleString()];
  if (clip.language) {
    parts.push(clip.language);
  }
  if (clip.copyCount > 1) {
    parts.push(`×${clip.copyCount}`);
  }
  return parts.join(" · ");
}

function ClipRow({
  clip,
  index,
  expanded,
  detail,
  onToggleExpand,
  onContextMenu,
  onPasteEnter,
  onPasteLeave,
  onPasteClick,
}: ClipRowProps) {
  const tooltip = formatMeta(clip);

  return (
    <article
      className={`clip-row${expanded ? " is-expanded" : ""}`}
      onContextMenu={event => onContextMenu(event, clip.id)}
    >
      <div className="clip-row-main" title={tooltip}>
        <span className="clip-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="clip-title">{clip.title}</span>
        <div
          className="clip-row-actions"
          onClick={event => event.stopPropagation()}
        >
          <IconButton
            icon="paste"
            label="Paste"
            className="clip-action-btn"
            primary
            onClick={() => onPasteClick(clip.id)}
            onMouseEnter={() => onPasteEnter(clip.id)}
            onMouseLeave={onPasteLeave}
          />
          <IconButton
            icon="chevron"
            label={expanded ? "Collapse" : "Expand content"}
            className={`clip-action-btn icon-btn-chevron${expanded ? " is-open" : ""}`}
            onClick={() => onToggleExpand(clip.id)}
          />
        </div>
      </div>
      {expanded && (
        <pre className="clip-preview">{detail?.value ?? "Loading…"}</pre>
      )}
    </article>
  );
}

function ContextMenu({
  state,
  clip,
  expanded,
  onClose,
  onToggleExpand,
}: {
  state: ContextMenuState;
  clip: ClipSummary;
  expanded: boolean;
  onClose: () => void;
  onToggleExpand: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const run = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ top: state.y, left: state.x }}
      role="menu"
    >
      <button
        type="button"
        className="context-menu-item"
        onClick={() =>
          run(() => postToHost({ type: "clip/copy", id: clip.id }))
        }
      >
        Copy to clipboard
      </button>
      {clip.hasLocation && (
        <button
          type="button"
          className="context-menu-item"
          onClick={() =>
            run(() => postToHost({ type: "clip/showInFile", id: clip.id }))
          }
        >
          Open in file
        </button>
      )}
      <button
        type="button"
        className="context-menu-item"
        onClick={() => run(() => onToggleExpand(clip.id))}
      >
        {expanded ? "Collapse content" : "Expand content"}
      </button>
      <div className="context-menu-sep" />
      <button
        type="button"
        className="context-menu-item context-menu-danger"
        onClick={() => run(() => postToHost({ type: "clip/ban", id: clip.id }))}
      >
        Ban clip
      </button>
      <button
        type="button"
        className="context-menu-item context-menu-danger"
        onClick={() =>
          run(() => postToHost({ type: "clip/remove", id: clip.id }))
        }
      >
        Remove
      </button>
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>("history");
  const [clips, setClips] = useState<ClipSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<ClipDetail | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const queryRef = useRef(query);
  const expandedIdRef = useRef(expandedId);

  queryRef.current = query;
  expandedIdRef.current = expandedId;

  const { onPasteEnter, onPasteLeave, onPasteClick, clearPreview } =
    useClipPreviewHover(previewEnabled);

  const requestFilter = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      setFilteredIds(null);
      return;
    }
    postToHost({ type: "clips/filter", query: normalized });
  };

  useEffect(() => {
    return onHostMessage(message => {
      switch (message.type) {
        case "clips/update":
          setClips(message.clips);
          if (queryRef.current.trim()) {
            requestFilter(queryRef.current);
          }
          break;
        case "clips/filterResult":
          if (message.query === queryRef.current.trim()) {
            setFilteredIds(message.ids);
          }
          break;
        case "clip/detail":
          if (expandedIdRef.current === message.clip.id) {
            setExpandedDetail(message.clip);
          }
          break;
        case "config/update":
          setPreviewEnabled(message.preview);
          break;
      }
    });
  }, []);

  useEffect(() => {
    postToHost({ type: "ready" });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      requestFilter(query);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (expandedId && !clips.some(clip => clip.id === expandedId)) {
      setExpandedId(null);
      setExpandedDetail(null);
    }
  }, [clips, expandedId]);

  const filteredClips = useMemo(() => {
    if (!filteredIds) {
      return clips;
    }
    const idSet = new Set(filteredIds);
    return clips.filter(clip => idSet.has(clip.id));
  }, [clips, filteredIds]);

  const handleToggleExpand = (id: string) => {
    setExpandedId(current => {
      if (current === id) {
        expandedIdRef.current = null;
        setExpandedDetail(null);
        return null;
      }
      expandedIdRef.current = id;
      setExpandedDetail(null);
      postToHost({ type: "clip/requestDetail", id });
      return id;
    });
  };

  const handleContextMenu = (event: React.MouseEvent, clipId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, clipId });
  };

  const contextClip = contextMenu
    ? clips.find(clip => clip.id === contextMenu.clipId)
    : undefined;

  const isFiltering = query.trim().length > 0;
  const isEmpty = clips.length === 0;
  const hasNoMatches = !isEmpty && isFiltering && filteredClips.length === 0;

  return (
    <div className="panel">
      <nav className="tab-bar" role="tablist" aria-label="Clipboard Manager">
        <button
          type="button"
          role="tab"
          className={`tab-btn${screen === "history" ? " is-active" : ""}`}
          aria-selected={screen === "history"}
          onClick={() => setScreen("history")}
        >
          <Icon name="history" />
          History
        </button>
        <button
          type="button"
          role="tab"
          className={`tab-btn${screen === "settings" ? " is-active" : ""}`}
          aria-selected={screen === "settings"}
          onClick={() => setScreen("settings")}
        >
          <Icon name="settings" />
          Settings
        </button>
      </nav>

      {screen === "settings" ? (
        <SettingsView />
      ) : (
        <div className="panel-content">
          <div className="toolbar">
            <span className="search-wrap">
              <Icon name="search" className="search-icon" />
              <input
                className="search-input"
                type="search"
                placeholder="Filter..."
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
            </span>
            <IconButton
              icon="clear"
              label="Clear history"
              onClick={() => postToHost({ type: "history/clear" })}
            />
          </div>

          {isEmpty ? (
            <div className="empty-state">
              <p className="empty-title">No clips yet</p>
              <p className="empty-desc">
                Copy text in the editor to fill the list.
              </p>
            </div>
          ) : hasNoMatches ? (
            <div className="empty-state">
              <p className="empty-title">No matches</p>
              <p className="empty-desc">Try a different search term.</p>
            </div>
          ) : (
            <div className="clip-list" onMouseLeave={clearPreview}>
              {filteredClips.map((clip, index) => (
                <ClipRow
                  key={clip.id}
                  clip={clip}
                  index={index}
                  expanded={expandedId === clip.id}
                  detail={
                    expandedId === clip.id
                      ? (expandedDetail ?? undefined)
                      : undefined
                  }
                  onToggleExpand={handleToggleExpand}
                  onContextMenu={handleContextMenu}
                  onPasteEnter={onPasteEnter}
                  onPasteLeave={onPasteLeave}
                  onPasteClick={onPasteClick}
                />
              ))}
            </div>
          )}

          {contextMenu && contextClip && (
            <ContextMenu
              state={contextMenu}
              clip={contextClip}
              expanded={expandedId === contextClip.id}
              onClose={() => setContextMenu(null)}
              onToggleExpand={handleToggleExpand}
            />
          )}
        </div>
      )}
    </div>
  );
}
