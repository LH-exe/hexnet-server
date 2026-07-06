"use client";
import { useEffect, useState } from 'react';

// --- Brutalist SVG Equity Curve Renderer ---
const TerminalSparkline = ({ data, color }) => {
  let parsedData = [];
  try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } 
  catch (e) { return <span style={{color: 'var(--term-red)'}}>ERR_DATA</span>; }
  
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{color: 'var(--term-muted)'}}>NO_TRADES</span>;
  
  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const points = parsedData.map((val, i) => `${(i / (parsedData.length - 1)) * 100},${100 - ((val - min) / range) * 100}`).join(' ');
  const zeroY = 100 - ((0 - min) / range) * 100;

  return (
    <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{ width: '100%', minWidth: '120px', height: '40px', overflow: 'visible' }}>
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="var(--term-muted)" strokeWidth="0.5" strokeDasharray="2,2" />}
      <polyline fill="none" stroke={color || "var(--term-cyan)"} strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export default function HexnetCLI() {
  const [activeTab, setActiveTab] = useState('portfolio'); // PORTFOLIO is now default
  const [cmdState, setCmdState] = useState(null);
  const [csvData, setCsvData] = useState([]);
  
  // Fake state for portfolio placeholders
  const [liveMetrics] = useState({
    balance: "100,000.00",
    equity: "100,000.00",
    openPnL: "0.00",
    dailyPnL: "0.00",
    margin: "0.00",
    status: "DISCONNECTED",
  });

  // Fetch logic (Kept exactly the same from your backend)
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/command');
        const data = await res.json();
        setCmdState(data);
      } catch (err) { console.error("CLI Fetch Err:", err); }
    };
    const fetchCsv = async () => {
      try {
        const res = await fetch('/api/upload');
        const data = await res.json();
        if (data && data.length > 0) setCsvData(data);
      } catch (err) { console.error("CSV Fetch Err:", err); }
    };
    
    fetchState(); fetchCsv();
    const interval = setInterval(() => { fetchState(); fetchCsv(); }, 1000);
    return () => clearInterval(interval);
  }, []);

  // CLI Styling Objects
  const containerStyle = { padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' };
  const headerStyle = { borderBottom: '1px solid var(--term-green)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' };
  const tabContainerStyle = { display: 'flex', gap: '15px', borderBottom: '1px solid var(--term-border)' };
  
  const getTabStyle = (tabName) => ({
    background: 'transparent',
    border: 'none',
    color: activeTab === tabName ? 'var(--term-cyan)' : 'var(--term-muted)',
    fontFamily: 'inherit',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '10px 0',
    textTransform: 'uppercase',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    letterSpacing: '1px'
  });

  const panelStyle = { border: '1px solid var(--term-border)', padding: '20px', background: '#020202' };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle} className="boot-seq-1">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '2px', color: 'var(--term-white)' }}>
            HEXNET_CORE <span style={{ color: 'var(--term-green)' }}>v2.9.9.9.8.1</span>
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--term-muted)', marginTop: '5px' }}>
            LOCAL_TIME: {new Date().toLocaleTimeString()} | SYSTEM: LIVE_FIRE_READY
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px' }}>
          ENGINE_STATUS: 
          <span style={{ color: cmdState?.engine_status === 'online' ? 'var(--term-green)' : 'var(--term-red)', marginLeft: '10px' }}>
            [{cmdState?.engine_status ? cmdState.engine_status.toUpperCase() : 'OFFLINE'}]
          </span>
          <span className="cursor-blink"></span>
        </div>
      </div>

      {/* CLI NAVIGATION */}
      <div style={tabContainerStyle} className="boot-seq-2">
        <button style={getTabStyle('portfolio')} onClick={() => setActiveTab('portfolio')}>
          {activeTab === 'portfolio' ? '> [ PORTFOLIO ]' : '[ PORTFOLIO ]'}
        </button>
        <button style={getTabStyle('generator')} onClick={() => setActiveTab('generator')}>
          {activeTab === 'generator' ? '> [ GENERATOR ]' : '[ GENERATOR ]'}
        </button>
        <button style={getTabStyle('live')} onClick={() => setActiveTab('live')}>
          {activeTab === 'live' ? '> [ LIVE_DATA ]' : '[ LIVE_DATA ]'}
        </button>
      </div>

      {/* --- TAB 1: PORTFOLIO (DEFAULT) --- */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          
          {/* Connection Banner */}
          <div style={{ ...panelStyle, borderColor: 'var(--term-red)', color: 'var(--term-red)', display: 'flex', justifyContent: 'space-between' }}>
            <span>WARN: PROP_FIRM_API_NOT_CONNECTED</span>
            <span>AWAITING_CREDENTIALS</span>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div style={panelStyle}>
              <div style={{ color: 'var(--term-muted)', fontSize: '12px', marginBottom: '10px' }}>ACCT_BALANCE</div>
              <div style={{ fontSize: '24px', color: 'var(--term-white)' }}>${liveMetrics.balance}</div>
            </div>
            <div style={panelStyle}>
              <div style={{ color: 'var(--term-muted)', fontSize: '12px', marginBottom: '10px' }}>OPEN_PNL</div>
              <div style={{ fontSize: '24px', color: 'var(--term-green)' }}>${liveMetrics.openPnL}</div>
            </div>
            <div style={panelStyle}>
              <div style={{ color: 'var(--term-muted)', fontSize: '12px', marginBottom: '10px' }}>DAILY_PNL</div>
              <div style={{ fontSize: '24px', color: 'var(--term-green)' }}>${liveMetrics.dailyPnL}</div>
            </div>
            <div style={panelStyle}>
              <div style={{ color: 'var(--term-muted)', fontSize: '12px', marginBottom: '10px' }}>USED_MARGIN</div>
              <div style={{ fontSize: '24px', color: 'var(--term-white)' }}>${liveMetrics.margin}</div>
            </div>
          </div>

          {/* Trade History Placeholder */}
          <div style={panelStyle}>
            <div style={{ color: 'var(--term-cyan)', marginBottom: '15px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '10px' }}>
              ~/hexnet/logs/execution_history.log
            </div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ color: 'var(--term-muted)' }}>
                  <th style={{ paddingBottom: '10px' }}>TIMESTAMP</th>
                  <th style={{ paddingBottom: '10px' }}>SYMBOL</th>
                  <th style={{ paddingBottom: '10px' }}>SIDE</th>
                  <th style={{ paddingBottom: '10px' }}>QTY</th>
                  <th style={{ paddingBottom: '10px' }}>PRICE</th>
                  <th style={{ paddingBottom: '10px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" style={{ paddingTop: '20px', color: 'var(--term-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                    > NO_EXECUTIONS_FOUND. SYSTEM IDLE.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2 & 3 PLACEHOLDERS (We will migrate your tables here next) --- */}
      {activeTab === 'generator' && (
        <div style={panelStyle} className="boot-seq-3">
          <div style={{ color: 'var(--term-cyan)' }}>~/hexnet/modules/generator.sh --status running</div>
          {/* Your massive CSV table will go back in here, styled for CLI */}
          <p style={{ marginTop: '20px' }}>> GENERATOR UI PORTING IN PROGRESS...</p>
        </div>
      )}

      {activeTab === 'live' && (
        <div style={panelStyle} className="boot-seq-3">
          <div style={{ color: 'var(--term-cyan)' }}>~/hexnet/modules/backtest_stream.sh</div>
          <p style={{ marginTop: '20px' }}>> LIVE DATA UI PORTING IN PROGRESS...</p>
        </div>
      )}

    </div>
  );
}
