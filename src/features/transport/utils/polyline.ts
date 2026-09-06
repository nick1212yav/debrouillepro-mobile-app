// src/features/transport/utils/polyline.ts
import type { Coordinates } from "../types";

export class PolylineUtil {
  /**
   * Décoder une chaîne Polyline compressée en un tableau de coordonnées GPS (latitude, longitude)
   */
  static decode(encoded: string): Coordinates[] {
    const points: Coordinates[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        lat: lat / 1e5,
        lng: lng / 1e5,
      });
    }

    return points;
  }

  /**
   * Encoder un tableau de coordonnées GPS en une chaîne Polyline compacte
   */
  static encode(points: Coordinates[]): string {
    let plat = 0;
    let plng = 0;
    let encoded = "";

    const encodeValue = (value: number): string => {
      let val = value < 0 ? ~(value << 1) : value << 1;
      let out = "";
      while (val >= 0x20) {
        out += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
        val >>= 5;
      }
      out += String.fromCharCode(val + 63);
      return out;
    };

    points.forEach((p) => {
      const late5 = Math.round(p.lat * 1e5);
      const lnge5 = Math.round(p.lng * 1e5);

      encoded += encodeValue(late5 - plat);
      encoded += encodeValue(lnge5 - plng);

      plat = late5;
      plng = lnge5;
    });

    return encoded;
  }
}
