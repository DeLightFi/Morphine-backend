"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config_dev_1 = __importDefault(require("./config.dev"));
const config_prod_1 = __importDefault(require("./config.prod"));
const getEnvironnementConfig = () => {
    switch (process.env.NODE_ENV) {
        case 'dev':
            return config_dev_1.default;
        case 'production':
            return config_prod_1.default;
        default:
            throw new Error(`config not found for env : ${process.env.NODE_ENV}`);
    }
};
//@ts-ignore
const config = {
    appName: 'morphine-backend',
    server: {
        corsOptions: {
            origin: '*',
            optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
        }
    },
    ...getEnvironnementConfig()
};
exports.default = config;
//# sourceMappingURL=index.js.map