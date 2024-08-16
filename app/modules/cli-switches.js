"use strict";

let yargs = require("yargs");

/**
 * Append the correct CLI Switches to
 * the underlying Chrome instance
 *
 * @param {import("electron").App} app
 * @param {import("electron-store")} config
 */
let cliSwitchHandler = function(app, config) {
    const flags = [
        ['disable-frame-rate-limit', null, config.get('unlimitedFPS', true)],
        ['disable-gpu-vsync', null, config.get('unlimitedFPS', true)],
        ['max-gum-fps', '9999', config.get('unlimitedFPS', true)],
        ['disable-features', 'UsePreferredIntervalForVideo', config.get('unlimitedFPS', true)],
		['use-cmd-decoder', 'passthrough', config.get('unlimitedFPS', true)],
		['enable-features', 'BlinkCompositorUseDisplayThreadPriority', config.get('unlimitedFPS', true)],
		['enable-features', 'BrowserUseDisplayThreadPriority', config.get('unlimitedFPS', true)],
		['enable-features', 'GpuUseDisplayThreadPriority', config.get('unlimitedFPS', true)],
        ['use-angle', config.get('angleType', 'default'), true],
        ['in-process-gpu', null, config.get('inProcessGPU', true)],
        ['autoplay-policy', 'no-user-gesture-required', config.get('autoPlay', true)],
        ['disable-accelerated-2d-canvas', 'true', !config.get('acceleratedCanvas', true)],
    ];

    // Apply all the flags
    flags.forEach(([flag, value, condition]) => {
        if (condition) {
            if (value) {
                app.commandLine.appendSwitch(flag, value);
            } else {
                app.commandLine.appendSwitch(flag);
            }
        }
    });

    const angleBackend = /** @type {string} */ (config.get("angleBackend", "default"));
    const colorProfile = /** @type {string} */ (config.get("colorProfile", "default"));

    if (angleBackend !== "default") {
        app.commandLine.appendSwitch("use-angle", angleBackend);
    }

    if (colorProfile !== "default") {
        app.commandLine.appendSwitch("force-color-profile", colorProfile);
    }

    // Apply custom chromium flags via yargs
    yargs.parse(
        /** @type {string} */
        (config.get("chromiumFlags", "")),
        (_, argv) => Object.entries(argv).slice(1, -1).forEach(entry => app.commandLine.appendSwitch(entry[0], entry[1]))
    );
};

module.exports = cliSwitchHandler;
