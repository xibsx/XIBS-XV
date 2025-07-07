// index.js
const { makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const fs = require('fs');

async function startBot() {
    // 1. Setup session storage
    const { state, saveCreds } = await useMultiFileAuthState('session_data');

    // 2. Create WhatsApp connection
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['MyBot', 'Safari', '1.0.0']
    });

    // 3. Handle connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        
        // Display QR code
        if (qr) {
            console.log('\n╔════════════════════════════════╗');
            console.log('║   SCAN THIS QR WITH YOUR PHONE  ║');
            console.log('║                                ║');
            console.log('║ 1. Open WhatsApp               ║');
            console.log('║ 2. Tap ⋮ > Linked Devices      ║');
            console.log('║ 3. Tap "Link a Device"         ║');
            console.log('╚════════════════════════════════╝\n');
        }

        // When connected
        if (connection === 'open') {
            console.log('✅ Bot connected to WhatsApp!');
            sendWelcomeMessage(sock);
        }
    });

    // 4. Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // 5. Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || '';
        const sender = msg.key.remoteJid;

        // Basic commands
        if (text === '!ping') {
            await sock.sendMessage(sender, { text: '🏓 Pong!' });
        }
        
        if (text === '!send') {
            // Send to specific number (replace with yours)
            const targetNumber = "25574206718@s.whatsapp.net";
            await sock.sendMessage(targetNumber, { 
                text: 'Hello from your WhatsApp bot! 🚀' 
            });
        }
    });
}

// Send welcome message when connected
async function sendWelcomeMessage(sock) {
    await delay(3000);
    const botJid = sock.user.id;
    await sock.sendMessage(botJid, { 
        text: '🤖 *Bot Activated!*\n\n' +
              'Type:\n' +
              '• !ping - Test bot\n' +
              '• !send - Send test message' 
    });
}

// Start the bot
startBot().catch(err => {
    console.error('❌ Bot Error:', err);
    process.exit(1);
});