import {isWebVersion} from "./isWebVersion";
const VERSION_BASE = "2.1.2"
export const VERSION = (!isWebVersion && electron.isDev) ? VERSION_BASE + "-dev" : VERSION_BASE;