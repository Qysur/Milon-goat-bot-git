
const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "autoreact_data.json");

const emojis = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚",
  "😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸",
  "🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️",
  "😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡",
  "🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓",
  "🤗","🤔","🫣","🤭","🫢","🫡","🤫","🫠","🤥","😶",
  "🫥","😐","🫤","😑","🫨","😬","🙄","😯","😦","😧",
  "😮","😲","🥱","😴","🤤","😪","😮‍💨","😵","🤐","🥴",
  "🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿",
  "👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖",
  "🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💖",
  "💗","💓","💞","💕","💘","💝","💟","❣️","💔","❤️‍🔥",
  "🔥","✨","⭐","🌟","💫","⚡","💥","💯","🎉","🎊",
  "🌈","☀️","🌙","🌹","🌸","🌺","🍀","🍓","🍒","🦋"
];

let settings = { ownerOnly: false, all: false };

function loadSettings() {
  try {
    if (fs.existsSync(dataPath)) {
      settings = {
        ...settings,
        ...JSON.parse(fs.readFileSync(dataPath, "utf8"))
      };
    }
  } catch (err) {
    console.error("[AUTOREACT SETTINGS]", err.message);
  }
}

function saveSettings() {
  fs.writeFileSync(dataPath, JSON.stringify(settings, null, 2));
}

loadSettings();

module.exports = {
  config: {
    name: "autoreact",
    aliases: ["ar"],
    version: "1.0.0",
    author: "Bassit",
    countDown: 3,
    role: 0,
    description: "Control automatic reactions",
    category: "box chat",
    usePrefix: true
  },

  onStart: async function ({ event, args, message }) {
    const action = (args[0] || "").toLowerCase();
    const second = (args[1] || "").toLowerCase();

    if (action === "all" && second === "on") {
      settings.all = true;
      settings.ownerOnly = false;
      saveSettings();
      return message.reply("✅ AutoReact is enabled for everyone.");
    }

    if (action === "all" && second === "off") {
      settings.all = false;
      saveSettings();
      return message.reply("🛑 AutoReact for everyone is disabled.");
    }

    if (action === "on") {
      settings.ownerOnly = true;
      settings.all = false;
      saveSettings();
      return message.reply("✅ AutoReact enabled for your messages only.");
    }

    if (action === "off") {
      settings.ownerOnly = false;
      saveSettings();
      return message.reply("🛑 AutoReact for your messages is disabled.");
    }

    return message.reply(
      "📌 AUTOREACT COMMANDS\n\n" +
      "autoreact on - Your messages only\n" +
      "autoreact off - Disable your reactions\n" +
      "autoreact all on - Everyone\n" +
      "autoreact all off - Disable everyone"
    );
  },

  onChat: async function ({ api, event }) {
    if (!event.body || event.type !== "message") return;
    if (!settings.ownerOnly && !settings.all) return;

    // في وضع on العادي، يتفاعل مع صاحب الأمر فقط
    if (settings.ownerOnly && !settings.all) {
      const botConfig = global.GoatBot?.config || {};
      const admins = (botConfig.adminBot || []).map(String);
      const senderID = String(event.senderID);

      // نعتمد على أول adminBot باعتباره صاحب البوت
      if (!admins.length || senderID !== admins[0]) return;
    }

    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    try {
      await api.setMessageReaction(
        emoji,
        event.messageID,
        (err) => {
          if (err) console.error("[AUTOREACT]", err);
        },
        true
      );
    } catch (err) {
      console.error("[AUTOREACT]", err.message);
    }
  }
};
