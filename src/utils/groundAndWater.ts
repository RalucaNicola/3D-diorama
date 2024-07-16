import Graphic from "@arcgis/core/Graphic";
import { Polyline } from "@arcgis/core/geometry";
import Mesh from '@arcgis/core/geometry/Mesh';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import MeshComponent from "@arcgis/core/geometry/support/MeshComponent";
import MeshMaterialMetallicRoughness from "@arcgis/core/geometry/support/MeshMaterialMetallicRoughness";
import { FillSymbol3DLayer, MeshSymbol3D, PolygonSymbol3D, WaterSymbol3DLayer } from "@arcgis/core/symbols";

type EnvelopeType = "ground" | "water";

interface EnvelopeFromGroundParameters {
    polygon: __esri.Polygon,
    step: number,
    extrusion: number,
    startColor: Array<number>,
    endColor?: Array<number>,
    type: EnvelopeType
}

const getSurfaceGraphic = (polygon: __esri.Polygon, type: EnvelopeType, height: number, color: Array<number>) => {
    polygon.rings.forEach(ring => {
        ring.forEach(coords => coords[2] = height);
    });
    polygon.hasZ = true;
    return new Graphic({
        geometry: polygon,
        symbol: type === 'water' ? new PolygonSymbol3D({
            symbolLayers: [new WaterSymbol3DLayer({
                waveDirection: 180,
                color,
                waveStrength: "moderate",
                waterbodySize: "large"
            })]
        }) : new PolygonSymbol3D({
            symbolLayers: [new FillSymbol3DLayer({
                material: {
                    color
                }
            })]
        })
    })
}

export const getPolygonEnvelopeFromGround = async ({
    polygon, step, extrusion, startColor, endColor, type }: EnvelopeFromGroundParameters,
    elevationLayer: __esri.ElevationLayer) => {

    const border = new Polyline({
        paths: polygon.rings,
        spatialReference: polygon.spatialReference,
        hasZ: true
    });
    const densifiedLine = geometryEngine.densify(border, step) as Polyline;
    try {
        const { geometry: zEnhancedLine } = await elevationLayer.queryElevation(densifiedLine);
        const borderVertices = (zEnhancedLine as Polyline).paths.flat();
        const color = borderVertices
            .map((_) => {
                return startColor;
            })
            .flat();
        if (!endColor) {
            endColor = startColor;
        }
        const [r, g, b, a] = endColor;
        const flatBorderVertices = borderVertices.flat();

        const borderLength = flatBorderVertices.length / 3;
        const indices = borderVertices.map((vertex, index) => index);
        const wallTriangles = [];
        for (let i = 0; i < indices.length; i++) {
            const vIdx1 = indices[i];
            const vIdx2 = indices[(i + 1) % indices.length];

            const vIdx3 = borderLength + i;
            const vIdx4 = borderLength + ((i + 1) % indices.length);

            // Add new wall vertex
            const x = flatBorderVertices[vIdx1 * 3];
            const y = flatBorderVertices[vIdx1 * 3 + 1];
            const z = extrusion;
            flatBorderVertices.push(x, y, z);
            color.push(r, g, b, a);

            wallTriangles.push(vIdx2, vIdx3, vIdx1, vIdx4, vIdx3, vIdx2);
        }

        const wall = new MeshComponent({
            faces: wallTriangles,
            material: new MeshMaterialMetallicRoughness({
                metallic: 0.5,
                roughness: 0.8,
                doubleSided: true
            })
        });

        const mesh = new Mesh({
            components: [wall],
            vertexAttributes: {
                position: flatBorderVertices,
                color
            },
            spatialReference: polygon.spatialReference
        });

        const wallsGraphic = new Graphic({
            geometry: mesh,
            symbol: new MeshSymbol3D({
                symbolLayers: [
                    new FillSymbol3DLayer({})
                ]
            })
        });

        const surfaceColor = [r, g, b, a / 255];
        const surfaceGraphic = getSurfaceGraphic(polygon, type, extrusion, surfaceColor);

        return [surfaceGraphic, wallsGraphic];
    } catch (error) {
        console.log(error);
    }

}
