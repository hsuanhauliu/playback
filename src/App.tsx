import { useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { MainView } from "./components/MainView";
import { Icon } from "./components/Icon";
import { useAppStore } from "./store/useAppStore";

function App() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const addClips = useAppStore((s) => s.addClips);
  // Drag events fire for every nested element; count them so leaving a child
  // does not dismiss the overlay prematurely.
  const dragDepth = useRef(0);

  return (
    <div
      className="relative flex h-full w-full flex-col bg-bg text-fg"
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("video/"),
        );
        if (files.length) addClips(files);
      }}
    >
      <TopBar open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MainView />
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-accent px-12 py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
              <Icon name="upload" size={22} />
            </span>
            <p className="text-sm font-medium text-fg">Drop to import footage</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
