import Graphic from "@arcgis/core/Graphic";
import Mesh from "@arcgis/core/geometry/Mesh";
import MeshMaterial from "@arcgis/core/geometry/support/MeshMaterial";
import { FillSymbol3DLayer, MeshSymbol3D, ObjectSymbol3DLayer, PointSymbol3D } from "@arcgis/core/symbols";

const pillarHeight = 80;
export const bladeLength = 55;
const underwaterLength = 10;
export const getGraphicFromModel = async (url: string, geometry: __esri.Point, translate: number[] = [0, 0, 0], scale: number = 1, rotate: number = 0) => {
    const mesh = await Mesh.createFromGLTF(geometry, url, { vertexSpace: 'georeferenced' });
    const offset = translate.map((t) => t * scale);
    mesh.scale(scale);
    mesh.offset(offset[0], offset[1], offset[2]);
    mesh.rotate(0, 0, rotate);


    const graphic = new Graphic({
        geometry: mesh,
        symbol: new MeshSymbol3D({
            symbolLayers: [new FillSymbol3DLayer()]
        }),
    });
    return graphic;
};

const pillarGraphicSymbol = new PointSymbol3D({
    symbolLayers: [new ObjectSymbol3DLayer({
        resource: { href: "./assets/models/wind-turbine/pillar.glb" },
        height: pillarHeight,
    })]
});

export const createTurbines = async (turbines: __esri.Graphic[], waterHeight: number) => {

    const zPoints = turbines.map(turbine => {
        const point = turbine.geometry as __esri.Point;
        point.hasZ = true;
        point.z = waterHeight - underwaterLength;
        return point;
    });

    const pillarGraphics = zPoints.map((point) => {
        return new Graphic({
            symbol: pillarGraphicSymbol,
            geometry: point
        })
    }
    );
    const bladeGraphics = await Promise.all(
        zPoints.map((point) => {
            return getGraphicFromModel(
                "./assets/models/wind-turbine/blades.glb",
                point,
                [0, -4.2, pillarHeight - 4], 1
            )
        })
    );
    bladeGraphics.forEach((graphic, index) => {
        graphic.attributes = turbines[index].attributes;
    });

    return {
        bladeGraphics,
        pillarGraphics
    }
}

export const createTurbineAnnotation = (geometry: __esri.Point, waterHeight: number) => {
    const origin = geometry.clone() as __esri.Point;
    origin.hasZ = true;
    origin.z = waterHeight + (pillarHeight + bladeLength) / 2 - underwaterLength;
    const plane = Mesh.createPlane(origin, { size: { height: 135, width: 110 }, facing: "south", vertexSpace: "georeferenced" });
    plane.components[0].material = new MeshMaterial({
        colorTexture: { url: "./assets/measurements.png" },
    });

    const planeGraphic = new Graphic({
        geometry: plane,
        symbol: new MeshSymbol3D({
            symbolLayers: [new FillSymbol3DLayer({
                material: {
                    color: [255, 255, 255, 0.8]
                }
            })]
        })
    });
    return planeGraphic;
}