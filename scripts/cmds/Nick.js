
const activeTasks = new Map();

module.exports = {
  config: {
    name: "nick",
    version: "1.0.0",
    author: "Bassit",
    countDown: 3,
    role: 2,
    description: "Change group members' nicknames",
    category: "group",
    guide: {
      en: "{pn} <nickname> | {pn} stop"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;

    if (args[0]?.toLowerCase() === "stop") {
      const task = activeTasks.get(threadID);
      if (task) task.stopped = true;
      return message.reply("تم طلب إيقاف تغيير الكنيات.");
    }

    const nickname = args.join(" ").trim();
    if (!nickname) {
      return message.reply("الاستعمال: nick الاسم\nللإيقاف: nick stop");
    }

    if (activeTasks.has(threadID)) {
      return message.reply("كاينة عملية خدامة. كتب nick stop أولا.");
    }

    const task = { stopped: false };
    activeTasks.set(threadID, task);

    try {
      const info = await api.getThreadInfo(threadID);
      const members = info.participantIDs || [];

      await message.reply(`بدأ تغيير الكنيات لـ ${members.length} عضو.`);

      for (const uid of members) {
        if (task.stopped) break;

        try {
          await new Promise((resolve, reject) => {
            api.changeNickname(nickname, threadID, uid, err => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (err) {
          console.error(`Nickname error (${uid}):`, err.message || err);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      return message.reply(
        task.stopped
          ? "توقف تغيير الكنيات."
          : "تم الانتهاء من تغيير الكنيات."
      );
    } catch (err) {
      console.error(err);
      return message.reply("وقع خطأ أثناء تغيير الكنيات.");
    } finally {
      if (activeTasks.get(threadID) === task) {
        activeTasks.delete(threadID);
      }
    }
  }
};
