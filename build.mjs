// Milli Deck(Stream Deck用の非公式プラグイン)が読む「配信まとめ」ファイルを作る。
// Milli Scene(milliscene.vercel.app)のデータベースから、公開されている読み取り専用の情報だけを読む。
//   videos   … 最近の動画(チャンネルごとに最新15本)
//   schedule … 配信中・配信予定の枠
//   casts    … ツイキャスで配信中の枠
// 中身が前回と同じなら changed=false を出し、Pagesへの載せ直しを省く。
import fs from "node:fs";

const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const PAGES_URL = process.env.PAGES_URL;
const POLL_SEC = Number(process.env.POLL_SEC || 180); // Milli Deckが次に読みに来るまでの秒数(利用者が増えたら延ばす)
const KEEP_PER_CHANNEL = 15;

async function get(pathAndQuery) {
  const res = await fetch(`${BASE}/rest/v1/${pathAndQuery}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`${pathAndQuery.split("?")[0]}: HTTP ${res.status}`);
  return res.json();
}

const [recent, schedule, casts] = await Promise.all([
  get("videos?select=video_id,channel_id,title,published_at&is_upcoming=eq.false&order=published_at.desc&limit=600"),
  get("videos?select=video_id,channel_id,title,published_at,is_upcoming,is_live,members_only&or=(is_upcoming.eq.true,is_live.eq.true)&order=published_at.asc&limit=300"),
  get("external_lives?select=user_id,channel_id,is_live,title,url,started_at&platform=eq.twitcasting&is_live=eq.true&order=user_id.asc"),
]);

const perChannel = new Map();
const videos = recent.filter((v) => {
  const n = perChannel.get(v.channel_id) ?? 0;
  perChannel.set(v.channel_id, n + 1);
  return n < KEEP_PER_CHANNEL;
});

const body = { v: 1, nextPollSec: POLL_SEC, videos, schedule, casts };
const feed = { ...body, generatedAt: new Date().toISOString() };
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/feed.json", JSON.stringify(feed));
fs.copyFileSync("index.html", "public/index.html");

// いま載っているものと比べる(作った時刻は除く)
let changed = true;
try {
  const res = await fetch(`${PAGES_URL}/feed.json?t=${Date.now()}`);
  if (res.ok) {
    const { generatedAt, ...old } = await res.json();
    changed = JSON.stringify(old) !== JSON.stringify(body);
  }
} catch {
  // 読めなければ載せ直す
}
console.log(`videos ${videos.length} / schedule ${schedule.length} / casts ${casts.length} / changed ${changed}`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
