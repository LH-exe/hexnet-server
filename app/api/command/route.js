export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || process.env.KV_URL;

if (!redisUrl) {
  console.error("🚨 CRITICAL ERROR: REDIS_URL environment variable is missing!");
}

let redisClient = null;

async function getClient() {
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

const DEFAULT_STATE = {
  status: 'idle', engine_status: 'offline', last_seen: 0,
  mode: 'Generate Random Strategies', strategy: '', sims: 1000,
  sort: 'Composite Score (Best Overall)', auto: true, auto_max: 10,
  available_strats: [], active_strats: [],
  adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.1, tp_max: 100.0,
  sl_min: 0.1, sl_max: 100.0, logic_max: 2, 
  ideal_tpd: 3.0, min_tpd: 1.0, ideal_ev: 10.0, min_ev: 0.0, ideal_add: 10.0, max_add: 50.0,
  ideal_al: 1.0, max_al: 5.0, ideal_wr: 60.0, min_wr: 40.0,
  ideal_tpd_ret: 80.0, min_tpd_ret: 50.0, ideal_sharpe: 3.0, min_sharpe: 1.0, min_pnl: 0.0, min_wfe: 50.0,
  cw_wr: 1.0, cw_pnl: 1.0, cw_ev: 1.0, cw_sharpe: 1.0, cw_alpha: 1.0, cw_add: 1.0, cw_al: 1.0, cw_tpd_ret: 1.0, cw_tpd: 1.0,
  use_genetic: false, progress: 0, total_sims: 1000, trade_progress: { current: 0, total: 0 },
  eta: '--:--:--', sims_sec: 0, data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A',
  fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '',
  fetch_rth: true, fetch_pct: 0, is_start: '', is_end: '', oos_list: [{ start: '', end: '' }],
  hv_start: '', hv_end: '', hv_oos_list: [{ start: '', end: '' }],
  lv_start: '', lv_end: '', lv_oos_list: [{ start: '', end: '' }], stage_text: '',
  auto: true, auto_max: 10, gen_count: 10, // <--- ADD THIS
  debug_csv_data: []
};

export async function GET() {
  try {
    const client = await getClient();
    const rawData = await client.get('hexnet_command_state');
    
    let state = rawData ? JSON.parse(rawData) : DEFAULT_STATE;

    const now = Date.now();
    if (now - (state.last_seen || 0) > 30000) {
      state.engine_status = 'offline';
      if (['sync_requested', 'stop_requested', 'fetch_requested', 'backtest_requested'].includes(state.status)) {
        state.status = 'idle';
      }
      await client.set('hexnet_command_state', JSON.stringify(state));
    }
    
    return NextResponse.json(state);
  } catch (error) {
    console.error("Redis GET Error:", error);
    return NextResponse.json(DEFAULT_STATE);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const client = await getClient();
    
    const rawData = await client.get('hexnet_command_state');
    let currentState = rawData ? JSON.parse(rawData) : DEFAULT_STATE;

    const newState = { ...currentState, ...body };
    
    if (body.engine_status) newState.last_seen = Date.now();

    await client.set('hexnet_command_state', JSON.stringify(newState));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Redis POST Error:", error);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
