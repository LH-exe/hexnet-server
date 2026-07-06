"use client";
import { useEffect, useState, useRef } from 'react';

// --- Brutalist SVG Equity Curve Renderer ---
const Sparkline = ({ data, color }) => {
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
      {min < 0 && max > 0 && <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="var(--term-border)" strokeWidth="0.5" strokeDasharray="2,2" />}
      <polyline fill="none" stroke={color || "var(--term-cyan)"} strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export default function HexnetCLI() {
  const [activeTab, setActiveTab] = useState('portfolio'); // Portfolio is default
  const [cmdState, setCmdState] = useState(null);
  const [csvData, setCsvData] = useState([]);
  
  // Local Form Controls State (Retaining every single parameter variable from v2.9.9.9.8.0)
  const [mode, setMode] = useState('Generate Random Strategies');
  const [strategy, setStrategy] = useState('');
  const [sims, setSims] = useState(1000);
  const [sort, setSort] = useState('Composite Score (Best Overall)');
  const [auto, setAuto] = useState(true);
  const [autoMax, setAutoMax] = useState(10);
  const [genCount, setGenCount] = useState(10);

  // Advanced Variable Threshold Modules
  const [advEnabled, setAdvEnabled] = useState(false);
  const [smaMin, setSmaMin] = useState(10);
  const [smaMax, setSmaMax] = useState(200);
  const [tpMin, setTpMin] = useState(0.1);
  const [tpMax, setTpMax] = useState(100.0);
  const [slMin, setSlMin] = useState(0.1);
  const [slMax, setSlMax] = useState(100.0);
  const [logicMax, setLogicMax] = useState(2);

  // Structural Target Rules
  const [idealTpd, setIdealTpd] = useState(3.0);
  const [minTpd, setMinTpd] = useState(1.0);
  const [idealEv, setIdealEv] = useState(10.0);
  const [minEv, setMinEv] = useState(0.0);
  const [idealPf, setIdealPf] = useState(1.8);
  const [minPf, setMinPf] = useState(1.1);
  const [wfeMin, setWfeMin] = useState(45.0);

  // Mock State for Live Fire Tracking Modules
  const [liveMetrics] = useState({
    balance: "100,000.00",
    equity: "100,000.00",
    openPnL: "0.00",
    dailyPnL: "0.00",
    margin: "0.00",
  });

  // Keep track of internal sync status
  const hasLoadedInitial = useRef(false);

  // Global Engine Fetch Systems
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/command');
        const data = await res.json();
        setCmdState(data);

        if (!hasLoadedInitial.current && data) {
          if (data.mode !== undefined) setMode(data.mode);
          if (data.strategy !== undefined) setStrategy(data.strategy);
          if (data.sims !== undefined) setSims(data.sims);
          if (data.sort !== undefined) setSort(data.sort);
          if (data.auto !== undefined) setAuto(data.auto);
          if (data.auto_max !== undefined) setAutoMax(data.auto_max);
          if (data.gen_count !== undefined) setGenCount(data.gen_count);
          if (data.adv_enabled !== undefined) setAdvEnabled(data.adv_enabled);
          if (data.sma_min !== undefined) setSmaMin(data.sma_min);
          if (data.sma_max !== undefined) setSmaMax(data.sma_max);
          if (data.tp_min !== undefined) setTpMin(data.tp_min);
          if (data.tp_max !== undefined) setTpMax(data.tp_max);
          if (data.sl_min !== undefined) setSlMin(data.sl_min);
          if (data.sl_max !== undefined) setSlMax(data.sl_max);
          if (data.logic_max !== undefined) setLogicMax(data.logic_max);
          if (data.ideal_tpd !== undefined) setIdealTpd(data.ideal_tpd);
          if (data.min_tpd !== undefined) setMinTpd(data.min_tpd);
          if (data.ideal_ev !== undefined) setIdealEv(data.ideal_ev);
          if (data.min_ev !== undefined) setMinEv(data.min_ev);
          if (data.ideal_pf !== undefined) setIdealPf(data.ideal_pf);
          if (data.min_pf !== undefined) setMinPf(data.min_pf);
          if (data.wfe_min !== undefined) setWfeMin(data.wfe_min);
          hasLoadedInitial.current = true;
        }
      } catch (err) { console.error("Engine state fetch malfunction:", err); }
    };

    const fetchCsv = async () => {
      try {
        const res = await fetch('/api/upload');
        const data = await res.json();
        if (data && data.length > 0) setCsvData(data);
      } catch (err) { console.error("CSV cache stream error:", err); }
    };

    fetchState(); fetchCsv();
    const interval = setInterval(() => { fetchState(); fetchCsv(); }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Structural Form Post Framework
  const sendCommand = async (statusOverride = null) => {
    const payload = {
      mode, strategy, sims: Number(sims), sort,
      auto, auto_max: Number(autoMax), gen_count: Number(genCount),
      adv_enabled: advEnabled, sma_min: Number(smaMin), sma_max: Number(smaMax),
      tp_min: Number(tpMin), tp_max: Number(tpMax), sl_min: Number(slMin), sl_max: Number(slMax),
      logic_max: Number(logicMax), ideal_tpd: Number(idealTpd), min_tpd: Number(minTpd),
      ideal_ev: Number(idealEv), min_ev: Number(minEv), ideal_pf: Number(idealPf),
      min_pf: Number(minPf), wfe_min: Number(wfeMin)
    };
    if (statusOverride) payload.status = statusOverride;

    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) { console.error("Failed to transmit payload command sequence:", err); }
  };

  // Styling Declarations
  const mainWrapper = { padding: '30px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' };
  const bannerLayout = { borderBottom: '1px solid var(--term-green)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' };
  const terminalTabs = { display: 'flex', gap: '20px', borderBottom: '1px solid var(--term-border)' };
  
  const activeTabStyle = (name) => ({
    background: 'transparent',
    border: 'none',
    color: activeTab === name ? 'var(--term-cyan)' : 'var(--term-muted)',
    fontFamily: 'inherit',
    fontSize: '15px',
    cursor: 'pointer',
    padding: '12px 5px',
    textTransform: 'uppercase',
    fontWeight: activeTab === name ? 'bold' : 'normal',
    letterSpacing: '1px'
  });

  const layoutPanel = { border: '1px solid var(--term-border)', padding: '20px', background: '#020202', display: 'flex', flexDirection: 'column', gap: '15px' };
  const parameterGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' };
  const InputGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', color: 'var(--term-muted)', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={mainWrapper}>
      {/* HEADER STATUS BLOCK */}
      <div style={bannerLayout} className="boot-seq-1">
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '2px', color: 'var(--term-white)' }}>
            HEXNET_INTERFACE <span style={{ color: 'var(--term-green)' }}>v2.9.9.9.8.1</span>
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--term-muted)', marginTop: '4px' }}>
            SYS_TIME: {new Date().toLocaleTimeString()} | PIPELINE_STATE: {cmdState?.status ? cmdState.status.toUpperCase() : 'IDLE'}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px' }}>
          DESKTOP_DAEMON: 
          <span style={{ color: cmdState?.engine_status === 'online' ? 'var(--term-green)' : 'var(--term-red)', marginLeft: '8px' }}>
            [{cmdState?.engine_status ? cmdState.engine_status.toUpperCase() : 'OFFLINE'}]
          </span>
          <span className="cursor-blink"></span>
        </div>
      </div>

      {/* TERMINAL TAB CONTROL SELECTOR */}
      <div style={terminalTabs} className="boot-seq-2">
        <button style={activeTabStyle('portfolio')} onClick={() => setActiveTab('portfolio')}>
          {activeTab === 'portfolio' ? '> [ 01.PORTFOLIO ]' : '[ 01.PORTFOLIO ]'}
        </button>
        <button style={activeTabStyle('generator')} onClick={() => setActiveTab('generator')}>
          {activeTab === 'generator' ? '> [ 02.GENERATOR_MODULE ]' : '[ 02.GENERATOR_MODULE ]'}
        </button>
        <button style={activeTabStyle('live')} onClick={() => setActiveTab('live')}>
          {activeTab === 'live' ? '> [ 03.TELEMETRY_STREAM ]' : '[ 03.TELEMETRY_STREAM ]'}
        </button>
      </div>

      {/* ================= TAB 01: PORTFOLIO (DEFAULT VIEW) ================= */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          <div style={{ ...layoutPanel, borderColor: 'var(--term-red)', color: 'var(--term-red)', padding: '12px' }}>
            {"[! ] SYSTEM ALERT: EXECUTION ROUTER IS DISCONNECTED. AWAITING PROP_FIRM_API GATEWAY CREDENTIALS."}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>CORE_ACCOUNT_BALANCE</div>
              <div style={{ fontSize: '24px', color: 'var(--term-white)' }}>${liveMetrics.balance}</div>
            </div>
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>UNREALIZED_OPEN_PNL</div>
              <div style={{ fontSize: '24px', color: 'var(--term-green)' }}>${liveMetrics.openPnL}</div>
            </div>
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>SESSION_DAILY_PNL</div>
              <div style={{ fontSize: '24px', color: 'var(--term-green)' }}>${liveMetrics.dailyPnL}</div>
            </div>
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>MARGIN_UTILIZATION</div>
              <div style={{ fontSize: '24px', color: 'var(--term-white)' }}>${liveMetrics.margin}</div>
            </div>
          </div>

          <div style={layoutPanel}>
            <div style={{ color: 'var(--term-cyan)', borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px', fontSize: '13px' }}>
              ~/hexnet/logs/live_orders.cfg
            </div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: 'var(--term-muted)', borderBottom: '1px solid var(--term-border)' }}>
                  <th style={{ padding: '8px' }}>EXEC_TIME</th>
                  <th style={{ padding: '8px' }}>INSTRUMENT</th>
                  <th style={{ padding: '8px' }}>DIRECTION</th>
                  <th style={{ padding: '8px' }}>CONTRACTS</th>
                  <th style={{ padding: '8px' }}>FILL_PRICE</th>
                  <th style={{ padding: '8px' }}>ROUTE_STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" style={{ padding: '30px', color: 'var(--term-muted)', textAlign: 'center' }}>
                    {"/* NO OPEN TRADES ENCOUNTERED. BROKER CORE INACTIVE */"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 02: GENERATOR CONTROL PANELS ================= */}
      {activeTab === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          
          {/* Action Trigger Deck */}
          <div style={{ ...layoutPanel, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px' }}>
              STAGE_LOG: <span style={{ color: 'var(--term-cyan)' }}>{cmdState?.stage_text || 'AWAITING_SEQUENCE'}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="cli-btn" onClick={() => sendCommand('sync_requested')}>[ SYNC PARAMETERS ]</button>
              <button className="cli-btn" onClick={() => sendCommand('fetch_requested')}>[ FETCH FROM DAEMON ]</button>
              <button className="cli-btn" onClick={() => sendCommand('backtest_requested')}>[ RUN BACKTEST SIM ]</button>
              <button className="cli-btn cli-btn-danger" onClick={() => sendCommand('stop_requested')}>[ FORCE STOP ENGINE ]</button>
            </div>
          </div>

          {/* Primary & Genetic Parameter Form Matrices */}
          <div style={layoutPanel}>
            <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px' }}>
              ~/hexnet/config/optimizer_weights.json
            </div>
            
            <div style={parameterGrid}>
              <InputGroup label="Execution Strategy Mode">
                <select className="cli-input" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="Generate Random Strategies">Generate Random Strategies</option>
                  <option value="Optimize Strategies (Mega Mode)">Optimize Strategies (Mega Mode)</option>
                  <option value="Walk Forward Validation">Walk Forward Validation</option>
                </select>
              </InputGroup>

              <InputGroup label="Target Output Dataset File">
                <select className="cli-input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="">-- Active Optimization Target --</option>
                  {cmdState?.available_strats?.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label="Monte Carlo Simulations">
                <input type="number" className="cli-input" value={sims} onChange={(e) => setSims(e.target.value)} />
              </InputGroup>

              <InputGroup label="Primary Optimization Matrix Selector">
                <select className="cli-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="Composite Score (Best Overall)">Composite Score (Best Overall)</option>
                  <option value="Win Rate (High Reliability)">Win Rate (High Reliability)</option>
                  <option value="Profit Factor (Efficiency)">Profit Factor (Efficiency)</option>
                  <option value="Total Return (Max Yield)">Total Return (Max Yield)</option>
                  <option value="Average Drawdown (Risk Avoidance)">Average Drawdown (Risk Avoidance)</option>
                </select>
              </InputGroup>
            </div>

            <div style={{ ...parameterGrid, borderTop: '1px solid #111', paddingTop: '15px' }}>
              <InputGroup label="Automated Loop Controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '35px' }}>
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                  <span style={{ fontSize: '12px' }}>LOOP EXECUTION ACTIVE</span>
                </div>
              </InputGroup>

              <InputGroup label="Maximum Run Limits">
                <input type="number" className="cli-input" value={autoMax} onChange={(e) => setAutoMax(e.target.value)} />
              </InputGroup>

              <InputGroup label="Generation Iterations">
                <input type="number" className="cli-input" value={genCount} onChange={(e) => setGenCount(e.target.value)} />
              </InputGroup>
            </div>
          </div>

          {/* Advanced Constraints Toggles & Subforms */}
          <div style={layoutPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--term-cyan)', fontSize: '13px' }}>~/hexnet/config/advanced_filters.cfg</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={advEnabled} onChange={(e) => setAdvEnabled(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                <span style={{ fontSize: '11px', color: 'var(--term-white)' }}>ENGAGE HARD CONDITIONAL FILTERS</span>
              </div>
            </div>

            {advEnabled && (
              <div style={parameterGrid}>
                <InputGroup label="SMA Filter Domain (Min/Max)">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" className="cli-input" style={{ width: '50%' }} value={smaMin} onChange={(e) => setSmaMin(e.target.value)} />
                    <input type="number" className="cli-input" style={{ width: '50%' }} value={smaMax} onChange={(e) => setSmaMax(e.target.value)} />
                  </div>
                </InputGroup>

                <InputGroup label="Take Profit Bounds (Min/Max)">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={tpMin} onChange={(e) => setTpMin(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={tpMax} onChange={(e) => setTpMax(e.target.value)} />
                  </div>
                </InputGroup>

                <InputGroup label="Stop Loss Bounds (Min/Max)">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={slMin} onChange={(e) => setSlMin(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={slMax} onChange={(e) => setSlMax(e.target.value)} />
                  </div>
                </InputGroup>

                <InputGroup label="Logic Complexity Threshold">
                  <input type="number" className="cli-input" value={logicMax} onChange={(e) => setLogicMax(e.target.value)} />
                </InputGroup>
              </div>
            )}

            {/* Performance Acceptance Parameters Mapping */}
            <div style={{ ...parameterGrid, borderTop: '1px solid #111', paddingTop: '15px' }}>
              <InputGroup label="Target Trades Per Day (Ideal/Min)">
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={idealTpd} onChange={(e) => setIdealTpd(e.target.value)} />
                  <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={minTpd} onChange={(e) => setMinTpd(e.target.value)} />
                </div>
              </InputGroup>

              <InputGroup label="Expected Value Limits (Ideal/Min)">
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={idealEv} onChange={(e) => setIdealEv(e.target.value)} />
                  <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={minEv} onChange={(e) => setMinEv(e.target.value)} />
                </div>
              </InputGroup>

              <InputGroup label="Profit Factor Gate (Ideal/Min)">
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={idealPf} onChange={(e) => setIdealPf(e.target.value)} />
                  <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={minPf} onChange={(e) => setMinPf(e.target.value)} />
                </div>
              </InputGroup>

              <InputGroup label="Minimum Walk Forward Efficiency %">
                <input type="number" step="0.1" className="cli-input" value={wfeMin} onChange={(e) => setWfeMin(e.target.value)} />
              </InputGroup>
            </div>
          </div>

          {/* Mass Backtest Quantitative Strategy Output Matrix (The CSV Data Frame) */}
          <div style={layoutPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--term-cyan)', fontSize: '13px' }}>{"~/hexnet/data/cached_results.csv (" + csvData.length + " Strategies Loaded)"}</span>
              {csvData.length > 0 && (
                <a href="/api/upload?download=true" className="cli-btn" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>
                  [ EXPORT RAW CSV DATA ]
                </a>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--term-muted)', borderBottom: '1px solid var(--term-border)' }}>
                    <th style={{ padding: '10px' }}>ID / SIG</th>
                    <th style={{ padding: '10px' }}>LOGIC ENGINE</th>
                    <th style={{ padding: '10px' }}>EQUITY STREAM</th>
                    <th style={{ padding: '10px' }}>SCORE</th>
                    <th style={{ padding: '10px' }}>WIN %</th>
                    <th style={{ padding: '10px' }}>PF / AVG DD</th>
                    <th style={{ padding: '10px' }}>TPD RET %</th>
                    <th style={{ padding: '10px' }}>WFE %</th>
                    <th style={{ padding: '10px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '30px', color: 'var(--term-muted)', textAlign: 'center' }}>
                        {"/* DATA STREAM VACANT. INITIATE OPTIMIZATION SEQUENCE TO INJECT RECORDS */"}
                      </td>
                    </tr>
                  ) : (
                    csvData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #111', color: 'var(--term-white)' }}>
                        <td style={{ padding: '10px', color: 'var(--term-cyan)' }}>{row.ID || `STRAT_${index}`}</td>
                        <td style={{ padding: '10px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'var(--term-muted)' }}>
                          {row.Logic || 'N/A'}
                        </td>
                        <td style={{ padding: '10px', minWidth: '130px' }}>
                          <Sparkline data={row.EquityCurve || row.Trades} color={row.Passed === true || row.Passed === 'true' ? 'var(--term-green)' : 'var(--term-red)'} />
                        </td>
                        <td style={{ padding: '10px', color: 'var(--term-white)', fontWeight: 'bold' }}>
                          {row.CompositeScore !== undefined ? row.CompositeScore.toFixed(2) : (row.Score !== undefined ? row.Score.toFixed(2) : 'N/A')}
                        </td>
                        <td style={{ padding: '10px' }}>{row.WinRate !== undefined ? `${row.WinRate.toFixed(1)}%` : (row.WR !== undefined ? `${row.WR.toFixed(1)}%` : 'N/A')}</td>
                        <td style={{ padding: '10px' }}>
                          {row.PF !== undefined ? `PF: ${row.PF.toFixed(2)}` : `DD: $${row.AverageDD?.toFixed(0) || 'N/A'}`}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--term-green)' }}>{row.TPD_Ret !== undefined ? `${row.TPD_Ret.toFixed(1)}%` : 'N/A'}</td>
                        <td style={{ padding: '10px', color: 'var(--term-cyan)' }}>{row.WFE !== undefined ? `${row.WFE.toFixed(1)}%` : 'N/A'}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: row.Passed === true || row.Passed === 'true' ? 'var(--term-green)' : 'var(--term-red)' }}>
                          {row.Passed === true || row.Passed === 'true' ? 'PASS' : 'FAIL'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 03: TELEMETRY & RUNTIME PROGRESS ================= */}
      {activeTab === 'live' && (
        <div style={layoutPanel} className="boot-seq-3">
          <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px' }}>
            ~/hexnet/telemetry/runtime_logs.sh
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>COMPUTATION_SPEED</div>
              <div style={{ fontSize: '20px', color: 'var(--term-white)', marginTop: '5px' }}>{cmdState?.speed || '0.00'} sim/sec</div>
            </div>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>ESTIMATED_TIME_ARRIVAL</div>
              <div style={{ fontSize: '20px', color: 'var(--term-cyan)', marginTop: '5px' }}>{cmdState?.eta || '00:00:00'}</div>
            </div>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>CURRENT_GENERATION_LOOP</div>
              <div style={{ fontSize: '20px', color: 'var(--term-green)', marginTop: '5px' }}>
                {cmdState?.gen_count || 0} / {cmdState?.auto_max || 0}
              </div>
            </div>
          </div>

          {/* Progress Bar Visualization Matrix */}
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: 'var(--term-muted)' }}>
              <span>COMPUTATION PROGRESS PROFILE</span>
              <span>{cmdState?.progress ? `${Number(cmdState.progress).toFixed(1)}%` : '0.0%'}</span>
            </div>
            <div style={{ height: '14px', border: '1px solid var(--term-border)', background: '#000', position: 'relative' }}>
              <div style={{ 
                height: '100%', 
                width: cmdState?.progress ? `${cmdState.progress}%` : '0%', 
                background: 'var(--term-green-dim)', 
                transition: 'width 0.2s linear' 
              }} />
            </div>
          </div>

          {/* Dynamic Architecture Pools Tracker */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-cyan)', fontSize: '12px', marginBottom: '8px' }}>AVAILABLE_STRATEGIES_POOL ({cmdState?.available_strats?.length || 0})</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px', color: 'var(--term-muted)' }}>
                {cmdState?.available_strats?.map((str, idx) => (
                  <div key={idx} style={{ padding: '4px 0' }}>{`> ${str}`}</div>
                )) || '/* EMPTY POOL */'}
              </div>
            </div>

            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-green)', fontSize: '12px', marginBottom: '8px' }}>ACTIVE_BACKTEST_TARGETS ({cmdState?.active_strats?.length || 0})</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px', color: 'var(--term-muted)' }}>
                {cmdState?.active_strats?.map((str, idx) => (
                  <div key={idx} style={{ padding: '4px 0', color: 'var(--term-white)' }}>{`# [RUNNING] -> ${str}`}</div>
                )) || '/* MONITORING IDLE */'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
