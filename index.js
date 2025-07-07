require('dotenv').config();
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Session Configuration
const SESSION_FOLDER = 'session_data';

async function startBot() {
    // 1. Initialize session
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

    // 2. Create WhatsApp connection
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // We'll handle QR display ourselves
        browser: ['WhatsApp Bot', 'Chrome', '3.0'],
        logger: { level: 'warn' } // Reduce console spam
    });

    // 3. Handle connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        // Display beautiful QR code
        if (qr) {
            displayQR(qr);
        }

        // When connected
        if (connection === 'open') {
            console.log('\n\x1b[32m✅ Bot successfully connected to WhatsApp!\x1b[0m');
            sendWelcomeMessage(sock);
        }
    });

    // 4. Save session credentials
    sock.ev.on('creds.update', saveCreds);

    // 5. Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || '';
        const sender = msg.key.remoteJid;

        // Command handler
        if (text.startsWith('!')) {
            await handleCommand(sock, sender, text.toLowerCase());
        }
    });
}

// Display QR Code with border
function displayQR(qr) {
    console.clear();
    console.log('\x1b[36m╔══════════════════════════════════════════╗');
    console.log('║                                              ║');
    console.log('║          \x1b[1mWHATSAPP BOT CONNECTION\x1b[0m\x1b[36m          ║');
    console.log('║                                              ║');
    console.log('║   • Open WhatsApp on your phone              ║');
    console.log('║   • Tap ⋮ > Linked Devices                   ║');
    console.log('║   • Tap "Link a Device"                      ║');
    console.log('║                                              ║');
    console.log('║   Scan within \x1b[31m2 minutes\x1b[36m:                      ║');
    console.log('║                                              ║');

    // Generate and display QR code
    qrcode.generate(qr, { small: true }, (code) => {
        code.split('\n').forEach(line => {
            console.log(`║   ${line.padEnd(37)}   ║`);
        });
    });

    console.log('║                                              ║');
    console.log('╚══════════════════════════════════════════╝\x1b[0m');
}

// Handle bot commands
async function handleCommand(sock, sender, cmd) {
    switch(cmd) {
        case '!ping':
            await sock.sendMessage(sender, { text: '🏓 Pong!' });
            break;
            
        case '!info':
            await sock.sendMessage(sender, { 
                text: '🤖 *Bot Information*\n\n' +
                      '• Version: 1.0\n' +
                      '• Status: Active\n' +
                      '• Uptime: ' + process.uptime().toFixed(0) + 's'
            });
            break;
            
        default:
            await sock.sendMessage(sender, { 
                text: '📝 *Available Commands*\n\n' +
                      '• !ping - Test bot response\n' +
                      '• !info - Show bot status'
            });
    }
}

// Send welcome message
async function sendWelcomeMessage(sock) {
    const welcomeMsg = '🚀 *Bot Activated!*\n\n' +
                       'I am now connected to WhatsApp!\n' +
                       'Type !help for commands.';
    
    await sock.sendMessage(sock.user.id, { text: welcomeMsg });
}

// Start the bot with error handling
startBot().catch(err => {
    console.error('\x1b[31m❌ Bot Error:\x1b[0m', err);
    process.exit(1);
});