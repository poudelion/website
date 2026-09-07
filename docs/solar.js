// Approximate solar position, NOAA fractional-year equations:
// https://www.gml.noaa.gov/grad/solcalc/solareqns.PDF
// Coordinates are Earth-fixed: turning the view must not move local daylight.
function solarPosition(date) {
  const year = date.getUTCFullYear();
  const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const day = Math.floor((date.getTime() - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const g = 2 * Math.PI / days * (day - 1 + (hour - 12) / 24);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2*g) - 0.040849 * Math.sin(2*g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2*g) + 0.000907 * Math.sin(2*g)
    - 0.002697 * Math.cos(3*g) + 0.00148 * Math.sin(3*g);
  const lon = (720 - hour * 60 - eq) / 4;
  return { lat: dec * 180 / Math.PI, lon: ((lon + 180) % 360 + 360) % 360 - 180 };
}
