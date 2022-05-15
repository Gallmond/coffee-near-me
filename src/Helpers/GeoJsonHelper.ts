/**
 * A helper class for parsing GeoJSON data.
 */
class GJ {
  json;

  constructor(json: object) {
    this.json = json;
  }

  getFeatures() {
    return this.json["features"] ?? [];
  }

  /**
   * Return segments from all features
   */
  getAllSegments() {
    const collectedSegments = [];
    this.getFeatures().forEach((feature) => {
      if (feature.properties && feature.properties.segments) {
        collectedSegments.push(...(feature.properties.segments ?? []));
      }
    });
    return collectedSegments
  }

  // Return all steps from all segments
  getAllSteps(){
    const collectedSteps = [];
    this.getAllSegments().forEach(segment => {
      collectedSteps.push(...(segment.steps ?? []));
    });
    return collectedSteps;
  }

}

export default GJ;
