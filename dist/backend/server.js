"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const sessions_1 = __importDefault(require("./routes/sessions"));
const stories_1 = __importDefault(require("./routes/stories"));
const votes_1 = __importDefault(require("./routes/votes"));
const export_1 = __importDefault(require("./routes/export"));
const socketServer_1 = require("./realtime/socketServer");
const SessionService_1 = require("./services/SessionService");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Create HTTP server for Socket.io
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
// Initialize Socket.io server with session service
const sessionService = new SessionService_1.SessionService();
(0, socketServer_1.initializeSocketServer)(io, sessionService);
// Middleware
app.use(express_1.default.json());
// CORS middleware
app.use((req, res, next) => {
    const allowedOrigins = ['localhost', 'localhost:3000', 'localhost:5173', '127.0.0.1'];
    const origin = req.headers.origin || '';
    if (allowedOrigins.some((allowed) => origin.includes(allowed)) ||
        process.env.NODE_ENV === 'development') {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
        }, `${req.method} ${req.path} ${res.statusCode}`);
    });
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Routes
app.use('/api/sessions', sessions_1.default);
app.use('/api', stories_1.default);
app.use('/api', votes_1.default);
app.use('/api', export_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    const code = err.code || 'INTERNAL_ERROR';
    logger_1.logger.error({
        error: err.message,
        status,
        path: req.path,
        method: req.method,
    }, 'Request error');
    res.status(status).json({
        error: {
            message,
            code,
            status,
        },
    });
});
// 404 handler (must be last)
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND',
            status: 404,
        },
    });
});
// Export app and io for testing
exports.default = app;
// Only start server if this file is run directly
if (require.main === module) {
    httpServer.listen(PORT, () => {
        console.log(`Server with WebSocket running on port ${PORT}`);
        logger_1.logger.info({ port: PORT }, 'HTTP and WebSocket server started');
    });
}
//# sourceMappingURL=server.js.map