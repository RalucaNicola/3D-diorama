import Camera from "@arcgis/core/Camera";
import { CameraProps } from "../types/types";
import { quat, vec3 } from "gl-matrix";
import MeshTransform from "@arcgis/core/geometry/support/MeshTransform";
import { bladeLength } from "./assets";

export default class AnimationManager {
    view: __esri.SceneView;
    animatingBoat: boolean = false;
    animatingTurbines: boolean = false;

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
        const factor = 0.0006;
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
            const waveZ = Math.sin(angle + phase) * 0.3 + 0.5;

            // Apply damping to gradually reduce wobbling over time
            const dampedWaveX = waveX * dampingFactor;
            const dampedWaveY = waveY * dampingFactor;
            const dampedWaveZ = waveZ * dampingFactor;

            // Update the quaternion rotation
            quat.identity(tmpQuaternion);
            quat.rotateY(tmpQuaternion, tmpQuaternion, dampedWaveY);
            quat.rotateX(tmpQuaternion, tmpQuaternion, dampedWaveX);

            const newAngle = quat.getAxisAngle(axis, tmpQuaternion);
            geometry.transform.rotationAxis = [axis[0], axis[1], axis[2]];
            geometry.transform.rotationAngle = (newAngle * 180) / Math.PI;

            geometry.transform.translation = [0, 0, dampedWaveZ - 1];
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
}


const getRPM = (windSpeed: number) => {
    const tipSpeedRatio = 6.0;
    return (60 * windSpeed * tipSpeedRatio) / (Math.PI * 2 * bladeLength / 100);
};