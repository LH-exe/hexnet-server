"use client";
import { useEffect, useState, useRef } from 'react';

// --- Safe SVG Equity Curve Renderer ---
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
  
  // --- RESTORED HEXNET EXACT STATE VARIABLES ---
  
  // Generation Parameters
  const [mode, setMode] = useState('Generate Random Strategies');
  const [strategy, setStrategy] = useState('');
  const [sims, setSims] = useState(100);
  const [sort, setSort] = useState('Composite Score');

  // Custom Fitness Weights
  const [wrWeight, setWrWeight] = useState(1.0);
  const [pfWeight, setPfWeight] = useState(1.0);
  const [ddWeight, setDdWeight] = useState(1.0);
  const [retWeight, setRetWeight] = useState(1.0);
  const [tpdWeight, setTpdWeight] = useState(1.0);

  // Advanced Generation Filters
  const [advEnabled, setAdvEnabled] = useState(false);
  const [smaMin, setSmaMin] = useState(10);
  const [smaMax, setSmaMax] = useState(200);
  const [tpMin, setTpMin] = useState(0.1);
  const [tpMax, setTpMax] = useState(2.0);
  const [slMin, setSlMin] = useState(0.1);
  const [slMax, setSlMax] = useState(2.0);
  const [logicMax, setLogicMax] = useState(2);

  // Optimization Constraints
  const [idealTpd, setIdealTpd] = useState(3.0);
  const [minTpd, setMinTpd] = useState(1.0);
  const [idealEv, setIdealEv] = useState(10.0);
  const [minEv, setMinEv] = useState(0.0);
  const [idealPf, setIdealPf] = useState(1.8);
  const [minPf, setMinPf] = useState(1.1);
  const [wfeMin, setWfeMin] = useState(45.0);

  // Time Window Settings
  const [isStart, setIsStart] = useState('2024-01-01');
  const [isEnd, setIsEnd] = useState('2024-06-30');
  const [oosStart, setOosStart] = useState('2024-07-01');
  const [oosEnd, setOosEnd] = useState('2024-12-31');

  // Automated Backtest Sequence
  const [auto, setAuto] = useState(true);
  const [autoMax, setAutoMax] = useState(10); // Max Generations
  const [totalStrats, setTotalStrats] = useState(100); // Total Strategies
  const [geneticAi, setGeneticAi] = useState(false);

  // Live Tracking Mock
  const [liveMetrics] = useState({
    balance: "100,000.00", equity: "100,000.00", openPnL: "0.00", dailyPnL: "0.00", margin: "0.00"
  });

  const hasLoadedInitial = useRef(false);

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
          
          if (data.wr_weight !== undefined) setWrWeight(data.wr_weight);
          if (data.pf_weight !== undefined) setPfWeight(data.pf_weight);
          if (data.dd_weight !== undefined) setDdWeight(data.dd_weight);
          if (data.ret_weight !== undefined) setRetWeight(data.ret_weight);
          if (data.tpd_weight !== undefined) setTpdWeight(data.tpd_weight);

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

          if (data.is_start !== undefined) setIsStart(data.is_start);
          if (data.is_end !== undefined) setIsEnd(data.is_end);
          if (data.oos_start !== undefined) setOosStart(data.oos_start);
          if (data.oos_end !== undefined) setOosEnd(data.oos_end);

          if (data.auto !== undefined) setAuto(data.auto);
          if (data.auto_max !== undefined) setAutoMax(data.auto_max);
          if (data.total_strats !== undefined) setTotalStrats(data.total_strats);
          if (data.genetic_ai !== undefined) setGeneticAi(data.genetic_ai);
          
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
    const interval = setInterval(() => { fetchState(); fetchCsv(); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (statusOverride = null) => {
    const payload = {
      mode, strategy, sims: Number(sims), sort,
      wr_weight: Number(wrWeight), pf_weight: Number(pfWeight), dd_weight: Number(ddWeight), ret_weight: Number(retWeight), tpd_weight: Number(tpdWeight),
      adv_enabled: advEnabled, sma_min: Number(smaMin), sma_max: Number(smaMax), tp_min: Number(tpMin), tp_max: Number(tpMax), sl_min: Number(slMin), sl_max: Number(slMax), logic_max: Number(logicMax),
      ideal_tpd: Number(idealTpd), min_tpd: Number(minTpd), ideal_ev: Number(idealEv), min_ev: Number(minEv), ideal_pf: Number(idealPf), min_pf: Number(minPf), wfe_min: Number(wfeMin),
      is_start: isStart, is_end: isEnd, oos_start: oosStart, oos_end: oosEnd,
      auto, auto_max: Number(autoMax), total_strats: Number(totalStrats), genetic_ai: geneticAi
    };
    if (statusOverride) payload.status = statusOverride;

    try {
      await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (err) { console.error("Command Post Err:", err); }
  };

  // UI Components
  const layoutPanel = { border: '1px solid var(--term-border)', padding: '20px', background: '#020202', display: 'flex', flexDirection: 'column', gap: '15px' };
  const parameterGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' };
  const InputGroup = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', color: 'var(--term-muted)', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid var(--term-green)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="boot-seq-1">
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '2px', color: 'var(--term-white)' }}>
            HEXNET_WEB_COMMAND_CENTER <span style={{ color: 'var(--term-green)' }}>v2.9.9.9.8.1</span>
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--term-muted)', marginTop: '4px' }}>
            SYS_TIME: {new Date().toLocaleTimeString()} | PIPELINE_STATE: {cmdState?.status ? cmdState.status.toUpperCase() : 'IDLE'}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px' }}>
          DESKTOP_DAEMON: <span style={{ color: cmdState?.engine_status === 'online' ? 'var(--term-green)' : 'var(--term-red)' }}>[{cmdState?.engine_status ? cmdState.engine_status.toUpperCase() : 'OFFLINE'}]</span><span className="cursor-blink"></span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--term-border)' }} className="boot-seq-2">
        {['portfolio', 'generator', 'live'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: 'transparent', border: 'none', color: activeTab === tab ? 'var(--term-cyan)' : 'var(--term-muted)',
            fontFamily: 'inherit', fontSize: '15px', cursor: 'pointer', padding: '12px 5px', textTransform: 'uppercase',
            fontWeight: activeTab === tab ? 'bold' : 'normal', letterSpacing: '1px'
          }}>
            {activeTab === tab ? `> [ 0${['portfolio', 'generator', 'live'].indexOf(tab)+1}.${tab.toUpperCase()} ]` : `[ 0${['portfolio', 'generator', 'live'].indexOf(tab)+1}.${tab.toUpperCase()} ]`}
          </button>
        ))}
      </div>

      {/* ================= TAB 01: PORTFOLIO ================= */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          <div style={{ ...layoutPanel, borderColor: 'var(--term-red)', color: 'var(--term-red)', padding: '12px' }}>
            {"[! ] SYSTEM ALERT: EXECUTION ROUTER IS DISCONNECTED. AWAITING PROP_FIRM_API GATEWAY CREDENTIALS."}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {Object.entries(liveMetrics).map(([key, val]) => (
              <div key={key} style={layoutPanel}>
                <div style={{ color: 'var(--term-muted)', fontSize: '11px', textTransform: 'uppercase' }}>{key}</div>
                <div style={{ fontSize: '24px', color: key === 'margin' || key === 'balance' ? 'var(--term-white)' : 'var(--term-green)' }}>${val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 02: GENERATOR CONTROL PANELS (ACCURATE) ================= */}
      {activeTab === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="boot-seq-3">
          
          <div style={{ ...layoutPanel, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px' }}>STAGE_LOG: <span style={{ color: 'var(--term-cyan)' }}>{cmdState?.stage_text || 'AWAITING_SEQUENCE'}</span></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="cli-btn" onClick={() => sendCommand('sync_requested')}>[ SYNC ]</button>
              <button className="cli-btn" onClick={() => sendCommand('fetch_requested')}>[ FETCH ]</button>
              <button className="cli-btn" onClick={() => sendCommand('backtest_requested')}>[ RUN BACKTEST ]</button>
              <button className="cli-btn cli-btn-danger" onClick={() => sendCommand('stop_requested')}>[ FORCE STOP ]</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Generation Parameters */}
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '10px' }}>[ Generation Parameters ]</div>
              <InputGroup label="Mode">
                <select className="cli-input" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="Generate Random Strategies">Generate Random Strategies</option>
                  <option value="Generate Advanced Optimal Strategies">Generate Advanced Optimal Strategies</option>
                </select>
              </InputGroup>
              <InputGroup label="Available Strategies">
                <select className="cli-input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="">-- Select Strategy --</option>
                  {cmdState?.available_strats?.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                </select>
              </InputGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <InputGroup label="Simulations">
                  <input type="number" className="cli-input" value={sims} onChange={(e) => setSims(e.target.value)} />
                </InputGroup>
                <InputGroup label="Sorting Metric">
                  <select className="cli-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="Composite Score">Composite Score</option>
                    <option value="Win Rate">Win Rate</option>
                    <option value="Profit Factor">Profit Factor</option>
                    <option value="Total Return">Total Return</option>
                  </select>
                </InputGroup>
              </div>
            </div>

            {/* Custom Fitness Weights */}
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '10px' }}>[ Custom Fitness Weights ]</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                <InputGroup label="WR Wgt"><input type="number" step="0.1" className="cli-input" value={wrWeight} onChange={(e) => setWrWeight(e.target.value)} /></InputGroup>
                <InputGroup label="PF Wgt"><input type="number" step="0.1" className="cli-input" value={pfWeight} onChange={(e) => setPfWeight(e.target.value)} /></InputGroup>
                <InputGroup label="DD Wgt"><input type="number" step="0.1" className="cli-input" value={ddWeight} onChange={(e) => setDdWeight(e.target.value)} /></InputGroup>
                <InputGroup label="RET Wgt"><input type="number" step="0.1" className="cli-input" value={retWeight} onChange={(e) => setRetWeight(e.target.value)} /></InputGroup>
                <InputGroup label="TPD Wgt"><input type="number" step="0.1" className="cli-input" value={tpdWeight} onChange={(e) => setTpdWeight(e.target.value)} /></InputGroup>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* Advanced Generation Filters */}
            <div style={layoutPanel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '10px' }}>
                <span style={{ color: 'var(--term-cyan)', fontSize: '13px' }}>[ Advanced Generation Filters ]</span>
                <input type="checkbox" checked={advEnabled} onChange={(e) => setAdvEnabled(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputGroup label="SMA Min/Max">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" className="cli-input" style={{ width: '50%' }} value={smaMin} onChange={(e) => setSmaMin(e.target.value)} />
                    <input type="number" className="cli-input" style={{ width: '50%' }} value={smaMax} onChange={(e) => setSmaMax(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="TP Min/Max">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={tpMin} onChange={(e) => setTpMin(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={tpMax} onChange={(e) => setTpMax(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="SL Min/Max">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={slMin} onChange={(e) => setSlMin(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={slMax} onChange={(e) => setSlMax(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="Max Logic Elements">
                  <input type="number" className="cli-input" value={logicMax} onChange={(e) => setLogicMax(e.target.value)} />
                </InputGroup>
              </div>
            </div>

            {/* Optimization Constraints */}
            <div style={layoutPanel}>
              <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '10px' }}>[ Optimization Constraints ]</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InputGroup label="Ideal/Min TPD">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={idealTpd} onChange={(e) => setIdealTpd(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={minTpd} onChange={(e) => setMinTpd(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="Ideal/Min EV">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={idealEv} onChange={(e) => setIdealEv(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={minEv} onChange={(e) => setMinEv(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="Ideal/Min PF">
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={idealPf} onChange={(e) => setIdealPf(e.target.value)} />
                    <input type="number" step="0.1" className="cli-input" style={{ width: '50%' }} value={minPf} onChange={(e) => setMinPf(e.target.value)} />
                  </div>
                </InputGroup>
                <InputGroup label="Min WFE %">
                  <input type="number" step="0.1" className="cli-input" value={wfeMin} onChange={(e) => setWfeMin(e.target.value)} />
                </InputGroup>
              </div>
            </div>

            {/* Time Window & Auto Loop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={layoutPanel}>
                <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '10px' }}>[ Time Window Settings ]</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <InputGroup label="In-Sample Start"><input type="date" className="cli-input" value={isStart} onChange={(e) => setIsStart(e.target.value)} /></InputGroup>
                  <InputGroup label="In-Sample End"><input type="date" className="cli-input" value={isEnd} onChange={(e) => setIsEnd(e.target.value)} /></InputGroup>
                  <InputGroup label="OOS Start"><input type="date" className="cli-input" value={oosStart} onChange={(e) => setOosStart(e.target.value)} /></InputGroup>
                  <InputGroup label="OOS End"><input type="date" className="cli-input" value={oosEnd} onChange={(e) => setOosEnd(e.target.value)} /></InputGroup>
                </div>
              </div>

              <div style={layoutPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--term-cyan)', fontSize: '13px' }}>[ Automated Backtest Sequence ]</span>
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'end' }}>
                  <InputGroup label="Max Generations"><input type="number" className="cli-input" value={autoMax} onChange={(e) => setAutoMax(e.target.value)} /></InputGroup>
                  <InputGroup label="Total Strategies"><input type="number" className="cli-input" value={totalStrats} onChange={(e) => setTotalStrats(e.target.value)} /></InputGroup>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '35px' }}>
                    <input type="checkbox" checked={geneticAi} onChange={(e) => setGeneticAi(e.target.checked)} style={{ accentColor: 'var(--term-green)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--term-muted)', textTransform: 'uppercase' }}>Enable Genetic AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Output Matrix */}
          <div style={layoutPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--term-cyan)', fontSize: '13px' }}>{`~/hexnet/data/cached_results.csv (${csvData.length} Strategies Loaded)`}</span>
              {csvData.length > 0 && <a href="/api/upload?download=true" className="cli-btn" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>[ EXPORT RAW CSV ]</a>}
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
                    <tr><td colSpan="9" style={{ padding: '30px', color: 'var(--term-muted)', textAlign: 'center' }}>{"/* DATA STREAM VACANT */"}</td></tr>
                  ) : (
                    csvData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #111', color: 'var(--term-white)' }}>
                        <td style={{ padding: '10px', color: 'var(--term-cyan)' }}>{row.ID || `STRAT_${index}`}</td>
                        <td style={{ padding: '10px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'var(--term-muted)' }}>{row.Logic || 'N/A'}</td>
                        <td style={{ padding: '10px', minWidth: '130px' }}><Sparkline data={row.EquityCurve || row.Trades} color={row.Passed === true || row.Passed === 'true' ? 'var(--term-green)' : 'var(--term-red)'} /></td>
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

      {/* ================= TAB 03: TELEMETRY ================= */}
      {activeTab === 'live' && (
        <div style={layoutPanel} className="boot-seq-3">
          <div style={{ color: 'var(--term-cyan)', fontSize: '13px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '6px' }}>~/hexnet/telemetry/runtime_logs.sh</div>
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
              <div style={{ fontSize: '20px', color: 'var(--term-green)', marginTop: '5px' }}>{cmdState?.gen_count || 0} / {cmdState?.auto_max || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: 'var(--term-muted)' }}>
              <span>COMPUTATION PROGRESS</span><span>{cmdState?.progress ? `${Number(cmdState.progress).toFixed(1)}%` : '0.0%'}</span>
            </div>
            <div style={{ height: '14px', border: '1px solid var(--term-border)', background: '#000', position: 'relative' }}>
              <div style={{ height: '100%', width: cmdState?.progress ? `${cmdState.progress}%` : '0%', background: 'var(--term-green-dim)', transition: 'width 0.2s linear' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
