import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import { getPolygonEnvelopeFromGround } from "../../utils/groundAndWater";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { Point, Polygon } from "@arcgis/core/geometry";
import { createTurbineAnnotation, createTurbines, getGraphicFromModel } from "../../utils/assets";
import state from "../../stores/state";
import AnimationManager from '../../utils/AnimationManager';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';

export default class BookmarkManager {

    view: __esri.SceneView;
    spatialReference: __esri.SpatialReference;
    presentation: __esri.Presentation;
    animationManager: AnimationManager;

    turbineLocations: __esri.FeatureLayer;
    waterExtent: __esri.FeatureLayer;
    submarineRoutes: __esri.FeatureLayer;
    elevation: __esri.ElevationLayer;
    groundAndWater: __esri.GraphicsLayer;
    assets3D: __esri.GraphicsLayer;

    resolutionStep = 100;
    waterHeight = 0;
    groundDepth = -1000;

    bladeGraphics: __esri.Graphic[];
    sailBoat: __esri.Graphic;
    pinpoint: __esri.Graphic;
    submarine: __esri.Graphic;

    controller: AbortController;

    constructor(view: __esri.SceneView) {
        this.view = view;
        this.spatialReference = view.spatialReference;
        this.presentation = (view.map as __esri.WebScene).presentation;
        this.animationManager = new AnimationManager(view);
        this.initialize().then(() => {
            state.setAssetsLoaded();
        })

    }

    async initialize() {
        this.initializeLayers();
        await this.addGroundAndWater();
        await this.add3DAssets();
    }

    initializeLayers() {
        this.elevation = this.view.map.ground.layers.getItemAt(0) as __esri.ElevationLayer;
        this.waterExtent = this.view.map.layers.filter(layer => layer.title === "Water Extent").getItemAt(0) as __esri.FeatureLayer;
        this.turbineLocations = this.view.map.layers.filter(layer => layer.title === "Wind turbines").getItemAt(0) as __esri.FeatureLayer;
        this.submarineRoutes = this.view.map.layers.filter(layer => layer.title === "Submarine Route").getItemAt(0) as __esri.FeatureLayer;
        this.groundAndWater = new GraphicsLayer({
            title: "Ground and water",
            elevationInfo: {
                mode: "absolute-height"
            }
        });
        this.assets3D = new GraphicsLayer({
            elevationInfo: {
                mode: "absolute-height"
            }
        });
        this.view.map.addMany([this.groundAndWater, this.assets3D]);
    }

    async addGroundAndWater() {
        const extent = (this.view.map as __esri.WebScene).clippingArea.extent;
        const results = await this.waterExtent.queryFeatures({ where: "1=1", returnGeometry: true });
        const { geometry } = results.features[0];
        const waterPolygonIntersection = geometryEngine.intersect(geometry, extent) as __esri.Polygon;
        const waterGraphics = await getPolygonEnvelopeFromGround({
            polygon: waterPolygonIntersection,
            step: this.resolutionStep,
            extrusion: this.waterHeight,
            type: "water",
            startColor: [4, 35, 56, 255],
            endColor: [58, 146, 176, 180]
        }, this.elevation as __esri.ElevationLayer);

        const groundGraphics = await getPolygonEnvelopeFromGround({
            polygon: Polygon.fromExtent(extent),
            step: this.resolutionStep,
            extrusion: this.groundDepth,
            type: "ground",
            startColor: [240, 221, 163, 255],
            endColor: [168, 138, 81, 255]
        }, this.elevation as __esri.ElevationLayer);

        this.groundAndWater.addMany([...waterGraphics, ...groundGraphics]);
    }

    async add3DAssets() {
        // wind turbines
        const { features } = await this.turbineLocations.queryFeatures({ where: "1=1", outFields: ["OBJECTID", "Speed"], returnGeometry: true, geometry: (this.view.map as __esri.WebScene).clippingArea, spatialRelationship: "intersects" });
        const { bladeGraphics, pillarGraphics } = await createTurbines(features, this.waterHeight);
        this.bladeGraphics = bladeGraphics;

        const turbine = features.filter(f => f.attributes.OBJECTID === 13)[0];
        const annotationGraphic = createTurbineAnnotation(turbine.geometry as __esri.Point, this.waterHeight);

        this.sailBoat = await getGraphicFromModel("./assets/models/sailboat.glb",
            new Point({
                x: -13544546.34895185,
                y: 4307521.548889681,
                z: this.waterHeight,
                spatialReference: this.spatialReference
            })
        );

        const routes = await this.submarineRoutes.queryFeatures({ where: "1=1", returnGeometry: true, returnZ: true });
        const route = routes.features[0];
        const routeGeometry = route.geometry as __esri.Polyline;

        const [x, y, z] = routeGeometry.paths[0][0];
        this.submarine = await getGraphicFromModel("./assets/models/yellow_submarine.glb",
            new Point({
                x, y, z, spatialReference: routeGeometry.spatialReference
            })
        );
        this.animationManager.setupSubmarineAnimation(routeGeometry, this.submarine);

        this.pinpoint = await getGraphicFromModel("./assets/models/pinpoint.glb",
            new Point({
                x: -13537233.287500003,
                y: 4312543.795616967,
                z: 442, spatialReference: routeGeometry.spatialReference
            })
        );
        this.setupCameraHeadingListener();

        this.assets3D.addMany([...bladeGraphics, ...pillarGraphics, annotationGraphic, this.sailBoat, this.submarine, this.pinpoint]);
    }

    setupCameraHeadingListener() {
        reactiveUtils.watch(() => Math.round(this.view.camera.heading), (heading) => {
            const geometry = this.pinpoint.geometry as __esri.Mesh;
            geometry.transform.rotationAngle = 180 - heading;
            geometry.transform.rotationAxis = [0, 0, 1];
        }, { initial: true });
    }

    resetSignal() {
        if (this.controller) {
            this.controller.abort();
        }
        this.controller = new AbortController();
        return this.controller.signal;
    };

    async activateBookmark(id: number, status: boolean) {
        const signal = this.resetSignal();
        switch (id) {
            case 0:
                if (status) {
                    this.animationManager.animateCamera({
                        camera: {
                            x: -13549161.92507,
                            y: 4307774.12432,
                            z: 174.102,
                            heading: 34.47,
                            tilt: 82.31
                        }, signal
                    });
                    this.animationManager.animateTurbines(this.bladeGraphics);
                } else {
                    this.animationManager.stopAnimatingTurbines();
                }
                break;
            case 1:
                if (status) {
                    this.animationManager.animateCamera({
                        camera: {
                            x: -13537764.11181,
                            y: 4307887.74312,
                            z: 920.260,
                            heading: 6.32,
                            tilt: 83.61
                        }, signal
                    })
                    this.animationManager.animatePinpoint(this.pinpoint);
                } else {
                    this.animationManager.stopAnimatingPinpoint();
                }
                break;
            case 2:
                if (status) {
                    this.animationManager.animateCamera({
                        camera: {
                            x: -13544598.82708,
                            y: 4307484.75467,
                            z: 15.41,
                            heading: 55.62,
                            tilt: 82.22
                        }, signal
                    });
                    this.animationManager.animateBoat(this.sailBoat);
                } else {
                    this.animationManager.stopAnimatingBoat();
                }
                break;
            case 3:
                if (status) {
                    this.animationManager.animateCamera({
                        camera: {
                            x: -13545249.77396,
                            y: 4302143.42422,
                            z: 386.005,
                            heading: 52.08,
                            tilt: 78.73
                        }, signal
                    });
                    this.animationManager.animateSubmarine();
                } else {
                    this.animationManager.stopAnimatingSubmarine();
                }
                break
        }
    }
}