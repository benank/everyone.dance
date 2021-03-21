const VERSION_BASE = "1.1.6"
export const VERSION = (typeof electron != 'undefined' && electron.isDev) ? VERSION_BASE + "-dev" : VERSION_BASE;