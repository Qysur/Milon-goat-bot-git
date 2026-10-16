
const activeTasks = new Map();

module.exports = {
  config: {
    name: "delnick",
    version: "1.0.0",
    author: "Bassit",
    countDown: 3,
    role: 2,
    description: "Reset group members' nicknames",
    category: "group",
    guide: {
      en: "{pn} | {pn} stop"
    }
  },

  onStart: async function ({ api, event, message }) {
    const threadID = event.threadID;

    if (activeTasks.has(threadID)) {
      const task = activeTasks.get(threadID);
      task.stopped = true;
      return message.reply("تم طلب إيقاف حذف الكنيات.");
    }

    const task = { stopped: false };
    activeTasks.set(threadID, task);

    try {
      const info = await api.getThreadInfo(threadID);
      const members = info.participantIDs || [];

      await message.reply("بدأ حذف الكنيات من أعضاء المجموعة.");

      for (const uid of members) {
        if (task.stopped) break;

        try {
          await new Promise((resolve, reject) => {
            api.changeNickname("", threadID, uid, err => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (err) {
          console.error(`Del nickname error (${uid}):`, err.message || err);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      return message.reply(
        task.stopped
          ? "توقف حذف الكنيات."
          : "تم الانتهاء من حذف الكنيات."
      );
    } catch (err) {
      console.error(err);
      return message.reply("وقع خطأ أثناء حذف الكنيات.");
    } finally {
      if (activeTasks.get(threadID) === task) {
        activeTasks.delete(threadID);
      }
    }
  }
};
