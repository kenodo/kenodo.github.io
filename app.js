import { channels } from "./channels.js";

const feed = document.getElementById("feed");

const CORS_PROXY = "https://r.jina.ai/http://";

async function loadChannel(channel) {
const rssUrl =
  "www.youtube.com/feeds/videos.xml?channel_id=" +
  channel.channelId;

const url = CORS_PROXY + rssUrl;

  const res = await fetch(url);
  const text = await res.text();

  const xml = new DOMParser().parseFromString(text, "application/xml");
  const entries = [...xml.querySelectorAll("entry")];

  return entries.map(e => ({
    title: e.querySelector("title")?.textContent,
    link: e.querySelector("link")?.getAttribute("href"),
    published: e.querySelector("published")?.textContent,
    channel: channel.name
  }));
}

async function loadAll() {
  feed.innerHTML = "Загружаю каналы…";

  let allVideos = [];

  for (const ch of channels) {
    try {
      const vids = await loadChannel(ch);
      allVideos.push(...vids);
    } catch (e) {
      console.warn("Ошибка канала", ch.name, e);
    }
  }

  allVideos.sort(
    (a, b) => new Date(b.published) - new Date(a.published)
  );

  render(allVideos);
}

function render(videos) {
  feed.innerHTML = "";

  for (const v of videos) {
    const div = document.createElement("div");
    div.className = "video";
    div.innerHTML = `
      <div class="title">${v.title}</div>
      <div class="meta">${v.channel}</div>
      <a href="${v.link}" target="_blank">Открыть</a>
    `;
    feed.appendChild(div);
  }
}

loadAll();
