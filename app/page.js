"use client";
import { useEffect, useState, useRef } from 'react';

// --- Safe SVG Individual Line Sparkline Renderer ---
const Sparkline = ({ data, color }) => {
  let parsedData = [];
  try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return <span style={{color: '#526685', fontSize: '11px', fontFamily: 'Fira Code'}}>ERR_DATA</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{color: '#526685', fontSize: '11px', fontFamily: 'Fira Code'}}>EMPTY_MAT</span>;
  
  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const points = parsedData.map((val, i) => `${(i / (parsedData.length - 1)) * 100},${100 - ((val - min) / range) * 100}`).join(' ');
  const zeroY = 100 - ((0 - min) / range) * 100;

  return (
    <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{ width: '100%', minWidth: '140px', height: '34px', overflow: 'visible' }}>
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#152233" strokeDasharray="2" strokeWidth="1" />}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" points={points} />
    </svg>
  );
};

// --- Overhauled Functional Strategy Equity Analytics Canvas Graph ---
const FullCanvasGraph = ({ data, strategyName }) => {
  if (!data || data.length === 0) return <span style={{ color: '#526685', fontSize: '11px', fontFamily: 'Fira Code' }}>[NO TRANSMISSION DATA RECORDED]</span>;
  
  const row = data.find(r => r.Name === strategyName) || data[0];
  if (!row) return <span style={{ color: '#526685', fontSize: '11px', fontFamily: 'Fira Code' }}>[STRATEGY PROFILE NOT SPECIFIED]</span>;

  let parsedData = [];
  try { parsedData = typeof row.ChartData === 'string' ? JSON.parse(row.ChartData) : row.ChartData; } catch (e) { return <span style={{ color: '#ff3366', fontSize: '11px', fontFamily: 'Fira Code' }}>[DATA_PARSING_ERROR]</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{ color: '#526685', fontSize: '11px', fontFamily: 'Fira Code' }}>[ZERO_TICKS_RECORDED]</span>;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00f0ff', background: '#020406', padding: '4px 6px', borderBottom: '1px solid #152233', fontWeight: 'bold', marginBottom: '8px', flexShrink: 0, fontFamily: 'Fira Code' }}>
        <span>ID: {row.Name}</span>
        <span>SHARPE: {row.Sharpe?.toFixed(2)} | PNL: ${row.PnL?.toFixed(2)}</span>
      </div>
      
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padLeft + (pct / 100) * graphW;
            return (
              <line key={`v-${pct}`} x1={x} y1={padTop} x2={x} y2={padTop + graphH} stroke="#101a26" strokeWidth="0.25" strokeDasharray="1 1" />
            );
          })}

          {[0, 25, 50, 75, 100].map((pct) => {
            const y = padTop + (pct / 100) * graphH;
            const val = max - (pct / 100) * range;
            return (
              <g key={`h-${pct}`}>
                <line x1={padLeft} y1={y} x2={100 - padRight} y2={y} stroke="#101a26" strokeWidth="0.25" strokeDasharray="1 1" />
                <text x={padLeft - 2} y={y + 1} fill="#526685" fontSize="3.2" className="select-none" style={{ fontFamily: 'Fira Code', fontWeight: '700' }} textAnchor="end">
                  {val >= 1000 || val <= -1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {min < 0 && max > 0 && zeroY >= padTop && zeroY <= padTop + graphH && (
            <line x1={padLeft} y1={zeroY} x2={100 - padRight} y2={zeroY} stroke="#ffaa00" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.65" />
          )}

          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padLeft + (pct / 100) * graphW;
            const indexMarker = Math.round((pct / 100) * (totalPoints - 1));
            return (
              <text key={`x-${pct}`} x={x} y={100 - 1} fill="#526685" fontSize="3.2" className="select-none" style={{ fontFamily: 'Fira Code', fontWeight: '700' }} textAnchor="middle">
                #{indexMarker}
              </text>
            );
          })}

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
  const [showLiveCredsDrawer, setShowLiveCredsDrawer] = useState(false);

  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', last_seen: 0, mode: 'Generate Random Strategies', strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)', auto: true, auto_max: 10, available_strats: [], active_strats: [], 
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.1, tp_max: 100.0, sl_min: 0.1, sl_max: 100.0, logic_max: 2, 
    ideal_tpd: 3.0, min_tpd: 1.0, ideal_ev: 10.0, min_ev: 0.0, ideal_add: 10.0, max_add: 50.0, 
    ideal_al: 1.0, max_al: 5.0, ideal_wr: 60.0, min_wr: 40.0, ideal_tpd_ret: 80.0, min_tpd_ret: 50.0, ideal_sharpe: 3.0, min_sharpe: 1.0, min_pnl: 0.0, min_wfe: 50.0,
    cw_wr: 1.0, cw_pnl: 1.0, cw_ev: 1.0, cw_sharpe: 1.0, cw_alpha: 1.0, cw_add: 1.0, cw_al: 1.0, cw_tpd_ret: 1.0, cw_tpd: 1.0,
    use_genetic: false, progress: 0, total_sims: 1000, trade_progress: { current: 0, total: 0 },
    eta: '--:--:--', sims_sec: 0, data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A', fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '', fetch_rth: true, fetch_pct: 0,
    is_start: '', is_end: '', oos_list: [{ start: '', end: '' }], hv_start: '', hv_end: '', hv_oos_list: [{ start: '', end: '' }], lv_start: '', lv_end: '', lv_oos_list: [{ start: '', end: '' }], stage_text: '',
    gen_count: 10, debug_csv_data: [],

    live_trading_enabled: false, emergency_flatten_requested: false, live_refresh_interval: 5, active_live_strategy: 'None Locked',
    tradovate_username: '', tradovate_password: '', tradovate_app_key: '', tradovate_sec_key: '', tradovate_environment: 'Demo',
    live_scaling: { def_contracts: 1, loss_add: 0, win_sub: 0, contract_min: 1, contract_max: 10 },
    sandbox_csv_name: 'databento_mes.csv', sandbox_test_results: 'AWAITING RUN SEQUENCE', sync_target_csv: 'hexnet_master_bars.csv'
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
            if (isFirstLoad.current) { isFirstLoad.current = false; return jsonCmd; }
            return {
              ...prev, ...jsonCmd,
              live_scaling: jsonCmd.live_scaling || prev.live_scaling,
              trade_progress: jsonCmd.trade_progress || prev.trade_progress,
              available_strats: jsonCmd.available_strats || prev.available_strats,
              active_strats: jsonCmd.active_strats || prev.active_strats,
              oos_list: jsonCmd.oos_list || prev.oos_list,
              hv_oos_list: jsonCmd.hv_oos_list || prev.hv_oos_list,
              lv_oos_list: jsonCmd.lv_oos_list || prev.lv_oos_list,
              debug_csv_data: jsonCmd.debug_csv_data || []
            };
          });

          if ((previousStatus.current === 'running' && jsonCmd.engine_status === 'idle') || (previousStatus.current === 'sync_requested' && jsonCmd.status === 'idle')) {
            fetchTableData();
          }
          previousStatus.current = jsonCmd.engine_status === 'running' ? 'running' : jsonCmd.status;
        }
        setLastUpdate(new Date().toLocaleTimeString());
        timeoutId = setTimeout(pollCommandState, jsonCmd?.engine_status === 'running' ? 3000 : 12000);
      } catch (err) { 
        setLastUpdate("SYS_ERROR");
        timeoutId = setTimeout(pollCommandState, 30000); 
      }
    };
    
    pollCommandState();
    return () => clearTimeout(timeoutId);
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
    <div style={{ padding: '20px', maxWidth: '1680px', margin: '0 auto', backgroundColor: '#020406', color: '#cbd5e1', fontFamily: 'Fira Code, monospace', minHeight: '100vh' }}>
      
      {/* SYSTEM HEADER MONITOR PANEL */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #152233', backgroundColor: '#070b11', padding: '16px 20px', marginBottom: '20px', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>HEXNET CONTROL DECK INTERFACE</h1>
            <span style={{ fontSize: '10px', padding: '2px 6px', background: '#0c121c', border: '1px solid #152233', color: '#526685', fontWeight: 'bold' }}>v2.9.9.9.8.6</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '11px' }}>
            <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>● CORE NODE STATUS: {(cmd.engine_status || 'OFFLINE').toUpperCase()}</span>
            <span style={{ color: '#152233' }}>|</span>
            <span style={{ color: '#526685' }}>Last Synced Pulse: <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{lastUpdate}</span></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowLiveCredsDrawer(true)} style={{ background: '#020406', color: '#af40ff', border: '1px solid #af40ff', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>[🔑 LINK TRADOVATE API]</button>
          <button onClick={() => sendCommand({ status: 'sync_requested' })} disabled={cmd.status === 'sync_requested' || cmd.engine_status === 'offline'} style={{ background: '#020406', color: '#ffaa00', border: '1px solid #ffaa00', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.status === 'sync_requested' || cmd.engine_status === 'offline') ? 0.3 : 1 }}>[↻ FORCE DESKTOP RE-SYNC]</button>
          <a href="/api/upload?download=true" download="hexnet_strategies.csv" style={{ background: '#00f0ff', color: '#020406', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center', display: 'inline-block' }}>[↓ DOWNLOAD CSV MATRICES]</a>
          <button onClick={() => {
            if (!cmd.debug_csv_data || cmd.debug_csv_data.length === 0) { alert("Matrix data empty."); return; }
            const headers = ["Category", "Count", "Low", "25%", "Mean", "Median", "75%", "High"];
            const csvContent = [headers.join(","), ...cmd.debug_csv_data.map(row => headers.map(field => `"${row[field] !== undefined ? row[field] : ''}"`).join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob); link.download = "Hexnet_Debug_Stats.csv"; link.click();
          }} style={{ background: '#0c121c', color: '#526685', border: '1px solid #152233', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>[DGN_STATS.LOG]</button>
        </div>
      </div>

      {/* COMPUTE ENGINE PIPELINE LOADING INDICATOR */}
      {cmd.engine_status === 'running' && (
        <div style={{ background: '#070b11', border: '1px solid #152233', borderLeft: '4px solid #00f0ff', padding: '12px 18px', marginBottom: '20px' }}>
          {!cmd.stage_text?.includes('Calculating') ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                <span style={{ color: '#ffffff' }}>&gt; {cmd.stage_text || 'PROCESSING LOGIC GRAPH MUTATIONS'}</span>
                <span style={{ color: '#00ff66', marginLeft: 'auto' }}>{((cmd.progress / (cmd.total_sims || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#020406', height: '5px', border: '1px solid #152233', marginBottom: '6px' }}>
                <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#00ff66', height: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '25px', fontSize: '11px', color: '#526685' }}>
                <span>MUTATIONS: <span style={{ color: '#cbd5e1' }}>{cmd.progress?.toLocaleString()}</span> / {cmd.total_sims?.toLocaleString()}</span>
                <span>COMPUTE VECTOR: <span style={{ color: '#af40ff' }}>{cmd.sims_sec?.toLocaleString() || 0} exec/s</span></span>
                <span>ETA BOUND: <span style={{ color: '#ffaa00' }}>{cmd.eta || '--:--:--'}</span></span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00ff66' }}>
              <span className="pulse-glow">&gt;&gt;</span> HARDWARE AGENT ACTIVE: CALCULATING AND EMITTING STRATEGY TIMELINE ARRAYS...
            </div>
          )}
        </div>
      )}

      {/* CORE WORKSPACE NAVIGATION TAB LIST */}
      <div style={{ display: 'flex', borderBottom: '1px solid #152233', marginBottom: '20px', gap: '5px' }}>
        {['portfolio', 'generator', 'backtester'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 18px', background: activeTab === tab ? '#070b11' : 'transparent', color: activeTab === tab ? '#00f0ff' : '#526685', border: '1px solid #152233', borderBottom: activeTab === tab ? '1px solid #070b11' : '1px solid #152233', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', marginBottom: '-1px' }}>
            {activeTab === tab ? '■ ' : ''}[{tab.toUpperCase()}_LIVE_WORKSPACE]
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT SWITCH MATRIX CANVAS */}
      <div style={{ backgroundColor: '#070b11', border: '1px solid #152233', padding: '20px', minHeight: '500px' }}>
        
        {/* VIEW 1: REALTIME PROP FIRM TUNERS & SCALING PERFORMANCE */}
        {activeTab === 'portfolio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tradeify Execution Control Overlay Card */}
            <div style={{ background: '#04070a', border: '1px solid #152233', padding: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #152233', paddingBottom: '12px', marginBottom: '16px', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', display: 'inline-block', backgroundColor: cmd.live_trading_enabled ? '#00ff66' : '#ff3366', borderRadius: '50%' }}></span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>TRADEIFY LIVEFIRE PIPELINE OVERRIDE ROUTER</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#526685' }}>STRATEGY FILTER: </span>
                    <select value={cmd.active_live_strategy} onChange={(e) => sendCommand({ active_live_strategy: e.target.value })} style={{ background: '#0c121c', color: '#00f0ff', border: '1px solid #152233', padding: '4px', fontWeight: 'bold', fontFamily: 'Fira Code' }}>
                      <option value="None Locked">None Locked</option>
                      {(cmd.available_strats || []).map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={{ color: '#526685' }}>REFRESH DELAY: </span>
                    <input type="number" value={cmd.live_refresh_interval} onChange={(e) => sendCommand({ live_refresh_interval: parseInt(e.target.value) || 1 })} style={{ background: '#0c121c', color: '#ffaa00', border: '1px solid #152233', padding: '4px', width: '50px', textAlign: 'center', fontWeight: 'bold' }} />s
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#020406', border: '1px solid #152233', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontWeight: 'bold', fontSize: '11px', color: cmd.live_trading_enabled ? '#00ff66' : '#ff3366' }}>
                    <input type="checkbox" checked={cmd.live_trading_enabled || false} onChange={(e) => sendCommand({ live_trading_enabled: e.target.checked, emergency_flatten_requested: false })} style={{ width: '15px', height: '14px', accentColor: '#00ff66' }} />
                    {cmd.live_trading_enabled ? 'AUTOMATION ACTIVE' : 'AUTOMATION MUTED'}
                  </label>
                  <button onClick={() => sendCommand({ emergency_flatten_requested: true, live_trading_enabled: false, status: 'flatten_triggered' })} style={{ background: '#1c060e', color: '#ff3366', border: '1px solid #ff3366', padding: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>🚨 EMERGENCY FLATTEN ALL</button>
                </div>
                
                {['def_contracts', 'loss_add', 'win_sub', 'contract_min', 'contract_max'].map((param) => (
                  <div key={param} style={{ background: '#020406', border: '1px solid #152233', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#526685', fontWeight: 'bold', marginBottom: '6px' }}>{param.toUpperCase().replace('_', ' ')}</div>
                    <input type="number" value={cmd.live_scaling?.[param] ?? 0} onChange={(e) => {
                      const copy = { ...cmd.live_scaling }; copy[param] = parseInt(e.target.value) || 0;
                      sendCommand({ live_scaling: copy });
                    }} style={{ width: '85%', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', textAlign: 'center', padding: '4px', fontSize: '12px', fontWeight: 'bold' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Sandbox Calibrators and Append Enforcers Block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #152233', paddingBottom: '6px' }}>[1] NATIVE LOCAL SANDBOX DATABENTO CALIBRATOR</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#526685' }}>TARGET FILENAME SNAPSHOT FOR VARIANCE VERIFICATION:</span>
                  <input type="text" value={cmd.sandbox_csv_name} onChange={(e) => sendCommand({ sandbox_csv_name: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px' }}>
                  <button onClick={() => sendCommand({ status: 'sandbox_check_requested' })} disabled={cmd.engine_status === 'offline'} style={{ background: '#0c121c', color: '#ffaa00', border: '1px solid #ffaa00', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>RUN TEST CHECKS</button>
                  <div style={{ textPen: 'right', fontSize: '11px' }}>
                    <span style={{ color: '#526685', display: 'block', fontSize: '9px' }}>CALIBRATION RESULT:</span>
                    <strong style={{ color: '#ffffff' }}>{cmd.sandbox_test_results}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#020406', border: '1px solid #152233', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #152233', paddingBottom: '6px' }}>[2] DEDUPLICATED HISTORICAL FILE RECODER / APPEND MANAGER</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#526685' }}>APPEND TARGET LOCAL DISK RECORDS STORAGE PATH:</span>
                  <input type="text" value={cmd.sync_target_csv} onChange={(e) => sendCommand({ sync_target_csv: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', fontSize: '12px' }} />
                </div>
                <button onClick={() => sendCommand({ status: 'csv_sync_requested' })} disabled={cmd.engine_status === 'offline'} style={{ background: '#0c121c', color: '#00ff66', border: '1px solid #00ff66', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', marginTop: '14px', alignSelf: 'flex-start' }}>EXECUTE MERGE APPEND PIPELINE</button>
              </div>
            </div>

            {/* Realtime Metrics Telemetry Displays */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: 'bold' }}>REALTIME CASH LIQUIDITY CAPITAL</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff66', marginTop: '4px' }}>$100,000.00</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: 'bold' }}>UNREALIZED OPEN TRANSACTION PNL</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00f0ff', marginTop: '4px' }}>$0.00</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: 'bold' }}>CRITICAL EOD MAX RISK FLOOR LIMIT</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffaa00', marginTop: '4px' }}>$96,000.00</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: STRATEGY GENERATOR ENGINE AND CRITERIA WEIGHER */}
        {activeTab === 'generator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#00f0ff', fontWeight: 'bold', fontSize: '12px' }}>[DATA_MAPPING_NODE]</span>
                <div style={{ fontSize: '11px', color: '#526685', marginTop: '2px' }}>TICKER: <span style={{ color: '#fff' }}>{cmd.data_ticker}</span> | POOLS: <span style={{ color: '#fff' }}>{cmd.data_start}</span> / <span style={{ color: '#fff' }}>{cmd.data_end}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'flex-end' }}>
                <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '70px', padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233' }} />
                <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233' }}>
                  <option>1m</option><option>5m</option><option>15m</option>
                </select>
                <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px' }} />
                <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px' }} />
                <button onClick={() => sendCommand({ status: 'fetch_requested' })} disabled={cmd.engine_status === 'offline'} style={{ background: '#00f0ff', color: '#020406', padding: '0 14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', height: '28px' }}>FETCH STREAM</button>
              </div>
            </div>

            <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px', width: '210px' }}>
                  <option>Generate Random Strategies</option>
                  <option>Optimize Existing Strategy</option>
                  <option>Generate Advanced Optimal Strategy</option>
                </select>

                {cmd.mode === 'Optimize Existing Strategy' && (
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', width: '160px', fontSize: '11px' }}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#526685', fontWeight: 'bold' }}>SIMS:</span>
                  <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) || 100 })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', width: '90px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#526685', fontWeight: 'bold' }}>GENS:</span>
                  <input type="number" value={cmd.gen_count || 10} onChange={(e) => sendCommand({ gen_count: parseInt(e.target.value) || 1 })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', width: '55px' }} />
                </div>

                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px', width: '220px' }}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Walk-Forward Efficiency (WFE)</option>
                  <option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option>
                </select>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                  <label style={{ color: '#ffaa00', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} /> BOUNDS
                  </label>
                  <label style={{ color: '#af40ff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} /> 🧬 GENETIC
                  </label>
                  <label style={{ color: '#00ff66', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} /> LOOP
                  </label>
                  {cmd.auto && <input type="number" value={cmd.auto_max} onChange={(e) => sendCommand({ auto_max: parseInt(e.target.value) || 1 })} style={{ width: '45px', padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px' }} />}
                  <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.engine_status === 'offline'} style={{ background: '#00ff66', color: '#020406', padding: '6px 16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '11px' }}>[START]</button>
                  <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle'} style={{ background: '#ff3366', color: '#ffffff', padding: '6px 16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '11px' }}>[STOP]</button>
                </div>
              </div>
            </div>

            {/* Custom Score Fitness Parameters Block */}
            {cmd.sort === 'Custom Score' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px', background: '#020406', border: '1px dashed #00f0ff' }}>
                {[
                  { label: 'WIN_RATE', key: 'cw_wr' }, { label: 'NET_PNL', key: 'cw_pnl' }, { label: 'EXP_VAL', key: 'cw_ev' },
                  { label: 'SHARPE', key: 'cw_sharpe' }, { label: 'ALPHA', key: 'cw_alpha' }, { label: 'DRAWDOWN', key: 'cw_add' },
                  { label: 'AVG_LOSS', key: 'cw_al' }, { label: 'TPD', key: 'cw_tpd' }, { label: 'TPD_RET', key: 'cw_tpd_ret' }
                ].map((f) => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px' }}>
                    <span style={{ color: '#526685' }}>{f.label}:</span>
                    <input type="number" step="0.1" min="0" max="1" value={cmd[f.key]} onChange={(e) => sendCommand({ [f.key]: parseFloat(e.target.value) || 0.0 })} style={{ width: '65px', padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Bounds Hyperparameter Indicators */}
            {cmd.adv_enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', padding: '12px', background: '#020406', border: '1px solid #152233' }}>
                {[
                  { label: 'SMA MIN', key: 'sma_min' }, { label: 'SMA MAX', key: 'sma_max' },
                  { label: 'TP MIN', key: 'tp_min' }, { label: 'TP MAX', key: 'tp_max' },
                  { label: 'SL MIN', key: 'sl_min' }, { label: 'SL MAX', key: 'sl_max' },
                  { label: 'GATES MAX', key: 'logic_max' }, { label: 'IDEAL TPD', key: 'ideal_tpd' },
                  { label: 'MIN TPD', key: 'min_tpd' }, { label: 'MIN EV', key: 'min_ev' },
                  { label: 'MAX ADD', key: 'max_add' }, { label: 'MAX LOSS', key: 'max_al' },
                  { label: 'MIN WR%', key: 'min_wr' }, { label: 'MIN SHARPE', key: 'min_sharpe' }
                ].map((f) => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px', background: '#070b11', border: '1px solid #152233', fontSize: '10px' }}>
                    <span style={{ color: '#526685' }}>{f.label}:</span>
                    <input type="number" step="0.1" value={cmd[f.key]} onChange={(e) => sendCommand({ [f.key]: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '2px', background: '#020406', color: '#ffffff', border: 'none', textAlign: 'center', fontWeight: 'bold' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Walk-Forward Timeline Range Boxes */}
            <div>
              {cmd.mode === 'Generate Advanced Optimal Strategy' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ padding: '12px', border: '1px solid rgba(255,51,102,0.3)', background: '#020406' }}>
                    <span style={{ fontSize: '11px', color: '#ff3366', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>HIGH_VOL ARCHITECTURE SETTINGS</span>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input type="date" value={cmd.hv_start} onChange={(e) => sendCommand({ hv_start: e.target.value })} style={{ background: '#070b11', color: '#fff', border: '1px solid #152233', padding: '4px', flex: 1, fontSize: '11px' }} />
                      <input type="date" value={cmd.hv_end} onChange={(e) => sendCommand({ hv_end: e.target.value })} style={{ background: '#070b11', color: '#fff', border: '1px solid #152233', padding: '4px', flex: 1, fontSize: '11px' }} />
                    </div>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid rgba(0,255,102,0.3)', background: '#020406' }}>
                    <span style={{ fontSize: '11px', color: '#00ff66', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>LOW_VOL ARCHITECTURE SETTINGS</span>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input type="date" value={cmd.lv_start} onChange={(e) => sendCommand({ lv_start: e.target.value })} style={{ background: '#070b11', color: '#fff', border: '1px solid #152233', padding: '4px', flex: 1, fontSize: '11px' }} />
                      <input type="date" value={cmd.lv_end} onChange={(e) => sendCommand({ lv_end: e.target.value })} style={{ background: '#070b11', color: '#fff', border: '1px solid #152233', padding: '4px', flex: 1, fontSize: '11px' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '20px', padding: '12px', background: '#020406', border: '1px solid #152233' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#00ff66', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>IN-SAMPLE RANGE</span>
                    <input type="date" value={cmd.is_start} onChange={(e) => sendCommand({ is_start: e.target.value })} style={{ width: '100%', marginBottom: '4px', padding: '4px', background: '#070b11', color: '#fff', border: '1px solid #152233', fontSize: '11px' }} />
                    <input type="date" value={cmd.is_end} onChange={(e) => sendCommand({ is_end: e.target.value })} style={{ width: '100%', padding: '4px', background: '#070b11', color: '#fff', border: '1px solid #152233', fontSize: '11px' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#af40ff', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>WALK FORWARD OUT-OF-SAMPLE WINDOW TRACKERS</span>
                    {cmd.oos_list?.map((oos, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                        <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.oos_list]; l[idx].start = e.target.value; sendCommand({ oos_list: l }); }} style={{ background: '#070b11', color: '#fff', border: '1px solid #152233', padding: '4px', fontSize: '11px' }} />
                        <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.oos_list]; l[idx].end = e.target.value; sendCommand({ oos_list: l }); }} style={{ background: '#070b11', color: '#fff', border: '1px solid #152233', padding: '4px', fontSize: '11px' }} />
                        {idx > 0 && <button onClick={() => sendCommand({ oos_list: cmd.oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#fff', border: 'none', padding: '0 8px', cursor: 'pointer' }}>X</button>}
                      </div>
                    ))}
                    <button onClick={() => sendCommand({ oos_list: [...(cmd.oos_list || []), {start: '', end: ''}] })} style={{ background: 'transparent', color: '#af40ff', border: '1px dashed #af40ff', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>+ ADD OOS VECTOR TRACKER</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: LIVE BACKTESTER CORE AND CHECKLIST STRATEGY ENGINE */}
        {activeTab === 'backtester' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#020406', border: '1px solid #152233', padding: '16px', display: 'flex', flexDirection: 'column', height: '490px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>[ASSIGNMENT_VECTOR_CHECKLIST_STACK]</span>
                <div style={{ flex: 1, background: '#070b11', border: '1px solid #152233', overflowY: 'auto', marginTop: '10px', padding: '4px' }}>
                  {cmd.available_strats?.map((strat, i) => {
                    const active = cmd.active_strats?.includes(strat);
                    return (
                      <div key={i} onClick={() => handleToggleStrategy(strat)} style={{ padding: '8px 10px', borderBottom: '1px solid #0c121c', color: active ? '#00f0ff' : '#cbd5e1', background: active ? 'rgba(0,240,255,0.05)' : 'transparent', fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{active ? '►' : '▫'}</span> <span>{strat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={startBacktest} disabled={!cmd.active_strats?.length} style={{ background: '#00ff66', color: '#020406', border: 'none', padding: '10px 20px', fontWeight: 'bold', fontSize: '11px', marginTop: '12px', cursor: 'pointer', width: 'max-content' }}>[RUN CLUSTER VERIFICATION]</button>
            </div>

            <div style={{ background: '#020406', border: '1px solid #152233', padding: '16px', display: 'flex', flexDirection: 'column', height: '490px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '8px' }}>
                <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>[STRATEGY_RENDER_CANVAS_OVERLAY]</span>
                {data.length > 0 && (
                  <select value={selectedBacktestStrat || data[0]?.Name} onChange={(e) => setSelectedBacktestStrat(e.target.value)} style={{ background: '#070b11', color: '#00f0ff', border: '1px solid #152233', fontSize: '11px', padding: '2px' }}>
                    {data.map((r, i) => <option key={i} value={r.Name}>{r.Name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ flex: 1, minHeight: 0, border: '1px dashed #152233' }}>
                <FullCanvasGraph data={data} strategyName={selectedBacktestStrat || data[0]?.Name} />
              </div>
            </div>
          </div>
        )}

        {/* LOG DATA MONITORING EXCEL SPREADSHEET CHANNELS */}
        {activeTab !== 'portfolio' && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ overflowX: 'auto', backgroundColor: '#020406', border: '1px solid #152233' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0c121c', color: '#526685', borderBottom: '1px solid #152233' }}>
                    <th style={{ padding: '10px' }}>IDENTIFIER_NODE_NAME</th>
                    <th style={{ padding: '10px', width: '160px' }}>EQUITY CANVAS</th>
                    <th style={{ padding: '10px' }}>SHARPE</th>
                    <th style={{ padding: '10px' }}>WIN_RATE</th>
                    <th style={{ padding: '10px' }}>TRADES</th>
                    <th style={{ padding: '10px' }}>NET_PNL</th>
                    <th style={{ padding: '10px' }}>EXPECTED_V</th>
                    <th style={{ padding: '10px', color: '#00ff66' }}>EVAL_STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #0c121c' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0c121c'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#ffffff' }}>{row.Name || `NODE_INDEX_${idx}`}</td>
                      <td style={{ padding: '2px 10px' }}><Sparkline data={row.ChartData} color={row.PnL >= 0 ? '#00ff66' : '#ff3366'} /></td>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: row.Sharpe >= 1.0 ? '#00ff66' : '#ff3366' }}>{row.Sharpe?.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}>{row.WinRate?.toFixed(1)}%</td>
                      <td style={{ padding: '8px 10px' }}>{row.Trades}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: row.PnL >= 0 ? '#00ff66' : '#ff3366' }}>${row.PnL?.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', color: '#af40ff', fontWeight: 'bold' }}>{row.EV?.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: (row.Passed === true || row.Passed === 'true') ? '#00ff66' : '#ff3366' }}>{(row.Passed === true || row.Passed === 'true') ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- ASYNCHRONOUS TRADOVATE SLIDEOUT DRAWER COUPLER --- */}
      {showLiveCredsDrawer && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', backgroundColor: '#070b11', borderLeft: '1px solid #152233', zIndex: 1000, padding: '24px', boxShadow: '-10px 0 40px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #152233', paddingBottom: '12px', marginBottom: '20px' }}>
            <span style={{ color: '#af40ff', fontWeight: 'bold', fontSize: '12px' }}>TRADOVATE BROADCAST ENDPOINT ACCESS MAPPING</span>
            <button onClick={() => setShowLiveCredsDrawer(false)} style={{ background: 'transparent', color: '#ff3366', border: '1px solid #ff3366', padding: '2px 6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>[X]</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '11px' }}>
            {['tradovate_environment', 'tradovate_username', 'tradovate_password', 'tradovate_app_key', 'tradovate_sec_key'].map((field) => (
              <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: '#526685', fontWeight: 'bold' }}>{field.toUpperCase().replace('_', ' ')}</label>
                {field === 'tradovate_environment' ? (
                  <select value={cmd[field]} onChange={(e) => sendCommand({ [field]: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', outline: 'none' }}>
                    <option value="Demo">Simulation Sandbox (Demo API)</option>
                    <option value="Live">Live Capital Fire (Live API Execution)</option>
                  </select>
                ) : (
                  <input type={field.includes('password') || field.includes('sec') ? 'password' : 'text'} value={cmd[field]} onChange={(e) => sendCommand({ [field]: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', fontFamily: 'Fira Code', outline: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
