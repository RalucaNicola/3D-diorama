import WebScene from "@arcgis/core/WebScene";
import PortalItem from "@arcgis/core/portal/PortalItem";
import SceneView from "@arcgis/core/views/SceneView";
import VirtualLighting from "@arcgis/core/webscene/VirtualLighting";
import { mapConfig } from "../../config";
import state from "../../stores/state";

let view: __esri.SceneView = null;

export function getView() {
    return view;
}

export function destroyView() {
    if (view) {
        view.destroy();
        view = null;
    }
}

export const initializeView = async (divRef: HTMLDivElement) => {
    try {
        const portalItem = new PortalItem({
            id: mapConfig['web-map-id']
        });

        await portalItem.load();
        const webmap = new WebScene({
            portalItem: portalItem
        });
        await webmap.load();
        view = new SceneView({
            container: divRef,
            map: webmap as __esri.WebScene,
            padding: {
                top: 50,
                bottom: 0
            },
            ui: {
                components: []
            },
            alphaCompositingEnabled: true,
            environment: {
                lighting: new VirtualLighting({
                    directShadowsEnabled: true
                }),
                background: {
                    type: "color",
                    color: [0, 0, 0, 0]
                },
                starsEnabled: false,
                atmosphereEnabled: false
            },
            popup: {
                dockEnabled: true,
                dockOptions: {
                    buttonEnabled: false,
                    breakpoint: false
                },
                highlightEnabled: false,
                defaultPopupTemplateEnabled: false
            }
        });

        (window as any).view = view;

        await view.when(async () => {
            state.setViewLoaded();
        });
    } catch (error) {
        console.error();
    }
};