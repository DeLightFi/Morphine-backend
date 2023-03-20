import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config()

import { MorphineConfig } from './config.d';

import devConfig from "./config.dev"
import prodConfig from "./config.prod"


const getEnvironnementConfig = () => {
    switch (process.env.NODE_ENV) {
        case 'dev':
            return devConfig;
        case 'production':
            return prodConfig;
        default:
            throw new Error(`config not found for env : ${process.env.NODE_ENV}`)
    }
}


//@ts-ignore
const config: MorphineConfig = {
    appName: 'morphine-backend',
    server: {
        corsOptions : {
            origin: '*',
            optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
        }
    },

    ...getEnvironnementConfig()
}

export default config;