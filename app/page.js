"use client";
import { useEffect, useState, useRef } from 'react';

const Sparkline = ({ data, color }) => {
  let parsedData = [];
  try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return <span style={{color: '#526685', fontSize: '10px', fontFamily: 'Fira Code'}}>ERR_DATA</span>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <span style={{color: '#526685', fontSize: '10px', fontFamily: 'Fira Code'}}>EMPTY_MAT</span>;
  
  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const points = parsedData.map((val, i) => `${(i / (parsedData.length - 1)) * 100},${100 - ((val - min) / range) * 100}`).join(' ');
  const zeroY = 100 - ((0 - min) / range) * 100;

  return (
    <svg viewBox="0 -5 100 110" preserveAspectRatio="none" style={{ width: '100%', minWidth: '120px', height: '28px', overflow: 'visible' }}>
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#152233" strokeDasharray="2" strokeWidth="1" />}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" points={points} />
    </svg>
  );
};

const FullCanvasGraph = ({ data, strategyName }) => {
  if (!data || data.length === 0) return <div style={{ color: '#526685', fontSize: '11px', fontFamily: 'Fira Code', padding: '20px' }}>[NO TRANSMISSION DATA RECORDED]</div>;
  
  const row = data.find(r => r.Name === strategyName) || data[0];
  if (!row) return <div style={{ color: '#526685', fontSize: '11px', fontFamily: 'Fira Code', padding: '20px' }}>[STRATEGY PROFILE NOT SPECIFIED]</div>;

  let parsedData = [];
  try { parsedData = typeof row.ChartData === 'string' ? JSON.parse(row.ChartData) : row.ChartData; } catch (e) { return <div style={{ color: '#ff3366', fontSize: '11px', fontFamily: 'Fira Code', padding: '20px' }}>[DATA_PARSING_ERROR]</div>; }
  if (!Array.isArray(parsedData) || parsedData.length === 0) return <div style={{ color: '#526685', fontSize: '11px', fontFamily: 'Fira Code', padding: '20px' }}>[ZERO_TICKS_RECORDED]</div>;

  const min = Math.min(...parsedData);
  const max = Math.max(...parsedData);
  const range = max - min === 0 ? 1 : max - min;
  const totalPoints = parsedData.length;

  const padLeft = 12;
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: '#020406' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00f0ff', background: '#0c121c', padding: '6px 12px', borderBottom: '1px solid #152233', fontWeight: 'bold', fontFamily: 'Fira Code', flexShrink: 0 }}>
        <span>ID: {row.Name}</span>
        <span>SHARPE: {row.Sharpe?.toFixed(2)} | PNL: ${row.PnL?.toFixed(2)}</span>
      </div>
      
      <div style={{ flex: 1, position: 'relative', minHeight: 0, padding: '10px' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {[0, 25, 50, 75, 100].map((pct) => {
            const x = padLeft + (pct / 100) * graphW;
            return <line key={`v-${pct}`} x1={x} y1={padTop} x2={x} y2={padTop + graphH} stroke="#101a26" strokeWidth="0.25" strokeDasharray="1 1" />;
          })}

          {[0, 25, 50, 75, 100].map((pct) => {
            const y = padTop + (pct / 100) * graphH;
            const val = max - (pct / 100) * range;
            return (
              <g key={`h-${pct}`}>
                <line x1={padLeft} y1={y} x2={100 - padRight} y2={y} stroke="#101a26" strokeWidth="0.25" strokeDasharray="1 1" />
                <text x={padLeft - 2} y={y + 1} fill="#526685" fontSize="3" style={{ fontFamily: 'Fira Code', fontWeight: '700' }} textAnchor="end">
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
              <text key={`x-${pct}`} x={x} y={100 - 1} fill="#526685" fontSize="3" style={{ fontFamily: 'Fira Code', fontWeight: '700' }} textAnchor="middle">
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
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showLiveCredsDrawer, setShowLiveCredsDrawer] = useState(false);
  const isFirstLoad = useRef(true); 
  const previousStatus = useRef('offline');

  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', mode: 'Generate Random Strategies', strategy: '', sims: 1000,
    sort: 'Composite Score (Best Overall)', auto: true, auto_max: 10, available_strats: [], active_strats: [],
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.1, tp_max: 100.0, sl_min: 0.1, sl_max: 100.0, logic_max: 2, 
    ideal_tpd: 3.0, min_tpd: 1.0, ideal_ev: 10.0, min_ev: 0.0, ideal_add: 10.0, max_add: 50.0,
    ideal_al: 1.0, max_al: 5.0, ideal_wr: 60.0, min_wr: 40.0, ideal_tpd_ret: 80.0, min_tpd_ret: 50.0, ideal_sharpe: 3.0, min_sharpe: 1.0, min_pnl: 0.0, min_wfe: 50.0,
    cw_wr: 1.0, cw_pnl: 1.0, cw_ev: 1.0, cw_sharpe: 1.0, cw_alpha: 1.0, cw_add: 1.0, cw_al: 1.0, cw_tpd_ret: 1.0, cw_tpd: 1.0,
    use_genetic: false, progress: 0, total_sims: 1000, trade_progress: { current: 0, total: 0 },
    eta: '--:--:--', sims_sec: 0, data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A',
    fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '', fetch_rth: true, fetch_pct: 0,
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
        timeoutId = setTimeout(pollCommandState, 15000);
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

  return (
    <div style={{ padding: '20px', maxWidth: '1650px', margin: '0 auto', backgroundColor: '#020406', color: '#cbd5e1', fontFamily: 'Fira Code, monospace', minHeight: '100vh' }}>
      
      {/* HEADER HUD BAR */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #152233', backgroundColor: '#070b11', padding: '16px 20px', marginBottom: '20px', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>HEXNET CONTROL DECK INTERFACE</h1>
            <span style={{ fontSize: '10px', padding: '2px 6px', background: '#0c121c', border: '1px solid #152233', color: '#526685', fontWeight: 'bold' }}>v2.9.9.9.8.6</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '11px' }}>
            <span style={{ color: cmd.engine_status !== 'offline' ? '#00ff66' : '#ff3366', fontWeight: 'bold' }}>● SYSTEM NODE: {cmd.engine_status?.toUpperCase()}</span>
            <span style={{ color: '#152233' }}>|</span>
            <span style={{ color: '#526685' }}>Handshake Matrix: <span style={{ color: '#cbd5e1' }}>{lastUpdate}</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowLiveCredsDrawer(true)} style={{ background: '#020406', color: '#af40ff', border: '1px solid #af40ff', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>[LINK TRADOVATE CREDENTIALS]</button>
          <button onClick={() => sendCommand({ status: 'sync_requested' })} disabled={cmd.engine_status === 'offline'} style={{ background: '#020406', color: '#ffaa00', border: '1px solid #ffaa00', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', opacity: cmd.engine_status === 'offline' ? 0.4 : 1 }}>[↻ FORCE RE-SYNC]</button>
          <a href="/api/upload?download=true" download="hexnet_strategies.csv" style={{ background: '#00f0ff', color: '#020406', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>[EXPORTS CSV]</a>
        </div>
      </div>

      {/* CLOUD TASK TRACKING LOOPS */}
      {cmd.engine_status === 'running' && (
        <div style={{ background: '#070b11', border: '1px solid #152233', borderLeft: '4px solid #00f0ff', padding: '12px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContext: 'space-between', marginBottom: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ color: '#ffffff' }}>&gt; {cmd.stage_text || 'PROCESSING SYSTEM TASKS'}</span>
            <span style={{ color: '#00ff66', marginLeft: 'auto' }}>{((cmd.progress / (cmd.total_sims || 1)) * 100).toFixed(1)}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#020406', height: '5px', border: '1px solid #152233', marginBottom: '6px' }}>
            <div style={{ width: `${Math.min(100, (cmd.progress / (cmd.total_sims || 1)) * 100)}%`, backgroundColor: '#00ff66', height: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '25px', fontSize: '11px', color: '#526685' }}>
            <span>MUTATIONS: <span style={{ color: '#cbd5e1' }}>{cmd.progress?.toLocaleString()}</span> / {cmd.total_sims?.toLocaleString()}</span>
            <span>SPEED: <span style={{ color: '#af40ff' }}>{cmd.sims_sec?.toLocaleString() || 0} exec/s</span></span>
            <span>ETA: <span style={{ color: '#ffaa00' }}>{cmd.eta || '--:--:--'}</span></span>
          </div>
        </div>
      )}

      {/* TACTICAL WORKSPACE TAB DIRECTORY */}
      <div style={{ display: 'flex', borderBottom: '1px solid #152233', marginBottom: '20px', gap: '5px' }}>
        {['portfolio', 'generator', 'backtester'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 18px', background: activeTab === tab ? '#070b11' : 'transparent', color: activeTab === tab ? '#00f0ff' : '#526685', border: '1px solid #152233', borderBottom: activeTab === tab ? '1px solid #070b11' : '1px solid #152233', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', marginBottom: '-1px' }}>
            {activeTab === tab ? '■ ' : ''}[{tab.toUpperCase()}_CONSOLE]
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT MATRIX MAPPING */}
      <div style={{ backgroundColor: '#070b11', border: '1px solid #152233', padding: '20px', minHeight: '500px' }}>
        
        {/* VIEWPORT 1: PORTFOLIO AUTOMATION PANEL */}
        {activeTab === 'portfolio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tradeify Execution Control Overlay Grid Card */}
            <div style={{ background: '#04070a', border: '1px solid #152233', padding: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #152233', paddingBottom: '12px', marginBottom: '16px', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', display: 'inline-block', backgroundColor: cmd.live_trading_enabled ? '#00ff66' : '#ff3366', borderRadius: '50%' }}></span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>TRADEIFY LIVE SYSTEM PIPELINE GATEWAY</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#526685' }}>STRATEGY: </span>
                    <select value={cmd.active_live_strategy} onChange={(e) => sendCommand({ active_live_strategy: e.target.value })} style={{ background: '#0c121c', color: '#00f0ff', border: '1px solid #152233', padding: '4px', fontWeight: 'bold', fontFamily: 'Fira Code' }}>
                      <option value="None Locked">None Locked</option>
                      {(cmd.available_strats || []).map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={{ color: '#526685' }}>REFRESH RATE: </span>
                    <input type="number" value={cmd.live_refresh_interval} onChange={(e) => sendCommand({ live_refresh_interval: parseInt(e.target.value) || 1 })} style={{ background: '#0c121c', color: '#ffaa00', border: '1px solid #152233', padding: '4px', width: '50px', textAlign: 'center', fontWeight: 'bold' }} />s
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#020406', border: '1px solid #152233', padding: '12px', display: 'flex', flexDirection: 'column', justifyContext: 'center', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontWeight: 'bold', fontSize: '11px', color: cmd.live_trading_enabled ? '#00ff66' : '#ff3366' }}>
                    <input type="checkbox" checked={cmd.live_trading_enabled || false} onChange={(e) => sendCommand({ live_trading_enabled: e.target.checked, emergency_flatten_requested: false })} style={{ width: '15px', height: '14px', accentColor: '#00ff66' }} />
                    {cmd.live_trading_enabled ? 'ALGO MODULE ACTIVE' : 'ALGO MODULE MUTED'}
                  </label>
                  <button onClick={() => sendCommand({ emergency_flatten_requested: true, live_trading_enabled: false, status: 'flatten_triggered' })} style={{ background: '#1c060e', color: '#ff3366', border: '1px solid #ff3366', padding: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', trackingSpacing: '0.5px' }}>🚨 EMERGENCY FLATTEN ALL</button>
                </div>
                
                {['def_contracts', 'loss_add', 'win_sub', 'contract_min', 'contract_max'].map((param) => (
                  <div key={param} style={{ background: '#020406', border: '1px solid #152233', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#526685', fontWeight: 'bold', marginBottom: '6px' }}>{param.toUpperCase().replace('_', ' ')}</div>
                    <input type="number" value={cmd.live_scaling?.[param] ?? 0} onChange={(e) => {
                      const copy = { ...cmd.live_scaling }; copy[param] = parseInt(e.target.value) || 0;
                      sendCommand({ live_scaling: copy });
                    }} style={{ width: '80%', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', textAlign: 'center', padding: '4px', fontSize: '12px', fontWeight: 'bold' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Verification and Deduplication Sourcing Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #152233', paddingBottom: '6px' }}>[1] LOCAL SANDBOX DATABENTO CALIBRATOR</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#526685' }}>TARGET FILENAME SNAPSHOT FOR VARIANCE VERIFICATION:</span>
                  <input type="text" value={cmd.sandbox_csv_name} onChange={(e) => sendCommand({ sandbox_csv_name: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233' }} />
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
                <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #152233', paddingBottom: '6px' }}>[2] DEDUPLICATED RECORDER / APPEND MATRIX LINK</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#526685' }}>APPEND SYSTEM TARGET LOCAL MASTER RECORDS STORAGE PATH:</span>
                  <input type="text" value={cmd.sync_target_csv} onChange={(e) => sendCommand({ sync_target_csv: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233' }} />
                </div>
                <button onClick={() => sendCommand({ status: 'csv_sync_requested' })} disabled={cmd.engine_status === 'offline'} style={{ background: '#0c121c', color: '#00ff66', border: '1px solid #00ff66', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', marginTop: '14px', alignSelf: 'flex-start' }}>EXECUTE MERGE APPEND PIPELINE</button>
              </div>
            </div>

            {/* Realtime Portfolio Monitor Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: 'bold' }}>REALTIME CASH LIQUIDITY Balance</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff66', marginTop: '4px' }}>$100,000.00</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: 'bold' }}>UNREALIZED ACC BALANCE OPEN PNL</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00f0ff', marginTop: '4px' }}>$0.00</div>
              </div>
              <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#526685', fontWeight: 'bold' }}>CRITICAL EOD RE RECALCULATED FLOOR</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffaa00', marginTop: '4px' }}>$96,000.00</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEWPORT 2: GENETIC PARAMETER MINE GENERATOR */}
        {activeTab === 'generator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContext: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#00f0ff', fontWeight: 'bold', fontSize: '12px' }}>[DATA_MAPPING_NODE]</span>
                <div style={{ fontSize: '11px', color: '#526685', marginTop: '2px' }}>TICKER: <span style={{ color: '#fff' }}>{cmd.data_ticker}</span> | POOLS: <span style={{ color: '#fff' }}>{cmd.data_start}</span> / <span style={{ color: '#fff' }}>{cmd.data_end}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                <input type="text" value={cmd.fetch_ticker} onChange={(e) => sendCommand({ fetch_ticker: e.target.value.toUpperCase() })} style={{ width: '70px', padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233' }} />
                <select value={cmd.fetch_interval} onChange={(e) => sendCommand({ fetch_interval: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233' }}>
                  <option>1m</option><option>5m</option><option>15m</option>
                </select>
                <input type="date" value={cmd.fetch_start} onChange={(e) => sendCommand({ fetch_start: e.target.value })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px' }} />
                <input type="date" value={cmd.fetch_end} onChange={(e) => sendCommand({ fetch_end: e.target.value })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px' }} />
                <button onClick={() => sendCommand({ status: 'fetch_requested' })} disabled={cmd.engine_status === 'offline'} style={{ background: '#00f0ff', color: '#020406', padding: '0 14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>FETCH STREAM</button>
              </div>
            </div>

            {/* Control Panel Parameters Row */}
            <div style={{ background: '#020406', border: '1px solid #152233', padding: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px', width: '210px' }}>
                  <option>Generate Random Strategies</option>
                  <option>Optimize Existing Strategy</option>
                  <option>Generate Advanced Optimal Strategy</option>
                </select>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#526685', fontWeight: 'bold' }}>SIMS:</span>
                  <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) || 100 })} style={{ padding: '4px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', width: '90px' }} />
                </div>

                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '5px', background: '#070b11', color: '#ffffff', border: '1px solid #152233', fontSize: '11px', width: '220px' }}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Walk-Forward Efficiency (WFE)</option>
                  <option>Strategy Sharpe</option>
                  <option>Expected Value (EV)</option>
                </select>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                  <label style={{ color: '#ffaa00', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.adv_enabled} onChange={(e) => sendCommand({ adv_enabled: e.target.checked })} /> FILTERS
                  </label>
                  <label style={{ color: '#af40ff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cmd.use_genetic} onChange={(e) => sendCommand({ use_genetic: e.target.checked })} /> 🧬 GENETIC
                  </label>
                  <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.engine_status === 'running' || cmd.engine_status === 'offline'} style={{ background: '#00ff66', color: '#020406', padding: '6px 16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '11px' }}>[START]</button>
                  <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.engine_status === 'idle'} style={{ background: '#ff3366', color: '#ffffff', padding: '6px 16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '11px' }}>[STOP]</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEWPORT 3: DYNAMIC ACCELERATED BACKTEST CHROMIUM VISUALIZER */}
        {activeTab === 'backtester' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#020406', border: '1px solid #152233', padding: '16px', display: 'flex', flexDirection: 'column', height: '460px' }}>
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>[HARDWARE_STATE_STRATEGY_SELECTOR]</span>
              <div style={{ background: '#070b11', border: '1px solid #152233', flex: 1, overflowY: 'auto', marginTop: '10px', padding: '4px' }}>
                {cmd.available_strats?.map((strat, idx) => {
                  const active = cmd.active_strats?.includes(strat);
                  return (
                    <div key={idx} onClick={() => handleToggleStrategy(strat)} style={{ padding: '8px', borderBottom: '1px solid #0c121c', color: active ? '#00f0ff' : '#cbd5e1', background: active ? 'rgba(0,240,255,0.05)' : 'transparent', fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', fontSize: '11px' }}>
                      {active ? '► ' : '▫ '} {strat}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => sendCommand({ status: 'backtest_requested', active_strats: cmd.active_strats })} disabled={cmd.engine_status === 'running'} style={{ background: '#00ff66', color: '#020406', border: 'none', padding: '10px', fontWeight: 'bold', fontSize: '11px', marginTop: '12px', cursor: 'pointer', width: 'max-content' }}>[RUN RADAR VERIFICATION]</button>
            </div>

            <div style={{ background: '#020406', border: '1px solid #152233', padding: '16px', display: 'flex', flexDirection: 'column', height: '460px' }}>
              <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', borderBottom: '1px solid #152233', paddingBottom: '6px', marginBottom: '8px' }}>
                <span style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold' }}>[STRATEGY VECTOR RENDERING OVERLAY]</span>
                {data.length > 0 && (
                  <select value={selectedBacktestStrat || data[0]?.Name} onChange={(e) => setSelectedBacktestStrat(e.target.value)} style={{ background: '#070b11', color: '#00f0ff', border: '1px solid #152233', fontSize: '11px', padding: '2px' }}>
                    {data.map((r, i) => <option key={i} value={r.Name}>{r.Name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <FullCanvasGraph data={data} strategyName={selectedBacktestStrat || data[0]?.Name} />
              </div>
            </div>
          </div>
        )}

        {/* GENERIC CONSOLE LOG MATRIX SHEETS FOR CALCULATIONS */}
        {activeTab !== 'portfolio' && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ overflowX: 'auto', backgroundColor: '#020406', border: '1px solid #152233' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Fira Code' }}>
                <thead>
                  <tr style={{ background: '#0c121c', borderBottom: '1px solid #152233', color: '#526685', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>STRATEGY IDENTIFIER MODEL</th>
                    <th style={{ padding: '10px', width: '150px' }}>GROWTH VELOCITY MATRIX</th>
                    <th style={{ padding: '10px' }}>SHARPE</th>
                    <th style={{ padding: '10px' }}>WIN_RATE</th>
                    <th style={{ padding: '10px' }}>TRADES</th>
                    <th style={{ padding: '10px' }}>NET_PNL</th>
                    <th style={{ padding: '10px' }}>EXPECTED_V</th>
                    <th style={{ padding: '10px' }}>PASS_FAIL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #0c121c' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#ffffff' }}>{row.Name || `NODE_SIM_${idx}`}</td>
                      <td style={{ padding: '2px 10px' }}><Sparkline data={row.ChartData} color={row.PnL >= 0 ? '#00ff66' : '#ff3366'} /></td>
                      <td style={{ padding: '8px 10px', color: row.Sharpe >= 1.0 ? '#00ff66' : '#ff3366', fontWeight: 'bold' }}>{row.Sharpe?.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}>{row.WinRate?.toFixed(1)}%</td>
                      <td style={{ padding: '8px 10px' }}>{row.Trades}</td>
                      <td style={{ padding: '8px 10px', color: row.PnL >= 0 ? '#00ff66' : '#ff3366', fontWeight: 'bold' }}>${row.PnL?.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', color: '#af40ff' }}>{row.EV?.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', color: row.Passed === true || row.Passed === 'true' ? '#00ff66' : '#ff3366', fontWeight: 'bold' }}>{row.Passed === true || row.Passed === 'true' ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* FLOATING APP CREDENTIAL HANDSHAKE SLIDEOUT DRAWER */}
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
                  <select value={cmd[field]} onChange={(e) => sendCommand({ [field]: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233' }}>
                    <option value="Demo">Simulation Sandbox (Demo API)</option>
                    <option value="Live">Live Capital Fire (Live API Execution)</option>
                  </select>
                ) : (
                  <input type={field.includes('password') || field.includes('sec') ? 'password' : 'text'} value={cmd[field]} onChange={(e) => sendCommand({ [field]: e.target.value })} style={{ padding: '6px', background: '#0c121c', color: '#ffffff', border: '1px solid #152233', fontFamily: 'Fira Code' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
