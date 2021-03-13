const VERSION_BASE = "1.1.5"
export const VERSION = (typeof electron != 'undefined' && electron.isDev) ? VERSION_BASE + "-dev" : VERSION_BASE;