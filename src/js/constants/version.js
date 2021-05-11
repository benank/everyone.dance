import {isWebVersion} from "./isWebVersion";
const VERSION_BASE = "2.3.7"
export const VERSION = (!isWebVersion && electron.isDev) ? VERSION_BASE + "-dev" : VERSION_BASE;