const { makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const fs = require("fs");

async function startBot() {
  // 1. Weka Session kwenye folda "auth_info"
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  // 2. Fungua Soketi ya WhatsApp
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  // 3. Chunga Mabadiliko ya QR na Koneksheni
  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;
    if (qr) console.log("🔵 Scan QR hii kwenye WhatsApp yako!");
    if (connection === "open") console.log("🟢 Bot imeshikana na WhatsApp!");
  });

  // 4. Hifadhi Session kila wakati
  sock.ev.on("creds.update", saveCreds);

  // 5. Pokua Ujumbe
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const text = msg.message.conversation || "";
    if (text === "!ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong!" });
    }
  });
}

startBot().catch((err) => console.log("❌ Hitilafu:", err));