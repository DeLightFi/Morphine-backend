"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose = __importStar(require("mongoose"));
const job_1 = __importDefault(require("./jobs/job"));
const MasterRouter_1 = __importDefault(require("./routers/MasterRouter"));
// load the environment variables from the .env file
dotenv_1.default.config({
    path: '.env'
});
/**
 * Express server application class.
 * @description Will later contain the routing system.
 */
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.router = MasterRouter_1.default;
    }
}
const server = new Server();
mongoose
    .connect(process.env.MONGODB_URI || 'none')
    .then(async (connection) => {
    //server.app.use(cors({ origin: "http://localhost:3000" }))
    server.app.set('views', __dirname + '/views');
    server.app.engine('.html', require('ejs').__express);
    server.app.use('/', server.router);
    server.app.get("/", (req, res) => {
        res.render('home.html');
    });
    server.app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
            status: 'error',
            statusCode: err.statusCode,
            message: err.message
        });
    });
    ((port = process.env.APP_PORT || 5000) => {
        server.app.listen(port, () => {
            console.log(("App is running at http://localhost:%d in %s mode"), port, process.env.NODE_ENV);
            console.log("Press CTRL-C to stop\n");
            job_1.default.PoolEvents();
            job_1.default.PoolValues();
        });
        server.app.on('close', () => {
            server.app.removeAllListeners();
        });
    })();
})
    .catch(error => console.log(error));
//# sourceMappingURL=index.js.map