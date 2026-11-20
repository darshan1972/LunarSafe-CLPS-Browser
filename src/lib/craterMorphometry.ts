/**
 * LunarSafe Mission Software — Crater Ellipse Fitting & Depth-to-Diameter (d/D) Engine
 * Team Rocket · AEROX Club · Parul University · Project Head: DARSHAN BAGUL (PATIL)
 *
 * Implements 2nd-order image moment tensor ellipse fitting and peer-reviewed
 * lunar crater depth-to-diameter morphological scaling:
 * - Pike, R.J. (1977, Impact and Explosion Cratering): Size-morphology relations of lunar craters
 * - Melosh, H.J. (1989, Impact Cratering: A Geologic Process): Simple vs complex crater transitions
 * - Head, J.W. (1976, LPSC): Transition from simple to complex crater morphology on the Moon
 */

import { BoundingBox, CraterDetection } from '../types';
import { ConsolidatedCrater } from './craterConsolidation';

export type CraterClass = 'MICRO_CRATER' | 'SIMPLE_BOWL' | 'TRANSITIONAL' | 'COMPLEX_BASIN';

export type EnrichedCraterDetection = CraterDetection & { ellipse: CraterEllipseProfile };

export interface CraterEllipseProfile {
  id: string;
  centerPixels: [number, number];       // [x, y] center in pixels
  centerMeters: [number, number];       // [x, y] in ground meters
  semiMajorPixels: number;              // Semi-major axis (pixels)
  semiMinorPixels: number;              // Semi-minor axis (pixels)
  semiMajorM: number;                   // Physical semi-major axis (meters)
  semiMinorM: number;                   // Physical semi-minor axis (meters)
  diameterM: number;                    // Effective physical diameter D = 2 * semiMajorM (meters)
  orientationDeg: number;               // Tilt angle in degrees (-90° to +90°)
  eccentricity: number;                 // e = sqrt(1 - (b/a)^2), 0 = circular, 1 = line
  circularity: number;                  // b / a (1.0 = perfectly circular)
  depthPikeM: number;                   // Empirical depth d computed from Pike (1977)
  depthToDiameterRatio: number;         // d / D ratio (dimensionless, ~0.18-0.22 for fresh simple craters)
  rimSlopeDeg: number;                  // Average interior wall slope estimate
  craterClass: CraterClass;
  isHazard: boolean;
  classificationDetails: string;
}

export class CraterMorphometryService {
  /**
   * Fits an equivalent geometric ellipse to a crater bounding box and constituent patches
   * using 2nd-order spatial central moments.
   *
   * @param box Bounding box [x1, y1, x2, y2]
   * @param patchCenters Optional array of constituent patch center coordinates [[x,y], ...]
   * @param pixelScaleMeters Ground resolution in meters per pixel
   * @param id Identifier string
   */
  public static fitEllipseToCrater(
    box: BoundingBox,
    patchCenters: [number, number][] | undefined,
    pixelScaleMeters: number,
    id: string = 'crater-ellipse'
  ): CraterEllipseProfile {
    const widthPx = Math.max(1, box.x2 - box.x1);
    const heightPx = Math.max(1, box.y2 - box.y1);
    const cx = (box.x1 + box.x2) / 2.0;
    const cy = (box.y1 + box.y2) / 2.0;

    let semiMajorPx = Math.max(widthPx, heightPx) / 2.0;
    let semiMinorPx = Math.min(widthPx, heightPx) / 2.0;
    let orientationDeg = 0.0;

    // If multiple constituent patches are available, compute the spatial moment tensor
    if (patchCenters && patchCenters.length >= 3) {
      let sumX = 0;
      let sumY = 0;
      const n = patchCenters.length;

      for (const [px, py] of patchCenters) {
        sumX += px;
        sumY += py;
      }
      const meanX = sumX / n;
      const meanY = sumY / n;

      let mu20 = 0;
      let mu02 = 0;
      let mu11 = 0;

      for (const [px, py] of patchCenters) {
        const dx = px - meanX;
        const dy = py - meanY;
        mu20 += dx * dx;
        mu02 += dy * dy;
        mu11 += dx * dy;
      }

      mu20 /= n;
      mu02 /= n;
      mu11 /= n;

      // Eigenvalues of the 2D covariance matrix:
      const common = Math.sqrt(Math.pow(mu20 - mu02, 2) + 4 * Math.pow(mu11, 2));
      const lambda1 = (mu20 + mu02 + common) / 2.0;
      const lambda2 = Math.max(0.01, (mu20 + mu02 - common) / 2.0);

      // Semi-axes lengths are proportional to 2 * sqrt(eigenvalues)
      const fittedA = 2.0 * Math.sqrt(Math.max(0.25, lambda1));
      const fittedB = 2.0 * Math.sqrt(Math.max(0.25, lambda2));

      // Sanity clamp to bounding box span
      semiMajorPx = Math.min(Math.max(widthPx, heightPx) / 1.5, Math.max(2.0, fittedA));
      semiMinorPx = Math.min(semiMajorPx, Math.max(1.5, fittedB));

      // Orientation angle theta = 0.5 * atan2(2 * mu11, mu20 - mu02)
      orientationDeg = Number(((0.5 * Math.atan2(2 * mu11, mu20 - mu02) * 180) / Math.PI).toFixed(1));
    } else {
      // Default geometric ellipse from bounding box
      orientationDeg = widthPx > heightPx ? 0.0 : 90.0;
    }

    const semiMajorM = Number((semiMajorPx * pixelScaleMeters).toFixed(2));
    const semiMinorM = Number((semiMinorPx * pixelScaleMeters).toFixed(2));
    const diameterM = Number((2.0 * semiMajorM).toFixed(2));

    const circularity = Number(Math.max(0.1, Math.min(1.0, semiMinorPx / semiMajorPx)).toFixed(3));
    const eccentricity = Number(Math.sqrt(Math.max(0, 1.0 - Math.pow(circularity, 2))).toFixed(3));

    // -------------------------------------------------------------------------
    // PIKE (1977) EMPIRICAL DEPTH-TO-DIAMETER SCALING
    // -------------------------------------------------------------------------
    // For lunar simple craters (D < 15 km):
    // d = 0.196 * D^1.010 (meters)
    // For complex craters (D >= 15 km):
    // d = 1.044 * D^0.301 (kilometers)
    let depthPikeM: number;
    let craterClass: CraterClass;

    if (diameterM < 10.0) {
      craterClass = 'MICRO_CRATER';
      depthPikeM = 0.20 * diameterM; // Parabolic micro-pit
    } else if (diameterM < 15000.0) {
      craterClass = 'SIMPLE_BOWL';
      depthPikeM = 0.196 * Math.pow(diameterM, 1.010);
    } else {
      craterClass = 'TRANSITIONAL';
      // Convert to km, evaluate complex scaling, convert back to meters
      const dKm = diameterM / 1000.0;
      depthPikeM = (1.044 * Math.pow(dKm, 0.301)) * 1000.0;
    }

    depthPikeM = Number(depthPikeM.toFixed(2));
    const dToDRatio = diameterM > 0 ? Number((depthPikeM / diameterM).toFixed(3)) : 0.20;

    // Approximate parabolic interior wall slope:
    // tan(theta) = 4 * d / D  =>  theta = atan(4 * (d/D))
    const rimSlopeDeg = Number(((Math.atan(4.0 * dToDRatio) * 180.0) / Math.PI).toFixed(1));

    // Flight Safety Hazard Assessment:
    // A crater is an active landing hazard if depth >= 1.0m (tip-over) or wall slope > 10.0°
    const isHazard = depthPikeM >= 1.0 || rimSlopeDeg > 10.0 || diameterM >= 3.0;

    let details = `${craterClass} | D=${diameterM.toFixed(1)}m, d=${depthPikeM.toFixed(2)}m (d/D = ${dToDRatio}) | Wall Slope: ${rimSlopeDeg}°`;
    if (isHazard) {
      details += ` [HAZARD: Exceeds ${depthPikeM >= 1.0 ? '1.0m depth' : '10° slope'} limit]`;
    }

    return {
      id,
      centerPixels: [Number(cx.toFixed(1)), Number(cy.toFixed(1))],
      centerMeters: [
        Number((cx * pixelScaleMeters).toFixed(1)),
        Number((cy * pixelScaleMeters).toFixed(1)),
      ],
      semiMajorPixels: Number(semiMajorPx.toFixed(1)),
      semiMinorPixels: Number(semiMinorPx.toFixed(1)),
      semiMajorM,
      semiMinorM,
      diameterM,
      orientationDeg,
      eccentricity,
      circularity,
      depthPikeM,
      depthToDiameterRatio: dToDRatio,
      rimSlopeDeg,
      craterClass,
      isHazard,
      classificationDetails: details,
    };
  }

  /**
   * Enriches an array of ConsolidatedCrater objects with exact ellipse profiles.
   */
  public static enrichConsolidatedCraters(
    craters: ConsolidatedCrater[],
    pixelScaleMeters: number
  ): Array<ConsolidatedCrater & { ellipse: CraterEllipseProfile }> {
    return craters.map(c => {
      const ellipse = this.fitEllipseToCrater(
        c.box,
        undefined,
        pixelScaleMeters,
        c.id
      );
      return {
        ...c,
        ellipse,
      };
    });
  }

  /**
   * Enriches raw CraterDetection patches with ellipse and depth-to-diameter profiles.
   */
  public static enrichDetections(
    detections: CraterDetection[],
    pixelScaleMeters: number
  ): Array<CraterDetection & { ellipse: CraterEllipseProfile }> {
    return detections.map(d => {
      const ellipse = this.fitEllipseToCrater(
        d.box,
        undefined,
        pixelScaleMeters,
        d.id
      );
      return {
        ...d,
        ellipse,
      };
    });
  }
}
