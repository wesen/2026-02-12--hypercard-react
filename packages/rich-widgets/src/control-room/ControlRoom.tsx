import { useState, useEffect } from 'react';
import { RICH_PARTS as P } from '../parts';
import type { LogLine, SwitchState, SwitchKey } from './types';
import {
  AnalogGauge,
  BarMeter,
  HorizontalBar,
  LED,
  ToggleSwitch,
  SevenSeg,
  Knob,
  ScrollLog,
  Scope,
} from './instruments';

// ── Props ────────────────────────────────────────────────────────────
export interface ControlRoomProps {
  /** Tick interval in ms (default 400). */
  tickInterval?: number;
}

// ── Panel sub-component ──────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-part={P.crPanel}>
      <div data-part={P.crPanelHeader}>{title}</div>
      <div data-part={P.crPanelBody}>{children}</div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export function ControlRoom({ tickInterval = 400 }: ControlRoomProps = {}) {
  const [tick, setTick] = useState(0);
  const [sw, setSw] = useState<SwitchState>({ main: true, aux: false, pump: true, alarm: false });
  const [knobVal, setKnobVal] = useState(65);
  const [knob2, setKnob2] = useState(30);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [scopeData, setScopeData] = useState<number[]>([]);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), tickInterval);
    return () => clearInterval(iv);
  }, [tickInterval]);

  // Simulated values
  const temp = 42 + Math.sin(tick * 0.05) * 18 + Math.random() * 5;
  const pressure = 60 + Math.sin(tick * 0.03) * 25 + Math.random() * 8;
  const rpm = 2000 + Math.sin(tick * 0.02) * 800 + Math.random() * 200;
  const flow = knobVal * 0.95 + Math.random() * 5;
  const load = knob2 * 1.1 + Math.random() * 3;
  const cpu = 30 + Math.sin(tick * 0.07) * 25 + Math.random() * 10;
  const mem = 55 + Math.sin(tick * 0.04) * 15 + Math.random() * 5;
  const net = 20 + Math.sin(tick * 0.09) * 18 + Math.random() * 8;
  const disk = 40 + Math.sin(tick * 0.01) * 10;

  // Scope data
  useEffect(() => {
    setScopeData((prev) => {
      const n = [...prev, Math.sin(tick * 0.15) * 0.7 + Math.random() * 0.3 - 0.15];
      return n.length > 100 ? n.slice(-100) : n;
    });
  }, [tick]);

  // Log messages
  useEffect(() => {
    if (tick % 5 === 0 && tick > 0) {
      const msgs: Omit<LogLine, 'time'>[] = [
        { msg: 'SYS: Telemetry nominal', type: 'ok' },
        { msg: 'PUMP: Flow rate adjusted', type: 'ok' },
        { msg: 'WARN: Pressure approaching limit', type: 'warn' },
        { msg: 'NET: Packet loss detected (0.2%)', type: 'warn' },
        { msg: 'SYS: Checkpoint saved', type: 'ok' },
        { msg: 'THERM: Coolant temp within range', type: 'ok' },
      ];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      const now = new Date();
      const ts =
        String(now.getHours()).padStart(2, '0') +
        ':' +
        String(now.getMinutes()).padStart(2, '0') +
        ':' +
        String(now.getSeconds()).padStart(2, '0');
      setLogs((prev) => [...prev.slice(-30), { time: ts, ...m }]);
    }
  }, [tick]);

  const tog = (k: SwitchKey) => setSw((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div data-part={P.controlRoom}>
      {/* Title bar */}
      <div data-part={P.crTitleBar}>
        <span>{'\uD83D\uDDA5\uFE0F'}</span>
        <span data-part={P.crTitleText}>SYSTEM CONTROL \u2014 STATION 7</span>
        <span>{'\u2699\uFE0F'}</span>
      </div>

      {/* Dashboard panels */}
      <div data-part={P.crDashboard}>
        {/* Primary Gauges */}
        <Panel title="Primary Gauges">
          <div data-part={P.crGaugeRow}>
            <AnalogGauge value={temp} min={0} max={100} label="TEMP" unit={'\u00B0C'} danger={75} size={150} />
            <AnalogGauge value={pressure} min={0} max={100} label="PSI" danger={85} size={150} />
          </div>
        </Panel>

        {/* Engine */}
        <Panel title="Engine">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AnalogGauge value={rpm} min={0} max={4000} label="RPM" danger={3200} size={170} />
          </div>
        </Panel>

        {/* Levels */}
        <Panel title="Levels">
          <div data-part={P.crBarRow}>
            <BarMeter value={flow} max={100} label="FLOW" danger={90} />
            <BarMeter value={load} max={100} label="LOAD" danger={80} />
            <BarMeter value={cpu} max={100} label="CPU" danger={85} />
            <BarMeter value={mem} max={100} label="MEM" danger={90} />
          </div>
        </Panel>

        {/* Digital Readout */}
        <Panel title="Digital Readout">
          <div data-part={P.crDigitalCol}>
            <SevenSeg value={String(Math.round(rpm)).padStart(4, '0')} label="RPM" digits={4} />
            <SevenSeg value={String(temp.toFixed(1)).replace('.', '').padStart(4, '0')} label="TEMP x10" digits={4} />
            <SevenSeg value={String(Math.round(pressure)).padStart(4, '0')} label="PRESSURE" digits={4} />
          </div>
        </Panel>

        {/* Controls */}
        <Panel title="Controls">
          <div data-part={P.crControlsLayout}>
            <div data-part={P.crKnobRow}>
              <Knob value={knobVal} onChange={setKnobVal} label="FLOW" size={52} />
              <Knob value={knob2} onChange={setKnob2} label="LOAD" size={52} />
            </div>
            <div data-part={P.crToggleCol}>
              <ToggleSwitch on={sw.main} onToggle={() => tog('main')} label="MAIN PWR" />
              <ToggleSwitch on={sw.aux} onToggle={() => tog('aux')} label="AUX SYS" />
              <ToggleSwitch on={sw.pump} onToggle={() => tog('pump')} label="PUMP" />
              <ToggleSwitch on={sw.alarm} onToggle={() => tog('alarm')} label="ALARM" />
            </div>
          </div>
        </Panel>

        {/* Status */}
        <Panel title="Status">
          <div data-part={P.crLedCol}>
            <LED on={sw.main} color="#00AA00" label="MAIN POWER" />
            <LED on={sw.aux} color="#3388FF" label="AUX SYSTEMS" />
            <LED on={sw.pump} color="#00AA00" label="PUMP ACTIVE" />
            <LED on={sw.alarm} color="#FF0000" label="ALARM ARMED" />
            <LED on={temp > 75} color="#FF0000" label="OVER TEMP" />
            <LED on={pressure > 85} color="#CCAA00" label="HIGH PSI" />
            <LED on={tick % 4 < 2} color="#00AA00" label="HEARTBEAT" />
          </div>
        </Panel>

        {/* System Resources */}
        <Panel title="System Resources">
          <div data-part={P.crResourceCol}>
            <HorizontalBar value={cpu} max={100} label="CPU USAGE" />
            <HorizontalBar value={mem} max={100} label="MEMORY" />
            <HorizontalBar value={net} max={100} label="NETWORK I/O" />
            <HorizontalBar value={disk} max={100} label="DISK I/O" />
          </div>
        </Panel>

        {/* Oscilloscope */}
        <Panel title="Oscilloscope">
          <Scope data={scopeData} width={246} height={90} label="CH1 \u2014 SIGNAL" />
          <div data-part={P.crScopeMeta}>
            <span>1ms/div</span>
            <span>500mV/div</span>
          </div>
        </Panel>

        {/* Event Log */}
        <Panel title="Event Log">
          <ScrollLog lines={logs} />
        </Panel>
      </div>

      {/* Status footer */}
      <div data-part={P.crFooter}>
        <span>{'\u23F1\uFE0F'} UPTIME: {Math.floor((tick * 0.4) / 60)}m {Math.floor(tick * 0.4) % 60}s</span>
        <span>{'\uD83C\uDF21\uFE0F'} {temp.toFixed(1)}{'\u00B0C'}</span>
        <span>{'\uD83D\uDCCA'} {Math.round(cpu)}% CPU</span>
        <span>{sw.alarm ? '\uD83D\uDD34 ALARM ARMED' : '\uD83D\uDFE2 NOMINAL'}</span>
      </div>
    </div>
  );
}
