const distanceBetweenKM = (coord1, coord2) => {
  let [lat1, lng1] = coord1;
  let [lat2, lng2] = coord2;

  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lng1 = (lng1 * Math.PI) / 180;
  lng2 = (lng2 * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  // Haversine formula
  let dlng = lng2 - lng1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlng / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result
  return c * r;
};

exports.distanceBetweenKM = distanceBetweenKM;