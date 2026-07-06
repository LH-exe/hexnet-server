"use client";
import { useEffect, useState, useRef } from 'react';

// --- Safe SVG Equity Curve Renderer ---
const Sparkline = ({ data, color }) => {
  let parsedData = [];
  try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return <span style={{color: '#53637c', fontSize: '11px'}}>DATA_ERR</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{color: '#53637c', fontSize: '11px'}}>NO_TRDS</span>;
  
  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const points = parsedData.map((val, i) => { return `${(i / (parsedData.length - 1)) * 100},${100 - ((val - min) / range) * 100}`; }).join(' ');
  const zeroY = 100 - ((0 - min) / range) * 100;

  return (
    <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{ width: '100%', minWidth: '130px', height: '36px', overflow: 'visible' }}>
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#1a2638" strokeDasharray="2" strokeWidth="1" />}
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("CONNECTING...");
  
  const isFirstLoad = useRef(true); 
  const previousStatus = useRef('offline');
  
  // 'portfolio' is configured as the structural initialization workspace index
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

  // --- Styled UI Design Layout Helpers ---
  const getStatusColor = () => {
    const status = (cmd.engine_status || 'offline').toLowerCase();
    if (status === 'running' || status === 'fetching') return '#00ff66';
    if (status === 'offline') return '#ff3366';
    return '#ffaa00';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1700px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* HEADER BAR TRACKER */}
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1a2638', backgroundColor: '#090e16', padding: '16px 20px', borderRadius: '4px', marginBottom: '20px', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff' }}>HEXNET//SYS_CMD</h1>
            <span style={{ fontSize: '11px', padding: '2px 6px', background: '#111823', border: '1px solid #1a2638', color: '#53637c', borderRadius: '2px' }}>v2.9.9.9.8.0</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px' }}>
            <span style={{ color: getStatusColor(), fontWeight: '700' }}>
              ● CORE_STATUS: {(cmd.engine_status || 'OFFLINE').toUpperCase()}
              {cmd.engine_status === 'fetching' && <span style={{ color: '#00f0ff', marginLeft: '6px' }}>[{cmd.fetch_pct || 0}%]</span>}
            </span>
            <span style={{ color: '#53637c' }}>|</span>
            <span style={{ color: '#53637c' }}>TELEMETRY_SYNC: <span style={{ color: '#c5d1e0' }}>{lastUpdate}</span></span>
          </div>
        </div>

        {/* TOP LEVEL ACTION RIGS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => sendCommand({ status: 'sync_requested' })} 
            disabled={cmd.status === 'sync_requested' || cmd.engine_status === 'offline'} 
            style={{ backgroundColor: 'transparent', color: '#ffaa00', border: '1px solid #ffaa00', padding: '8px 14px', borderRadius: '3px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', opacity: (cmd.status === 'sync_requested' || cmd.engine_status === 'offline') ? 0.4 : 1, transition: '0.15s' }}
          >
            {cmd.status === 'sync_requested' ? '⏳ SYNCING_EXEC' : '[↻ FORCE_DESKTOP_SYNC]'}
          </button>
          <a 
            href="/api/upload?download=true" 
            download="hexnet_strategies.csv" 
            style={{ backgroundColor: '#00f0ff', color: '#03060a', padding: '8px 14px', borderRadius: '3px', fontSize: '11px', fontWeight: '800', textDecoration: 'none', display: 'inline-block' }}
          >
            [↓ DOWNLOAD_MATRICES]
          </a>
          <button 
            onClick={() => {
              if (!cmd.debug_csv_data || cmd.debug_csv_data.length === 0) { alert("Diagnostic array empty. Run optimization cycle first."); return; }
              const headers = ["Category", "Count", "Low", "25%", "Mean", "Median", "75%", "High"];
              const csvContent = [headers.join(","), ...cmd.debug_csv_data.map(row => headers.map(field => `"${row[field] !== undefined ? row[field] : ''}"`).join(","))].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob); link.download = "Hexnet_Debug_Stats.csv"; link.click();
            }} 
            style={{ backgroundColor: '#111823', color: '#53637c', border: '1px solid #1a2638', padding: '8px 14px', borderRadius: '3px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
          >
            [DGN_STATS.LOG]
          </button>
        </div>
      </div>

      {/* COMPONENT TELEMETRY PROGRESS RUNNERS */}
      {cmd.engine_status === 'running' && (
        <div className="animate-fade-in" style={{ background: '#090e16', border: '1px solid #1a2638', borderLeft: '3px solid #00f0ff', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
          {!cmd.stage_text?.includes('Calculating') ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ color: '#ffffff', fontWeight: '700' }}>&gt; {cmd.stage_text || 'ALGORITHMIC OPTIMIZATION ENGINE RUNNING'}</span>
                <span style={{ color: '#00ff66', fontWeight: '700' }}>{((cmd.progress / (cmd.total_sims || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#03060a', height: '6px', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1a2638', marginBottom: '10px' }}>
                <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#00ff66', height: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#53637c' }}>
                <span>ITERATIONS: <strong style={{ color: '#c5d1e0' }}>{cmd.progress?.toLocaleString()}</strong> / {cmd.total_sims?.toLocaleString()}</span>
                <span>SPEED: <strong style={{ color: '#af40ff' }}>{cmd.sims_sec?.toLocaleString() || 0} cycles/s</strong></span>
                <span>COMP_ETA: <strong style={{ color: '#ffaa00' }}>{cmd.eta || '--:--:--'}</strong></span>
              </div>
            </>
          ) : (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#00ff66', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cursor-blink">&gt;</span> ⚡ RUNNING LIVE MULTI-THREADED STRATEGY SIMULATION MATRIX...
              </div>
              <p style={{ fontSize: '11px', color: '#53637c', marginTop: '4px' }}>Processing historical order-flow variables and variance calculations across active nodes.</p>
            </div>
          )}

          {cmd.stage_text?.includes("Simulating Trades") && cmd.trade_progress?.total > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #1a2638' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#00f0ff' }}>[BAR_PROCESSING_PIPELINE]</span>
                <span>{((cmd.trade_progress.current / cmd.trade_progress.total) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#03060a', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(cmd.trade_progress.current / cmd.trade_progress.total) * 100}%`, backgroundColor: '#00f0ff', height: '100%' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#53637c', marginTop: '4px' }}>{cmd.trade_progress.current.toLocaleString()} / {cmd.trade_progress.total.toLocaleString()} ticks mapped</div>
            </div>
          )}
        </div>
      )}

      {/* CORE TERMINAL TAB NAVIGATION SYSTEM */}
      <div className="animate-fade-in delay-1" style={{ display: 'flex', borderBottom: '1px solid #1a2638', marginBottom: '20px', gap: '4px' }}>
        <button 
          onClick={() => setActiveTab('portfolio')}
          style={{ padding: '10px 18px', background: activeTab === 'portfolio' ? '#090e16' : 'transparent', color: activeTab === 'portfolio' ? '#00f0ff' : '#53637c', border: '1px solid #1a2638', borderBottom: activeTab === 'portfolio' ? '1px solid #090e16' : '1px solid #1a2638', borderRadius: '3px 3px 0 0', cursor: 'pointer', fontSize: '11px', fontWeight: '700', transition: '0.15s', zIndex: 2, marginBottom: '-1px' }}
        >
          {activeTab === 'portfolio' ? '● ' : ''}[SYS_PORTFOLIO_CONSOLE]
        </button>
        <button 
          onClick={() => setActiveTab('generator')}
          style={{ padding: '10px 18px', background: activeTab === 'generator' ? '#090e16' : 'transparent', color: activeTab === 'generator' ? '#00f0ff' : '#53637c', border: '1px solid #1a2638', borderBottom: activeTab === 'generator' ? '1px solid #090e16' : '1px solid #1a2638', borderRadius: '3px 3px 0 0', cursor: 'pointer', fontSize: '11px', fontWeight: '700', transition: '0.15s', zIndex: 2, marginBottom: '-1px' }}
        >
          {activeTab === 'generator' ? '● ' : ''}[STRATEGY_GENERATOR]
        </button>
        <button 
          onClick={() => setActiveTab('backtester')}
          style={{ padding: '10px 18px', background: activeTab === 'backtester' ? '#090e16' : 'transparent', color: activeTab === 'backtester' ? '#00f0ff' : '#53637c', border: '1px solid #1a2638', borderBottom: activeTab === 'backtester' ? '1px solid #090e16' : '1px solid #1a2638', borderRadius: '3px 3px 0 0', cursor: 'pointer', fontSize: '11px', fontWeight: '700', transition: '0.15s', zIndex: 2, marginBottom: '-1px' }}
        >
          {activeTab === 'backtester' ? '● ' : ''}[LIVE_BACKTESTER]
        </button>
      </div>

      {/* TAB CONTENT MODULE: MAIN WORKSPACE CONSOLE */}
      <div className="animate-fade-in delay-2" style={{ backgroundColor: '#090e16', border: '1px solid #1a2638', borderRadius: '0 4px 4px 4px', padding: '20px', minHeight: '400px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
        
        {/* TAB 1: PORTFOLIO CONSOLE (DEFAULT INITIALIZATION INTERFACE) */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* TELEMETRY READOUT CARDS */}
              <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '14px', borderRadius: '3px' }}>
                <div style={{ fontSize: '10px', color: '#53637c', fontWeight: '700' }}>NET_LIQUIDITY_VAL</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#00ff66', marginTop: '4px', fontFamily: 'monospace' }}>$100,000.00</div>
                <div style={{ fontSize: '10px', color: '#53637c', marginTop: '4px' }}>PROP_FIRM ALLOCATION LEVEL_1</div>
              </div>

              <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '14px', borderRadius: '3px' }}>
                <div style={{ fontSize: '10px', color: '#53637c', fontWeight: '700' }}>FLOATING_MARGIN_PNL</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#00f0ff', marginTop: '4px' }}>$0.00</div>
                <div style={{ fontSize: '10px', color: '#53637c', marginTop: '4px' }}>0 ACTIVE RISK POSITION EXPOSURES</div>
              </div>

              <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '14px', borderRadius: '3px' }}>
                <div style={{ fontSize: '10px', color: '#53637c', fontWeight: '700' }}>MAX_DAILY_DRAWDOWN_LIMIT</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffaa00', marginTop: '4px' }}>$5,000.00</div>
                <div style={{ fontSize: '10px', color: '#53637c', marginTop: '4px' }}>CURRENT MARGIN BREACH GAP: 100%</div>
              </div>

              <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '14px', borderRadius: '3px' }}>
                <div style={{ fontSize: '10px', color: '#53637c', fontWeight: '700' }}>LIVEFIRE_GATE_LINK</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#ff3366', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="cursor-blink">■</span> DISCONNECTED_STANDBY
                </div>
                <div style={{ fontSize: '10px', color: '#53637c', marginTop: '4px' }}>AWAITING LIVE EXECUTION INTEGRATION</div>
              </div>
            </div>

            {/* PERFORMANCE MOCK TERMINAL TRACE DIAGRAM */}
            <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '16px', borderRadius: '3px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '11px' }}>
                <span style={{ color: '#00f0ff', fontWeight: '700' }}>[PERFORMANCE_METRIC_MATRIX_FEED]</span>
                <span style={{ color: '#53637c' }}>HISTORICAL_RUNNING_EQUITY_BASE</span>
              </div>
              <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #1a2638', borderRadius: '2px', position: 'relative' }}>
                <span style={{ color: '#53637c', fontSize: '11px', zIndex: 2 }}>[SYSTEM INITIALIZATION STANDBY — STABLE EXECUTIONS PIPELINE DETECTED]</span>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '9px', color: '#1a2638' }}>HEXNET_GRAPHICS_SYS_V2</div>
              </div>
            </div>

            {/* LOG ENGINE HISTORY READOUT FEED */}
            <div style={{ background: '#03060a', border: '1px solid #1a2638', borderRadius: '3px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#ffaa00', borderRadius: '50%' }}></span>
                LIVEFIRE_LOG_STREAM (STDOUT)
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#53637c', lineHeight: '1.6', background: '#05080c', padding: '12px', borderRadius: '2px', border: '1px solid #121b27', height: '160px', overflowY: 'auto' }}>
                <div>[{new Date().toISOString().slice(0,10)} 00:01:04] <span style={{ color: '#00f0ff' }}>[SYS_INIT]</span> Hexnet architecture modules compiled successfully.</div>
                <div>[{new Date().toISOString().slice(0,10)} 00:01:05] <span style={{ color: '#00f0ff' }}>[KV_REDIS]</span> Connected to remote command buffer.</div>
                <div>[{new Date().toISOString().slice(0,10)} 00:01:06] <span style={{ color: '#ffaa00' }}>[PROP_GATE]</span> Live link connection key array empty. Standing by for API bridge validation...</div>
                <div>[{new Date().toISOString().slice(0,10)} 09:53:16] <span style={{ color: '#53637c' }}>[POLL_PULSE]</span> Web interface sync matrix running smoothly. Ready for allocation array commands.</div>
                <div style={{ color: '#c5d1e0' }}><span className="cursor-blink">_</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGY GENERATOR */}
        {activeTab === 'generator' && (
          <>
            {/* DATA ENGINE SUB-CONTROLLER BLOCK */}
            <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '16px', borderRadius: '3px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#00f0ff', fontSize: '13px', fontWeight: '700' }}>[DATA_ROUTING_ENGINE]</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#53637c', fontSize: '11px' }}>
                    BUFFER: <strong style={{ color: '#ffffff' }}>{cmd.data_ticker}</strong> | WINDOW: <strong style={{ color: '#ffffff' }}>{cmd.data_start}</strong> TO <strong style={{ color: '#ffffff' }}>{cmd.data_end}</strong>
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', color: '#53637c', fontWeight: '700' }}>TICKER</label>
                    <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '70px', padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', color: '#53637c', fontWeight: '700' }}>INTERVAL</label>
                    <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={{ padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px' }}>
                      <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', color: '#53637c', fontWeight: '700' }}>START_DATE</label>
                    <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={{ padding: '4px 6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', color: '#53637c', fontWeight: '700' }}>END_DATE</label>
                    <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={{ padding: '4px 6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c5d1e0', fontSize: '11px', cursor: 'pointer', height: '30px' }}>
                    <input type="checkbox" checked={cmd.fetch_rth} onChange={(e) => sendCommand({ fetch_rth: e.target.checked })} style={{ accentColor: '#00f0ff' }} /> HIDE_ETH
                  </label>
                  <button 
                    onClick={() => sendCommand({ status: 'fetch_requested' })} 
                    disabled={cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline'} 
                    style={{ background: '#00f0ff', color: '#03060a', border: 'none', padding: '7px 14px', borderRadius: '2px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', opacity: (cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' || cmd.engine_status === 'offline') ? 0.4 : 1 }}
                  >
                    {cmd.status === 'fetch_requested' || cmd.engine_status === 'fetching' ? 'RUNNING...' : '[FETCH]'}
                  </button>
                </div>
              </div>
            </div>

            {/* GENERATION CRITERIA WORKSPACE CONTROLS */}
            <div style={{ background: '#03060a', border: '1px solid #1a2638', padding: '16px', borderRadius: '3px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #1a2638', paddingBottom: '16px', marginBottom: '16px' }}>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px', width: '230px' }}>
                  <option>Generate Random Strategies</option>
                  <option>Optimize Existing Strategy</option>
                  <option>Generate Advanced Optimal Strategy</option>
                </select>
                
                {cmd.mode === 'Optimize Existing Strategy' && (
                  <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{ padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px', width: '160px' }}>
                    {(cmd.available_strats || []).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#53637c', fontWeight: '700' }}>SIMS:</span>
                  <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={{ padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px', width: '75px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#53637c', fontWeight: '700' }}>GENS:</span>
                  <input type="number" value={cmd.gen_count || 10} onChange={(e) => sendCommand({ gen_count: parseInt(e.target.value) })} style={{ padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px', width: '60px' }} title="Manual Generation Override" />
                </div>
                
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '6px', background: '#090e16', color: '#ffffff', border: '1px solid #1a2638', fontSize: '12px', width: '220px' }}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Walk-Forward Efficiency (WFE)</option>
                  <option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option>
                  <option>Strategy Alpha</option>
                  <option>Net PnL</option>
                  <option>Custom Score</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffaa00', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} style={{ accentColor: '#ffaa00' }} /> FILTERS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#af40ff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} style={{ accentColor: '#af40ff' }} /> 🧬GENETIC
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00ff66', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ accentColor: '#00ff66' }} /> LOOP
                    </label>
                    {cmd.auto && (
                      <div style={{ display: 'flex', alignItems: 'center', background: '#090e16', padding: '2px 6px', border: '1px solid #1a2638', borderRadius: '2px' }}>
                        <span style={{ fontSize: '9px', color: '#53637c' }}>MAX:</span>
                        <input type="number" min="1" max="999" value={cmd.auto_max || 10} onChange={(e) => sendCommand({ auto_max: parseInt(e.target.value) || 1 })} style={{ width: '40px', background: 'transparent', color: '#ffffff', border: 'none', outline: 'none', fontSize: '12px', marginLeft: '4px' }} />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => sendCommand({ status: 'start_requested' })} 
                    disabled={cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline'} 
                    style={{ backgroundColor: '#00ff66', color: '#03060a', border: 'none', padding: '8px 16px', borderRadius: '2px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', opacity: (cmd.engine_status === 'running' || cmd.status === 'start_requested' || cmd.engine_status === 'offline') ? 0.4 : 1 }}
                  >
                    {cmd.status === 'start_requested' ? 'LAUNCHING...' : '[START]'}
                  </button>
                  <button 
                    onClick={() => sendCommand({ status: 'stop_requested' })} 
                    disabled={cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested'} 
                    style={{ backgroundColor: '#ff3366', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '2px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', opacity: (cmd.engine_status === 'idle' || cmd.engine_status === 'offline' || cmd.status === 'stop_requested') ? 0.4 : 1 }}
                  >
                    {cmd.status === 'stop_requested' ? 'KILLING...' : '[STOP]'}
                  </button>
                </div>
              </div>

              {/* DYNAMIC CUSTOM MATRICES WEIGHT MODIFIERS */}
              {cmd.sort === 'Custom Score' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '14px', background: '#090e16', border: '1px dashed #00f0ff', borderRadius: '3px', marginTop: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '100%', fontSize: '10px', color: '#00f0ff', fontWeight: '700', marginBottom: '-4px' }}>CUSTOM BIAS CALCULATOR WEIGHTS (0.0 TO 1.0)</div>
                  {[
                    { label: 'WIN_RATE', key: 'cw_wr' }, { label: 'NET_PNL', key: 'cw_pnl' }, { label: 'EXP_VAL', key: 'cw_ev' },
                    { label: 'SHARPE', key: 'cw_sharpe' }, { label: 'ALPHA', key: 'cw_alpha' }, { label: 'DRAWDOWN(INV)', key: 'cw_add' },
                    { label: 'AVG_LOSS(INV)', key: 'cw_al' }, { label: 'TPD', key: 'cw_tpd' }, { label: 'TPD_RETENT', key: 'cw_tpd_ret' }
                  ].map((field) => (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '9px', color: '#53637c', fontWeight: '700' }}>{field.label}</label>
                      <input type="number" step="0.1" min="0" max="1" value={cmd[field.key]} onChange={(e) => sendCommand({ [field.key]: parseFloat(e.target.value) })} style={{ width: '68px', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* WINDOW SELECTOR SLATE */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {cmd.mode === 'Generate Advanced Optimal Strategy' ? (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ border: '1px solid #ff3366', padding: '12px', borderRadius: '2px', background: '#090e16', flex: 1, minWidth: '280px' }}>
                      <label style={{ fontSize: '10px', color: '#ff3366', fontWeight: '700', display: 'block', marginBottom: '6px' }}>HIGH_VOL IN-SAMPLE MATRIX BOUNDS</label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <input type="date" value={cmd.hv_start} onChange={(e) => sendCommand({ hv_start: e.target.value })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                        <input type="date" value={cmd.hv_end} onChange={(e) => sendCommand({ hv_end: e.target.value })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                      </div>
                      <label style={{ fontSize: '10px', color: '#ff3366', fontWeight: '700', display: 'block', marginBottom: '4px' }}>HIGH_VOL OUT-OF-SAMPLE SLICES</label>
                      {(cmd.hv_oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.hv_oos_list]; l[idx].start = e.target.value; sendCommand({ hv_oos_list: l }); }} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                          <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.hv_oos_list]; l[idx].end = e.target.value; sendCommand({ hv_oos_list: l }); }} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                          {idx > 0 && <button onClick={() => sendCommand({ hv_oos_list: cmd.hv_oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '10px' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ hv_oos_list: [...(cmd.hv_oos_list || []), {start: '', end: ''}] })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '5px', fontSize: '10px', fontWeight: '700', width: '100%', marginTop: '4px', cursor: 'pointer' }}>+ ADD_WINDOW_SLICE</button>
                    </div>

                    <div style={{ border: '1px solid #00ff66', padding: '12px', borderRadius: '2px', background: '#090e16', flex: 1, minWidth: '280px' }}>
                      <label style={{ fontSize: '10px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '6px' }}>LOW_VOL IN-SAMPLE MATRIX BOUNDS</label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        <input type="date" value={cmd.lv_start} onChange={(e) => sendCommand({ lv_start: e.target.value })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                        <input type="date" value={cmd.lv_end} onChange={(e) => sendCommand({ lv_end: e.target.value })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                      </div>
                      <label style={{ fontSize: '10px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '4px' }}>LOW_VOL OUT-OF-SAMPLE SLICES</label>
                      {(cmd.lv_oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const l = [...cmd.lv_oos_list]; l[idx].start = e.target.value; sendCommand({ lv_oos_list: l }); }} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                          <input type="date" value={oos.end} onChange={(e) => { const l = [...cmd.lv_oos_list]; l[idx].end = e.target.value; sendCommand({ lv_oos_list: l }); }} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px', flex: 1 }} />
                          {idx > 0 && <button onClick={() => sendCommand({ lv_oos_list: cmd.lv_oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '10px' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ lv_oos_list: [...(cmd.lv_oos_list || []), {start: '', end: ''}] })} style={{ background: '#00ff66', color: '#03060a', border: 'none', padding: '5px', fontSize: '10px', fontWeight: '700', width: '100%', marginTop: '4px', cursor: 'pointer' }}>+ ADD_WINDOW_SLICE</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', padding: '12px', background: '#090e16', border: '1px solid #1a2638', borderRadius: '2px', width: '100%' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#00ff66', fontWeight: '700', display: 'block', marginBottom: '4px' }}>IN-SAMPLE ENGINE WINDOW</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="date" value={cmd.is_start} onChange={(e) => sendCommand({ is_start: e.target.value })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                        <input type="date" value={cmd.is_end} onChange={(e) => sendCommand({ is_end: e.target.value })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#af40ff', fontWeight: '700', display: 'block', marginBottom: '4px' }}>OUT-OF-SAMPLE EVALUATION SPLITS</label>
                      {(cmd.oos_list || [{start: '', end: ''}]).map((oos, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          <input type="date" value={oos.start} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].start = e.target.value; sendCommand({ oos_list: newList }); }} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                          <input type="date" value={oos.end} onChange={(e) => { const newList = [...cmd.oos_list]; newList[idx].end = e.target.value; sendCommand({ oos_list: newList }); }} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                          {idx > 0 && <button onClick={() => sendCommand({ oos_list: cmd.oos_list.filter((_, i) => i !== idx) })} style={{ background: '#ff3366', color: '#ffffff', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '10px' }}>X</button>}
                        </div>
                      ))}
                      <button onClick={() => sendCommand({ oos_list: [...(cmd.oos_list || []), {start: '', end: ''}] })} style={{ background: '#af40ff', color: '#ffffff', border: 'none', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '2px' }}>+ ADD_OOS_WINDOW</button>
                    </div>
                  </div>
                )}

                {/* FILTERS SYSTEM INNER DRILLDOWN */}
                {cmd.adv_enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', padding: '12px', background: '#090e16', border: '1px solid #ffaa00', borderRadius: '2px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '9px', color: '#ffffff' }}>SMA MIN/MAX</label>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <input type="number" value={cmd.sma_min} onChange={(e) => sendCommand({ sma_min: parseInt(e.target.value) })} style={{ width: '100%', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                        <input type="number" value={cmd.sma_max} onChange={(e) => sendCommand({ sma_max: parseInt(e.target.value) })} style={{ width: '100%', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '9px', color: '#ffffff' }}>TP MIN/MAX</label>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <input type="number" step="0.1" value={cmd.tp_min} onChange={(e) => sendCommand({ tp_min: parseFloat(e.target.value) })} style={{ width: '100%', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                        <input type="number" step="0.1" value={cmd.tp_max} onChange={(e) => sendCommand({ tp_max: parseFloat(e.target.value) })} style={{ width: '100%', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '9px', color: '#ffffff' }}>SL MIN/MAX</label>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <input type="number" step="0.1" value={cmd.sl_min} onChange={(e) => sendCommand({ sl_min: parseFloat(e.target.value) })} style={{ width: '100%', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                        <input type="number" step="0.1" value={cmd.sl_max} onChange={(e) => sendCommand({ sl_max: parseFloat(e.target.value) })} style={{ width: '100%', padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                      </div>
                    </div>
                    {[
                      { label: 'MAX GATES', key: 'logic_max', step: '1' }, { label: 'IDEAL TPD', key: 'ideal_tpd', step: '0.5' },
                      { label: 'MIN TPD', key: 'min_tpd', step: '0.1' }, { label: 'IDEAL TPD RET%', key: 'ideal_tpd_ret', step: '1' },
                      { label: 'MIN TPD RET%', key: 'min_tpd_ret', step: '1' }, { label: 'IDEAL EV(PTS)', key: 'ideal_ev', step: '1' },
                      { label: 'MIN EV(PTS)', key: 'min_ev', step: '0.5' }, { label: 'IDEAL ADD(PTS)', key: 'ideal_add', step: '1' },
                      { label: 'MAX ADD(PTS)', key: 'max_add', step: '1' }, { label: 'IDEAL AVG.LOSS', key: 'ideal_al', step: '0.1' },
                      { label: 'MAX AVG.LOSS', key: 'max_al', step: '0.1' }, { label: 'IDEAL WR %', key: 'ideal_wr', step: '1' },
                      { label: 'MIN WR %', key: 'min_wr', step: '1' }, { label: 'IDEAL SHARPE', key: 'ideal_sharpe', step: '0.1' },
                      { label: 'MIN SHARPE', key: 'min_sharpe', step: '0.1' }, { label: 'MIN NET PNL', key: 'min_pnl', step: '1' },
                      { label: 'MIN WFE %', key: 'min_wfe', step: '1' }
                    ].map((f) => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '9px', color: '#53637c' }}>{f.label}</label>
                        <input type="number" step={f.step} value={cmd[f.key]} onChange={(e) => sendCommand({ [f.key]: parseFloat(e.target.value) })} style={{ padding: '4px', background: '#03060a', color: '#ffffff', border: '1px solid #1a2638', fontSize: '11px' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: LIVE PERFORMANCE BACKTESTER */}
        {activeTab === 'backtester' && (
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '15px', fontWeight: '700' }}>[LIVE_STRATEGY_DELEGATION_CORE]</h2>
            <p style={{ color: '#53637c', marginBottom: '16px', fontSize: '11px' }}>Select structural node configurations loaded via the local engine sync process to test across the cluster topology.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', maxHeight: '350px', overflowY: 'auto', padding: '10px', backgroundColor: '#03060a', border: '1px solid #1a2638', borderRadius: '2px' }}>
              {cmd.available_strats && cmd.available_strats.length > 0 ? (
                cmd.available_strats.map((strat, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', backgroundColor: (cmd.active_strats || []).includes(strat) ? 'rgba(0, 240, 255, 0.05)' : 'transparent', border: (cmd.active_strats || []).includes(strat) ? '1px solid #00f0ff' : '1px solid transparent', borderRadius: '2px', transition: '0.1s' }}>
                    <input 
                      type="checkbox" 
                      checked={(cmd.active_strats || []).includes(strat)}
                      onChange={() => handleToggleStrategy(strat)}
                      style={{ accentColor: '#00f0ff', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: (cmd.active_strats || []).includes(strat) ? '#00f0ff' : '#c5d1e0' }}>{strat}</span>
                  </label>
                ))
              ) : (
                <div style={{ color: '#53637c', padding: '20px', textAlign: 'center', fontSize: '11px' }}>AWAITING NODE STRATEGIES SYNC MATRIX OVERFLOW...</div>
              )}
            </div>
            
            <button 
              onClick={startBacktest}
              disabled={!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running'}
              style={{ 
                padding: '12px 20px', fontSize: '12px',
                backgroundColor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#111823' : '#00ff66', 
                color: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? '#53637c' : '#03060a', 
                border: 'none', borderRadius: '2px', cursor: (!cmd.active_strats || cmd.active_strats.length === 0 || cmd.engine_status === 'running') ? 'not-allowed' : 'pointer', fontWeight: '800', width: '100%' 
              }}
            >
              {cmd.engine_status === 'running' ? 'ALGORITHMIC AGENT CLUSTER BUSY' : '[EXECUTE REMOTE MULTI-THREADED BACKTEST MATCH]'}
            </button>
          </div>
        )}

        {/* METRICS TRACKING DATA TABLE DISPATCHER */}
        {activeTab !== 'portfolio' && (
          <div className="animate-fade-in delay-3" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#53637c', fontWeight: '700' }}>[GENERATED_STRATEGY_TELEMETRY_LOG]</span>
              <span style={{ fontSize: '10px', color: '#1a2638' }}>ROWS_MAX_260</span>
            </div>
            
            {data.length === 0 ? ( 
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#03060a', borderRadius: '2px', border: '1px solid #1a2638' }}> 
                <h3 style={{ color: '#53637c', fontSize: '12px' }}>&gt; STANDBY: PIPELINE STREAM COLD. AWAITING PYTHON CORE ARRAYS...</h3> 
              </div> 
            ) : ( 
              <div style={{ overflowX: 'auto', backgroundColor: '#03060a', border: '1px solid #1a2638', borderRadius: '3px' }}> 
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '11px' }}> 
                  <thead> 
                    <tr style={{ backgroundColor: '#111823', borderBottom: '1px solid #1a2638', fontSize: '10px', color: '#53637c' }}> 
                      <th style={{ padding: '10px 14px' }}>{data[0]?.PF !== undefined ? 'STRAT_IDENT' : 'IDX_RANK'}</th> 
                      {data[0]?.ChartData !== undefined && <th style={{ padding: '10px 14px', width: '150px' }}>EQUITY_CURVE</th>}
                      <th style={{ padding: '10px 14px' }}>SQN_SHARPE</th> 
                      <th style={{ padding: '10px 14px' }}>WIN_RATE</th> 
                      <th style={{ padding: '10px 14px' }}>TRADES</th> 
                      <th style={{ padding: '10px 14px' }}>NET_PNL</th> 
                      <th style={{ padding: '10px 14px' }}>EXP_VAL</th> 
                      <th style={{ padding: '10px 14px', color: '#ffaa00' }}>ALPHA</th> 
                      <th style={{ padding: '10px 14px', color: '#ffaa00' }}>{data[0]?.PF !== undefined ? 'PROFIT_FACTOR' : 'ADD_PTS'}</th> 
                      <th style={{ padding: '10px 14px', color: '#af40ff' }}>{data[0]?.PF !== undefined ? '' : 'TPD_RET%'}</th> 
                      <th style={{ padding: '10px 14px', color: '#af40ff' }}>{data[0]?.PF !== undefined ? '' : 'WFE%'}</th> 
                      <th style={{ padding: '10px 14px', color: '#ffffff' }}>EVAL</th> 
                    </tr> 
                  </thead> 
                  <tbody> 
                    {data.slice(0, 260).map((row, i) => ( 
                      <tr key={i} style={{ borderBottom: '1px solid #121b27', transition: 'background-color 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111823'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}> 
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#ffffff' }}>
                          {row.Name ? row.Name : `#${String(i + 1).padStart(3, '0')}`}
                        </td> 
                        
                        {data[0]?.ChartData !== undefined && (
                          <td style={{ padding: '2px 14px', verticalAlign: 'middle' }}>
                            <Sparkline data={row.ChartData} color={row.PnL >= 0 ? '#00ff66' : '#ff3366'} />
                          </td>
                        )}

                        <td style={{ padding: '10px 14px', fontWeight: '700', color: row.Sharpe >= 1.0 ? '#00ff66' : '#ff3366' }}>{row.Sharpe?.toFixed(2)}</td> 
                        <td style={{ padding: '10px 14px' }}>{row.WinRate?.toFixed(1)}%</td> 
                        <td style={{ padding: '10px 14px', color: '#c5d1e0' }}>{row.Trades}</td> 
                        <td style={{ padding: '10px 14px', color: row.PnL >= 0 ? '#00ff66' : '#ff3366', fontWeight: '700' }}>{row.PnL?.toFixed(2)}</td> 
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#af40ff' }}>{row.EV?.toFixed(2)}</td> 
                        <td style={{ padding: '10px 14px', color: row.Alpha >= 0 ? '#ffaa00' : '#ff3366', fontWeight: '700' }}>{row.Alpha?.toFixed(2)}</td> 
                        
                        <td style={{ padding: '10px 14px', color: '#ffaa00', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined 
                            ? (row.PF !== undefined ? row.PF.toFixed(2) : 'N/A') 
                            : (row.AverageDD !== undefined ? `${row.AverageDD.toFixed(2)}` : 'N/A')}
                        </td> 

                        <td style={{ padding: '10px 14px', color: '#af40ff', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined 
                            ? '' 
                            : (row.TPD_Ret !== undefined ? `${row.TPD_Ret.toFixed(1)}%` : 'N/A')}
                        </td>

                        <td style={{ padding: '10px 14px', color: '#af40ff', fontWeight: '700' }}>
                          {data[0]?.PF !== undefined 
                            ? '' 
                            : (row.WFE !== undefined ? `${row.WFE.toFixed(1)}%` : 'N/A')}
                        </td> 
                        
                        <td style={{ 
                          padding: '10px 14px', 
                          fontWeight: '800', 
                          color: row.Passed === true || row.Passed === 'true' ? '#00ff66' : '#ff3366' 
                        }}>
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
