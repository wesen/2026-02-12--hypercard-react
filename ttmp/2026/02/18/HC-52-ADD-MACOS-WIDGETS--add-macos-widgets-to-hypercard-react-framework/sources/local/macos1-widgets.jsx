import { useState, useRef, useEffect, useCallback } from "react";

const CHICAGO = `"Chicago", "Geneva", "Monaco", monospace`;

const stripePattern = (() => {
  const c = document.createElement("canvas");
  c.width = 2; c.height = 2;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 2, 2);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1, 1); ctx.fillRect(1, 1, 1, 1);
  return c.toDataURL();
})();

const desktopPattern = (() => {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 4;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 4, 4);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1, 1); ctx.fillRect(2, 2, 1, 1);
  return c.toDataURL();
})();

const titleBarPattern = (() => {
  const c = document.createElement("canvas");
  c.width = 2; c.height = 2;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 2, 2);
  ctx.fillStyle = "#fff"; ctx.fillRect(1, 0, 1, 1); ctx.fillRect(0, 1, 1, 1);
  return c.toDataURL();
})();

function MacWindow({ title, x, y, width, height, children, style, zIndex = 1 }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width,
      border: "2px solid #000", background: "#fff",
      boxShadow: "2px 2px 0 #000", zIndex,
      display: "flex", flexDirection: "column", ...style
    }}>
      <div style={{
        height: 20, display: "flex", alignItems: "center",
        borderBottom: "2px solid #000", padding: "0 4px",
        backgroundImage: `url(${titleBarPattern})`,
        backgroundRepeat: "repeat", cursor: "grab", flexShrink: 0
      }}>
        <div style={{
          width: 13, height: 13, border: "2px solid #000",
          background: "#fff", flexShrink: 0, cursor: "pointer", marginRight: 6
        }} />
        <div style={{
          flex: 1, textAlign: "center", fontFamily: CHICAGO,
          fontSize: 12, fontWeight: "bold", color: "#000",
          background: "#fff", padding: "0 8px", whiteSpace: "nowrap", overflow: "hidden"
        }}>{title}</div>
        <div style={{ width: 13, flexShrink: 0 }} />
      </div>
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>{children}</div>
      <div style={{
        position: "absolute", bottom: 0, right: 0, width: 15, height: 15,
        cursor: "nwse-resize", borderTop: "2px solid #000", borderLeft: "2px solid #000",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <svg width="9" height="9" viewBox="0 0 9 9">
          <line x1="8" y1="0" x2="0" y2="8" stroke="#000" strokeWidth="1.5" />
          <line x1="8" y1="3" x2="3" y2="8" stroke="#000" strokeWidth="1.5" />
          <line x1="8" y1="6" x2="6" y2="8" stroke="#000" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

function ScrollBar({ vertical = true, value = 30 }) {
  const track = vertical
    ? { position: "absolute", right: 0, top: 0, bottom: 15, width: 16 }
    : { position: "absolute", bottom: 0, left: 0, right: 15, height: 16 };
  return (
    <div style={{
      ...track, border: "1px solid #000",
      backgroundImage: `url(${stripePattern})`, backgroundRepeat: "repeat",
      display: "flex", flexDirection: vertical ? "column" : "row"
    }}>
      <div style={{
        width: vertical ? "100%" : 16, height: vertical ? 16 : "100%",
        background: "#fff", border: "1px solid #000",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 10, fontFamily: CHICAGO, flexShrink: 0
      }}>{vertical ? "▲" : "◀"}</div>
      <div style={{ flex: 1, position: "relative" }}>
        <div style={{
          position: "absolute",
          ...(vertical
            ? { top: `${value}%`, left: 0, right: 0, height: 24 }
            : { left: `${value}%`, top: 0, bottom: 0, width: 24 }),
          background: "#fff", border: "1px solid #000", cursor: "grab"
        }} />
      </div>
      <div style={{
        width: vertical ? "100%" : 16, height: vertical ? 16 : "100%",
        background: "#fff", border: "1px solid #000",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 10, fontFamily: CHICAGO, flexShrink: 0
      }}>{vertical ? "▼" : "▶"}</div>
    </div>
  );
}

function PushButton({ label, isDefault, onClick, disabled, style: extraStyle }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: "inline-block", padding: isDefault ? 3 : 0, border: isDefault ? "2px solid #000" : "none", borderRadius: isDefault ? 10 : 0 }}>
      <button onClick={onClick} disabled={disabled}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
        style={{
          fontFamily: CHICAGO, fontSize: 12,
          background: pressed ? "#000" : "#fff",
          color: pressed ? "#fff" : disabled ? "#888" : "#000",
          border: "2px solid #000", borderRadius: 7, padding: "4px 16px",
          cursor: disabled ? "default" : "pointer", minWidth: 80, ...extraStyle
        }}
      >{label}</button>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <div onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: CHICAGO, fontSize: 12, marginBottom: 4 }}>
      <div style={{
        width: 14, height: 14, border: "2px solid #000", background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: "bold", lineHeight: 1
      }}>{checked ? "✕" : ""}</div>
      <span>{label}</span>
    </div>
  );
}

function RadioButton({ label, selected, onChange }) {
  return (
    <div onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: CHICAGO, fontSize: 12, marginBottom: 4 }}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%", border: "2px solid #000",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#000" }} />}
      </div>
      <span>{label}</span>
    </div>
  );
}

function TextField({ value, onChange, width = 180 }) {
  return (
    <input value={value} onChange={onChange}
      style={{
        fontFamily: CHICAGO, fontSize: 12, border: "1px solid #000",
        background: "#fff", padding: "3px 4px", width, outline: "none", caretColor: "#000"
      }}
    />
  );
}

function ListBox({ items, selected, onSelect, height = 90 }) {
  return (
    <div style={{ border: "1px solid #000", background: "#fff", height, overflowY: "auto", width: 160, fontFamily: CHICAGO, fontSize: 12 }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => onSelect(i)}
          style={{ padding: "2px 6px", cursor: "pointer", background: selected === i ? "#000" : "#fff", color: selected === i ? "#fff" : "#000" }}
        >{item}</div>
      ))}
    </div>
  );
}

// ---- Dropdown Selector (Pop-up Menu) ----
function DropdownSelector({ options, selected, onSelect, width = 150 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen(!open)}
        style={{
          width, fontFamily: CHICAGO, fontSize: 12,
          border: "2px solid #000", background: "#fff",
          padding: "3px 6px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "1px 1px 0 #000"
        }}>
        <span>{options[selected]}</span>
        <span style={{ fontSize: 8, marginLeft: 8 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0,
          width: width + 4, border: "2px solid #000", background: "#fff",
          boxShadow: "2px 2px 0 #000", zIndex: 50
        }}>
          {options.map((opt, i) => (
            <div key={i}
              onClick={() => { onSelect(i); setOpen(false); }}
              onMouseEnter={e => { e.target.style.background = "#000"; e.target.style.color = "#fff"; }}
              onMouseLeave={e => { e.target.style.background = "#fff"; e.target.style.color = "#000"; }}
              style={{
                padding: "3px 8px", cursor: "pointer", fontFamily: CHICAGO, fontSize: 12,
                background: i === selected ? "#000" : "#fff", color: i === selected ? "#fff" : "#000"
              }}
            >{i === selected ? "✓ " : "   "}{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Context Menu (Right-Click Popup) ----
function ContextMenu({ x, y, items, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "fixed", left: x, top: y,
      border: "2px solid #000", background: "#fff",
      boxShadow: "2px 2px 0 #000", zIndex: 500, minWidth: 170
    }}>
      {items.map((item, i) => (
        item === "─"
          ? <div key={i} style={{ borderTop: "1px dashed #000", margin: "2px 0" }} />
          : <div key={i}
              onClick={() => { onSelect(item); onClose(); }}
              onMouseEnter={e => { e.target.style.background = "#000"; e.target.style.color = "#fff"; }}
              onMouseLeave={e => { e.target.style.background = "#fff"; e.target.style.color = "#000"; }}
              style={{ padding: "3px 16px", cursor: "pointer", fontFamily: CHICAGO, fontSize: 12, whiteSpace: "nowrap" }}
            >{item}</div>
      ))}
    </div>
  );
}

function AlertDialog({ type, message, onOK }) {
  const icons = { stop: "✋", caution: "⚠️", note: "🖥️" };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{
        border: "3px solid #000", background: "#fff", padding: 16,
        boxShadow: "3px 3px 0 #000", display: "flex", gap: 16,
        alignItems: "flex-start", maxWidth: 300
      }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{icons[type]}</div>
        <div>
          <div style={{ fontFamily: CHICAGO, fontSize: 12, marginBottom: 12 }}>{message}</div>
          <div style={{ textAlign: "right" }}><PushButton label="OK" isDefault onClick={onOK} /></div>
        </div>
      </div>
    </div>
  );
}

function MenuBar({ openMenu, setOpenMenu }) {
  const menus = {
    "🍎": ["About This Macintosh...", "─", "Scrapbook", "Alarm Clock", "Note Pad", "Calculator", "Key Caps", "Control Panel"],
    "File": ["New", "Open...", "Close", "Save", "Save As...", "─", "Page Setup...", "Print...", "─", "Quit"],
    "Edit": ["Undo  ⌘Z", "─", "Cut    ⌘X", "Copy   ⌘C", "Paste  ⌘V", "Clear", "Select All"],
  };
  return (
    <div style={{
      height: 20, background: "#fff", borderBottom: "2px solid #000",
      display: "flex", alignItems: "center", fontFamily: CHICAGO,
      fontSize: 12, position: "relative", zIndex: 200, flexShrink: 0
    }}>
      {Object.keys(menus).map(name => (
        <div key={name} style={{ position: "relative" }}>
          <div onClick={() => setOpenMenu(openMenu === name ? null : name)}
            style={{
              padding: "0 12px", height: 20, display: "flex", alignItems: "center",
              cursor: "pointer",
              background: openMenu === name ? "#000" : "transparent",
              color: openMenu === name ? "#fff" : "#000"
            }}>{name}</div>
          {openMenu === name && (
            <div style={{
              position: "absolute", top: 20, left: 0,
              border: "2px solid #000", background: "#fff",
              boxShadow: "2px 2px 0 #000", minWidth: 180, zIndex: 300
            }}>
              {menus[name].map((item, i) => (
                item === "─"
                  ? <div key={i} style={{ borderTop: "1px dashed #000", margin: "2px 0" }} />
                  : <div key={i} onClick={() => setOpenMenu(null)}
                      onMouseEnter={e => { e.target.style.background = "#000"; e.target.style.color = "#fff"; }}
                      onMouseLeave={e => { e.target.style.background = "#fff"; e.target.style.color = "#000"; }}
                      style={{ padding: "3px 16px", cursor: "pointer", fontFamily: CHICAGO, fontSize: 12, whiteSpace: "nowrap" }}
                    >{item}</div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div style={{ flex: 1 }} />
    </div>
  );
}

function ToolPalette({ selected, onSelect }) {
  const tools = [
    { icon: "✏️", n: "Pencil" }, { icon: "🖌️", n: "Brush" },
    { icon: "🪣", n: "Fill" }, { icon: "🔲", n: "Select" },
    { icon: "✂️", n: "Lasso" }, { icon: "📏", n: "Line" },
    { icon: "⬜", n: "Rect" }, { icon: "⭕", n: "Oval" },
    { icon: "🔤", n: "Text" }, { icon: "🧽", n: "Eraser" },
    { icon: "💨", n: "Spray" }, { icon: "🔍", n: "Zoom" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid #000", background: "#fff", width: 58 }}>
      {tools.map((t, i) => (
        <div key={i} title={t.n} onClick={() => onSelect(i)}
          style={{
            width: 27, height: 27, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 14,
            background: selected === i ? "#000" : "#fff",
            border: "1px solid #000",
            filter: selected === i ? "invert(1)" : "none"
          }}>{t.icon}</div>
      ))}
    </div>
  );
}

function ProgressBar({ value, width = 220 }) {
  return (
    <div style={{ width, height: 16, border: "2px solid #000", background: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`,
        backgroundImage: `url(${stripePattern})`, backgroundRepeat: "repeat",
        transition: "width 0.3s ease"
      }} />
    </div>
  );
}

function TabControl({ tabs, activeTab, setActiveTab, children }) {
  return (
    <div>
      <div style={{ display: "flex", marginBottom: -2 }}>
        {tabs.map((tab, i) => (
          <div key={i} onClick={() => setActiveTab(i)}
            style={{
              fontFamily: CHICAGO, fontSize: 11, padding: "4px 14px",
              border: "2px solid #000",
              borderBottom: activeTab === i ? "2px solid #fff" : "2px solid #000",
              background: activeTab === i ? "#fff" : `url(${stripePattern})`,
              cursor: "pointer", position: "relative", zIndex: activeTab === i ? 2 : 1,
              borderRadius: "4px 4px 0 0", marginRight: -1
            }}>{tab}</div>
        ))}
      </div>
      <div style={{ border: "2px solid #000", background: "#fff", padding: 12, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function DesktopIcon({ icon, label, x, y }) {
  const [selected, setSelected] = useState(false);
  return (
    <div onClick={() => setSelected(!selected)}
      style={{
        position: "absolute", left: x, top: y,
        display: "flex", flexDirection: "column", alignItems: "center",
        cursor: "pointer", width: 64
      }}>
      <div style={{
        fontSize: 28, padding: 4,
        background: selected ? "#000" : "transparent",
        filter: selected ? "invert(1)" : "none", borderRadius: 2
      }}>{icon}</div>
      <div style={{
        fontFamily: CHICAGO, fontSize: 10, textAlign: "center",
        background: selected ? "#000" : "transparent",
        color: selected ? "#fff" : "#000",
        padding: "1px 3px", marginTop: 1, whiteSpace: "nowrap"
      }}>{label}</div>
    </div>
  );
}

function DisclosureTriangle({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ fontFamily: CHICAGO, fontSize: 12, marginBottom: 4 }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", fontSize: 10 }}>▶</span>
        <span>{label}</span>
      </div>
      {open && <div style={{ marginLeft: 16, marginTop: 2 }}>{children}</div>}
    </div>
  );
}

// ---- Smalltalk Halos ----
function HaloTarget({ children, label }) {
  const [showHalo, setShowHalo] = useState(false);

  const handles = [
    { x: "-12px", y: "-12px", color: "#e22", emoji: "✕", title: "Delete" },
    { x: "calc(50% - 10px)", y: "-12px", color: "#28f", emoji: "🔍", title: "Inspect" },
    { x: "calc(100% - 8px)", y: "-12px", color: "#2a2", emoji: "📋", title: "Duplicate" },
    { x: "-12px", y: "calc(50% - 10px)", color: "#f80", emoji: "🔄", title: "Rotate" },
    { x: "calc(100% - 8px)", y: "calc(50% - 10px)", color: "#a3f", emoji: "↔️", title: "Resize" },
    { x: "-12px", y: "calc(100% - 8px)", color: "#0bb", emoji: "👁️", title: "Browse" },
    { x: "calc(50% - 10px)", y: "calc(100% - 8px)", color: "#f5a", emoji: "✋", title: "Grab" },
    { x: "calc(100% - 8px)", y: "calc(100% - 8px)", color: "#cb0", emoji: "📐", title: "Debug" },
  ];

  return (
    <div
      onMouseEnter={() => setShowHalo(true)}
      onMouseLeave={() => setShowHalo(false)}
      style={{ position: "relative", display: "inline-block", padding: 14 }}
    >
      {showHalo && (
        <>
          <div style={{
            position: "absolute", inset: 8, border: "2px dashed #555",
            pointerEvents: "none", zIndex: 10
          }} />
          {handles.map((h, i) => (
            <div key={i} title={h.title}
              style={{
                position: "absolute", left: h.x, top: h.y,
                width: 20, height: 20, borderRadius: "50%",
                background: h.color, border: "2px solid #000",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, cursor: "pointer", zIndex: 11,
                boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                transition: "transform 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >{h.emoji}</div>
          ))}
          <div style={{
            position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
            fontFamily: CHICAGO, fontSize: 9, background: "#ff0",
            border: "1px solid #000", padding: "1px 5px", whiteSpace: "nowrap", zIndex: 12
          }}>{label}</div>
        </>
      )}
      <div style={{ position: "relative", zIndex: 5 }}>{children}</div>
    </div>
  );
}


// ==== MAIN APP ====
export default function MacOS1Demo() {
  const [openMenu, setOpenMenu] = useState(null);
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);
  const [checkC, setCheckC] = useState(true);
  const [radio, setRadio] = useState(0);
  const [textVal, setTextVal] = useState("Hello, Macintosh!");
  const [listSel, setListSel] = useState(2);
  const [showAlert, setShowAlert] = useState(null);
  const [tool, setTool] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [dropdown, setDropdown] = useState(1);
  const [ctxMenu, setCtxMenu] = useState(null);
  const progressRef = useRef(null);

  useEffect(() => {
    progressRef.current = setInterval(() => {
      setProgress(p => p >= 100 ? 0 : p + 2);
    }, 150);
    return () => clearInterval(progressRef.current);
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const listItems = ["System Folder", "MacPaint", "MacWrite", "Finder", "Scrapbook", "Note Pad", "Calculator"];
  const dropdownOptions = ["Geneva", "Chicago", "Monaco", "New York", "Athens", "Cairo"];

  return (
    <div
      onClick={() => { openMenu && setOpenMenu(null); }}
      onContextMenu={handleContextMenu}
      style={{
        width: "100%", height: "100vh",
        backgroundImage: `url(${desktopPattern})`, backgroundRepeat: "repeat",
        fontFamily: CHICAGO, color: "#000",
        display: "flex", flexDirection: "column",
        overflow: "hidden", position: "relative",
        imageRendering: "pixelated"
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        <MenuBar openMenu={openMenu} setOpenMenu={setOpenMenu} />
      </div>

      <DesktopIcon icon="💾" label="Macintosh HD" x={16} y={36} />
      <DesktopIcon icon="🗑️" label="Trash" x={16} y={540} />

      {/* ---- Main Widget Window ---- */}
      <MacWindow title="System 1 Widgets" x={90} y={32} width={480} height={395} zIndex={2}>
        <div style={{ padding: 12 }}>
          <div style={{ fontFamily: CHICAGO, fontSize: 10, color: "#888", marginBottom: 4 }}>PUSH BUTTONS</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <PushButton label="OK" isDefault onClick={() => setShowAlert("note")} />
            <PushButton label="Cancel" />
            <PushButton label="Disabled" disabled />
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>CHECKBOXES</div>
              <Checkbox label="Bold" checked={checkA} onChange={() => setCheckA(!checkA)} />
              <Checkbox label="Italic" checked={checkB} onChange={() => setCheckB(!checkB)} />
              <Checkbox label="Underline" checked={checkC} onChange={() => setCheckC(!checkC)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>RADIO BUTTONS</div>
              <RadioButton label="9 point" selected={radio === 0} onChange={() => setRadio(0)} />
              <RadioButton label="10 point" selected={radio === 1} onChange={() => setRadio(1)} />
              <RadioButton label="12 point" selected={radio === 2} onChange={() => setRadio(2)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>DROPDOWN SELECTOR</div>
              <DropdownSelector options={dropdownOptions} selected={dropdown} onSelect={setDropdown} />
            </div>
          </div>

          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>TEXT FIELD</div>
          <div style={{ marginBottom: 14 }}>
            <TextField value={textVal} onChange={e => setTextVal(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>LIST BOX</div>
              <ListBox items={listItems} selected={listSel} onSelect={setListSel} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>DISCLOSURE TRIANGLES</div>
              <DisclosureTriangle label="System Folder">
                <div style={{ fontSize: 12 }}>System</div>
                <div style={{ fontSize: 12 }}>Finder</div>
                <DisclosureTriangle label="Extensions">
                  <div style={{ fontSize: 12 }}>Chooser</div>
                  <div style={{ fontSize: 12 }}>ImageWriter</div>
                </DisclosureTriangle>
              </DisclosureTriangle>
              <DisclosureTriangle label="Applications">
                <div style={{ fontSize: 12 }}>MacPaint</div>
                <div style={{ fontSize: 12 }}>MacWrite</div>
              </DisclosureTriangle>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>SCROLL BARS</div>
          <div style={{ position: "relative", width: 220, height: 60, border: "1px solid #000", marginBottom: 6 }}>
            <ScrollBar vertical value={25} />
            <ScrollBar vertical={false} value={40} />
          </div>
        </div>
      </MacWindow>

      {/* ---- Tool Palette ---- */}
      <MacWindow title="Tools" x={590} y={32} width={90} height={346} zIndex={3}>
        <div style={{ padding: 8, display: "flex", justifyContent: "center" }}>
          <ToolPalette selected={tool} onSelect={setTool} />
        </div>
      </MacWindow>

      {/* ---- Halos Demo ---- */}
      <MacWindow title="Smalltalk Halos" x={590} y={396} width={160} height={200} zIndex={5}>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: CHICAGO, fontSize: 10, color: "#888", textAlign: "center" }}>HOVER TO SEE HALOS</div>
          <HaloTarget label="a Button">
            <PushButton label="Morph" />
          </HaloTarget>
          <HaloTarget label="a StringMorph">
            <div style={{
              fontFamily: CHICAGO, fontSize: 14,
              border: "1px solid #000", padding: "4px 10px", background: "#fff"
            }}>Hello World</div>
          </HaloTarget>
        </div>
      </MacWindow>

      {/* ---- Progress & Tabs ---- */}
      <MacWindow title="More Widgets  ·  Right-click anywhere for popup menu" x={130} y={442} width={440} height={170} zIndex={4}>
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>PROGRESS BAR</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <ProgressBar value={progress} width={200} />
            <span style={{ fontFamily: CHICAGO, fontSize: 11 }}>Copying files… {Math.round(progress)}%</span>
          </div>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>TAB CONTROL</div>
          <TabControl tabs={["General", "Sound", "Mouse"]} activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 0 && (
              <div style={{ fontFamily: CHICAGO, fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}>Desktop Pattern: Standard</div>
                <div>Time: {new Date().toLocaleTimeString()}</div>
              </div>
            )}
            {activeTab === 1 && (
              <div style={{ fontFamily: CHICAGO, fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}>Speaker Volume</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10 }}>🔈</span>
                  <div style={{ width: 120, height: 8, border: "2px solid #000", background: "#fff", position: "relative" }}>
                    <div style={{ width: "60%", height: "100%", background: "#000" }} />
                  </div>
                  <span style={{ fontSize: 10 }}>🔊</span>
                </div>
              </div>
            )}
            {activeTab === 2 && (
              <div style={{ fontFamily: CHICAGO, fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}>Double-Click Speed</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <RadioButton label="Slow" selected={true} onChange={() => {}} />
                  <RadioButton label="Fast" selected={false} onChange={() => {}} />
                </div>
              </div>
            )}
          </TabControl>
        </div>
      </MacWindow>

      {/* Alert overlay */}
      {showAlert && (
        <AlertDialog type={showAlert}
          message={
            showAlert === "stop" ? "The application has unexpectedly quit."
            : showAlert === "caution" ? "Are you sure you want to erase the disk?"
            : "Welcome to Macintosh."
          }
          onOK={() => setShowAlert(null)}
        />
      )}

      {/* Right-Click Context Menu */}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y}
          items={[
            "Get Info", "Duplicate", "─",
            "Open", "Open With…", "─",
            "Move to Trash", "─",
            "Inspect (Smalltalk)", "Browse Senders", "Browse Implementors"
          ]}
          onSelect={(item) => {
            if (item === "Get Info") setShowAlert("note");
            else if (item === "Move to Trash") setShowAlert("caution");
            else if (item.startsWith("Inspect") || item.startsWith("Browse")) setShowAlert("stop");
          }}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
