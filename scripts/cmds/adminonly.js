
const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
  config: {
    name: "adminonly",
    aliases: ["adonly", "onlyad", "onlyadmin"],
    version: "1.6",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    description: {
      vi: "Bật/tắt chế độ chỉ admin mới có thể sử dụng bot",
      en: "Turn on/off admin-only mode"
    },
    category: "owner",
    guide: {
      en: "{pn} on/off\n{pn} noti on/off"
    }
  },

  langs: {
    en: {
      turnedOn: "🐤",
      turnedOff: "😔",
      turnedOnNoti: "Admin-only notifications are disabled.",
      turnedOffNoti: "Admin-only notifications are disabled."
    },
    vi: {
      turnedOn: "Đã bật chế độ chỉ admin mới có thể sử dụng bot",
      turnedOff: "Đã tắt chế độ chỉ admin mới có thể sử dụng bot",
      turnedOnNoti: "Đã tắt thông báo admin-only",
      turnedOffNoti: "Đã tắt thông báo admin-only"
    }
  },

  onStart: function ({ args, message, getLang }) {
    let isSetNoti = false;
    let value;
    let indexGetVal = 0;

    if (args[0] === "noti") {
      isSetNoti = true;
      indexGetVal = 1;
    }

    if (args[indexGetVal] === "on") {
      value = true;
    } else if (args[indexGetVal] === "off") {
      value = false;
    } else {
      return message.SyntaxError();
    }

    if (isSetNoti) {
      // Keep admin-only notifications disabled.
      config.hideNotiMessage.adminOnly = true;
      message.reply(getLang("turnedOnNoti"));
    } else {
      config.adminOnly.enable = value;
      message.reply(getLang(value ? "turnedOn" : "turnedOff"));
    }

    fs.writeFileSync(
      client.dirConfig,
      JSON.stringify(config, null, 2)
    );
  }
};
