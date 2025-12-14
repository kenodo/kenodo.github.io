import { channels } from "./channels.js";

const feed = document.getElementById("feed");

// CORS-прокси
const CORS_PROXY = "https://";

// ---------- RSS helpers ----------

async function fetchRSS(rssPath) {
  const url = CORS_PROXY + rssPath;
  const res = await fetch(url);
  const text = await res.text();

  const xml = new DOMParser().parseFromString(text, "application/xml");
  return [...xml.getElementsByTagName("entry")];
}

// ---------- Channel loader ----------

async function loadChannel(channel) {
  let entries = [];

  // 1️⃣ legacy user
  if (channel.user) {
    entries = await fetchRSS(
      `www.youtube.com/feeds/videos.xml?user=${channel.user}`
    );
    if (entries.length) return normalize(entries, channel.name);
  }

  // 2️⃣ channelId
  if (channel.channelId) {
    entries = await fetchRSS(
      `www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`
    );
    if (entries.length) return normalize(entries, channel.name);
  }

  console.warn("Пустой RSS:", channel.name);
  return [];
}

// ---------- Normalize ----------

function normalize(entries, channelName) {
  return entries.map(e => {
    const title = e.getElementsByTagName("title")[0]?.textContent;
    const link = e.getElementsByTagName("link")[0]?.getAttribute("href");
    const published = e.getElementsByTagName("published")[0]?.textContent;

    const thumbs = e.getElementsByTagName("media:thumbnail");
    const thumbnail = thumbs.length
      ? thumbs[thumbs.length - 1].getAttribute("url")
      : null;

    const videoId = link?.split("v=")[1];

    return {
      title,
      link,
      videoId,
      published,
      thumbnail,
      channel: channelName
    };
  });
}

// ---------- Render ----------

function render(videos) {
  feed.innerHTML = "";

  for (const v of videos) {
    const div = document.createElement("div");
    div.className = "video";

    div.innerHTML = `
      <div class="thumb-wrap" data-id="${v.videoId}">
        ${
          v.thumbnail
            ? `<img src="${v.thumbnail}" class="thumb" loading="lazy">`
            : ""
        }
        <div class="play">▶</div>
      </div>

      <div class="info">
        <div class="title">${v.title}</div>
        <div class="meta">${v.channel}</div>
        <a href="${v.link}" target="_blank">Открыть на YouTube</a>
      </div>
    `;

    const wrap = div.querySelector(".thumb-wrap");

    wrap.onclick = () => {
      wrap.outerHTML = `
        <iframe
          class="player"
          src="https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0&modestbranding=1"
          allow="autoplay; encrypted-media"
          allowfullscreen
          loading="lazy">
        </iframe>
      `;
    };

    feed.appendChild(div);
  }
}

// ---------- Load all ----------

async function loadAll() {
  feed.innerHTML = "Загружаю ленту…";

  let all = [];

  for (const ch of channels) {
    try {
      const vids = await loadChannel(ch);
      all.push(...vids);
    } catch (e) {
      console.warn("Ошибка канала:", ch.name, e);
    }
  }

  all.sort(
    (a, b) => new Date(b.published) - new Date(a.published)
  );

  render(all);
}

loadAll();
