// アプリ内で唯一の AudioContext。bgm.js と uiSe.js で共有する。
// 別々の ctx を作ると iOS でオーディオセッションを取り合って一方が止まる。

let ctx = null;
let onRebuildCallbacks = []; // ctx 作り直し後に呼ばれる (buffers キャッシュ破棄等)

function createCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    return new AC();
  } catch {
    return null;
  }
}

export function getCtx() {
  if (!ctx) ctx = createCtx();
  return ctx;
}

// ctx が interrupted/closed で固まったときに作り直す。
// bgm/uiSe 側はキャッシュされた AudioBuffer を破棄して再 decode する必要があるので
// コールバックを発火する。
export async function rebuildCtx() {
  if (ctx) {
    try { await ctx.close(); } catch {}
  }
  ctx = createCtx();
  for (const cb of onRebuildCallbacks) {
    try { cb(ctx); } catch {}
  }
  return ctx;
}

export function onRebuild(cb) {
  onRebuildCallbacks.push(cb);
}

// suspended なら resume、interrupted/closed なら作り直し。
// 戻り値: running になったかどうか。
export async function ensureRunning() {
  if (!ctx) ctx = createCtx();
  if (!ctx) return false;
  if (ctx.state === "interrupted" || ctx.state === "closed") {
    await rebuildCtx();
  } else if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch {}
    if (ctx.state !== "running") {
      await rebuildCtx();
    }
  }
  return ctx && ctx.state === "running";
}
