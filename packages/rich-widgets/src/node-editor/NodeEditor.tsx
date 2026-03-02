import { useState, useRef, useCallback, useEffect } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { GraphNode, Connection, TempConnection } from './types';
import { NODE_WIDTH } from './types';
import { INITIAL_NODES, INITIAL_CONNECTIONS } from './sampleData';

// ── Helpers ──────────────────────────────────────────────────────────
function getPortPosition(
  nodes: GraphNode[],
  portId: string,
): { x: number; y: number } {
  for (const node of nodes) {
    for (let i = 0; i < node.inputs.length; i++) {
      if (node.inputs[i].id === portId) {
        const headerH = 22;
        const fieldsH = node.fields.length * 24;
        const inputY = headerH + fieldsH + 12 + i * 22 + 8;
        return { x: node.x + 2, y: node.y + inputY };
      }
    }
    for (let i = 0; i < node.outputs.length; i++) {
      if (node.outputs[i].id === portId) {
        const headerH = 22;
        const fieldsH = node.fields.length * 24;
        const outputY = headerH + fieldsH + 12 + i * 22 + 8;
        return { x: node.x + NODE_WIDTH - 2, y: node.y + outputY };
      }
    }
  }
  return { x: 0, y: 0 };
}

// ── ConnectionSVG ────────────────────────────────────────────────────
function ConnectionSVG({
  nodes,
  connections,
  tempConn,
}: {
  nodes: GraphNode[];
  connections: Connection[];
  tempConn: TempConnection | null;
}) {
  const allConns: (Connection | TempConnection)[] = tempConn
    ? [...connections, tempConn]
    : connections;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <marker
          id="dot"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="6"
          markerHeight="6"
        >
          <circle cx="3" cy="3" r="2.5" fill="var(--hc-color-fg, #000)" />
        </marker>
      </defs>
      {allConns.map((conn, ci) => {
        const isTemp = conn === tempConn;
        const from =
          (conn as TempConnection).fromPos ||
          getPortPosition(nodes, conn.from);
        const to =
          (conn as TempConnection).toPos ||
          getPortPosition(nodes, conn.to!);
        const dx = Math.abs(to.x - from.x) * 0.5;
        const path = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
        return (
          <path
            key={ci}
            d={path}
            fill="none"
            stroke="var(--hc-color-fg, #000)"
            strokeWidth={isTemp ? 1.5 : 2}
            strokeDasharray={isTemp ? '4 3' : 'none'}
            markerStart="url(#dot)"
            markerEnd="url(#dot)"
          />
        );
      })}
    </svg>
  );
}

// ── NodeComponent ────────────────────────────────────────────────────
function NodeComponent({
  node,
  selected,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
}: {
  node: GraphNode;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (
    e: React.MouseEvent,
    portId: string,
    portType: string,
    nodeId: string,
  ) => void;
  onPortMouseUp: (
    e: React.MouseEvent,
    portId: string,
    portType: string,
    nodeId: string,
  ) => void;
}) {
  return (
    <div
      data-part={RICH_PARTS.nodeEditorNode}
      data-state={selected ? 'selected' : undefined}
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).dataset.port) return;
        onMouseDown(e, node.id);
      }}
    >
      {/* Title bar */}
      <div data-part={RICH_PARTS.nodeEditorNodeHeader}>
        <span>
          {node.icon} {node.title}
        </span>
      </div>

      {/* Fields */}
      <div data-part={RICH_PARTS.nodeEditorNodeFields}>
        {node.fields.map((f, fi) => (
          <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20 }}>
            <span style={{ fontSize: 10, opacity: 0.6, minWidth: 40 }}>
              {f.label}:
            </span>
            <span
              data-part="field-input"
              style={{ flex: 1, fontSize: 10, padding: '1px 4px' }}
            >
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* Ports */}
      <div data-part={RICH_PARTS.nodeEditorNodePorts}>
        {node.outputs.map((port, pi) => (
          <div
            key={`o-${pi}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: 18,
              padding: '2px 6px 2px 8px',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 9, opacity: 0.6 }}>{port.label}</span>
            <div
              data-part={RICH_PARTS.nodeEditorPort}
              data-port={port.id}
              data-port-type="output"
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown(e, port.id, 'output', node.id);
              }}
            />
          </div>
        ))}
        {node.inputs.map((port, pi) => (
          <div
            key={`i-${pi}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 18,
              padding: '2px 8px 2px 6px',
              gap: 4,
            }}
          >
            <div
              data-part={RICH_PARTS.nodeEditorPort}
              data-port={port.id}
              data-port-type="input"
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown(e, port.id, 'input', node.id);
              }}
              onMouseUp={(e) => onPortMouseUp(e, port.id, 'input', node.id)}
            />
            <span style={{ fontSize: 9, opacity: 0.6 }}>{port.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────
export interface NodeEditorProps {
  initialNodes?: GraphNode[];
  initialConnections?: Connection[];
}

// ── Component ────────────────────────────────────────────────────────
export function NodeEditor({
  initialNodes = INITIAL_NODES,
  initialConnections = INITIAL_CONNECTIONS,
}: NodeEditorProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [connections, setConnections] = useState(initialConnections);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{
    startX: number;
    startY: number;
  } | null>(null);
  const [tempConn, setTempConn] = useState<TempConnection | null>(null);
  const [drawingFrom, setDrawingFrom] = useState<{
    portId: string;
    nodeId: string;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setSelected(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setDragging({
        nodeId,
        offsetX: e.clientX - node.x - pan.x,
        offsetY: e.clientY - node.y - pan.y,
      });
    },
    [nodes, pan],
  );

  const handlePortMouseDown = useCallback(
    (
      e: React.MouseEvent,
      portId: string,
      portType: string,
      nodeId: string,
    ) => {
      if (portType === 'output') {
        const pos = getPortPosition(nodes, portId);
        setDrawingFrom({ portId, nodeId });
        setTempConn({
          from: portId,
          fromPos: pos,
          to: null,
          toPos: { x: e.clientX - pan.x, y: e.clientY - pan.y },
        });
      }
    },
    [nodes, pan],
  );

  const handlePortMouseUp = useCallback(
    (
      _e: React.MouseEvent,
      portId: string,
      portType: string,
      nodeId: string,
    ) => {
      if (
        drawingFrom &&
        portType === 'input' &&
        drawingFrom.nodeId !== nodeId
      ) {
        const exists = connections.some(
          (c) => c.from === drawingFrom.portId && c.to === portId,
        );
        if (!exists) {
          setConnections((prev) => [
            ...prev,
            { from: drawingFrom.portId, to: portId },
          ]);
        }
      }
      setDrawingFrom(null);
      setTempConn(null);
    },
    [drawingFrom, connections],
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === canvasRef.current ||
        (e.target as HTMLElement).tagName === 'svg'
      ) {
        setSelected(null);
        setPanning({ startX: e.clientX - pan.x, startY: e.clientY - pan.y });
      }
    },
    [pan],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging.nodeId
              ? {
                  ...n,
                  x: e.clientX - dragging.offsetX - pan.x,
                  y: e.clientY - dragging.offsetY - pan.y,
                }
              : n,
          ),
        );
      }
      if (panning) {
        setPan({
          x: e.clientX - panning.startX,
          y: e.clientY - panning.startY,
        });
      }
      if (drawingFrom && tempConn && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setTempConn((prev) =>
          prev
            ? {
                ...prev,
                toPos: {
                  x: e.clientX - rect.left - pan.x,
                  y: e.clientY - rect.top - pan.y,
                },
              }
            : null,
        );
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setPanning(null);
      setDrawingFrom(null);
      setTempConn(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, panning, pan, drawingFrom, tempConn]);

  const handleDelete = () => {
    if (!selected) return;
    setNodes((prev) => prev.filter((n) => n.id !== selected));
    setConnections((prev) =>
      prev.filter(
        (c) => !c.from.startsWith(selected) && !c.to.startsWith(selected),
      ),
    );
    setSelected(null);
  };

  const handleAddNode = () => {
    const id = `n${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id,
        x: 200 - pan.x,
        y: 200 - pan.y,
        title: 'New Filter',
        icon: '✨',
        inputs: [{ id: `${id}-in-0`, label: 'Input', type: 'image' }],
        outputs: [{ id: `${id}-out-0`, label: 'Output', type: 'image' }],
        fields: [{ label: 'Param', value: '0' }],
      },
    ]);
  };

  return (
    <div data-part={RICH_PARTS.nodeEditor}>
      {/* ── Toolbar ── */}
      <div data-part={RICH_PARTS.nodeEditorToolbar}>
        <Btn onClick={handleAddNode} style={{ fontSize: 10 }}>
          + Add Node
        </Btn>
        <Btn onClick={handleDelete} style={{ fontSize: 10 }}>
          Delete
        </Btn>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, opacity: 0.6 }}>
          Nodes: {nodes.length} | Connections: {connections.length}
        </span>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        data-part={RICH_PARTS.nodeEditorCanvas}
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: panning ? 'grabbing' : 'default' }}
      >
        {/* Grid dots */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${pan.x % 32} ${pan.y % 32})`}
            >
              <circle
                cx="0"
                cy="0"
                r="0.8"
                fill="var(--hc-color-fg, rgba(0,0,0,0.15))"
                opacity="0.15"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <ConnectionSVG
            nodes={nodes}
            connections={connections}
            tempConn={tempConn}
          />
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              selected={selected === node.id}
              onMouseDown={handleNodeMouseDown}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseUp={handlePortMouseUp}
            />
          ))}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div data-part={RICH_PARTS.nodeEditorStatusBar}>
        <span>
          {selected
            ? `Selected: ${nodes.find((n) => n.id === selected)?.title || '—'}`
            : 'Ready'}
        </span>
        <span>
          Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})
        </span>
      </div>
    </div>
  );
}
