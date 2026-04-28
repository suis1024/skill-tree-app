const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const USER_ID_KEY = "skill-tree-shooter:user-id";

function generateId() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

async function request(path, init) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export function fetchProgress(userId) {
  return request(`/users/${encodeURIComponent(userId)}/progress`);
}

export function addCoins(userId, coins) {
  return request(`/users/${encodeURIComponent(userId)}/coins/add`, {
    method: "POST",
    body: JSON.stringify({ coins }),
  });
}

export function upgradeSkill(userId, skillId, cost) {
  return request(`/users/${encodeURIComponent(userId)}/skills/upgrade`, {
    method: "POST",
    body: JSON.stringify({ skill_id: skillId, cost }),
  });
}
