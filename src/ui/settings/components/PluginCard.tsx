import { ButtonColors, Plugin } from "@types";
import { NavigationNative, clipboard } from "@metro/common";
import { removePlugin, startPlugin, stopPlugin, getSettings, fetchPlugin } from "@lib/plugins";
import { MMKVManager } from "@lib/native";
import { getAssetIDByName } from "@ui/assets";
import { showToast } from "@ui/toasts";
import { showConfirmationAlert } from "@ui/alerts";
import Card, { CardWrapper } from "@ui/settings/components/Card";
import { lang } from "..";

async function stopThenStart(plugin: Plugin, callback: Function) {
    if (plugin.enabled) stopPlugin(plugin.id, false);
    callback();
    if (plugin.enabled) await startPlugin(plugin.id);
}

export default function PluginCard({ item: plugin, index, highlight }: CardWrapper<Plugin>) {
    const settings = getSettings(plugin.id);
    const navigation = NavigationNative.useNavigation();
    const [removed, setRemoved] = React.useState(false);

    // This is needed because of React™
    if (removed) return null;
    
    const authors = plugin.manifest.authors;

    return (
        <Card
            index={index}
            // TODO: Actually make use of user IDs
            headerLabel={plugin.manifest.name}
            headerSublabel={authors?.[0] && `by ${plugin.manifest.authors.map(i => i.name).join(", ")}`}
            headerIcon={plugin.manifest.vendetta?.icon || "ic_application_command_24px"}
            toggleType="switch"
            toggleValue={plugin.enabled}
            onToggleChange={(v: boolean) => {
                try {
                    if (v) startPlugin(plugin.id); else stopPlugin(plugin.id);
                } catch (e) {
                    showToast((e as Error).message, getAssetIDByName("Small"));
                }
            }}
            descriptionLabel={plugin.manifest.description}
            overflowTitle={plugin.manifest.name}
            overflowActions={[
                {
                    icon: "ic_sync_24px",
                    label: lang.format("button.refetch", {}),
                    onPress: async () => {
                        stopThenStart(plugin, () => {
                            fetchPlugin(plugin.id).then(async () => {
                                showToast(lang.format("plugin.refetch.successs", {}), getAssetIDByName("toast_image_saved"));
                            }).catch(() => {
                                showToast(lang.format("plugin.refetch.error", {}), getAssetIDByName("Small"));
                            })
                        });
                    },
                },
                {
                    icon: "copy",
                    label: lang.format("button.copy", {}),
                    onPress: () => {
                        clipboard.setString(plugin.id);
                        showToast(lang.format("button.copy.toast", {}), getAssetIDByName("toast_copy_link"));
                    }
                },
                {   
                    icon: "ic_download_24px",
                    label: plugin.update ? lang.format("plugin.update.disable", {}) : lang.format("plugin.update.enable", {}),
                    onPress: () => {
                        plugin.update = !plugin.update;
                        showToast(`${plugin.update ? lang.format("enabled", {}) : lang.format("disabled", {})} ${lang.format(plugin.update.toast)} ${plugin.manifest.name}.`, getAssetIDByName("toast_image_saved"));
                    }
                },
                {
                    icon: "ic_duplicate",
                    label: lang.format("plugin.cleardata", {}),
                    isDestructive: true,
                    onPress: () => showConfirmationAlert({
                        title: lang.format("wait", {}),
                        content: lang.format("plugin.cleardata.prompt", {}),
                        confirmText: lang.format("button.clear", {}),
                        cancelText: lang.format("button.cancel", {}),
                        confirmColor: ButtonColors.RED,
                        onConfirm: () => {
                            stopThenStart(plugin, () => {
                                try {
                                    MMKVManager.removeItem(plugin.id);
                                    showToast(`${lang.format("plugin.cleardata.success", {})}`, getAssetIDByName("trash"));
                                } catch {
                                    showToast(`${lang.format("plugin.cleardata.error", {})}`, getAssetIDByName("Small"));
                                }
                            });
                        }
                    }),
                },
                {
                    icon: "ic_message_delete",
                    label: lang.format("button.delete", {}),
                    isDestructive: true,
                    onPress: () => showConfirmationAlert({
                        title: lang.format("wait", {}),
                        content: `${lang.format("plugin.delete.prompt", {})}`,
                        confirmText: lang.format("button.delete", {}),
                        cancelText: lang.format("plugin.cancel", {}),
                        confirmColor: ButtonColors.RED,
                        onConfirm: () => {
                            try {
                                removePlugin(plugin.id);
                                setRemoved(true);
                            } catch (e) {
                                showToast((e as Error).message, getAssetIDByName("Small"));
                            }
                        }
                    }),
                },
            ]}
            actions={[
                ...(settings ? [{
                    icon: "settings",
                    onPress: () => navigation.push("VendettaCustomPage", {
                        title: plugin.manifest.name,
                        render: settings,
                    })
                }] : []),
            ]}
            highlight={highlight}
        />
    )
}
