import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

interface ClientMessage {
    action: 'spin' | 'addBalance';
    amount?: number;
}

interface ServerMessage {
    type: 'spin' | 'addBalance' | 'status';
    amount?: number;
    balance?: number;
    reels?: string[];
}

let balance = 100;
let reels = ["🍒", "🍋", "🍉"];

const clients: WebSocket[] = [];

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.push(ws);

    // Send initial game status to the new client
    ws.send(JSON.stringify({ type: 'status', balance, reels }));

    ws.on('message', (data) => {
        const message: ClientMessage = JSON.parse(data.toString());

        if (message.action === 'spin') {
            spinReels();
            broadcastStatus();
        } else if (message.action === 'addBalance' && message.amount) {
            balance += message.amount;
            broadcastStatus();
        }
    });

    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index > -1) {
            clients.splice(index, 1);
        }
        console.log('Client disconnected');
    });
});

function spinReels() {
    reels = [getRandomFruit(), getRandomFruit(), getRandomFruit()];
    balance -= 1; // Deduct bet amount for spinning
}

function getRandomFruit() {
    const symbols = ["🍒", "🍋", "🍉", "🍇", "🍊"];
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function broadcastStatus() {
    const statusMessage: ServerMessage = {
        type: 'status',
        balance,
        reels,
    };
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(statusMessage));
        }
    });
}

server.listen(8080, () => {
    console.log('WebSocket server started on port 8080');
});
