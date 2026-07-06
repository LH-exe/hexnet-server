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
  const [activeTab, setActiveTab] = useState('portfolio'); 
  const [cmdState, setCmdState] = useState(null);
  const [csvData, setCsvData] = useState([]);
  
  // =========================================================================
  // 100% ACCURATE STATE VARIABLES (MAPPED DIRECTLY FROM HEXNETORIGINAL.PDF)
  // =========================================================================
  
  // 1. Data Engine
  const [ticker, setTicker] = useState('SPY');
  const [interval, setIntervalStr] = useState('1m');
  const [dataStart, setDataStart] = useState('2019-10-03');
  const [dataEnd, setDataEnd] = useState('2026-05-13');
  const [hideExtHours, setHideExtHours] = useState(false);

  // 2. Generator Core
  const [mode, setMode] = useState('Generate Random Strategies');
  const [sims, setSims] = useState(1000000);
  const [sort, setSort] = useState('Custom Score');
  const [gens, setGens] = useState(15);
  const [advFilters, setAdvFilters] = useState(true);
  const [geneticAutoLoop, setGeneticAutoLoop] = useState(true);

  // 3. Custom Fitness Weights (The exact 9 from your UI)
  const [wWinRate, setWWinRate] = useState(0.0);
  const [wNetPnl, setWNetPnl] = useState(0.75);
  const [wExpValue, setWExpValue] = useState(1.0);
  const [wTpd, setWTpd] = useState(0.5);
  const [wTpdRet, setWTpdRet] = useState(0.75);
  const [wSharpe, setWSharpe] = useState(0.75);
  const [wAlpha, setWAlpha] = useState(0.1);
  const [wAddInv, setWAddInv] = useState(0.5);
  const [wAvgLossInv, setWAvgLossInv] = useState(0.5);

  // 4. Dynamic Time Windows
  const [inSampleStart, setInSampleStart] = useState('2023-07-27');
  const [inSampleEnd, setInSampleEnd] = useState('2025-07-07');
  const [oosWindows, setOosWindows] = useState([
    { start: '2025-07-08', end: '2026-05-13' }
  ]);

  // 5. Advanced Gates & Constraints
  const [smaMin, setSmaMin] = useState(1);
  const [smaMax, setSmaMax] = useState(1000);
  const [tpMin, setTpMin] = useState(0.1);
  const [tpMax, setTpMax] = useState(5.0);
  const [slMin, setSlMin] = useState(0.1);
  const [slMax, setSlMax] = useState(5.0);
  const [maxGates, setMaxGates] = useState(3);
  const [idealTpd, setIdealTpd] = useState(5.0);
  const [minTpd, setMinTpd] = useState(1.0);

  // Portfolio Mock Data
  const [liveMetrics] = useState({
    balance: "100,000.00", equity: "100,000.00", openPnL: "0.00", dailyPnL: "0.00", margin: "0.00"
  });

  const hasLoadedInitial = useRef(false);

  // -------------------------------------------------------------------------
  // NETWORK & SYNC LOGIC
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/command');
        const data = await res.json();
        setCmdState(data);

        // Map backend state on first load if it exists
        if (!hasLoadedInitial.current && data) {
          if (data.ticker !== undefined) setTicker(data.ticker);
          if (data.sims !== undefined) setSims(data.sims);
          if (data.oos_windows !== undefined) setOosWindows(data.oos_windows);
          hasLoadedInitial.current = true;
        }
      } catch (err) { console.error("Fetch Err:", err); }
    };

    const fetchCsv = async () => {
      try {
        const res = await fetch('/api/upload');
        const data = await res.json();
        if (data && data.length > 0) setCsvData(data);
      } catch (err) { console.error("CSV Fetch Err:", err); }
    };

    fetchState(); fetchCsv();
    const intervalId = setInterval(() => { fetchState(); fetchCsv(); }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const sendCommand = async (actionCommand = null) => {
    const payload = {
      // General Config
      ticker, interval: intervalStr, data_start: dataStart, data_end: dataEnd, hide_ext_hours: hideExtHours,
      // Engine Config
      mode, sims: Number(sims), sort, gens: Number(gens), adv_filters: advFilters, genetic_auto_loop: geneticAutoLoop,
      // Weights
      w_win_rate: Number(wWinRate), w_net_pnl: Number(wNetPnl), w_exp_value: Number(wExpValue), w_tpd: Number(wTpd),
      w_tpd_ret: Number(wTpdRet), w_sharpe: Number(wSharpe), w_alpha: Number(wAlpha), w_add_inv: Number(wAddInv), w_avg_loss_inv: Number(wAvgLossInv),
      // Time Windows
      in_sample_start: inSampleStart, in_sample_end: inSampleEnd, oos_windows: oosWindows,
      // Constraints
      sma_min: Number(smaMin), sma_max: Number(smaMax), tp_min: Number(tpMin), tp_max: Number(tpMax),
      sl_min: Number(slMin), sl_max: Number(slMax), max_gates: Number(maxGates), ideal_tpd: Number(idealTpd), min_tpd: Number(minTpd)
    };
    
    if (actionCommand) payload.status = actionCommand;

    try {
      await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (err) { console.error("Command Post Err:", err); }
  };

  // -------------------------------------------------------------------------
  // DYNAMIC OOS HANDLERS
  // -------------------------------------------------------------------------
  const addOosWindow = () => {
    setOosWindows([...oosWindows, { start: '', end: '' }]);
  };
  
  const updateOosWindow = (index, field, value) => {
    const newWindows = [...oosWindows];
    newWindows[index][field] = value;
    setOosWindows(newWindows);
  };

  const removeOosWindow = (index) => {
    const newWindows = [...oosWindows];
    newWindows.splice(index, 1);
    setOosWindows(newWindows);
  };

  // -------------------------------------------------------------------------
  // UI HELPERS
  // -------------------------------------------------------------------------
  const panelStyle = { border: '1px solid var(--term-border)', padding: '20px', background: '#030303', display: 'flex', flexDirection: 'column', gap: '15px' };
  const InputGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      <label style={{ fontSize: '11px', color: 'var(--term-muted)', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
  const PanelHeader = ({ title }) => (
    <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '5px', fontWeight: 'bold' }}>
      {`[ ${title} ]`}
    </div>
  );

  return (
    <div style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER: Matching HexnetOriginal.pdf */}
      <div style={{ borderBottom: '1px solid var(--term-green)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="boot-seq-1">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '2px', color: 'var(--term-white)' }}>HEXNET REMOTE COMMAND</h1>
          <div style={{ fontSize: '12px', color: 'var(--term-muted)', marginTop: '4px' }}>
            ENGINE STATUS: <span style={{ color: cmdState?.engine_status === 'online' ? 'var(--term-green)' : 'var(--term-red)' }}>{cmdState?.engine_status ? cmdState.engine_status.toUpperCase() : 'OFFLINE'}</span> | SYNC: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="cli-btn" onClick={() => sendCommand('sync_requested')}>FORCE DESKTOP SYNC</button>
          <button className="cli-btn" onClick={() => sendCommand('fetch_requested')}>↓ DEBUG STATS</button>
          {csvData.length > 0 && <a href="/api/upload?download=true" className="cli-btn" style={{ textDecoration: 'none' }}>! DOWNLOAD RESULTS</a>}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--term-border)' }} className="boot-seq-2">
        {['portfolio', 'strategy generator', 'telemetry stream'].map((tab, idx) => {
          const tabKey = tab.split(' ')[0];
          return (
            <button key={tabKey} onClick={() => setActiveTab(tabKey)} style={{
              background: 'transparent', border: 'none', color: activeTab === tabKey ? 'var(--term-cyan)' : 'var(--term-muted)',
              fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer', padding: '10px 5px', textTransform: 'uppercase',
              fontWeight: activeTab === tabKey ? 'bold' : 'normal', letterSpacing: '1px'
            }}>
              {activeTab === tabKey ? `> [ 0${idx+1}.${tab} ]` : `[ 0${idx+1}.${tab} ]`}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 01: PORTFOLIO ================= */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          <div style={{ ...panelStyle, borderColor: 'var(--term-red)', color: 'var(--term-red)', padding: '15px' }}>
            {"[! ] NO BROKER DATA FEED DETECTED. LIVE FIRE TESTING DISABLED."}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {Object.entries(liveMetrics).map(([key, val]) => (
              <div key={key} style={panelStyle}>
                <div style={{ color: 'var(--term-muted)', fontSize: '12px', textTransform: 'uppercase' }}>{key}</div>
                <div style={{ fontSize: '28px', color: key === 'margin' || key === 'balance' ? 'var(--term-white)' : 'var(--term-green)' }}>${val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 02: STRATEGY GENERATOR ================= */}
      {activeTab === 'strategy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          
          {/* TOP BLOCK: Data Engine + Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px' }}>
            
            <div style={panelStyle}>
              <PanelHeader title="DATA ENGINE" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', alignItems: 'end' }}>
                <InputGroup label="Ticker"><input type="text" className="cli-input" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} /></InputGroup>
                <InputGroup label="Interval"><input type="text" className="cli-input" value={intervalStr} onChange={(e) => setIntervalStr(e.target.value)} /></InputGroup>
                <InputGroup label="Start Date"><input type="date" className="cli-input" value={dataStart} onChange={(e) => setDataStart(e.target.value)} /></InputGroup>
                <InputGroup label="End Date"><input type="date" className="cli-input" value={dataEnd} onChange={(e) => setDataEnd(e.target.value)} /></InputGroup>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={hideExtHours} onChange={(e) => setHideExtHours(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--term-white)' }}>HIDE EXT. HOURS</span>
                  </div>
                  <button className="cli-btn" style={{ fontSize: '11px', padding: '4px' }}>REMOTE FETCH</button>
                </div>
              </div>
            </div>

            <div style={{ ...panelStyle, justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="cli-btn" onClick={() => sendCommand('backtest_requested')} style={{ fontSize: '16px', padding: '15px', background: 'var(--term-green-dim)' }}>► START ENGINE</button>
                <button className="cli-btn cli-btn-danger" onClick={() => sendCommand('stop_requested')} style={{ fontSize: '16px', padding: '15px' }}>■ STOP</button>
              </div>
            </div>
          </div>

          {/* MIDDLE BLOCK: Generator Constraints & Weights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={panelStyle}>
              <PanelHeader title="GENERATOR CONFIGURATION" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <select className="cli-input" style={{ width: '100%' }} value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option>Generate Random Strategies</option>
                    <option>Generate Advanced Optimal Strategies</option>
                  </select>
                </div>
                <InputGroup label="SIMS"><input type="number" className="cli-input" value={sims} onChange={(e) => setSims(e.target.value)} /></InputGroup>
                <InputGroup label="GENS"><input type="number" className="cli-input" value={gens} onChange={(e) => setGens(e.target.value)} /></InputGroup>
                <InputGroup label="Sort By">
                  <select className="cli-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option>Custom Score</option>
                    <option>Win Rate</option>
                  </select>
                </InputGroup>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={advFilters} onChange={(e) => setAdvFilters(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--term-white)' }}>ADV. FILTERS</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={geneticAutoLoop} onChange={(e) => setGeneticAutoLoop(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--term-white)' }}>GENETIC AUTO-LOOP</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={panelStyle}>
              <PanelHeader title="CUSTOM FITNESS WEIGHTS (0.0 to 1.0)" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <InputGroup label="WIN RATE"><input type="number" step="0.01" className="cli-input" value={wWinRate} onChange={(e) => setWWinRate(e.target.value)} /></InputGroup>
                <InputGroup label="NET PNL"><input type="number" step="0.01" className="cli-input" value={wNetPnl} onChange={(e) => setWNetPnl(e.target.value)} /></InputGroup>
                <InputGroup label="EXP VALUE"><input type="number" step="0.01" className="cli-input" value={wExpValue} onChange={(e) => setWExpValue(e.target.value)} /></InputGroup>
                
                <InputGroup label="TPD"><input type="number" step="0.01" className="cli-input" value={wTpd} onChange={(e) => setWTpd(e.target.value)} /></InputGroup>
                <InputGroup label="TPD RET"><input type="number" step="0.01" className="cli-input" value={wTpdRet} onChange={(e) => setWTpdRet(e.target.value)} /></InputGroup>
                <InputGroup label="SHARPE"><input type="number" step="0.01" className="cli-input" value={wSharpe} onChange={(e) => setWSharpe(e.target.value)} /></InputGroup>
                
                <InputGroup label="ALPHA"><input type="number" step="0.01" className="cli-input" value={wAlpha} onChange={(e) => setWAlpha(e.target.value)} /></InputGroup>
                <InputGroup label="ADD (INV)"><input type="number" step="0.01" className="cli-input" value={wAddInv} onChange={(e) => setWAddInv(e.target.value)} /></InputGroup>
                <InputGroup label="AVG LOSS(INV)"><input type="number" step="0.01" className="cli-input" value={wAvgLossInv} onChange={(e) => setWAvgLossInv(e.target.value)} /></InputGroup>
              </div>
            </div>

          </div>

          {/* LOWER BLOCK: Timeline + Advanced Logic Constraints */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={panelStyle}>
              <PanelHeader title="DYNAMIC TIMELINE CONTROLS" />
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '11px', color: 'var(--term-cyan)', marginBottom: '5px' }}>IN-SAMPLE WINDOW</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" className="cli-input" style={{ width: '50%' }} value={inSampleStart} onChange={(e) => setInSampleStart(e.target.value)} />
                  <input type="date" className="cli-input" style={{ width: '50%' }} value={inSampleEnd} onChange={(e) => setInSampleEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--term-cyan)' }}>OUT-OF-SAMPLE (OOS) WINDOWS</span>
                  <button onClick={addOosWindow} style={{ background: 'none', border: 'none', color: 'var(--term-green)', cursor: 'pointer', fontSize: '12px' }}>[+ ADD WINDOW]</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                  {oosWindows.map((win, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--term-muted)', fontSize: '10px' }}>{idx + 1}.</span>
                      <input type="date" className="cli-input" style={{ width: '45%' }} value={win.start} onChange={(e) => updateOosWindow(idx, 'start', e.target.value)} />
                      <input type="date" className="cli-input" style={{ width: '45%' }} value={win.end} onChange={(e) => updateOosWindow(idx, 'end', e.target.value)} />
                      <button onClick={() => removeOosWindow(idx)} style={{ background: 'none', border: 'none', color: 'var(--term-red)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </div>
                  ))}
                  {oosWindows.length === 0 && <span style={{ fontSize: '11px', color: 'var(--term-muted)' }}>NO OOS WINDOWS ACTIVE.</span>}
                </div>
              </div>
            </div>

            <div style={{ ...panelStyle, opacity: advFilters ? 1 : 0.4 }}>
              <PanelHeader title="ADVANCED FILTERS" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <InputGroup label="SMA MIN / MAX">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" className="cli-input" style={{ width: '50%' }} value={smaMin} onChange={(e) => setSmaMin(e.target.value)} />
                    <input type="number" className="cli-input" style={{ width: '50%' }} value={smaMax} onChange={(e) => setSmaMax(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="TP MIN / MAX">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={tpMin} onChange={(e) => setTpMin(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={tpMax} onChange={(e) => setTpMax(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="SL MIN / MAX">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={slMin} onChange={(e) => setSlMin(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={slMax} onChange={(e) => setSlMax(e.target.value)} />
                  </div>
                </InputGroup>

                <InputGroup label="MAX GATES"><input type="number" className="cli-input" value={maxGates} onChange={(e) => setMaxGates(e.target.value)} /></InputGroup>
                <InputGroup label="IDEAL TPD"><input type="number" step="0.1" className="cli-input" value={idealTpd} onChange={(e) => setIdealTpd(e.target.value)} /></InputGroup>
                <InputGroup label="MIN TPD"><input type="number" step="0.1" className="cli-input" value={minTpd} onChange={(e) => setMinTpd(e.target.value)} /></InputGroup>
              </div>
            </div>

          </div>

          {/* MASSIVE CSV TABLE BLOCK */}
          <div style={panelStyle}>
            <PanelHeader title={`CACHED RESULTS MATRIX (${csvData.length} RECORDS)`} />
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#030303', zIndex: 1 }}>
                  <tr style={{ color: 'var(--term-muted)', borderBottom: '1px solid var(--term-border)' }}>
                    <th style={{ padding: '10px' }}>ID / SIG</th>
                    <th style={{ padding: '10px' }}>LOGIC ENGINE</th>
                    <th style={{ padding: '10px', minWidth: '150px' }}>EQUITY STREAM</th>
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
                    <tr><td colSpan="9" style={{ padding: '30px', color: 'var(--term-muted)', textAlign: 'center' }}>{"/* DATA STREAM VACANT */"}</td></tr>
                  ) : (
                    csvData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #111', color: 'var(--term-white)' }}>
                        <td style={{ padding: '10px', color: 'var(--term-cyan)' }}>{row.ID || `STRAT_${index}`}</td>
                        <td style={{ padding: '10px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'var(--term-muted)' }}>{row.Logic || 'N/A'}</td>
                        <td style={{ padding: '10px' }}><Sparkline data={row.EquityCurve || row.Trades} color={row.Passed === true || row.Passed === 'true' ? 'var(--term-green)' : 'var(--term-red)'} /></td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.CompositeScore !== undefined ? row.CompositeScore.toFixed(2) : (row.Score !== undefined ? row.Score.toFixed(2) : 'N/A')}</td>
                        <td style={{ padding: '10px' }}>{row.WinRate !== undefined ? `${row.WinRate.toFixed(1)}%` : (row.WR !== undefined ? `${row.WR.toFixed(1)}%` : 'N/A')}</td>
                        <td style={{ padding: '10px' }}>{row.PF !== undefined ? `PF: ${row.PF.toFixed(2)}` : `DD: $${row.AverageDD?.toFixed(0) || 'N/A'}`}</td>
                        <td style={{ padding: '10px', color: 'var(--term-green)' }}>{row.TPD_Ret !== undefined ? `${row.TPD_Ret.toFixed(1)}%` : 'N/A'}</td>
                        <td style={{ padding: '10px', color: 'var(--term-cyan)' }}>{row.WFE !== undefined ? `${row.WFE.toFixed(1)}%` : 'N/A'}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: row.Passed === true || row.Passed === 'true' ? 'var(--term-green)' : 'var(--term-red)' }}>{row.Passed === true || row.Passed === 'true' ? 'PASS' : 'FAIL'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 03: TELEMETRY STREAM ================= */}
      {activeTab === 'telemetry' && (
        <div style={panelStyle} className="boot-seq-3">
          <PanelHeader title="RUNTIME LOGS & TELEMETRY" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>COMPUTATION_SPEED</div>
              <div style={{ fontSize: '24px', color: 'var(--term-white)', marginTop: '5px' }}>{cmdState?.speed || '0.00'} <span style={{fontSize: '12px', color: 'var(--term-muted)'}}>sim/sec</span></div>
            </div>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>ESTIMATED_TIME_ARRIVAL</div>
              <div style={{ fontSize: '24px', color: 'var(--term-cyan)', marginTop: '5px' }}>{cmdState?.eta || '00:00:00'}</div>
            </div>
            <div style={{ border: '1px solid #151515', padding: '15px' }}>
              <div style={{ color: 'var(--term-muted)', fontSize: '11px' }}>CURRENT_GENERATION_LOOP</div>
              <div style={{ fontSize: '24px', color: 'var(--term-green)', marginTop: '5px' }}>{cmdState?.gen_count || 0} <span style={{fontSize: '14px', color: 'var(--term-muted)'}}>/ {cmdState?.auto_max || gens}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
