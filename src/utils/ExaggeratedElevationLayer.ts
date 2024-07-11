import { subclass } from '@arcgis/core/core/accessorSupport/decorators';
import BaseElevationLayer from '@arcgis/core/layers/BaseElevationLayer';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';

@subclass('esri.layers.ExaggeratedElevationLayer')
class ExaggeratedElevationLayer extends BaseElevationLayer {
  exaggeration: number;
  elevation: ElevationLayer;

  constructor(exaggeration = 1) {
    super();
    this.exaggeration = exaggeration;
  }

  override load() {
    this.elevation = new ElevationLayer({
      url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/TopoBathy3D/ImageServer'
    });

    return this.addResolvingPromise(
      this.elevation.load().then(() => {
        this.tileInfo = this.elevation.tileInfo;
        this.spatialReference = this.elevation.spatialReference;
        this.fullExtent = this.elevation.fullExtent;
      })
    );
  }

  fetchTile(level: number, row: number, col: number, options: __esri.ElevationLayerFetchTileOptions) {
    return this.elevation.fetchTile(level, row, col, options).then(
      function (data: { values: number[] }) {
        const exaggeration = this.exaggeration;
        for (let i = 0; i < data.values.length; i++) {
          data.values[i] = data.values[i] * exaggeration;
        }

        return data;
      }.bind(this)
    );
  }
}

export default ExaggeratedElevationLayer;
