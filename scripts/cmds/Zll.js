
const activeTasks = new Map();

module.exports = {
  config: {
    name: "zll",
    aliases: [],
    version: "1.0.0",
    author: "Bassit",
    countDown: 3,
    role: 2,
    shortDescription: "Repeat a replied message with limits",
    longDescription: "Repeat a replied message with a delay and a limited count",
    category: "tools",
    guide: {
      en: "{pn} on | Reply to a message, then use {pn} <count> <delay>\n{pn} off"
    }
  },

  onStart: async function ({ message, event, args }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    if (args[0] === "off") {
      const task = activeTasks.get(threadID);

      if (!task || task.senderID !== senderID) {
        return message.reply("ما كاين حتى تكرار نشط ديالك.");
      }

      task.stopped = true;
      activeTasks.delete(threadID);
      return message.reply("تم إيقاف التكرار بنجاح.");
    }

    if (args[0] === "on") {
      return message.reply(
        "رد على الرسالة المطلوبة، ثم اكتب: zll العدد التأخير\nمثال: zll 3 5\nللإيقاف: zll off"
      );
    }

    if (!event.messageReply) {
      return message.reply("خاصك ترد على الرسالة اللي بغيتي تعاود إرسالها.");
    }

    if (activeTasks.has(threadID)) {
      return message.reply("كاينة عملية تكرار خدامة فهاد المجموعة. وقفها أولا.");
    }

    const count = Number(args[0]);
    const delaySeconds = Number(args[1]);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 5 ||
      !Number.isFinite(delaySeconds) ||
      delaySeconds < 3 ||
      delaySeconds > 60
    ) {
      return message.reply(
        "الاستعمال: رد على رسالة وكتب zll العدد التأخير\nمثال: zll 3 5\nالعدد من 1 حتى 5، والتأخير من 3 حتى 60 ثانية."
      );
    }

    const task = {
      senderID,
      stopped: false
    };

    activeTasks.set(threadID, task);

    await message.reply("بدأ التكرار المحدود.");

    try {
      const reply = event.messageReply;
      const body = reply.body || "";

      for (let i = 0; i < count; i++) {
        if (task.stopped) break;

        if (i > 0) {
          await new Promise(resolve =>
            setTimeout(resolve, delaySeconds * 1000)
          );
        }

        if (task.stopped) break;

        if (body) {
          await message.reply(body);
        } else {
          await message.reply(
            "ما قدرتش نعاود إرسال هاد الرسالة لأنها ما فيهاش نص قابل للقراءة."
          );
          break;
        }
      }
    } catch (error) {
      console.error("[ZLL ERROR]", error);
    } finally {
      if (activeTasks.get(threadID) === task) {
        activeTasks.delete(threadID);
      }
    }
  }
};
