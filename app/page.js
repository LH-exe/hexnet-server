"use client";
import { useEffect, useState, useRef } from 'react';

// --- Safe SVG Individual Line Sparkline Renderer ---
const Sparkline = ({ data, color }) => {
  let parsedData = [];
  try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return <span style={{color: '#526685', fontSize: '11px'}}>ERR_DATA</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{color: '#526685', fontSize: '11px'}}>EMPTY_MAT</span>;
  
  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const points = parsedData.map((val, i) => { return `${(i / (parsedData.length - 1)) * 100},${100 - ((val - min) / range) * 100}`; }).join(' ');
  const zeroY = 100 - ((0 - min) / range) * 100;

  return (
    <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{ width: '100%', minWidth: '140px', height: '34px', overflow: 'visible' }}>
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#152233" strokeDasharray="2" strokeWidth="1" />}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" points={points} />
    </svg>
  );
};

// --- Overhauled Functional Strategy Equity Analytics Canvas Graph (UN-SQUASHED HEIGHT) ---
const FullCanvasGraph = ({ data, strategyName }) => {
  if (!data || data.length === 0) return <span style={{ color: '#526685', fontSize: '11px' }}>[NO TRANSMISSION DATA RECORDED]</span>;
  
  const row = data.find(r => r.Name === strategyName) || data[0];
  if (!row) return <span style={{ color: '#526685', fontSize: '11px' }}>[STRATEGY PROFILE NOT SPECIFIED]</span>;

  let parsedData = [];
  try { parsedData = typeof row.ChartData === 'string' ? JSON.parse(row.ChartData) : row.ChartData; } catch (e) { return <span style={{ color: '#ff3366', fontSize: '11px' }}>[DATA_PARSING_ERROR]</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{ color: '#526685', fontSize: '11px' }}>[ZERO_TICKS_RECORDED]</span>;

  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const totalPoints = parsedData.length;

  const padLeft = 14;
  const padRight = 4;
  const padTop = 6;
  const padBottom = 10;
  
  const graphW = 100 - padLeft - padRight;
  const graphH = 100 - padTop - padBottom;

  const points = parsedData.map((val, i) => {
    const x = padLeft + (i / (totalPoints - 1)) * graphW;
    const y = padTop + graphH - ((val - min) / range) * graphH;
    return `${x},${y}`;
  }).join(' ');

  const zeroY = padTop + graphH - ((0 - min) / range) * graphH;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00f0ff', background: '#020406', padding: '4px 6px', borderBottom: '1px solid #152233', fontWeight: 'bold', marginBottom: '8px', flexShrink: 0 }}>
        <span>ID: {row.Name}</span>
        <span>SHARPE: {row.Sharpe?.toFixed(2)} | PNL: ${row.PnL?.toFixed(2)}</span>
      </div>
      
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Vertical Matrix Grid Intervals */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padLeft + (pct / 100) * graphW;
            return (
              <line key={`v-${pct}`} x1={x} y1={padTop} x2={x} y2={padTop + graphH} stroke="#101a26" strokeWidth="0.25" strokeDasharray="1 1" />
            );
          })}

          {/* Horizontal Matrix Grid Lines & Dynamic Precise Data Labels */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = padTop + (pct / 100) * graphH;
            const val = max - (pct / 100) * range;
            return (
              <g key={`h-${pct}`}>
                <line x1={padLeft} y1={y} x2={100 - padRight} y2={y} stroke="#101a26" strokeWidth="0.25" strokeDasharray="1 1" />
                <text x={padLeft - 2} y={y + 1} fill="#526685" fontSize="3.2" fontBar="monospace" className="select-none" style={{ fontFamily: 'Fira Code', fontWeight: '700' }} textAnchor="end">
                  {val >= 1000 || val <= -1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Calibrated Equity Delta Baseline Marker */}
          {min < 0 && max > 0 && zeroY >= padTop && zeroY <= padTop + graphH && (
            <line x1={padLeft} y1={zeroY} x2={100 - padRight} y2={zeroY} stroke="#ffaa00" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.65" />
          )}

          {/* Trade Progression Horizontal Step Markers */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padLeft + (pct / 100) * graphW;
            const indexMarker = Math.round((pct / 100) * (totalPoints - 1));
            return (
              <text key={`x-${pct}`} x={x} y={100 - 1} fill="#526685" fontSize="3.2" fontBar="monospace" className="select-none" style={{ fontFamily: 'Fira Code', fontWeight: '700' }} textAnchor="middle">
                #{indexMarker}
              </text>
            );
          })}

          {/* Rugged High-Resolution Canvas Metric Polyline Vector */}
          <polyline fill="none" stroke={row.PnL >= 0 ? '#00ff66' : '#ff3366'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" points={points} />
        </svg>
      </div>
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("CONNECTING...");
  const [selectedBacktestStrat, setSelectedBacktestStrat] = useState("");
  
  const isFirstLoad = useRef(true); 
  const previousStatus = useRef('offline');
  const [activeTab, setActiveTab] = useState('portfolio');

  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', mode: 'Generate Random Strategies', strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)', auto: true, auto_max: 10, available_strats: [], active_strats: [], 
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.1, tp_max: 100.0, sl_min: 0.1, sl_max: 100.0, logic_max: 2, 
    ideal_tpd: 3.0, min_tpd: 1.0, ideal_ev: 10.0, min_ev: 0.0, ideal_add: 10.0, max_add: 50.0, 
    ideal_al: 1.0, max_al: 5.0, ideal_wr: 60.0, min_wr: 40.0, ideal_tpd_ret: 80.0, min_tpd_ret: 50.0, ideal_sharpe: 3.0, min_sharpe: 1.0, min_pnl: 0.0, min_wfe: 50.0,
    cw_wr: 1.0, cw_pnl: 1.0, cw_ev: 1.0, cw_sharpe: 1.0, cw_alpha: 1.0, cw_add: 1.0, cw_al: 1.0, cw_tpd_ret: 1.0, cw_tpd: 1.0,
    use_genetic: false, progress: 0, total_sims: 1000, eta: '--:--:--', sims_sec: 0, trade_progress: { current: 0, total: 0 },
    data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A', fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '', fetch_rth: true, fetch_pct: 0,
    is_start: '', is_end: '', oos_list: [{ start: '', end: '' }], hv_start: '', hv_end: '', hv_oos_list: [{ start: '', end: '' }], lv_start: '', lv_end: '', lv_oos_list: [{ start: '', end: '' }], stage_text: '',
    gen_count: 10, debug_csv_data: []
  });

  useEffect(() => {
    let timeoutId;
    const fetchTableData = async () => {
      try {
        const resData = await fetch('/api/upload');
        const jsonData = await resData.json();
        if (jsonData && jsonData.length > 0) setData(jsonData);
      } catch (err) { console.error("Data fetch error:", err); }
    };

    fetchTableData();

    const pollCommandState = async () => {
      if (document.hidden) return; 

      try {
        const resCmd = await fetch('/api/command');
        const jsonCmd = await resCmd.json();
        
        if (jsonCmd) {
          setCmd(prev => {
            if (isFirstLoad.current) {
              isFirstLoad.current = false;
              return jsonCmd;
            }
            return {
              ...prev,
              engine_status: jsonCmd.engine_status, progress: jsonCmd.progress, total_sims: jsonCmd.total_sims, 
              eta: jsonCmd.eta, sims_sec: jsonCmd.sims_sec, data_ticker: jsonCmd.data_ticker, 
              data_start: jsonCmd.data_start, data_end: jsonCmd.data_end, status: jsonCmd.status, 
              fetch_pct: jsonCmd.fetch_pct, stage_text: jsonCmd.stage_text, auto_max: jsonCmd.auto_max,
              gen_count: jsonCmd.gen_count !== undefined ? jsonCmd.gen_count : prev.gen_count,
              trade_progress: jsonCmd.trade_progress || prev.trade_progress,
              available_strats: jsonCmd.available_strats || prev.available_strats,
              active_strats: jsonCmd.active_strats || prev.active_strats,
              ideal_add: jsonCmd.ideal_add !== undefined ? jsonCmd.ideal_add : prev.ideal_add,
              max_add: jsonCmd.max_add !== undefined ? jsonCmd.max_add : prev.max_add,
              ideal_al: jsonCmd.ideal_al !== undefined ? jsonCmd.ideal_al : prev.ideal_al,
              max_al: jsonCmd.max_al !== undefined ? jsonCmd.max_al : prev.max_al,
              ideal_wr: jsonCmd.ideal_wr !== undefined ? jsonCmd.ideal_wr : prev.ideal_wr,
              min_wr: jsonCmd.min_wr !== undefined ? jsonCmd.min_wr : prev.min_wr,
              ideal_tpd_ret: jsonCmd.ideal_tpd_ret !== undefined ? jsonCmd.ideal_tpd_ret : prev.ideal_tpd_ret,
              min_tpd_ret: jsonCmd.min_tpd_ret !== undefined ? jsonCmd.min_tpd_ret : prev.min_tpd_ret,
              ideal_sharpe: jsonCmd.ideal_sharpe !== undefined ? jsonCmd.ideal_sharpe : prev.ideal_sharpe,
              min_sharpe: jsonCmd.min_sharpe !== undefined ? jsonCmd.min_sharpe : prev.min_sharpe,
              min_pnl: jsonCmd.min_pnl !== undefined ? jsonCmd.min_pnl : prev.min_pnl,
              min_wfe: jsonCmd.min_wfe !== undefined ? jsonCmd.min_wfe : prev.min_wfe,
              min_ev: jsonCmd.min_ev !== undefined ? jsonCmd.min_ev : prev.min_ev,
              ideal_tpd: jsonCmd.ideal_tpd !== undefined ? jsonCmd.ideal_tpd : prev.ideal_tpd,
              min_tpd: jsonCmd.min_tpd !== undefined ? jsonCmd.min_tpd : prev.min_tpd,
              cw_add: jsonCmd.cw_add !== undefined ? jsonCmd.cw_add : prev.cw_add,
              cw_al: jsonCmd.cw_al !== undefined ? jsonCmd.cw_al : prev.cw_al,
              cw_tpd_ret: jsonCmd.cw_tpd_ret !== undefined ? jsonCmd.cw_tpd_ret : prev.cw_tpd_ret,
              cw_tpd: jsonCmd.cw_tpd !== undefined ? jsonCmd.cw_tpd : prev.cw_tpd,
              oos_list: jsonCmd.oos_list || prev.oos_list,
              hv_oos_list: jsonCmd.hv_oos_list || prev.hv_oos_list,
              lv_oos_list: jsonCmd.lv_oos_list || prev.lv_oos_list,
              debug_csv_data: jsonCmd.debug_csv_data || []
            };
          });

          const justFinished = previousStatus.current === 'running' && jsonCmd.engine_status === 'idle';
          const justSynced = previousStatus.current === 'sync_requested' && jsonCmd.status === 'idle';
          
          if (justFinished || justSynced) fetchTableData();
          
          previousStatus.current = jsonCmd.engine_status === 'running' ? 'running' : jsonCmd.status;
        }
        setLastUpdate(new Date().toLocaleTimeString());

        let nextPingDelay = 15000; 
        if (jsonCmd?.engine_status === 'running' || jsonCmd?.engine_status === 'fetching') nextPingDelay = 3000; 
        else if (jsonCmd?.engine_status === 'offline') nextPingDelay = 60000; 
        
        timeoutId = setTimeout(pollCommandState, nextPingDelay);
      } catch (err) { 
        setLastUpdate("SYS_ERROR");
        timeoutId = setTimeout(pollCommandState, 30000); 
      }
    };
    
    pollCommandState();

    const handleVisibilityChange = () => {
      if (!document.hidden) { clearTimeout(timeoutId); pollCommandState(); }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => { clearTimeout(timeoutId); document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, []);
  
  const sendCommand = async (updates) => {
    const newState = { ...cmd, ...updates };
    setCmd(newState);
    await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newState) });
  };

  const handleToggleStrategy = (stratName) => {
    let newActive = [...(cmd.active_strats || [])];
    if (newActive.includes(stratName)) newActive = newActive.filter(s => s !== stratName);
    else newActive.push(stratName);
    sendCommand({ active_strats: newActive });
  };

  const startBacktest = () => {
    setCmd(prev => ({ ...prev, engine_status: 'running', stage_text: 'Calculating Strategy Data...' }));
    sendCommand({ status: 'backtest_requested', mode: 'Backtest Specific Strategies', active_strats: cmd.active_strats });
  };

  const getStatusColor = () => {
    const status = (cmd.engine_status || 'offline').toLowerCase();
    if (status === 'running' || status === 'fetching') return '#00ff66';
    if (status === 'offline') return '#ff3366';
    return '#ffaa00';
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1720px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* GLOBAL TELEMETRY INTERFACE BAR */}
      <div className="animate-cascade seq-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--term-border)', backgroundColor: '#070b11', padding: '12px 18px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.2px' }}>HEXNET DASHBOARD</h1>
            <span style={{ fontSize: '10px', padding: '2px 6px', background: '#0c121c', border: '1px solid var(--term-border)', color: '#526685', fontWeight: 'bold' }}>EXE_2.9.9.9.8.0</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '12px' }}>
            <span style={{ color: getStatusColor(), fontWeight: '700' }}>
              ● CORE_STATUS: {(cmd.engine_status || 'OFFLINE').toUpperCase()}
              {cmd.engine_status === 'fetching' && <span style={{ color: '#00f0ff', marginLeft: '5px' }}>[{cmd.fetch_pct || 0}%]</span>}
            </span>
            <span style={{ color: '#152233' }}>|</span>
            <span style={{ color: '#526685' }}>Last Synced: <span style={{ color: '#cbd5e1', fontWeight: '700' }}>{lastUpdate}</span></span>
          </div>
        </div>

        {/* HUD CORE ACTION SHORTCUTS */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => sendCommand({ status: 'sync_requested' })} disabled={cmd.status === 'sync_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: 'transparent', color: '#ffaa00', border: '1px solid #ffaa00', padding: '6px 14px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', opacity: (cmd.status === 'sync_requested' || cmd.engine_status === 'offline') ? 0.3 : 1 }}>
            {cmd.status === 'sync_requested' ? 'SYNCING...' : '[↻ FORCE_DESKTOP_SYNC]'}
          </button>
          <a href="/api/upload?download=true" download="hexnet_strategies.csv" style={{ backgroundColor: '#00f0ff', color: '#020406', padding: '6px 14px', fontSize: '11px', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
            [↓ DOWNLOAD_MATRICES]
          </a>
          <button onClick={() => {
            if (!cmd.debug_csv_data || cmd.debug_csv_data.length === 0) { alert("Matrix data empty."); return; }
            const headers = ["Category", "Count", "Low", "25%", "Mean", "Median", "75%", "High"];
            const csvContent = [headers.join(","), ...cmd.debug_csv_data.map(row => headers.map(field => `"${row[field] !== undefined ? row[field] : ''}"`).join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob); link.download = "Hexnet_Debug_Stats.csv"; link.click();
          }} style={{ backgroundColor: '#0c121c', color: '#526685', border: '1px solid var(--term-border)', padding: '6px 14px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            [DGN_STATS.LOG]
          </button>
        </div>
      </div>

      {/* BACKGROUND SIMULATION PROGRESS DECK */}
      {cmd.engine_status === 'running' && (
        <div className="animate-cascade seq-0" style={{ background: '#070b11', border: '1px solid var(--term-border)', borderLeft: '3px solid #00f0ff', padding: '12px 16px', marginBottom: '16px' }}>
          {!cmd.stage_text?.includes('Calculating') ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ color: '#ffffff', fontWeight: '700' }}>&gt; {cmd.stage_text || 'PROCESSING SYSTEM TASKS'}</span>
                <span style={{ color: '#00ff66', fontWeight: '700' }}>{((cmd.progress / (cmd.total_sims || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#020406', height: '4px', overflow: 'hidden', border: '1px solid var(--term-border)', marginBottom: '8px' }}>
                <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#00ff66', height: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#526685' }}>
                <span>MUTATIONS: <strong style={{ color: '#cbd5e1' }}>{cmd.progress?.toLocaleString()}</strong> / {cmd.total_sims?.toLocaleString()}</span>
                <span>SPEED: <strong style={{ color: '#af40ff' }}>{cmd.sims_sec?.toLocaleString() || 0} exec/s</strong></span>
                <span>ETA: <strong style={{ color: '#ffaa00' }}>{cmd.eta || '--:--:--'}</strong></span>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#00ff66' }}>
                <span className="pulse-glow">&gt;&gt;</span> MATRIX CONFIGURED: RUNNING LIVE CLUSTER CALCULATION ROUTINES...
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN NAVIGATION WORKSPACE TABS */}
      <div className="animate-cascade seq-1" style={{ display: 'flex', borderBottom: '1px solid var(--term-border)', marginBottom: '16px', gap: '4px' }}>
        <button onClick={() => { setActiveTab('portfolio'); }} style={{ padding: '10px 20px', background: activeTab === 'portfolio' ? '#070b11' : 'transparent', color: activeTab === 'portfolio' ? '#00f0ff' : '#526685', border: '1px solid var(--term-border)', borderBottom: activeTab === 'portfolio' ? '1px solid #070b11' : '1px solid var(--term-border)', cursor: 'pointer', fontSize: '12px', fontWeight: '700', marginBottom: '-1px' }}>
          {activeTab === 'portfolio' ? '■ ' : ''}[PORTFOLIO_PERFORMANCE]
        </button>
        <button onClick={() => { setActiveTab('generator'); }} style={{ padding: '10px 20px', background: activeTab === 'generator' ? '#070b11' : 'transparent', color: activeTab === 'generator' ? '#00f0ff' : '#526685', border: '1px solid var(--term-border)', borderBottom: activeTab === 'generator' ? '1px solid #070b11' : '1px solid var(--term-border)', cursor: 'pointer', fontSize: '12px', fontWeight: '700', marginBottom: '-1px' }}>
          {activeTab === 'generator' ? '■ ' : ''}[STRATEGY_GENERATOR]
        </button>
        <button onClick={() => { setActiveTab('backtester'); }} style={{ padding: '10px 20px', background: activeTab === 'backtester' ? '#070b11' : 'transparent', color: activeTab === 'backtester' ? '#00f0ff' : '#526685', border: '1px solid var(--term-border)', borderBottom: activeTab === 'backtester' ? '1px solid #070b11' : '1px solid var(--term-border)', cursor: 'pointer', fontSize: '12px', fontWeight: '700', marginBottom: '-1px' }}>
          {activeTab === 'backtester' ? '■ ' : ''}[LIVE_BACKTESTER]
        </button>
      </div>

      {/* PRINCIPAL CONSOLE CONTEXT AREA */}
      <div style={{ backgroundColor: '#070b11', border: '1px solid var(--term-border)', padding: '16px', minHeight: '450px' }}>
        
        {/* TAB 1: PORTFOLIO MAIN PERFORMANCE Workspace */}
        {activeTab === 'portfolio' && (
          <div key="viewport-portfolio">
            <div className="animate-cascade seq-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>NET_LIQUIDITY_VAL</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#00ff66', marginTop: '4px' }}>$100,000.00</div>
                <div style={{ fontSize: '10px', color: '#526685', marginTop: '4px' }}>PROP_FIRM ALLOCATION: L1</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>FLOATING_MARGIN_PNL</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#00f0ff', marginTop: '4px' }}>$0.00</div>
                <div style={{ fontSize: '10px', color: '#526685', marginTop: '4px' }}>0 ACTIVE RISK POSITION VECTORS</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>MAX_DAILY_DRAWDOWN_LIMIT</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffaa00', marginTop: '4px' }}>$5,000.00</div>
                <div style={{ fontSize: '10px', color: '#526685', marginTop: '4px' }}>VIOLATION EXPOSURE: LEVEL CLEAN</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>LIVEFIRE_GATE_LINK</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ff3366', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-glow" style={{ fontSize: '14px' }}>■</span> DISCONNECTED_STANDBY
                </div>
              </div>
            </div>

            {/* ACCOUNT CORE HIGH-DENSITY GRID CANVAS GRAPH */}
            <div className="animate-cascade seq-1" style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                <span style={{ color: '#00f0ff', fontWeight: '700' }}>[PORTFOLIO_EQUITY_FEED_REALTIME]</span>
                <span style={{ color: '#526685' }}>COORDINATES: SECURE</span>
              </div>
              <div style={{ height: '220px', position: 'relative', border: '1px dashed var(--term-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px' }}>
                {[105000, 100000, 95000].map((val) => (
                  <div key={val} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(21, 34, 51, 0.15)', height: '25%' }}>
                    <span style={{ fontSize: '10px', color: '#526685' }}>${val.toLocaleString()}</span>
                    <span style={{ fontSize: '10px', color: '#101a26' }}>--------------------------------------------------------------------------------------------------</span>
                  </div>
                ))}
                <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#526685', background: '#020406', padding: '6px 12px', border: '1px solid var(--term-border)' }}>
                    &gt; LOGISTICAL SYSTEM COLD — STANDBY FOR PLATFORM CORE ALLOCATION LINK ARRAYS
                  </div>
                </div>
              </div>
            </div>

            {/* REALTIME SYSTEM STDOUT OUTPUT WRAPPER FEED */}
            <div className="animate-cascade seq-2" style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: '700', marginBottom: '10px' }}>LIVEFIRE_LOG_STREAM (STDOUT)</div>
              <div style={{ fontSize: '12px', color: '#526685', lineHeight: '1.5', background: '#04070a', padding: '10px', border: '1px solid var(--term-border-muted)', height: '110px', overflowY: 'auto' }}>
                <div>[{new Date().toISOString().slice(0,10)} 00:01] <span style={{ color: '#00f0ff' }}>[SYS]</span> Core modules compiled inside local node stack.</div>
                <div>[{new Date().toISOString().slice(0,10)} 00:01] <span style={{ color: '#00f0ff' }}>[KV]</span> Command synchronization matrix loop live.</div>
                <div>[{new Date().toISOString().slice(0,10)} 00:01] <span style={{ color: '#ffaa00' }}>[ROUTER]</span> Prop API broker waiting in clean standby setup parameters.</div>
                <div><span className="pulse-glow" style={{ color: '#00ff66' }}>■</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGY GENERATOR */}
        {activeTab === 'generator' && (
          <div key="viewport-generator">
            {/* DATA ENGINE ROUTING INTERFACE SECTION */}
            <div className="animate-cascade seq-0" style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#00f0ff', fontSize: '13px', fontWeight: '700' }}>[DATA_ROUTING_ENGINE]</h3>
                  <p style={{ margin: '2px 0 0 0', color: '#526685', fontSize: '11px' }}>
                    TICKER: <strong style={{ color: '#ffffff' }}>{cmd.data_ticker}</strong> | WINDOWS: <strong style={{ color: '#ffffff' }}>{cmd.data_start}</strong> TO <strong style={{ color: '#ffffff' }}>{cmd.data_end}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '9px', color: '#526685', fontWeight: '700' }}>TICKER</label>
                    <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '80px', padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '9px', color: '#526685', fontWeight: '700' }}>INTERVAL</label>
                    <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)' }}>
                      <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '9px', color: '#526685', fontWeight: '700' }}>START_DATE</label>
                    <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '9px', color: '#526685', fontWeight: '700' }}>END_DATE</label>
                    <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                  </div>
                  <button onClick={() => sendCommand({ status: 'fetch_requested' })} disabled={cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline'} style={{ background: '#00f0ff', color: '#020406', border: 'none', padding: '0 16px', height: '30px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', opacity: (cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline') ? 0.3 : 1 }}>
                    [ROUTING FETCH]
                  </button>
                </div>
              </div>
            </div>

            {/* GENERATOR SYSTEM WORKSPACE CORE SETTINGS */}
            <div className="animate-cascade seq-1" style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--term-border)', paddingBottom: '12px', marginBottom: '12px' }}>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)', width: '220px' }}>
                  <option>Generate Random Strategies</option>
                  <option>Optimize Existing Strategy</option>
                  <option>Generate Advanced Optimal Strategy</option>
                </select>
                
                {cmd.mode === 'Optimize Existing Strategy' && (
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)', width: '160px' }}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>SIMS:</span>
                  <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)', width: '140px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>GENS:</span>
                  <input type="number" value={cmd.gen_count || 10} onChange={(e) => sendCommand({ gen_count: parseInt(e.target.value) })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)', width: '65px' }} />
                </div>
                
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)', width: '240px' }}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Walk-Forward Efficiency (WFE)</option>
                  <option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option>
                  <option>Strategy Alpha</option>
                  <option>Net PnL</option>
                  <option>Custom Score</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffaa00', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} style={{ accentColor: '#ffaa00' }} /> FILTERS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#af40ff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} style={{ accentColor: '#af40ff' }} /> 🧬GENETIC
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00ff66', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ accentColor: '#00ff66' }} /> LOOP
                    </label>
                    {cmd.auto && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#070b11', border: '1px solid var(--term-border)', padding: '2px 4px', height: '26px' }}>
                        <span style={{ fontSize: '9px', color: '#526685', fontWeight: '700' }}>MAX:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="999" 
                          value={cmd.auto_max || 10} 
                          onChange={(e) => sendCommand({ auto_max: parseInt(e.target.value) || 1 })} 
                          style={{ width: '45px', background: 'transparent', color: '#ffffff', border: 'none', outline: 'none', fontSize: '12px', padding: 0, height: '100%', fontWeight: '700' }} 
                        />
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#00ff66', color: '#020406', border: 'none', padding: '8px 16px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', opacity: (cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline') ? 0.4 : 1 }}>
                    [LAUNCH]
                  </button>
                  <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested'} style={{ backgroundColor: '#ff3366', color: '#ffffff', border: 'none', padding: '8px 16px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', opacity: (cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested') ? 0.4 : 1 }}>
                    [ABORT]
                  </button>
                </div>
              </div>

              {/* DYNAMIC FITNESS CRITERIA WEIGHT CALCULATORS */}
              {cmd.sort === 'Custom Score' && (
                <div className="animate-cascade seq-2" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '10px', background: '#070b11', border: '1px dashed #00f0ff', marginBottom: '12px' }}>
                  {[
                    { label: 'WIN_RATE', key: 'cw_wr' }, { label: 'NET_PNL', key: 'cw_pnl' }, { label: 'EXP_VAL', key: 'cw_ev' },
                    { label: 'SHARPE', key: 'cw_sharpe' }, { label: 'ALPHA', key: 'cw_alpha' }, { label: 'DRAWDOWN', key: 'cw_add' },
                    { label: 'AVG_LOSS', key: 'cw_al' }, { label: 'TPD', key: 'cw_tpd' }, { label: 'TPD_RET', key: 'cw_tpd_ret' }
                  ].map((field) => (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '9px', color: '#526685' }}>{field.label}</label>
                      <input type="number" step="0.1" min="0" max="1" value={cmd[field.key]} onChange={(e) => sendCommand({ [field.key]: parseFloat(e.target.value) })} style={{ width: '70px', padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* TIMEFRAME MODULAR SELECTION GENERATOR */}
              <div className="animate-cascade seq-3">
                {cmd.mode === 'Generate Advanced Optimal Strategy' ? (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ border: '1px solid rgba(255,51,102,0.3)', padding: '12px', background: '#070b11', flex: 1, minWidth: '310px' }}>
                      <label style={{ fontSize: '10px', color: '#ff3366', fontWeight: '700', display: 'block', marginBottom: '4px' }}>HIGH_VOL IN-SAMPLE WINDOW</label>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        <input type="date" value={cmd.hv_start} onChange={(e) => sendCommand({ hv_start: e.target.value })} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                        <input type="date" value={cmd.hv_end} onChange={(e) => sendCommand({ hv_end: e.target.value })} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                      </div>
                      <label style={{ fontSize: '10px', color: '#ff3366', fontWeight: '700', display: 'block', marginBottom: '4px' }}>HIGH_VOL OUT-OF-SAMPLE SLICES</label>
                      {(cmd.hv_oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.hv_oos_list]; l[idx].start = e.target.value; sendCommand({ hv_oos_list: l }); }} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                          <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.hv_oos_list]; l[idx].end = e.target.value; sendCommand({ hv_oos_list: l }); }} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                          {idx > 0 && <button onClick={() => sendCommand({ hv_oos_list: cmd.hv_oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '11px' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ hv_oos_list: [...(cmd.hv_oos_list || []), {start: '', end: ''}] })} style={{ background: 'transparent', color: '#ff3366', border: '1px dashed #ff3366', padding: '4px', fontSize: '10px', fontWeight: '700', width: '100%', marginTop: '4px', cursor: 'pointer' }}>+ ADD_HV_WINDOW_SLICE</button>
                    </div>

                    <div style={{ border: '1px solid rgba(0,255,102,0.3)', padding: '12px', background: '#070b11', flex: 1, minWidth: '310px' }}>
                      <label style={{ fontSize: '10px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '4px' }}>LOW_VOL IN-SAMPLE WINDOW</label>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        <input type="date" value={cmd.lv_start} onChange={(e) => sendCommand({ lv_start: e.target.value })} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                        <input type="date" value={cmd.lv_end} onChange={(e) => sendCommand({ lv_end: e.target.value })} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                      </div>
                      <label style={{ fontSize: '10px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '4px' }}>LOW_VOL OUT-OF-SAMPLE SLICES</label>
                      {(cmd.lv_oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.lv_oos_list]; l[idx].start = e.target.value; sendCommand({ lv_oos_list: l }); }} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                          <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.lv_oos_list]; l[idx].end = e.target.value; sendCommand({ lv_oos_list: l }); }} style={{ padding: '4px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)', fontSize: '11px', flex: 1 }} />
                          {idx > 0 && <button onClick={() => sendCommand({ lv_oos_list: cmd.lv_oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '11px' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ lv_oos_list: [...(cmd.lv_oos_list || []), {start: '', end: ''}] })} style={{ background: 'transparent', color: '#00ff66', border: '1px dashed #00ff66', padding: '4px', fontSize: '10px', fontWeight: '700', width: '100%', marginTop: '4px', cursor: 'pointer' }}>+ ADD_LV_WINDOW_SLICE</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '14px', padding: '12px', background: '#070b11', border: '1px solid var(--term-border)' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '4px' }}>IN-SAMPLE RANGE VALIDATOR</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="date" value={cmd.is_start} onChange={(e) => sendCommand({ is_start: e.target.value })} style={{ padding: '5px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                        <input type="date" value={cmd.is_end} onChange={(e) => sendCommand({ is_end: e.target.value })} style={{ padding: '5px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#af40ff', fontWeight: '700', display: 'block', marginBottom: '4px' }}>OUT-OF-SAMPLE BOUND SYSTEM TRACKERS</label>
                      {(cmd.oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].start = e.target.value; sendCommand({ oos_list: newList }); }} style={{ padding: '5px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                          <input type="date" value={oos.end} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].end = e.target.value; sendCommand({ oos_list: newList }); }} style={{ padding: '5px', background: '#020406', color: '#ffffff', border: '1px solid var(--term-border)' }} />
                          {idx > 0 && <button onClick={() => sendCommand({ oos_list: cmd.oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '11px' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ oos_list: [...(cmd.oos_list || []), {start: '', end: ''}] })} style={{ background: 'transparent', color: '#af40ff', border: '1px dashed #af40ff', padding: '4px 10px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '2px' }}>+ ADD_OOS_WINDOW_TRACKER</button>
                    </div>
                  </div>
                )}
              </div>

              {/* STREAMLINED LOW-PROFILE PARAMETER CRITERIA ADVANCED FILTER GRID */}
              {cmd.adv_enabled && (
                <div className="animate-cascade seq-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', padding: '10px', background: '#04070a', border: '1px dashed rgba(255,170,0,0.4)', marginTop: '12px' }}>
                  {[
                    { label: 'SMA MIN', key: 'sma_min' }, { label: 'SMA MAX', key: 'sma_max' },
                    { label: 'TP MIN', key: 'tp_min' }, { label: 'TP MAX', key: 'tp_max' },
                    { label: 'SL MIN', key: 'sl_min' }, { label: 'SL MAX', key: 'sl_max' },
                    { label: 'GATES MAX', key: 'logic_max' }, { label: 'IDEAL TPD', key: 'ideal_tpd' },
                    { label: 'MIN TPD', key: 'min_tpd' }, { label: 'IDEAL TPD RET%', key: 'ideal_tpd_ret' },
                    { label: 'MIN TPD RET%', key: 'min_tpd_ret' }, { label: 'IDEAL EV', key: 'ideal_ev' },
                    { label: 'MIN EV', key: 'min_ev' }, { label: 'IDEAL ADD', key: 'ideal_add' },
                    { label: 'MAX ADD', key: 'max_add' }, { label: 'IDEAL LOSS', key: 'ideal_al' },
                    { label: 'MAX LOSS', key: 'max_al' }, { label: 'IDEAL WR%', key: 'ideal_wr' },
                    { label: 'MIN WR%', key: 'min_wr' }, { label: 'IDEAL SHARPE', key: 'ideal_sharpe' },
                    { label: 'MIN SHARPE', key: 'min_sharpe' }, { label: 'MIN PNL', key: 'min_pnl' },
                    { label: 'MIN WFE%', key: 'min_wfe' }
                  ].map((f) => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#020406', padding: '4px 6px', border: '1px solid var(--term-border-muted)' }}>
                      <label style={{ fontSize: '9px', color: '#526685', fontWeight: 'bold' }}>{f.label}</label>
                      <input type="number" step="0.1" value={cmd[f.key]} onChange={(e) => sendCommand({ [f.key]: parseFloat(e.target.value) })} style={{ width: '100%', padding: '3px', background: '#070b11', color: '#ffffff', border: '1px solid var(--term-border)', height: '26px', fontSize: '12px' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE PERFORMANCE BACKTESTER */}
        {activeTab === 'backtester' && (
          <div key="viewport-backtester" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
            
            {/* EXPANDED CONTROL MODULE: RE-ENGINEERED PERSISTENT SELECTION MATRIX VIEWPORT */}
            <div className="animate-cascade seq-0" style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px', display: 'flex', flexDirection: 'column', height: '490px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <h2 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '13px', fontWeight: '700' }}>[STRATEGY_SELECTOR]</h2>
                <p style={{ color: '#526685', marginBottom: '12px', fontSize: '11px' }}>Assign dynamic node matrices to run historical verification across the cluster loop.</p>
                
                {/* --- PURE REACT CHECKLIST VIEWPORT ENGINE (ZERO BLUR SIDE EFFECTS) --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0, marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: '#526685', fontWeight: '700' }}>ASSIGNMENT VECTOR STACK (CLICK TO SELECT / TOGGLE NODE ENTRANCES)</label>
                  <div style={{ width: '100%', flex: 1, background: '#070b11', border: '1px solid var(--term-border)', overflowY: 'auto', padding: '2px' }}>
                    {cmd.available_strats && cmd.available_strats.length > 0 ? (
                      cmd.available_strats.map((strat, i) => {
                        const isSelected = cmd.active_strats?.includes(strat);
                        return (
                          <div 
                            key={i}
                            onClick={() => handleToggleStrategy(strat)}
                            style={{ 
                              padding: '8px 10px', 
                              fontSize: '12px', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              borderBottom: '1px solid #0c121c', 
                              background: isSelected ? 'rgba(0, 240, 255, 0.06)' : 'transparent', 
                              color: isSelected ? '#00f0ff' : '#cbd5e1',
                              userSelect: 'none',
                              fontWeight: isSelected ? '700' : '400'
                            }}
                          >
                            <span style={{ color: isSelected ? '#00f0ff' : '#526685', fontSize: '10px', width: '14px' }}>
                              {isSelected ? '►' : '▫'}
                            </span>
                            <span>{strat}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: '#526685', padding: '12px', fontSize: '11px' }}>AWAITING DESKTOP SYSTEM RAM MATRIX INSTANCES FLOW...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* INDUSTRIAL SCALE LAUNCH STACK TRIGGERS */}
              <button 
                onClick={startBacktest}
                disabled={!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running'}
                style={{ 
                  padding: '10px 20px', fontSize: '12px',
                  backgroundColor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#0c121c' : '#00ff66', 
                  color: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#526685' : '#020406', 
                  border: 'none', cursor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? 'not-allowed' : 'pointer', fontWeight: '700', alignSelf: 'flex-start', width: 'auto', flexShrink: 0
                }}
              >
                {cmd.engine_status === 'running' ? 'CLUSTER OCCUPIED...' : '[RUN BACKTEST MATCH]'}
              </button>
            </div>

            {/* EXPANDED GRAPH MONITOR VISUAL CANVAS CARD (TALL, SCALED, & COMPACT GRAPH) */}
            <div className="animate-cascade seq-1" style={{ background: '#020406', border: '1px solid var(--term-border)', padding: '14px', display: 'flex', flexDirection: 'column', height: '490px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '8px', flexShrink: 0 }}>
                <span style={{ color: '#00f0ff', fontWeight: '700' }}>[BACKTESTER_VECTOR_CANVAS]</span>
                
                {/* Dynamic Strategy Selector Dropdown for Graph Scaling */}
                {data && data.length > 0 && (
                  <select 
                    value={selectedBacktestStrat || (data[0]?.Name || "")} 
                    onChange={(e) => setSelectedBacktestStrat(e.target.value)} 
                    style={{ background: '#070b11', color: '#00f0ff', border: '1px solid var(--term-border)', padding: '2px 4px', fontSize: '11px', width: '170px' }}
                  >
                    {data.map((row, idx) => (
                      <option key={idx} value={row.Name}>{row.Name}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* MAXIMIZED INNER BOUNDS ALLOWS VECTOR GRAPH TO GRACEFULLY OCCUPY VACANT WORKSPACE */}
              <div style={{ flex: 1, position: 'relative', border: '1px dashed var(--term-border)', padding: '8px 6px 4px 6px', overflow: 'hidden' }}>
                {data && data.length > 0 ? (
                  <FullCanvasGraph data={data} strategyName={selectedBacktestStrat || data[0]?.Name} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#526685', fontSize: '11px', padding: '10px', textAlign: 'center' }}>
                      [AWAITING RUN CLUSTER TRIGGER COMMAND VALIDATION]
                    </span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '8px', color: '#152233', pointerEvents: 'none', zIndex: 10 }}>NODE_GRAPH_2D</div>
              </div>
            </div>

          </div>
        )}

        {/* METRICS DISPATCH TERMINAL VIEW LOG LISTS */}
        {activeTab !== 'portfolio' && (
          <div className="animate-cascade seq-2" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#526685', fontWeight: '700' }}>
                {activeTab === 'generator' ? '[Generated_strategy_Log]' : '[Backtest Results Log]'}
              </span>
              <span style={{ fontSize: '10px', color: '#152233', fontWeight: 'bold' }}>MAX_LOG_ENTRIES_260</span>
            </div>
            
            {data.length === 0 ? ( 
              <div style={{ padding: '28px', textAlign: 'center', backgroundColor: '#020406', border: '1px solid var(--term-border)' }}> 
                <h3 style={{ color: '#526685', fontSize: '12px' }}>&gt;&gt; PIPELINE EMPTY: AWAITING CORE AGENT SIGNAL FEED TRANSACTION ARRAY...</h3> 
              </div> 
            ) : ( 
              <div style={{ overflowX: 'auto', backgroundColor: '#020406', border: '1px solid var(--term-border)' }}> 
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}> 
                  <thead> 
                    <tr style={{ backgroundColor: '#0c121c', borderBottom: '1px solid var(--term-border)', fontSize: '10px', color: '#526685' }}> 
                      <th style={{ padding: '10px 12px' }}>{data[0]?.PF !== undefined ? 'IDENT_STRAT' : 'RANK_IDX'}</th> 
                      {data[0]?.ChartData !== undefined && <th style={{ padding: '10px 12px', width: '160px' }}>EQUITY_CANVAS</th>}
                      <th style={{ padding: '10px 12px' }}>SHARPE</th> 
                      <th style={{ padding: '10px 12px' }}>WIN_RATE</th> 
                      <th style={{ padding: '10px 12px' }}>TRADES</th> 
                      <th style={{ padding: '10px 12px' }}>NET_PNL</th> 
                      <th style={{ padding: '10px 12px' }}>EXPECTED_V</th> 
                      <th style={{ padding: '10px 12px', color: '#ffaa00' }}>ALPHA</th> 
                      <th style={{ padding: '10px 12px', color: '#ffaa00' }}>{data[0]?.PF !== undefined ? 'PROFIT_FACTOR' : 'ADD_PTS'}</th> 
                      <th style={{ padding: '10px 12px', color: '#af40ff' }}>{data[0]?.PF !== undefined ? '' : 'TPD_RET'}</th> 
                      <th style={{ padding: '10px 12px', color: '#af40ff' }}>{data[0]?.PF !== undefined ? '' : 'WFE'}</th> 
                      <th style={{ padding: '10px 12px', color: '#ffffff' }}>EVAL</th> 
                    </tr> 
                  </thead> 
                  <tbody> 
                    {data.slice(0, 260).map((row, i) => ( 
                      <tr key={i} style={{ borderBottom: '1px solid #0c121c', transition: 'background-color 0.05s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0c121c'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}> 
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#ffffff' }}>
                          {row.Name ? row.Name : `#${String(i + 1).padStart(3, '0')}`}
                        </td> 
                        
                        {data[0]?.ChartData !== undefined && (
                          <td style={{ padding: '2px 12px', verticalAlign: 'middle' }}>
                            <Sparkline data={row.ChartData} color={row.PnL >= 0 ? '#00ff66' : '#ff3366'} />
                          </td>
                        )}

                        <td style={{ padding: '10px 12px', fontWeight: '700', color: row.Sharpe >= 1.0 ? '#00ff66' : '#ff3366' }}>{row.Sharpe?.toFixed(2)}</td> 
                        <td style={{ padding: '10px 12px' }}>{row.WinRate?.toFixed(1)}%</td> 
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{row.Trades}</td> 
                        <td style={{ padding: '10px 12px', color: row.PnL >= 0 ? '#00ff66' : '#ff3366', fontWeight: '700' }}>{row.PnL?.toFixed(2)}</td> 
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#af40ff' }}>{row.EV?.toFixed(2)}</td> 
                        <td style={{ padding: '10px 12px', color: row.Alpha >= 0 ? '#ffaa00' : '#ff3366', fontWeight: '700' }}>{row.Alpha?.toFixed(2)}</td> 
                        
                        <td style={{ padding: '10px 12px', color: '#ffaa00', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined ? (row.PF !== undefined ? row.PF.toFixed(2) : 'N/A') : (row.AverageDD !== undefined ? `${row.AverageDD.toFixed(2)}` : 'N/A')}
                        </td> 

                        <td style={{ padding: '10px 12px', color: '#af40ff', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined ? '' : (row.TPD_Ret !== undefined ? `${row.TPD_Ret.toFixed(1)}%` : 'N/A')}
                        </td>

                        <td style={{ padding: '10px 12px', color: '#af40ff', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined ? '' : (row.WFE !== undefined ? `${row.WFE.toFixed(1)}%` : 'N/A')}
                        </td> 
                        
                        <td style={{ padding: '10px 12px', fontWeight: '800', color: row.Passed === true || row.Passed === 'true' ? '#00ff66' : '#ff3366' }}>
                          {row.Passed === true || row.Passed === 'true' ? 'PASS' : 'FAIL'}
                        </td>
                      </tr> 
                    ))} 
                  </tbody>
                </table> 
              </div> 
            )}
          </div>
        )}

      </div>
    </div>
  );
}
