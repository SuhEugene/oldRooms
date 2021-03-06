const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const token = "AAAAAAAAAAAAAAAAAAAAAAAA.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

let cids = [];
let chats = {};

try{
  cids = JSON.parse(fs.readFileSync("./cids.json")) || [];
  cids = cids.map(el => {
    if (typeof el == typeof "") {
        return { id: el, owner: null }
    } else {
        return el;
    }
  });
} catch (_e) {
  cids = [];
}

try{
  chats = JSON.parse(fs.readFileSync("./chats.json")) || {};
} catch (_e) {
  chats = {};
}


client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    rcinit();
    let settings = JSON.parse(fs.readFileSync("./settings.json"));
    console.log("PARSING GUILDS");
    for (let g in settings) {
      try {
        let gld = await client.guilds.fetch(g);
        console.log("-", gld.name);
        let ctg = gld.channels.resolve(settings[g].category);
        ctg.children.each(async v => {
          if (v.type != "voice") return;
          if (v.id == settings[g].voice) return;

          let cidsEl = cids.find(c => c.id == String(v.id) || c == String(v.id));
          if (!cidsEl || v.members.size != 0) return;

          console.log(`[${gld.name}] ${cidsEl.owner} deleted voice`);
          if (chats[String(v.id)]) {
            await (await client.channels.fetch(chats[String(v.id)])).delete();
            console.log(`[${gld.name}] ${cidsEl.owner} deleted text`);
          }
          delete chats[String(v.id)];
          fs.writeFileSync("./chats.json", JSON.stringify(chats));
          await v.delete();
        })
      } catch (e) {}
    }
    console.log("PARSED ALL GUILDS");
});

function twozero() {
    client.user.setActivity("2.4", {type: "WATCHING"});
    setTimeout(() => {rcinit()}, 30000);
}
function rcinit() {
    client.user.setActivity("rc-init", {type: "WATCHING"});
    setTimeout(() => {link()}, 30000);
}
function link() {
    client.user.setActivity("bit.ly/RoomsCanary", {type: "WATCHING"});
    setTimeout(() => {twozero()}, 30000);
}
/*
    THE TODO LIST
    - ??????????????
*/

// let chs = Watcher("./channels.js");

const HELP_TEXT = "**-** `rc-init` - ?????????????????????????? ????????"+
                "\n**-** `rc-reset` - ???????????? ????????????"+
                "\n**-** `rc-help` - ?????????? ???????????? ???????????? (?????????????? ???? ???????????? ?? ??????????????)"+
                "\n**-** `rc-info` - ?????????? ???????????????????? ?? ?????????????? ???????????????????? ??????????????"+
                "\n**-** `rc-text` - ???????????????? ???????????????????? ???????????? ?? ???????? ?? ????????????????????"+
                "\n---"+
                "\n**-** `rc-<N>` - ?????????????????? ???????????????????????? ???????????????????? ?????????????????????????? ?? ????????????"+
                "\n?????????????????? ????????????????: `1-12`, `inf` (`inf` - ????????????????????)"+
                "\n??????????????: `r-1`, `r-6`, `r-inf`"+
                "\n---"+
                "\n**-** `rc-kick` - ?????? ???????????????????????? ???? ????????????"+
                "\n??????????????????????????: `rc-kick <@????????>` | ????????????: `rc-kick @SuhEugene`"+
                "\n?????????? ???? ?????? ???????????????????????? ???? ???????????? ???????????????? ???????? ???????????? ?? ?????????????????? ????????????"+
                "\n---"+
                "\n**-** `rc-prefix` - ?????????????????? ???????????????? ???????????????????????? ????????????"+
                "\n??????????????????????????: `rc-prefix <??????????????>` | ????????????: `rc-prefix ????????????`"+
                "\n?????????? ?????????????????????????? ?????????????? ?????????????? ?????????? ?????????????????????? ???????????? ???????? `???????????? ??????????????` (???????????????? `???????????? SuhEugene`)"+
                "\n---"+
                "\n**-** `rc-category` - ?????????????????? ?????????? ?????????????????? ?????? ???????????????? ??????????????"+
                "\n??????????????????????????: `rc-category <ID ??????????????????>` | ????????????: `rc-category 112233445566778899`"+
                "\n**-** `rc-voice` - ?????????????????? ???????????? ?????????????????? ???????????????????? ????????????"+
                "\n??????????????????????????: `rc-voice <ID ????????????>` | ????????????: `rc-voice 112233445566778899`";

client.on('message', async (message) => {
    if (message.author.bot) return;
    // console.log(((message.channel.type == "dm") ? "" :  "(" + message.channel.guild.name + ") ") + "["+((message.channel.type == "dm") ? "DM" : "#" + message.channel.name) + "]", message.author.username, ">", message.content)
    if (message.channel.type == "dm") return;
    message.member = await message.guild.members.fetch(message.author);

    let msg = null;
    let command = message.content.split(' ').shift().toLowerCase();

    let settings = JSON.parse(fs.readFileSync("./settings.json"));
    if (command == "rc-text") {
      /*d.log(!message.member.voice.channelID,
          !cids.find(c => c.id == String(message.member.voice.channelID)),
          !!chats[String(message.member.voice.channelID)]);*/
        if (!message.member.voice.channelID ||
            !cids.find(c => c.id == String(message.member.voice.channelID)) ||
            chats[String(message.member.voice.channelID)]) return;

        let pows = message.member.voice.channel.permissionOverwrites;
        let everyoneId = (await message.guild.fetch()).roles.everyone.id
        pows.set(everyoneId, { deny: ["MENTION_EVERYONE", "SEND_TTS_MESSAGES", "CREATE_INSTANT_INVITE"], type: "role", id: everyoneId });
        let options = {
            type: "text",
            parent: await client.channels.fetch(settings[message.guild.id].category),
            permissionOverwrites: pows
        }
        let newCh = await message.guild.channels.create(`${settings[message.guild.id].prefix} ${message.member.nickname || message.author.username}`.slice(0, 100), options);
        chats[String(message.member.voice.channelID)] = newCh.id;
        fs.writeFileSync("./chats.json", JSON.stringify(chats));
        console.log(`[${message.guild.name}] ${message.author.id} created text`);
        return newCh.send(`<@!${message.author.id}>, ?????????? ???????????????????? ?? ?????? ???????????? ??????????`);
    }

    if (command == "rc-kick") {
        if (!message.member.voice.channelID)
            return message.channel.send("?????? ?????????????????????????? ???????????? ?????????????? ???? ???????????? ???????????????????? ?? ?????????????????? ????????????");

        let ping = message.mentions.members.first();
        if (!ping) return message.channel.send("???? ???????????? ??????????????, ???????????????? ???? ???????????? ??????????????, ???????? ???????????? ??????????????????????");

        if (ping.voice.channelID != message.member.voice.channelID)
            return message.channel.send("??????????????, ???????????????? ???? ???????????? ??????????????, ?????????????????? ?? ???????????? ???????????? ?????? ?????? ?????????????????? ??????????????");

        let channel = cids.find(c => c.id == String(message.member.voice.channelID));
        if (!channel) return message.channel.send("?????? ???????????????? ?? ???????????? ???????????? ????????????????????");
        if (channel.owner != message.author.id)
            return message.channel.send("???????????????????????? ????????: ???????????? ???? ???????????? ?????????? ???????????? ?????? ??????????????????");

        await ping.voice.setChannel(null);
        return message.channel.send("???????????????????????? ?????? ?????????????? ????????????");
    }

    if (!message.member.permissions.has(8) && message.member.id != "404236405116764162") return;

    if (command == "rc-init") {

        if (settings[message.guild.id])
        return message.channel.send("???? ???????????? ?????????????? ?????? ???????? ?????????????? ?????????????????? ?? ?????????? ?? ???????????????????? ??????????????\n?????? ?????????????????? ?????????????????? ???????????? ?????????????? ???????????????? `rc-reset`");

        return message.guild.channels.create("?????????????????? ?????????? [rc]", {type: "category"}).then(ch => {
            message.guild.channels.create("[+] ??????????????", {type: "voice", parent: ch}).then(async ch1 => {
                settings[message.guild.id] = {
                    category: ch.id,
                    voice: ch1.id,
                    inf: 2,
                    prefix: "??????????"
                };
                fs.writeFileSync("./settings.json", JSON.stringify(settings));
                 await message.channel.send("**RoomsBot Canary - __????????-????????????__ RoomsBot'a**\n?????? ?????????? ???????? __??????????????????????__, ?????? ?????????? ???????????????? ?? __????????????__, ???? ???? ???? ?????? ?? __??????????__");
                 await message.channel.send("**?????????????? ????????:**\n"+HELP_TEXT);
                 await message.channel.send("**????????????????????????**\n???????? ???????????????????????????? ?????? ?????????? ???? ????????????????, ???? ?????? ???????????????? ???????????????????? ???????????? ????????: <https://bit.ly/RoomsBot>");
                return message.channel.send("**????????**\n???????? ???? ???????????????? ?????? - ???? ???????????? ?????????????????? ?? ?????????????????????????? ?? ????: <https://vk.me/suheugene>\nP.S. ?????? ?????????? ???????????? ?????????????????? ??????????????. ???????? ???? ?????????????? ????????????, ???? ?????? ???????????? ?????? ??????: <https://www.donationalerts.com/r/suheugene>");
            });
        });
    }
    if (!message.content.startsWith("rc-")) return;
    if (command == "rc-help") {
        return message.channel.send(HELP_TEXT);
    }
    if (!message.member.permissions.has(8) && message.member.id == "404236405116764162") await message.delete();
    if (!settings[message.guild.id]) return message.channel.send("?????? ?????? ???? ?????? ??????????????????????????????");
    if (command == "rc-reset") {
        let v1 = await client.channels.resolve(settings[message.guild.id].voice);
        let v2 = await client.channels.resolve(settings[message.guild.id].category);
        v1 && v1.delete().catch(()=>{});
        v2 && v2.delete().catch(()=>{});

        delete settings[message.guild.id];

        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????? ?????????? ?????????????? ????????????????\n???????????? ???? ???????????? ?????????? ?????????????? ?????????????????? ?????????????????? ????????????");
    }
    if (command == "rc-prefix") {
        let prefix_arr = message.content.split(' ');
        prefix_arr.shift();
        let prefix = prefix_arr.join(" ").slice(0, 100);
        let settings = JSON.parse(fs.readFileSync("./settings.json"));
        settings[message.guild.id].prefix = prefix;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send(`?????????? ?????????????? ??????????????: \`${prefix}\``)
    }
    if (command == "rc-info") {
        return message.channel.send(
            `**?????????????????? ??????????????:**\n` +
            `???? ?????????????????????? ??????-???? ????????????: __${settings[message.guild.id].inf || "????????????????????"}__\n` +
            `???? ??????????????: \`${settings[message.guild.id].prefix}\`\n` +
            `???? ??????????????????: __${settings[message.guild.id].category}__\n` +
            `???? ?????????????????? ??????????: __${settings[message.guild.id].voice}__\n`);
    }
    if (command == "rc-2") {
        settings[message.guild.id].inf = 2;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 2");
    }
    if (command == "rc-3") {
        settings[message.guild.id].inf = 3;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 3");
    }
    if (command == "rc-4") {
        settings[message.guild.id].inf = 4;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 4");
    }
    if (command == "rc-5") {
        settings[message.guild.id].inf = 5;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 5");
    }
    if (command == "rc-6") {
        settings[message.guild.id].inf = 6;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 6");
    }
    if (command == "rc-7") {
        settings[message.guild.id].inf = 7;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 7");
    }
    if (command == "rc-8") {
        settings[message.guild.id].inf = 8;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 8");
    }
    if (command == "rc-9") {
        settings[message.guild.id].inf = 9;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 9");
    }
    if (command == "rc-10") {
        settings[message.guild.id].inf = 10;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 10");
    }
    if (command == "rc-11") {
        settings[message.guild.id].inf = 11;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 11");
    }
    if (command == "rc-12") {
        settings[message.guild.id].inf = 12;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: 12");
    }
    if (command == "rc-inf") {
        settings[message.guild.id].inf = 0;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));
        msg = await message.channel.send("?????????????????????? ??????-???? ???????????? ???????????????????? ??????????: ????????????????????");
    }
    if (command == "rc-category") {
        let num = message.content.split(' ')[1];
        if (isNaN(num)) return message.channel.send("?????? ???? ??????????");
        let ch = await (await client.guilds.fetch(message.guild.id)).channels.resolve(num);
        if (!ch) return message.channel.send("???????????? ID ???? ???????????????? ??????????????");
        if (ch.type != "category") return message.channel.send("?????????? ???? ???????????????? ????????????????????");
        settings[message.guild.id].category = ch.id;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));

        msg = await message.channel.send(`???????????? ???????????? ?????????? ???????????????????? ?? ?????????????????? \`${ch.name}\` (${ch.id})`);
    }
    if (command == "rc-voice") {
        let num = message.content.split(' ')[1];
        if (isNaN(num)) return message.channel.send("?????? ???? ??????????");
        let ch = await (await client.guilds.fetch(message.guild.id)).channels.resolve(num);
        if (!ch) return message.channel.send("???????????? ID ???? ???????????????? ??????????????");
        if (ch.type != "voice") return message.channel.send("?????????? ???? ???????????????? ????????-??????????????");
        settings[message.guild.id].voice = ch.id;
        await fs.writeFileSync("./settings.json", JSON.stringify(settings));

        msg = await message.channel.send(`???????????? ???????????? ?????????? ???????????????????? ???? ?????????????????????????? ?? \`${ch.name}\` (${ch.id})`);
    }
    if (!message.member.permissions.has(8) && message.member.id == "404236405116764162") msg.delete();
});

client.on("voiceStateUpdate", async (oldM, newM) => {
  // d.log("new connection", oldM);
    let settings = JSON.parse(fs.readFileSync("./settings.json"))[newM.guild.id];
    if (!settings) return;
    let guildFCH = await oldM.guild.fetch();
    let oldCh = await guildFCH.channels.resolve(oldM.channelID);
    let newCh = await guildFCH.channels.resolve(newM.channelID);
    let oldTest = (oldCh && oldCh.parent && oldCh.parent.id == settings.category);
    let newTest = (newCh && newCh.parent && newCh.parent.id == settings.category);
    (async ()=> {
        if (settings.voice != oldM.channelID && settings.voice != newM.channelID) return;
        // if (!newTest) return;
        if (newM.channelID == settings.voice) {
            let pows = (await guildFCH.channels.resolve(settings.category)).permissionOverwrites;
            pows.set(newM.id, {allow: ["MANAGE_CHANNELS"], type: "member", id: newM.id});
            // console.log(pows);
            let options = {
                type: "voice",
                parent: await newM.guild.channels.resolve(settings.category),
                permissionOverwrites: pows // [{allow: ["MANAGE_CHANNELS"], id: newM.id}]
            }
            if (settings.inf) options.userLimit = settings.inf;
            let usr = await guildFCH.members.fetch(newM.id);
            newM.guild.channels.create(`${settings.prefix} ${usr.nickname || usr.user.username}`.slice(0, 100), options)
            .then(channel => {
                console.log(`[${newM.guild.name}] ${usr.id} created voice`);
                newM.setChannel(channel.id)
                .then(()=>{ cids.push({ id: String(channel.id), owner: String(newM.id) }); fs.writeFileSync("./cids.json", JSON.stringify(cids)); })
                .catch(_err => { channel.delete() });
            })
        }
    })();
    (async ()=> {
        // console.log("TESTS");
        // console.log(!!oldTest)
        if (!oldTest) return;
        // console.log(!!oldM.channelID);
        if (!oldM.channelID) return;

        // console.log(!(oldCh && oldCh.id == settings.voice), !(oldCh && oldCh.parent && oldCh.parent.id != settings.category))
        if ((oldCh && oldCh.id == settings.voice) || (oldCh && oldCh.parent && oldCh.parent.id != settings.category)) return;
        // console.log(!!cids.find(c => c.id == String(oldCh.id)));
        if (!cids.find(c => c.id == String(oldCh.id) || c == String(oldCh.id))) return;
        if (!oldCh || oldCh.members.size != 0) return;
        cids = cids.filter(c => c.id != oldCh.id && c != oldCh.id);
        fs.writeFileSync("./cids.json", JSON.stringify(cids));

        if(chats[String(oldCh.id)]) {
            let delCh = await client.channels.fetch(chats[String(oldCh.id)]);
            delCh.delete();
            console.log(`[${newM.guild.name}] ${newM.id} deleted text`);
        }
        delete chats[String(oldCh.id)];
        fs.writeFileSync("./chats.json", JSON.stringify(chats));

        // console.log(!oldCh, !!oldCh.members.first())
        console.log(`[${newM.guild.name}] ${newM.id} deleted voice`);
        return oldCh.delete();
    })();
})

client.on('error', (e) => {
    console.error("I FOUND YOU ->", e.name);
    console.error("I FOUND ERROR ->", e.message);
});


client.login(token);
