// A single Durable Object instance ("family") keeps:
//  - daily message counts per profile and for the whole family (stored, survives restarts)
//  - short-term rate limits per profile and per IP address (in memory)
//  - failed family-code attempts per IP (in memory), to slow down guessing
// It runs one request at a time, so the counters are always consistent.

const RATE = {
  ip: { max: 20, windowMs: 60_000 },
  profile: { max: 8, windowMs: 60_000 },
  authFail: { max: 10, windowMs: 10 * 60_000 },
};

export class Limiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.windows = new Map();
  }

  check(key, { max, windowMs }, record = true) {
    const now = Date.now();
    const arr = (this.windows.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      this.windows.set(key, arr);
      return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - arr[0])) / 1000)) };
    }
    if (record) arr.push(now);
    this.windows.set(key, arr);
    if (this.windows.size > 5000) this.windows.clear(); // memory safety
    return { ok: true };
  }

  async getDay(date) {
    return (await this.state.storage.get(`day:${date}`)) || { total: 0, p: {} };
  }

  async cleanup(date) {
    if (this.lastCleanup === date) return;
    this.lastCleanup = date;
    const all = await this.state.storage.list({ prefix: 'day:' });
    const keep = new Date(`${date}T00:00:00Z`).getTime() - 3 * 86400_000;
    const old = [...all.keys()].filter((k) => new Date(`${k.slice(4)}T00:00:00Z`).getTime() < keep);
    if (old.length) await this.state.storage.delete(old);
  }

  async op(body) {
    switch (body.op) {
      case 'authLocked':
        return this.check(`fail:${body.ip}`, RATE.authFail, false);
      case 'authFail':
        this.check(`fail:${body.ip}`, RATE.authFail, true);
        return { ok: true };

      case 'reserve': {
        const ip = this.check(`ip:${body.ip}`, RATE.ip);
        if (!ip.ok) return { ok: false, reason: 'too_fast', retryAfter: ip.retryAfter };
        const pr = this.check(`p:${body.profileId}`, RATE.profile);
        if (!pr.ok) return { ok: false, reason: 'too_fast', retryAfter: pr.retryAfter };

        await this.cleanup(body.date);
        const day = await this.getDay(body.date);
        const used = day.p[body.profileId] || 0;
        if (used >= body.limit) return { ok: false, reason: 'daily_limit', used, limit: body.limit };
        if (day.total >= body.familyLimit) return { ok: false, reason: 'family_limit', used, limit: body.limit };
        day.p[body.profileId] = used + 1;
        day.total += 1;
        await this.state.storage.put(`day:${body.date}`, day);
        return { ok: true, used: used + 1, limit: body.limit };
      }

      case 'refund': {
        const day = await this.getDay(body.date);
        if (day.p[body.profileId] > 0) {
          day.p[body.profileId] -= 1;
          day.total = Math.max(0, day.total - 1);
          await this.state.storage.put(`day:${body.date}`, day);
        }
        return { ok: true };
      }

      case 'usage':
        return { ok: true, ...(await this.getDay(body.date)) };

      default:
        return { ok: false, reason: 'unknown_op' };
    }
  }

  async fetch(request) {
    const body = await request.json();
    return Response.json(await this.op(body));
  }
}
