console.clear()
require('./setting/config')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    jidDecode,
    proto,
    getAggregateVotesInPollMessage
} = require("@whiskeysockets/baileys")
const chalk = require('chalk')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const FileType = require('file-type')
const readline = require("readline")
const PhoneNumber = require('awesome-phonenumber')
const path = require('path')
const NodeCache = require("node-cache")
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('./System/Data1.js')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./System/Data2.js')
const usePairingCode = global.connect

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    return new Promise((resolve) => {
        rl.question(text, resolve)
    })
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./session")
    const SarDev = makeWASocket({
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            )
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                }
            }
            return message
        },
        version: (await fetchLatestBaileysVersion()).version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({ level: "fatal" }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "silent", stream: "store" })),
        },
    })

    if (!SarDev.authState.creds.registered) {
        const phoneNumber = await question(console.log(chalk.blue(`Enter Your Number\nYour Number: `)))
        const code = await SarDev.requestPairingCode(phoneNumber.trim())
        console.log(chalk.blue(`Code: ${code}\n`))
    }

    const store = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    })

    store.bind(SarDev.ev)

    SarDev.ev.on('call', async (caller) => {
        console.log("INCOMING CALL DETECTED")
    })
    SarDev.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    SarDev.ev.on('messages.upsert', async chatUpdate => {
        try {
            mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return
            if (!SarDev.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            let m = smsg(SarDev, mek, store)
            require("./mrmenu")(SarDev, m, chatUpdate, store)
        } catch (error) {
            console.error("Error processing message: ", error)
        }
    })

    SarDev.ev.on('messages.update', async (updates) => {
        try {
            const { handleAntiDelete } = require('./mrmenu')
            for (const update of updates) {
                if (update.update?.message === null || update.update?.messageStubType === 1) {
                    await handleAntiDelete(SarDev, update.key)
                }
            }
        } catch (error) {
            console.error("AntiDelete Event Error: ", error.message)
        }
    })

    SarDev.ev.on('group-participants.update', async (update) => {
        try {
            const { handleGroupUpdates } = require('./mrmenu')
            await handleGroupUpdates(SarDev, update)
        } catch (error) {
            console.error("Group Update Event Error: ", error.message)
        }
    })

    SarDev.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
        filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext);
if (data && save) fs.promises.writeFile(filename, data)
        return { res, filename, size: await getSizeMedia(data), ...type, data }
    }

    SarDev.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }

    SarDev.sendText = (jid, text, quoted = '', options) => SarDev.sendMessage(jid, { text, ...options }, { quoted })

    SarDev.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff)
        await SarDev.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    SarDev.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff)
        await SarDev.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    SarDev.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    SarDev.sendMedia = async (jid, path, caption = '', quoted = '', options = {}) => {
        let { mime, data } = await SarDev.getFile(path, true)
        let messageType = mime.split('/')[0]
        let messageContent = {};
if (messageType === 'image') {
            messageContent = { image: data, caption: caption, ...options }
        } else if (messageType === 'video') {
            messageContent = { video: data, caption: caption, ...options }
        } else if (messageType === 'audio') {
            messageContent = { audio: data, ptt: options.ptt || false, ...options }
        } else {
            messageContent = { document: data, mimetype: mime, fileName: options.fileName || 'file' }
        }
        await SarDev.sendMessage(jid, messageContent, { quoted })
    }

    SarDev.sendPoll = async (jid, question, options) => {
        const pollMessage = {
            pollCreationMessage: {
                name: question,
                options: options.map(option => ({ optionName: option })),
                selectableCount: 1,
            },
        }
        await SarDev.sendMessage(jid, pollMessage)
    }

    SarDev.setStatus = async (status) => {
        await SarDev.query({
            tag: 'iq',
            attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
            content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
        })
        console.log(chalk.yellow(`Bot Status Updated: ${status}`))
    }

    SarDev.public = global.publicX

    SarDev.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            SarDev.setStatus(global.botName)
            SarDev.newsletterFollow("120363424538394885@newsletter")
            SarDev.newsletterFollow("120363406457183149@newsletter")
        }
    })

    SarDev.ev.on('error', (err) => {
        console.error(chalk.red("Connection Error: "), err.message || err)
    })
    SarDev.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()