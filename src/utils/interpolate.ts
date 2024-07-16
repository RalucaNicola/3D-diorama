// Code by Arno Fiva: https://github.com/arnofiva/animations

import Camera from "@arcgis/core/Camera";
import { Point } from "@arcgis/core/geometry";

type LerpObject = Point | Camera;
type LerpValue = number | number[] | Date | LerpObject;

const delta = (a: number, b: number, modulo?: number): number => {
  let d = b - a;
  if (modulo) {
    if (d > modulo / 2) {
      d = -d + modulo;
    } else if (d < -modulo / 2) {
      d = d + modulo;
    }
  }
  return d;
}

const numberLerp = (a: number, b: number, t: number, total?: number, modulo?: number): number => {
  if (!total) {
    total = 1.0;
  } else if (total === 0) {
    throw new Error("Can not interpolate between two values where the distance is 0");
  }

  // Vector
  const d = delta(a as number, b as number, modulo);

  // Length
  const s = t / total;

  return (a as number) + d * s as any;
}

const objectLerp = <T extends LerpObject>(a: T, b: T, t: number, total?: number, modulo?: number): T => {
  if (a.declaredClass && a.declaredClass === b.declaredClass) {
    if (a.declaredClass === "esri.Camera") {
      const cameraA = a as Camera;
      const cameraB = b as Camera;
      return new Camera({
        heading: numberLerp(cameraA.heading, cameraB.heading, t, total, 360),
        position: objectLerp(cameraA.position, cameraB.position, t, total),
        tilt: numberLerp(cameraA.tilt, cameraB.tilt, t, total),
      }) as T;
    } else if (a.declaredClass === "esri.geometry.Point") {
      const pointA = a as Point;
      const pointB = b as Point;
      const spatialReference = pointA.spatialReference;
      return new Point({
        spatialReference,
        x: numberLerp(pointA.x, pointB.x, t, total, modulo),
        y: numberLerp(pointA.y, pointB.y, t, total, modulo),
        z: numberLerp(pointA.z, pointB.z, t, total, modulo),
      }) as T;
    }
  }
  throw new Error("Values a and b do not have compatible types for interpolation");
}

const interpolate = <T extends LerpValue>(a: T, b: T, t: number, total?: number, modulo?: number): T | undefined => {

  const typeofA = typeof a;

  if (typeof b === typeofA) {

    if (typeofA === "number") {
      return numberLerp(a as number, b as number, t, total, modulo) as T;
    } else if (typeofA === "object") {
      return objectLerp(a as LerpObject, b as LerpObject, t, total) as T;
    } else if (a === undefined) {
      return undefined;
    }
  }
  throw new Error("Values a and b do not have compatible types for interpolation");

}

export default interpolate;