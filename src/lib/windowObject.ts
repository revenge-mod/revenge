import { createVendettaObject } from "@core/vendettaObject";
import * as api from "@lib/api";
import patcher from "@lib/api/patcher";
import * as debug from "@lib/debug";
import * as managers from "@lib/managers";
import * as metro from "@lib/metro";
import * as settings from "@lib/settings";
import * as ui from "@lib/ui";
import * as utils from "@lib/utils";

function createBunnyObject(unloads: any[]): BunnyObject {
    return {
        api: {
            ...api,
            patcher
        },
        managers,
        metro,
        ui,
        utils,
        settings,
        debug,
        version: debug.versionHash,
        unload: () => {
            unloads.filter(i => typeof i === "function").forEach(p => p());
            // @ts-expect-error
            delete window.bunny;
        },
    };
}

export default function initWindowObject(unloads: any[]) {
    window.vendetta = createVendettaObject(unloads);
    window.bunny = createBunnyObject(unloads);
}


/*
    (You may now worry about my mental state.)
    This is a hack, apparently when you destruct a star-imported module, its type is deferenced
    We need to do this for every module because the types bundler apparently does not support referencing star-imported modules(?)
    I only have realized this after getting everything set up, thinking it'd go well :)
    The API should be the same even if we got alternatives in the future

    See: https://github.com/timocov/dts-bundle-generator/issues/304
*/
export type BunnyObject = ReturnType<typeof _bunnyObject>;
const _bunnyObject = () => ({ // this function is never used, only exists for typings
    api: {
        ...api,
        flux: utils.without({ ...api.flux }, "injectFluxInterceptor"),
        commands: { ...api.commands },
        native: {
            ...api.native,
            fs: { ...api.native.fs },
            modules: { ...api.native.modules },
            loader: { ...api.native.loader }
        },
        storage: { ...api.storage },
        assets: { ...api.assets },
        patcher: utils.without({
            ...patcher,
            unpatchAll: () => { }
        }, "unpatchAll")
    },
    managers: {
        ...managers,
        plugins: { ...managers.plugins },
        themes: { ...managers.themes }
    },
    metro: {
        ...metro,
        common: { ...metro.common },
        filters: { ...metro.filters },
        ...metro.filters
    },
    ui: {
        ...ui,
        components: {
            ...ui.components,
            discord: {
                ...ui.components.discord,
                Forms: { ...ui.components.discord.Forms },
                Redesign: { ...ui.components.discord.Redesign }
            }
        },
        alerts: { ...ui.alerts },
        color: { ...ui.color },
        toasts: { ...ui.toasts },
        styles: { ...ui.styles }
    },
    utils: {
        ...utils,
        constants: { ...utils.constants },
        types: { ...utils.types },
        logger: { ...utils.logger },
    },
    settings: {
        ...settings,
        settings: settings.settings,
        loaderConfig: { ...settings.loaderConfig }
    },
    debug: { ...debug },
    version: debug.versionHash,
    unload: () => { },
});
