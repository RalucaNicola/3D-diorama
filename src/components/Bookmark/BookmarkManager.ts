import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import { getPolygonEnvelopeFromGround } from "../../utils/groundAndWater";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { Point, Polygon } from "@arcgis/core/geometry";
import { createTurbineAnnotation, createTurbines, getGraphicFromModel } from "../../utils/assets";
import { fadeIn } from "../../utils";
import Camera from "@arcgis/core/Camera";
import MeshTransform from "@arcgis/core/geometry/support/MeshTransform";
import { PolygonSymbol3D, WaterSymbol3DLayer } from "@arcgis/core/symbols";
import SunLighting from "@arcgis/core/views/3d/environment/SunLighting";
import VirtualLighting from "@arcgis/core/views/3d/environment/VirtualLighting";
import Color from "@arcgis/core/Color";
import { quat, vec3 } from "gl-matrix";
import SliceAnalysis from "@arcgis/core/analysis/SliceAnalysis";
import state from "../../stores/state";
import AnimationManager from '../../utils/AnimationManager';

export default class BookmarkManager {

    view: __esri.SceneView;
    spatialReference: __esri.SpatialReference;
    presentation: __esri.Presentation;
    animationManager: AnimationManager;

    turbineLocations: __esri.FeatureLayer;
    waterExtent: __esri.FeatureLayer;
    elevation: __esri.ElevationLayer;
    groundAndWater: __esri.GraphicsLayer;
    assets3D: __esri.GraphicsLayer;

    resolutionStep = 200;
    animatingSailBoat = false;
    waterHeight = 0;
    groundDepth = -1000;

    bladeGraphics: __esri.Graphic[];
    trawlerGraphic: __esri.Graphic;
    harborGraphic: __esri.Graphic;
    waterSurface: __esri.Graphic;

    controller: AbortController;
    sliceAnalysis: SliceAnalysis;
    sailBoat: __esri.Graphic;
    basemapFinal: __esri.GroupLayer;
    scenario2050: __esri.GroupLayer;


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

        this.waterSurface = waterGraphics[0];

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
            }), [0, 0, 0], 1
        );

        this.assets3D.addMany([...bladeGraphics, ...pillarGraphics, annotationGraphic, this.sailBoat]);
    }

    resetSignal() {
        if (this.controller) {
            this.controller.abort();
        }
        this.controller = new AbortController();
        return this.controller.signal;
    };



    async activateBookmark(id: number) {
        switch (id) {
            case 0:
                this.animationManager.stopAnimatingTurbines();
                break;
            case 1:
                this.animationManager.animateTurbines(this.bladeGraphics);
                break;
            case 2:
                this.animationManager.animateBoat(this.sailBoat);
                break
        }
    }

    destroy() {
    }
}