// Cloudflare Worker for startupstage.org
//
// Serves the static site (via the ASSETS binding) and handles the
// pitch-event signup API: POST /api/pitch
//   -> validates input + honeypot
//   -> stores the row in D1 (source of truth)
//   -> emails a notification via Resend (best-effort)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/pitch") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return handlePitch(request, env, ctx);
    }

    // Everything else is a static asset (home pages, css, js, 404, ...).
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }
  // Fallback for a plain (no-JS) form POST.
  try {
    const form = await request.formData();
    const obj = {};
    for (const [k, v] of form.entries()) obj[k] = typeof v === "string" ? v : "";
    return obj;
  } catch {
    return {};
  }
}

function clean(v, max) {
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}

function validEmail(email) {
  return email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handlePitch(request, env, ctx) {
  const data = await readBody(request);

  // Honeypot: real users leave this empty. Silently drop bots.
  if (clean(data.website, 100) !== "") {
    return json({ ok: true });
  }

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const startupName = clean(data.startup_name, 160);
  const description = clean(data.description, 2000);
  const language = clean(data.language, 10);

  if (!name || !email || !startupName || !description) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }
  if (!validEmail(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";

  // Store in D1 (source of truth).
  try {
    await env.DB.prepare(
      "INSERT INTO pitch_signups (name, email, startup_name, description, language, ip) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(name, email, startupName, description, language, ip)
      .run();
  } catch (e) {
    return json({ ok: false, error: "storage" }, 500);
  }

  // Email notification — best-effort, never blocks/fails the response.
  const send = sendEmail(env, {
    name,
    email,
    startupName,
    description,
    language,
  }).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(send);
  else await send;

  return json({ ok: true });
}

async function sendEmail(env, s) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  const text =
    "New StartupStage pitch signup\n\n" +
    `Name: ${s.name}\n` +
    `Email: ${s.email}\n` +
    `Startup: ${s.startupName}\n` +
    `Language: ${s.language || "-"}\n\n` +
    `Description:\n${s.description}\n`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || "StartupStage <onboarding@resend.dev>",
      to: [env.NOTIFY_EMAIL],
      reply_to: s.email,
      subject: `New pitch signup: ${s.startupName}`,
      text,
    }),
  });
}
