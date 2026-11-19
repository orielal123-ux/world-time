// Country + time zone data comes from the "countries-and-timezones" library,
// loaded from the internet (jsDelivr CDN) in index.html. It exposes a global `ct`.
// Flags come from flagcdn.com.

const ISRAEL_ZONE = "Asia/Jerusalem";

const pickBtn = document.getElementById("pickBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

// Current UTC offset (in minutes) of an IANA time zone, e.g. "Asia/Tokyo" -> 540.
// Uses the browser's built-in time zone database, so summer/winter time is handled.
function offsetMinutes(timeZone, date = new Date()) {
  const tzName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName").value; // "GMT+09:00" or "GMT"

  const m = tzName.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function formatOffset(minutes) {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${h}:${m}`;
}

function localTime(timeZone) {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeDiff(diffMinutes) {
  if (diffMinutes === 0) return { text: "Same time as Israel", cls: "same" };
  const abs = Math.abs(diffMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  let amount = h ? `${h} hour${h === 1 ? "" : "s"}` : "";
  if (m) amount += `${amount ? " " : ""}${m} min`;
  return diffMinutes > 0
    ? { text: `${amount} ahead of Israel`, cls: "ahead" }
    : { text: `${amount} behind Israel`, cls: "behind" };
}

// "America/Argentina/Buenos_Aires" -> "Buenos Aires"
function cityName(zone) {
  return zone.split("/").pop().replace(/_/g, " ");
}

function getAllCountries() {
  if (typeof ct === "undefined") {
    throw new Error("the country data didn't load");
  }
  return Object.values(ct.getAllCountries()).filter(
    (c) => c.timezones && c.timezones.length
  );
}

function showCountry(country) {
  const israel = offsetMinutes(ISRAEL_ZONE);

  const flag = document.getElementById("flag");
  flag.src = `https://flagcdn.com/w160/${country.id.toLowerCase()}.png`;
  flag.alt = `Flag of ${country.name}`;
  document.getElementById("countryName").textContent = country.name;
  document.getElementById("capital").textContent = `Country code: ${country.id}`;

  document.getElementById("israelTime").textContent = localTime(ISRAEL_ZONE);
  document.getElementById("israelOffset").textContent = `(${formatOffset(israel)})`;

  // Group the country's zones by their current offset, so a big country
  // like the USA shows one row per distinct time instead of dozens.
  const groups = new Map();
  for (const zone of country.timezones) {
    let off;
    try {
      off = offsetMinutes(zone);
    } catch {
      continue; // browser doesn't know this zone name; skip it
    }
    if (!groups.has(off)) groups.set(off, []);
    groups.get(off).push(zone);
  }
  const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);

  const list = document.getElementById("zones");
  list.innerHTML = "";

  if (sorted.length > 1) {
    const note = document.createElement("li");
    note.className = "note";
    note.textContent = `This country has ${sorted.length} different times right now:`;
    list.appendChild(note);
  }

  for (const [off, zones] of sorted) {
    const diff = describeDiff(off - israel);
    const cities = zones.slice(0, 4).map(cityName).join(", ") +
      (zones.length > 4 ? ` +${zones.length - 4} more` : "");

    const li = document.createElement("li");
    const top = document.createElement("div");
    top.className = "zone-name";
    top.textContent = `${localTime(zones[0])} · ${formatOffset(off)}`;
    const where = document.createElement("div");
    where.className = "muted";
    where.textContent = cities;
    const d = document.createElement("div");
    d.className = `diff ${diff.cls}`;
    d.textContent = diff.text;
    li.append(top, where, d);
    list.appendChild(li);
  }

  resultEl.classList.remove("hidden");
}

pickBtn.addEventListener("click", () => {
  statusEl.classList.remove("error");
  statusEl.textContent = "";
  try {
    const all = getAllCountries();
    const country = all[Math.floor(Math.random() * all.length)];
    showCountry(country);
  } catch (err) {
    statusEl.classList.add("error");
    statusEl.textContent =
      `Couldn't get country data (${err.message}). Check your internet connection and reload the page.`;
  }
});
