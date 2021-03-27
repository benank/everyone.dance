import {isWebVersion} from "./isWebVersion";

const port = (!isWebVersion && electron.isDev) ? "2083" : "2053";
export const ENDPOINT = `https://everyone.dance:${port}`;