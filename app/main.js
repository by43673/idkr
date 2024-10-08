
"use strict";

require("v8-compile-cache");

let path = require("path");
let { app, protocol } = require("electron");
let Store = require("electron-store");
let log = require("electron-log");
let yargs = require("yargs");

let PathUtils = require("./utils/path-utils");
let UrlUtils = require("./utils/url-utils");
let cliSwitches = require("./modules/cli-switches");
let BrowserLoader = require("./loaders/browser-loader");
let IpcLoader = require("./loaders/ipc-loader");

Object.assign(console, log.functions);

console.log(`idkr@${app.getVersion()} { Electron: ${process.versions.electron}, Node: ${process.versions.node}, Chromium: ${process.versions.chrome} }`);
if (!app.requestSingleInstanceLock()) app.quit();

const { argv } = yargs;
const config = new Store();

/** @type {string} */
let userscriptsDirConfig = (config.get("userscriptsPath", ""));
const userscriptsDir = PathUtils.isValidPath(userscriptsDirConfig) ? userscriptsDirConfig : path.join(app.getPath("documents"), "idkr/scripts");
cliSwitches(app, config);

app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36';

let init = function() {
	// Workaround for Electron 8.x
	protocol.registerSchemesAsPrivileged([{
		scheme: "idkr-swap",
		privileges: {
			secure: true,
			corsEnabled: true
		}
	}]);

	/** @type {any} */
	BrowserLoader.load(Boolean(argv.debug), config);
	IpcLoader.load(config);
	IpcLoader.initRpc(config);

	app.once("ready", async() => {
		await PathUtils.ensureDirs(BrowserLoader.getSwapDir(), userscriptsDir);
		protocol.registerFileProtocol("idkr-swap", (request, callback) => callback(decodeURI(request.url.replace(/^idkr-swap:/, ""))));
		app.on("second-instance", (_, _argv) => {
			let instanceArgv = yargs.parse(_argv);
			console.log("Second instance: " + _argv);
			if (!["unknown", "external"].includes(UrlUtils.locationType(String(instanceArgv["new-window"])))) {
				BrowserLoader.initWindow(String(instanceArgv["new-window"]), config);
			}
		});

		BrowserLoader.initSplashWindow(app.isPackaged ? String(argv.update || config.get("autoUpdate", "download")) : "skip", config);
	});
};

init();
