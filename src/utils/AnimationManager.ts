import Camera from "@arcgis/core/Camera";
import { CameraProps } from "../types/types";
import { quat, vec3 } from "gl-matrix";
import MeshTransform from "@arcgis/core/geometry/support/MeshTransform";
import { bladeLength } from "./assets";
import { Point } from "@arcgis/core/geometry";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import interpolate from "./interpolate";
import { getAngle } from ".";

export default class AnimationManager {
    view: __esri.SceneView;
    animatingBoat: boolean = false;
    animatingTurbines: boolean = false;
    animatingSubmarine: boolean = false;
    animatingPinpoint: boolean = false;

    points: __esri.Point[] = [];
    xs: number[] = []; // distance from the beginning to that point
    dxs: number[] = []; // distance from the previous point to current point
    speed: number = 100; // submarine speed in m/s
    submarine: __esri.Mesh;

    constructor(view: __esri.SceneView) {
        this.view = view;
    }

    async animateCamera({ camera = null, signal, speedFactor = 1 }: { camera?: CameraProps, signal: AbortSignal, speedFactor?: number }) {
        let target = null;
        if (camera) {
            const { x, y, z, heading, tilt } = camera;
            target = new Camera({
                position: {
                    x,
                    y,
                    z,
                    spatialReference: this.view.spatialReference
                },
                heading,
                tilt
            });
        }
        try {
            return await this.view.goTo({ target }, { signal, speedFactor });
        } catch (error) {
            console.log(error);
        }
    }

    async animateBoat(graphic: __esri.Graphic) {
        this.animatingBoat = true;
        let angle = 0;
        let phase = 0;
        let prevTime: number | undefined = undefined;
        const factor = 0.0003;
        const dampingFactor = 0.7;
        const tmpQuaternion = quat.create();
        const axis = vec3.fromValues(0, 0, 0);

        const geometry = graphic.geometry as __esri.Mesh;

        const animate = (elapsedTime: number) => {
            if (prevTime == null) {
                prevTime = elapsedTime;
            }

            const dt = elapsedTime - prevTime;
            prevTime = elapsedTime;

            angle += factor * dt;
            phase += factor * dt;
            geometry.transform ??= new MeshTransform();

            const { rotationAxis, rotationAngle } = geometry.transform;
            quat.setAxisAngle(tmpQuaternion, vec3.fromValues(rotationAxis[0], rotationAxis[1], rotationAxis[2]), rotationAngle);

            // Simulate wave dynamics with multiple sine waves and some randomness
            const waveY = Math.sin(angle) * 0.03 + Math.sin(angle + phase / 2) * 0.05;
            const waveX = Math.sin(angle + phase) * 0.05 + Math.cos(angle) * 0.02;

            // Apply damping to gradually reduce wobbling over time
            const dampedWaveX = waveX * dampingFactor;
            const dampedWaveY = waveY * dampingFactor;

            // Update the quaternion rotation
            quat.identity(tmpQuaternion);
            quat.rotateY(tmpQuaternion, tmpQuaternion, dampedWaveY);
            quat.rotateX(tmpQuaternion, tmpQuaternion, dampedWaveX);

            const newAngle = quat.getAxisAngle(axis, tmpQuaternion);
            geometry.transform.rotationAxis = [axis[0], axis[1], axis[2]];
            geometry.transform.rotationAngle = (newAngle * 180) / Math.PI;

            if (this.animatingBoat) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }

    stopAnimatingBoat() {
        this.animatingBoat = false;
    }

    async animateTurbines(graphics: __esri.Graphic[]) {
        this.animatingTurbines = true;
        const startTime = Date.now() / 1000;

        const animateBlades = (geometry: __esri.Mesh, rpm: number) => {
            const dt = Date.now() / 1000 - startTime;
            const bladeRotation = (dt / 60) * rpm;

            geometry.transform.rotationAngle = bladeRotation;
            geometry.transform.rotationAxis = [0, 1, 0];
            if (this.animatingTurbines) {
                requestAnimationFrame(() => animateBlades(geometry, rpm));
            }
        }

        graphics.forEach((graphic: __esri.Graphic) => {
            animateBlades(graphic.geometry as __esri.Mesh, getRPM(graphic.attributes.Speed))
        })
    }

    stopAnimatingTurbines() {
        this.animatingTurbines = false;
    }

    setupSubmarineAnimation(line: __esri.Polyline, graphic: __esri.Graphic) {
        const coordinates = line.paths.length ? line.paths[0] : [];
        const spatialReference = line.spatialReference;
        this.submarine = graphic.geometry as __esri.Mesh;

        // Compute distances between given coordinates
        let prevPoint: __esri.Point | null = null;
        coordinates.forEach((coords, index) => {
            const point = new Point({
                spatialReference,
                x: coords[0],
                y: coords[1],
                z: coords[2]
            });
            this.points.push(point);
            if (index === 0) {
                this.xs.push(0);
            } else {
                const distance = geometryEngine.distance(prevPoint as Point, point, undefined as any);
                this.dxs.push(distance);
                this.xs.push(distance + this.xs[index - 1]);
            }
            prevPoint = point;
        });
        this.submarine.transform ??= new MeshTransform();
        const angle = getAngle(this.points[0], this.points[1]);
        console.log(angle);
        this.submarine.transform.rotationAngle = angle;
        this.submarine.transform.rotationAxis = [0, 0, 1];

    }

    getTranslationAndRotationAtTime(time: number) {
        const xs = this.xs;
        const length = xs.length;
        const distance = ((time / 1000) * this.speed) % xs[length - 1];

        let i = 0;
        while (i < length - 1 && distance > xs[i + 1]) {
            i++;
        }

        // interpolate point
        const dx = this.dxs[i];
        const p1 = this.points[i];
        const p2 = this.points[i + 1];

        const point = interpolate(p1, p2, distance - xs[i], dx);
        const origin = this.points[0];
        return {
            translation: [point.x - origin.x, point.y - origin.y, point.z - origin.z],
            rotation: getAngle(p1, p2)
        }
    }

    async animateSubmarine() {
        this.animatingSubmarine = true;
        let startTime: number = null;

        const animate = (elapsedTime: number) => {
            if (!startTime) {
                startTime = elapsedTime;
            }
            const time = elapsedTime - startTime;
            if (this.animatingSubmarine) {
                const { translation, rotation } = this.getTranslationAndRotationAtTime(time);
                this.submarine.transform.translation = translation;
                this.submarine.transform.rotationAngle = rotation;
                this.submarine.transform.rotationAxis = [0, 0, 1];
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }

    stopAnimatingSubmarine() {
        this.animatingSubmarine = false;
    }

    animatePinpoint(graphic: __esri.Graphic) {
        let scale = 1;
        let startTime: number = null;
        this.animatingPinpoint = true;
        const animate = (elapsedTime: number) => {
            if (!startTime) {
                startTime = elapsedTime;
            }
            const timeDif = (elapsedTime - startTime) / 1000;
            scale = 1 + Math.abs(Math.sin(timeDif * 2));
            const geometry = graphic.geometry as __esri.Mesh;
            geometry.transform ??= new MeshTransform();
            geometry.transform.scale = [scale, scale, scale];
            if (this.animatingPinpoint) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }

    stopAnimatingPinpoint() {
        this.animatingPinpoint = false;
    }
}


const getRPM = (windSpeed: number) => {
    const tipSpeedRatio = 6.0;
    return (60 * windSpeed * tipSpeedRatio) / (Math.PI * 2 * bladeLength / 100);
};
