"use strict";
const $ = (id) => document.getElementById(id);
const NAMES = { iss: "Issuer", sub: "Subject", aud: "Audience", exp: "Expires", nbf: "Not before", iat: "Issued at", jti: "Token ID" };

function part(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function when(sec) {
  const d = new Date(sec * 1000);
  const diff = Math.round((d - Date.now()) / 60000);
  const rel = Math.abs(diff) < 60 ? `${Math.abs(diff)} min` : Math.abs(diff) < 2880 ? `${Math.round(Math.abs(diff) / 60)} h` : `${Math.round(Math.abs(diff) / 1440)} days`;
  return `${d.toLocaleString()} (${diff >= 0 ? "in " + rel : rel + " ago"})`;
}

function run() {
  const t = $("token").value.trim().replace(/^Bearer\s+/i, "");
  $("err").textContent = "";
  $("header").textContent = $("payload").textContent = "";
  $("claims").innerHTML = "";
  if (!t) return;
  const parts = t.split(".");
  if (parts.length < 2) { $("err").textContent = "A JWT has three parts separated by dots."; return; }
  let header, payload;
  try { header = part(parts[0]); payload = part(parts[1]); }
  catch { $("err").textContent = "Couldn't decode that. Check you pasted the whole token."; return; }
  $("header").textContent = JSON.stringify(header, null, 2);
  $("payload").textContent = JSON.stringify(payload, null, 2);
  const rows = [];
  if (typeof payload.exp === "number") {
    const expired = payload.exp * 1000 < Date.now();
    rows.push(`<div><b>Status</b><span class="${expired ? "bad" : "good"}">${expired ? "Expired" : "Not expired"}</span></div>`);
  }
  for (const [k, label] of Object.entries(NAMES)) {
    if (!(k in payload)) continue;
    const v = payload[k];
    const text = ["exp", "nbf", "iat"].includes(k) && typeof v === "number" ? when(v) : Array.isArray(v) ? v.join(", ") : String(v);
    const div = document.createElement("div");
    div.innerHTML = `<b></b><span></span>`;
    div.querySelector("b").textContent = label;
    div.querySelector("span").textContent = text;
    rows.push(div.outerHTML);
  }
  $("claims").innerHTML = rows.join("");
}
$("token").addEventListener("input", run);
run();
