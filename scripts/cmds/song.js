
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const searchCache = new Map();

module.exports = {
  config: {
    name: "song",
    version: "3.0.0",
    author: "Milon",
    countDown: 5,
    role: 0,
    description: "Search and download songs",
    category: "media",
    usePrefix: false
  },

  onChat: async function ({ api, event, message }) {
    const body = (event.body || "").trim();

    // البحث عن أغنية بكتابة song + اسم الأغنية
    if (/^song(?:\s|$)/i.test(body)) {
      const query = body.replace(/^song\s*/i, "").trim();

      if (!query) {
        return message.reply(
          "❌ Please provide a song name.\n" +
          "📌 Example: song Let Me Love You"
        );
      }

      try {
        await message.reply("🔍 Searching for: " + query);

        const searchResponse = await axios.get(
          "https://betadash-search-download.vercel.app/yt",
          {
            params: { search: query },
            timeout: 30000
          }
        );

        const data = searchResponse.data;
        const results = Array.isArray(data)
          ? data
          : data && Array.isArray(data.results)
            ? data.results
            : [];

        if (!results.length) {
          return message.reply("⚠️ No songs found. Try another name.");
        }

        // الاحتفاظ بالنتائج حتى يختار المستخدم رقماً
        const songs = results.slice(0, 10);
        const key = `${event.threadID}_${event.senderID}`;

        searchCache.set(key, {
          songs,
          time: Date.now()
        });

        const list = songs.map((song, i) =>
          `${i + 1}. ${song.title || "Unknown title"}`
        ).join("\n");

        return message.reply(
          `🎵 SONG SEARCH RESULTS\n\n${list}\n\n` +
          "📩 Reply with a number from 1 to " + songs.length +
          " to download the song."
        );
      } catch (err) {
        console.error("[SONG SEARCH]", err.message);
        return message.reply(
          "❌ Search failed. The search API may be unavailable."
        );
      }
    }

    // اختيار أغنية بالرقم بعد البحث
    if (!/^\d{1,2}$/.test(body)) return;

    const key = `${event.threadID}_${event.senderID}`;
    const cached = searchCache.get(key);

    if (!cached) return;

    if (Date.now() - cached.time > 10 * 60 * 1000) {
      searchCache.delete(key);
      return message.reply("⌛ Search expired. Send the song name again.");
    }

    const number = Number(body);

    if (number < 1 || number > cached.songs.length) {
      return message.reply(
        `❌ Choose a number from 1 to ${cached.songs.length}.`
      );
    }

    const selected = cached.songs[number - 1];
    const ytUrl = selected.url;

    if (!ytUrl) {
      return message.reply("❌ This result has no valid download URL.");
    }

    try {
      await message.reply(
        `⏳ Preparing: ${selected.title || "Selected song"}`
      );

      const downloadResponse = await axios.get(
        "https://yt-mp3-imran.vercel.app/api",
        {
          params: { url: ytUrl },
          timeout: 60000
        }
      );

      const audioUrl = downloadResponse.data?.downloadUrl;

      if (!audioUrl) {
        return message.reply(
          "❌ Download link unavailable. The download API may be down."
        );
      }

      const cachePath = path.join(__dirname, "cache");
      await fs.ensureDir(cachePath);

      const filePath = path.join(
        cachePath,
        `song_${Date.now()}.mp3`
      );

      try {
        const response = await axios.get(audioUrl, {
          responseType: "stream",
          timeout: 120000,
          maxRedirects: 5
        });

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);

          response.data.pipe(writer);

          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });

        const stats = await fs.stat(filePath);

        if (!stats.size) {
          throw new Error("Downloaded audio file is empty");
        }

        await message.reply({
          body:
            `🎶 ${selected.title || "Song"}\n` +
            `🎤 ${selected.channelName || "Unknown artist"}`,
          attachment: fs.createReadStream(filePath)
        });

        searchCache.delete(key);
      } finally {
        await fs.remove(filePath).catch(() => {});
      }
    } catch (err) {
      console.error("[SONG DOWNLOAD]", err.response?.status || err.message);

      return message.reply(
        "❌ Failed to send the song.\n" +
        "The download API may be unavailable, or Messenger may have rejected the audio file."
      );
    }
  },

  onStart: async function () {}
};
