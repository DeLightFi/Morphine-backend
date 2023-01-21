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
    server.app.use('/', server.router);
    server.app.get("/", (req, res) => {
        res.send(`
        <body style="width: 100%; height: 100%; overflow: hidden; background-color: #313131;">
          <img style="display: block; margin: 0 auto;" src="https://morphine.store//assets/logo/logo.png" alt="Example Image">
          <h2 style="text-align: center; color: #FFA72E; font-family: 'Inter';">Welcome to Morphine API.</h2>
          <p style="text-align: center; color: #FFA72E; font-family: 'Inter';">Please read the documentation:</p>
          <a href="https://github.com/Morphine-protocol/backend">
              <svg style="display: block; margin: 0 auto;" height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1"
                  width="32" data-view-component="true" class="octicon octicon-mark-github v-align-middle">
                  <path fill="#FFA72E"
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z">
                  </path>
              </svg>
          </a>
        </body>
        `);
    });
    server.app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
            status: 'error',
            statusCode: err.statusCode,
            message: err.message
        });
    });
    ((port = process.env.PORT || 5000) => {
        server.app.listen(port, () => {
            console.log(("App is running at http://localhost:%d in %s mode"), port, process.env.NODE_ENV);
            console.log("Press CTRL-C to stop\n");
            job_1.default.PoolEvents();
            job_1.default.PoolValues();
            job_1.default.MulticallEvents();
        });
        server.app.on('close', () => {
            server.app.removeAllListeners();
        });
    })();
})
    .catch(error => console.log(error));
//# sourceMappingURL=index.js.map