"use client";
import { useEffect, useState, useRef } from 'react';

// --- Safe SVG Equity Curve Renderer ---
const Sparkline = ({ data, color }) => {
  let parsedData = [];
  try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return <span style={{color: '#5c7294', fontSize: '11px'}}>ERR_DATA</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{color: '#5c7294', fontSize: '11px'}}>EMPTY_MAT</span>;
  
  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const points = parsedData.map((val, i) => { return `${(i / (parsedData.length - 1)) * 100},${100 - ((val - min) / range) * 100}`; }).join(' ');
  const zeroY = 100 - ((0 - min) / range) * 100;

  return (
    <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{ width: '100%', minWidth: '150px', height: '38px', overflow: 'visible' }}>
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#1d2d44" strokeDasharray="2" strokeWidth="1" />}
      <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" points={points} />
    </svg>
  );
};

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("CONNECTING...");
  
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
    <div style={{ padding: '24px', maxWidth: '1850px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* GLOBAL HUD TERMINAL BAR */}
      <div className="animate-cascade seq-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #1d2d44', backgroundColor: '#070b11', padding: '20px 24px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' }}>HEXNET DASHBOARD</h1>
            <span style={{ fontSize: '11px', padding: '3px 8px', background: '#0e1420', border: '1px solid #1d2d44', color: '#5c7294', fontWeight: 'bold' }}>VERSION//2.9.9.9.8.0</span>
          </div>
          <div style={{ display: 'flex', gap: '18px', marginTop: '8px', fontSize: '14px' }}>
            <span style={{ color: getStatusColor(), fontWeight: '700' }}>
              ● CORE_STATUS: {(cmd.engine_status || 'OFFLINE').toUpperCase()}
              {cmd.engine_status === 'fetching' && <span style={{ color: '#00f0ff', marginLeft: '6px' }}>[{cmd.fetch_pct || 0}%]</span>}
            </span>
            <span style={{ color: '#1d2d44', fontWeight: 'bold' }}>|</span>
            <span style={{ color: '#5c7294', fontWeight: '500' }}>Last Synced: <span style={{ color: '#d2e0f5', fontWeight: '700' }}>{lastUpdate}</span></span>
          </div>
        </div>

        {/* TOP HUD UTILITIES */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => sendCommand({ status: 'sync_requested' })} disabled={cmd.status === 'sync_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: 'transparent', color: '#ffaa00', border: '2px solid #ffaa00', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: (cmd.status === 'sync_requested' || cmd.engine_status === 'offline') ? 0.3 : 1 }}>
            {cmd.status === 'sync_requested' ? 'SYNCING_CLUSTER...' : '[↻ FORCE_DESKTOP_SYNC]'}
          </button>
          <a href="/api/upload?download=true" download="hexnet_strategies.csv" style={{ backgroundColor: '#00f0ff', color: '#020406', padding: '10px 20px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', display: 'inline-block', border: '2px solid #00f0ff' }}>
            [↓ DOWNLOAD_MATRICES]
          </a>
          <button onClick={() => {
            if (!cmd.debug_csv_data || cmd.debug_csv_data.length === 0) { alert("Diagnostic tracking array is empty."); return; }
            const headers = ["Category", "Count", "Low", "25%", "Mean", "Median", "75%", "High"];
            const csvContent = [headers.join(","), ...cmd.debug_csv_data.map(row => headers.map(field => `"${row[field] !== undefined ? row[field] : ''}"`).join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob); link.download = "Hexnet_Debug_Stats.csv"; link.click();
          }} style={{ backgroundColor: '#0e1420', color: '#5c7294', border: '2px solid #1d2d44', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            [DGN_STATS.LOG]
          </button>
        </div>
      </div>

      {/* COMPUTATIONAL DISPATCH FEED */}
      {cmd.engine_status === 'running' && (
        <div className="animate-cascade seq-0" style={{ background: '#070b11', border: '2px solid #1d2d44', borderLeft: '4px solid #00f0ff', padding: '16px', marginBottom: '24px' }}>
          {!cmd.stage_text?.includes('Calculating') ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#ffffff', fontWeight: '700' }}>&gt; {cmd.stage_text || 'PROCESSING LOGIC ARRAYS'}</span>
                <span style={{ color: '#00ff66', fontWeight: '700' }}>{((cmd.progress / (cmd.total_sims || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#020406', height: '6px', overflow: 'hidden', border: '1px solid #1d2d44', marginBottom: '10px' }}>
                <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#00ff66', height: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#5c7294' }}>
                <span>MUTATIONS: <strong style={{ color: '#d2e0f5' }}>{cmd.progress?.toLocaleString()}</strong> / {cmd.total_sims?.toLocaleString()}</span>
                <span>CLUSTER_SPEED: <strong style={{ color: '#af40ff' }}>{cmd.sims_sec?.toLocaleString() || 0} exec/s</strong></span>
                <span>ETA: <strong style={{ color: '#ffaa00' }}>{cmd.eta || '--:--:--'}</strong></span>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#00ff66' }}>
                <span className="pulse-glow">&gt;&gt;</span> ENGINES DEPLOYED: RUNNING LIVE MULTI-THREADED MATRIX MATCH OPERATIONS...
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORE WORKSPACE SYSTEM NAVIGATION TABS */}
      <div className="animate-cascade seq-1" style={{ display: 'flex', borderBottom: '2px solid #1d2d44', marginBottom: '24px', gap: '6px' }}>
        <button onClick={() => setActiveTab('portfolio')} style={{ padding: '14px 28px', background: activeTab === 'portfolio' ? '#070b11' : 'transparent', color: activeTab === 'portfolio' ? '#00f0ff' : '#5c7294', border: '2px solid #1d2d44', borderBottom: activeTab === 'portfolio' ? '2px solid #070b11' : '2px solid #1d2d44', cursor: 'pointer', fontSize: '14px', fontWeight: '700', marginBottom: '-2px' }}>
          {activeTab === 'portfolio' ? '■ ' : ''}[PORTFOLIO_PERFORMANCE]
        </button>
        <button onClick={() => setActiveTab('generator')} style={{ padding: '14px 28px', background: activeTab === 'generator' ? '#070b11' : 'transparent', color: activeTab === 'generator' ? '#00f0ff' : '#5c7294', border: '2px solid #1d2d44', borderBottom: activeTab === 'generator' ? '2px solid #070b11' : '2px solid #1d2d44', cursor: 'pointer', fontSize: '14px', fontWeight: '700', marginBottom: '-2px' }}>
          {activeTab === 'generator' ? '■ ' : ''}[STRATEGY_GENERATOR]
        </button>
        <button onClick={() => setActiveTab('backtester')} style={{ padding: '14px 28px', background: activeTab === 'backtester' ? '#070b11' : 'transparent', color: activeTab === 'backtester' ? '#00f0ff' : '#5c7294', border: '2px solid #1d2d44', borderBottom: activeTab === 'backtester' ? '2px solid #070b11' : '2px solid #1d2d44', cursor: 'pointer', fontSize: '14px', fontWeight: '700', marginBottom: '-2px' }}>
          {activeTab === 'backtester' ? '■ ' : ''}[LIVE_BACKTESTER]
        </button>
      </div>

      {/* CENTRAL CONTROL ROOM PANEL */}
      <div style={{ backgroundColor: '#070b11', border: '2px solid #1d2d44', padding: '24px', minHeight: '500px' }}>
        
        {/* TAB 1: PORTFOLIO MAIN WORKING PANEL */}
        {activeTab === 'portfolio' && (
          <div key="viewport-portfolio">
            <div className="animate-cascade seq-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>NET_LIQUIDITY_VAL</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#00ff66', marginTop: '6px' }}>$100,000.00</div>
                <div style={{ fontSize: '11px', color: '#5c7294', marginTop: '6px' }}>PROP_FIRM BASE: LAYER_1</div>
              </div>
              <div style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>FLOATING_MARGIN_PNL</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#00f0ff', marginTop: '6px' }}>$0.00</div>
                <div style={{ fontSize: '11px', color: '#5c7294', marginTop: '6px' }}>0 ACTIVE EXPOSURE AGENTS</div>
              </div>
              <div style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>MAX_DAILY_DRAWDOWN_LIMIT</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffaa00', marginTop: '6px' }}>$5,000.00</div>
                <div style={{ fontSize: '11px', color: '#5c7294', marginTop: '6px' }}>BREACH EXPOSURE: 100% CLEAR</div>
              </div>
              <div style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>LIVEFIRE_GATE_LINK</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#ff3366', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pulse-glow" style={{ fontSize: '18px' }}>■</span> DISCONNECTED_STANDBY
                </div>
              </div>
            </div>

            {/* DEDICATED PORTFOLIO HIGH-SCALE INTEGRATED CANVAS GRAPH */}
            <div className="animate-cascade seq-1" style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '14px' }}>
                <span style={{ color: '#00f0ff', fontWeight: '700' }}>[PORTFOLIO_EQUITY_FEED_REALTIME]</span>
                <span style={{ color: '#5c7294' }}>GRID_MATRIX: RUNNING</span>
              </div>
              <div style={{ height: '280px', position: 'relative', border: '1px dashed #1d2d44', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29, 45, 68, 0.2)', height: '20%' }}>
                  <span style={{ fontSize: '11px', color: '#5c7294' }}>$105,000</span><span style={{ fontSize: '11px', color: '#1d2d44' }}>---------------------------------------------------------------------------------------------------------------------------------</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29, 45, 68, 0.2)', height: '20%' }}>
                  <span style={{ fontSize: '11px', color: '#5c7294' }}>$100,000</span><span style={{ fontSize: '11px', color: '#1d2d44' }}>---------------------------------------------------------------------------------------------------------------------------------</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29, 45, 68, 0.2)', height: '20%' }}>
                  <span style={{ fontSize: '11px', color: '#5c7294' }}>$95,000</span><span style={{ fontSize: '11px', color: '#1d2d44' }}>---------------------------------------------------------------------------------------------------------------------------------</span>
                </div>
                <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#5c7294', background: '#020406', padding: '8px 16px', border: '2px solid #1d2d44' }}>
                    &gt;&gt; LOGISTICAL PIPELINE COLD — AWAITING FIRST LIVE TRADE PLATFORM EXECUTION INDEX
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE CONSOLE LOG INPUT/OUTPUT STREAM */}
            <div className="animate-cascade seq-2" style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: '700', marginBottom: '12px' }}>LIVEFIRE_LOG_STREAM (STDOUT)</div>
              <div style={{ fontSize: '13px', color: '#5c7294', lineHeight: '1.6', background: '#04070a', padding: '14px', border: '1px solid #162235', height: '140px', overflowY: 'auto' }}>
                <div>[{new Date().toISOString().slice(0,10)} 00:01:12] <span style={{ color: '#00f0ff' }}>[CORE]</span> Hexnet architecture execution matrix linked successfully.</div>
                <div>[{new Date().toISOString().slice(0,10)} 00:01:13] <span style={{ color: '#00f0ff' }}>[REDIS]</span> Command state synchronization online.</div>
                <div>[{new Date().toISOString().slice(0,10)} 00:01:15] <span style={{ color: '#ffaa00' }}>[ROUTER]</span> Prop server allocation array running on safe standby configurations.</div>
                <div><span className="pulse-glow" style={{ color: '#00ff66' }}>■</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGY GENERATOR */}
        {activeTab === 'generator' && (
          <div key="viewport-generator">
            {/* DATA ENGINE ROUTING GRID */}
            <div className="animate-cascade seq-0" style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#00f0ff', fontSize: '14px', fontWeight: '700' }}>[DATA_ROUTING_ENGINE]</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#5c7294', fontSize: '12px' }}>
                    BUFFER: <strong style={{ color: '#ffffff' }}>{cmd.data_ticker}</strong> | WINDOWS: <strong style={{ color: '#ffffff' }}>{cmd.data_start}</strong> TO <strong style={{ color: '#ffffff' }}>{cmd.data_end}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#5c7294', fontWeight: '700' }}>TICKER</label>
                    <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '90px', padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#5c7294', fontWeight: '700' }}>INTERVAL</label>
                    <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={{ padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44' }}>
                      <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#5c7294', fontWeight: '700' }}>START_DATE</label>
                    <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: '#5c7294', fontWeight: '700' }}>END_DATE</label>
                    <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44' }} />
                  </div>
                  <button onClick={() => sendCommand({ status: 'fetch_requested' })} disabled={cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline'} style={{ background: '#00f0ff', color: '#020406', border: 'none', padding: '0 20px', height: '36px', fontWeight: '700', fontSize: '12px', marginTop: '18px', cursor: 'pointer', opacity: (cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline') ? 0.3 : 1 }}>
                    [ROUTING FETCH]
                  </button>
                </div>
              </div>
            </div>

            {/* GENERATOR CONFIGURATION ENGINE SPACE */}
            <div className="animate-cascade seq-1" style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '2px solid #1d2d44', paddingBottom: '16px', marginBottom: '16px' }}>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44', width: '250px' }}>
                  <option>Generate Random Strategies</option>
                  <option>Optimize Existing Strategy</option>
                  <option>Generate Advanced Optimal Strategy</option>
                </select>
                
                {cmd.mode === 'Optimize Existing Strategy' && (
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{ padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44', width: '180px' }}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                )}
                
                {/* WIDENED SIMS BOX FOR SEAMLESS LARGE VALUE READING */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>SIMS:</span>
                  <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={{ padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44', width: '150px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>GENS:</span>
                  <input type="number" value={cmd.gen_count || 10} onChange={(e) => sendCommand({ gen_count: parseInt(e.target.value) })} style={{ padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44', width: '70px' }} />
                </div>
                
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '6px', background: '#070b11', color: '#ffffff', border: '2px solid #1d2d44', width: '260px' }}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Walk-Forward Efficiency (WFE)</option>
                  <option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option>
                  <option>Strategy Alpha</option>
                  <option>Net PnL</option>
                  <option>Custom Score</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffaa00', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} style={{ accentColor: '#ffaa00', width: '16px', height: '16px' }} /> ADV_FILTERS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#af40ff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} style={{ accentColor: '#af40ff', width: '16px', height: '16px' }} /> 🧬GENETIC
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00ff66', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ accentColor: '#00ff66', width: '16px', height: '16px' }} /> LOOP
                  </label>
                  
                  <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline'} style={{ backgroundColor: '#00ff66', color: '#020406', border: 'none', padding: '10px 20px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', opacity: (cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline') ? 0.4 : 1 }}>
                    [LAUNCH]
                  </button>
                  <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested'} style={{ backgroundColor: '#ff3366', color: '#ffffff', border: 'none', padding: '10px 20px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', opacity: (cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested') ? 0.4 : 1 }}>
                    [ABORT]
                  </button>
                </div>
              </div>

              {/* DYNAMIC FITNESS BIAS TUNER */}
              {cmd.sort === 'Custom Score' && (
                <div className="animate-cascade seq-2" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '14px', background: '#070b11', border: '2px dashed #00f0ff', marginBottom: '16px' }}>
                  {[
                    { label: 'WIN_RATE', key: 'cw_wr' }, { label: 'NET_PNL', key: 'cw_pnl' }, { label: 'EXP_VAL', key: 'cw_ev' },
                    { label: 'SHARPE', key: 'cw_sharpe' }, { label: 'ALPHA', key: 'cw_alpha' }, { label: 'DRAWDOWN', key: 'cw_add' },
                    { label: 'AVG_LOSS', key: 'cw_al' }, { label: 'TPD', key: 'cw_tpd' }, { label: 'TPD_RET', key: 'cw_tpd_ret' }
                  ].map((field) => (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: '#5c7294', fontWeight: '700' }}>{field.label}</label>
                      <input type="number" step="0.1" min="0" max="1" value={cmd[field.key]} onChange={(e) => sendCommand({ [field.key]: parseFloat(e.target.value) })} style={{ width: '80px', padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* BOUNDING EVALUATION WINDOW SELECTION GRID */}
              <div className="animate-cascade seq-3">
                {cmd.mode === 'Generate Advanced Optimal Strategy' ? (
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ border: '2px solid #ff3366', padding: '14px', background: '#070b11', flex: 1, minWidth: '320px' }}>
                      <label style={{ fontSize: '11px', color: '#ff3366', fontWeight: '700', display: 'block', marginBottom: '6px' }}>HIGH_VOL IN-SAMPLE WINDOW</label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <input type="date" value={cmd.hv_start} onChange={(e) => sendCommand({ hv_start: e.target.value })} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44', flex: 1 }} />
                        <input type="date" value={cmd.hv_end} onChange={(e) => sendCommand({ hv_end: e.target.value })} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44', flex: 1 }} />
                      </div>
                    </div>
                    <div style={{ border: '2px solid #00ff66', padding: '14px', background: '#070b11', flex: 1, minWidth: '320px' }}>
                      <label style={{ fontSize: '11px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '6px' }}>LOW_VOL IN-SAMPLE WINDOW</label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <input type="date" value={cmd.lv_start} onChange={(e) => sendCommand({ lv_start: e.target.value })} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44', flex: 1 }} />
                        <input type="date" value={cmd.lv_end} onChange={(e) => sendCommand({ lv_end: e.target.value })} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44', flex: 1 }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', padding: '16px', background: '#070b11', border: '2px solid #1d2d44' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '6px' }}>IN-SAMPLE VALIDATION RANGE</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input type="date" value={cmd.is_start} onChange={(e) => sendCommand({ is_start: e.target.value })} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44' }} />
                        <input type="date" value={cmd.is_end} onChange={(e) => sendCommand({ is_end: e.target.value })} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#af40ff', fontWeight: '700', display: 'block', marginBottom: '6px' }}>OUT-OF-SAMPLE BOUND MATRIX OVERLAYS</label>
                      {(cmd.oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].start = e.target.value; sendCommand({ oos_list: newList }); }} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44' }} />
                          <input type="date" value={oos.end} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].end = e.target.value; sendCommand({ oos_list: newList }); }} style={{ padding: '6px', background: '#020406', color: '#ffffff', border: '2px solid #1d2d44' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FULL EXTENDED ADVANCED PARAMETER FILTERS STACK CONTAINER */}
              {cmd.adv_enabled && (
                <div className="animate-cascade seq-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', padding: '16px', background: '#070b11', border: '2px solid #ffaa00', marginTop: '16px' }}>
                  {[
                    { label: 'SMA MIN PARAM', key: 'sma_min' }, { label: 'SMA MAX PARAM', key: 'sma_max' },
                    { label: 'TAKE_PROFIT MIN', key: 'tp_min' }, { label: 'TAKE_PROFIT MAX', key: 'tp_max' },
                    { label: 'STOP_LOSS MIN', key: 'sl_min' }, { label: 'STOP_LOSS MAX', key: 'sl_max' },
                    { label: 'LOGIC GATES MAX', key: 'logic_max' }, { label: 'TARGET IDEAL TPD', key: 'ideal_tpd' },
                    { label: 'CRITICAL MIN TPD', key: 'min_tpd' }, { label: 'IDEAL TPD RET%', key: 'ideal_tpd_ret' },
                    { label: 'MIN TPD RETENTION%', key: 'min_tpd_ret' }, { label: 'TARGET IDEAL EV', key: 'ideal_ev' },
                    { label: 'CRITICAL MIN EV', key: 'min_ev' }, { label: 'TARGET IDEAL ADD', key: 'ideal_add' },
                    { label: 'ABSOLUTE MAX ADD', key: 'max_add' }, { label: 'IDEAL AVG LOSS', key: 'ideal_al' },
                    { label: 'ABSOLUTE MAX LOSS', key: 'max_al' }, { label: 'IDEAL TARGET WR%', key: 'ideal_wr' },
                    { label: 'CRITICAL MIN WR%', key: 'min_wr' }, { label: 'TARGET IDEAL SHARPE', key: 'ideal_sharpe' },
                    { label: 'CRITICAL MIN SHARPE', key: 'min_sharpe' }, { label: 'CRITICAL MIN PNL', key: 'min_pnl' },
                    { label: 'CRITICAL MIN WFE%', key: 'min_wfe' }
                  ].map((f) => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#020406', padding: '8px', border: '1px solid #1d2d44' }}>
                      <label style={{ fontSize: '10px', color: '#5c7294', fontWeight: '700' }}>{f.label}</label>
                      <input type="number" step="0.1" value={cmd[f.key]} onChange={(e) => sendCommand({ [f.key]: parseFloat(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#070b11', color: '#ffffff', border: '1px solid #1d2d44', height: '34px' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE PERFORMANCE BACKTESTER */}
        {activeTab === 'backtester' && (
          <div key="viewport-backtester" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            
            {/* LARGE ASSIGNMENT SELECTOR BLOCK */}
            <div className="animate-cascade seq-0" style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '14px', fontWeight: '700' }}>[STRATEGY_VECTOR_SELECTION_POOL]</h2>
                <p style={{ color: '#5c7294', marginBottom: '16px', fontSize: '12px' }}>Highlight and assign synced system profiles from the desktop core array to process across the simulation framework.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', color: '#5c7294', fontWeight: '700' }}>ACTIVE COMPILATION TARGETS (CTRL/CMD CLICK TO MULTI-SELECT)</label>
                  <select 
                    multiple
                    value={cmd.active_strats || []}
                    onChange={(e) => {
                      const options = e.target.options;
                      const values = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) values.push(options[i].value);
                      }
                      sendCommand({ active_strats: values });
                    }}
                    style={{ width: '100%', height: '220px', background: '#070b11', color: '#00f0ff', border: '2px solid #1d2d44', padding: '10px', fontSize: '13px', lineHeight: '1.6' }}
                  >
                    {cmd.available_strats && cmd.available_strats.length > 0 ? (
                      cmd.available_strats.map((strat, i) => (
                        <option key={i} value={strat} style={{ padding: '6px', background: '#070b11' }}>
                          {cmd.active_strats?.includes(strat) ? '► SYSTEM::' : '  LOGIC::'}{strat}
                        </option>
                      ))
                    ) : (
                      <option disabled style={{ color: '#5c7294' }}>AWAITING PIPELINE SIGNAL GENERATION ENTRIES...</option>
                    )}
                  </select>
                </div>
              </div>

              {/* INDUSTRIAL SCALE SECTOR LAUNCH TRIGGERS */}
              <button 
                onClick={startBacktest}
                disabled={!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running'}
                style={{ 
                  padding: '12px 24px', fontSize: '13px',
                  backgroundColor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#0e1420' : '#00ff66', 
                  color: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#5c7294' : '#020406', 
                  border: 'none', cursor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? 'not-allowed' : 'pointer', fontWeight: '700', alignSelf: 'flex-start', width: 'auto'
                }}
              >
                {cmd.engine_status === 'running' ? 'CLUSTER PROCESSING...' : '[EXECUTE STACK SIMULATION MATCH]'}
              </button>
            </div>

            {/* DEDICATED INDUSTRIAL DIAGNOSTIC BACKTEST CANVAS GRAPH PANEL */}
            <div className="animate-cascade seq-1" style={{ background: '#020406', border: '2px solid #1d2d44', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                <span style={{ color: '#00f0ff', fontWeight: '700' }}>[BACKTESTER_VECTOR_CANVAS]</span>
                <span style={{ color: '#5c7294' }}>SYSTEM_CORE: STANDBY</span>
              </div>
              <div style={{ flex: 1, minHeight: '260px', position: 'relative', border: '1px dashed #1d2d44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#5c7294', fontSize: '12px', padding: '16px', textAlign: 'center' }}>
                  [AWAITING SYSTEM COMPILATION GENERATION OVERLAYS]
                </span>
                <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '9px', color: '#1d2d44' }}>ENGINE_GRID_V2</div>
              </div>
            </div>

          </div>
        )}

        {/* METRICS LOGS LOGISTICAL DISPATCH DATA TABLE */}
        {activeTab !== 'portfolio' && (
          <div className="animate-cascade seq-2" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#5c7294', fontWeight: '700' }}>[GENERATED_STRATEGY_TELEMETRY_LOG]</span>
              <span style={{ fontSize: '10px', color: '#1d2d44', fontWeight: 'bold' }}>LOG_ROWS_LIMIT_260</span>
            </div>
            
            {data.length === 0 ? ( 
              <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#020406', border: '2px solid #1d2d44' }}> 
                <h3 style={{ color: '#5c7294', fontSize: '13px' }}>&gt;&gt; PIPELINE EMPTY: STANDBY FOR TRANSMISSION FLOW INTERFACE SOURCE ARRAY...</h3> 
              </div> 
            ) : ( 
              <div style={{ overflowX: 'auto', backgroundColor: '#020406', border: '2px solid #1d2d44' }}> 
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}> 
                  <thead> 
                    <tr style={{ backgroundColor: '#0e1420', borderBottom: '2px solid #1d2d44', fontSize: '11px', color: '#5c7294' }}> 
                      <th style={{ padding: '12px 16px' }}>{data[0]?.PF !== undefined ? 'IDENT_STRAT' : 'RANK_IDX'}</th> 
                      {data[0]?.ChartData !== undefined && <th style={{ padding: '12px 16px', width: '180px' }}>EQUITY_CANVAS</th>}
                      <th style={{ padding: '12px 16px' }}>SHARPE</th> 
                      <th style={{ padding: '12px 16px' }}>WIN_RATE</th> 
                      <th style={{ padding: '12px 16px' }}>TRADES</th> 
                      <th style={{ padding: '12px 16px' }}>NET_PNL</th> 
                      <th style={{ padding: '12px 16px' }}>EXPECTED_V</th> 
                      <th style={{ padding: '12px 16px', color: '#ffaa00' }}>ALPHA</th> 
                      <th style={{ padding: '12px 16px', color: '#ffaa00' }}>{data[0]?.PF !== undefined ? 'PROFIT_FACTOR' : 'ADD_PTS'}</th> 
                      <th style={{ padding: '12px 16px', color: '#af40ff' }}>{data[0]?.PF !== undefined ? '' : 'TPD_RET'}</th> 
                      <th style={{ padding: '12px 16px', color: '#af40ff' }}>{data[0]?.PF !== undefined ? '' : 'WFE'}</th> 
                      <th style={{ padding: '12px 16px', color: '#ffffff' }}>EVAL</th> 
                    </tr> 
                  </thead> 
                  <tbody> 
                    {data.slice(0, 260).map((row, i) => ( 
                      <tr key={i} style={{ borderBottom: '1px solid #0e1420', transition: 'background-color 0.05s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0e1420'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}> 
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#ffffff' }}>
                          {row.Name ? row.Name : `#${String(i + 1).padStart(3, '0')}`}
                        </td> 
                        
                        {data[0]?.ChartData !== undefined && (
                          <td style={{ padding: '4px 16px', verticalAlign: 'middle' }}>
                            <Sparkline data={row.ChartData} color={row.PnL >= 0 ? '#00ff66' : '#ff3366'} />
                          </td>
                        )}

                        <td style={{ padding: '12px 16px', fontWeight: '700', color: row.Sharpe >= 1.0 ? '#00ff66' : '#ff3366' }}>{row.Sharpe?.toFixed(2)}</td> 
                        <td style={{ padding: '12px 16px' }}>{row.WinRate?.toFixed(1)}%</td> 
                        <td style={{ padding: '12px 16px', color: '#d2e0f5' }}>{row.Trades}</td> 
                        <td style={{ padding: '12px 16px', color: row.PnL >= 0 ? '#00ff66' : '#ff3366', fontWeight: '700' }}>{row.PnL?.toFixed(2)}</td> 
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#af40ff' }}>{row.EV?.toFixed(2)}</td> 
                        <td style={{ padding: '12px 16px', color: row.Alpha >= 0 ? '#ffaa00' : '#ff3366', fontWeight: '700' }}>{row.Alpha?.toFixed(2)}</td> 
                        
                        <td style={{ padding: '12px 16px', color: '#ffaa00', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined 
                            ? (row.PF !== undefined ? row.PF.toFixed(2) : 'N/A') 
                            : (row.AverageDD !== undefined ? `${row.AverageDD.toFixed(2)}` : 'N/A')}
                        </td> 

                        <td style={{ padding: '12px 16px', color: '#af40ff', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined 
                            ? '' 
                            : (row.TPD_Ret !== undefined ? `${row.TPD_Ret.toFixed(1)}%` : 'N/A')}
                        </td>

                        <td style={{ padding: '12px 16px', color: '#af40ff', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined 
                            ? '' 
                            : (row.WFE !== undefined ? `${row.WFE.toFixed(1)}%` : 'N/A')}
                        </td> 
                        
                        <td style={{ padding: '12px 16px', fontWeight: '800', color: row.Passed === true || row.Passed === 'true' ? '#00ff66' : '#ff3366' }}>
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
