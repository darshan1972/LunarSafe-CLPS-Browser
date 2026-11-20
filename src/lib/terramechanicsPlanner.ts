/**
 * LunarSafe Mission Software — Terramechanics-Aware Energy Traverse Planner
 * Team Rocket · AEROX Club · Parul University · Project Head: DARSHAN BAGUL (PATIL)
 *
 * Implements classical Bekker-Wong soil terramechanics and energy-optimal A* egress pathfinding
 * across calibrated lunar digital elevation models and classified hazard grids.
 *
 * Grounded in peer-reviewed terramechanics literature:
 * - Bekker, M.G. (1969): Introduction to Terrain-Vehicle Systems
 * - Wong, J.Y. (2008): Theory of Ground Vehicles (4th Edition)
 * - Carrier, W.D. et al. (1991, Lunar Sourcebook): Geotechnical Properties of Lunar Soil
 * - Heiken, G.H. et al. (1991): Regolith bearing capacity and rolling resistance
 */

import { GridCell, SafeLandingZone } from '../types';

export interface RoverPhysicalModel {
  massKg: number;                     // Vehicle mass with scientific payload (default: 300 kg)
  wheelCount: number;                 // 4 or 6 wheels
  wheelRadiusM: number;               // 0.25 m
  wheelWidthM: number;                // 0.15 m
  drivetrainEfficiency: number;       // 0.85 (85% motor/gearbox efficiency)
  solarPanelAreaM2: number;           // 0.8 m²
  solarPanelEfficiency: number;       // 0.28 (28% multi-junction GaAs cells)
  nominalSpeedMPerS: number;          // 0.10 m/s (10 cm/s nominal traverse speed)
  maxSafeSlopeDeg: number;            // 15.0° (tip-over & wheel spin safety ceiling)
}

export interface TraverseWaypoint {
  stepIndex: number;
  gridX: number;
  gridY: number;
  xMeters: number;
  yMeters: number;
  slopeDeg: number;
  segmentDistanceM: number;
  tractiveForceN: number;
  energyJoules: number;
  solarRechargeJoules: number;
  netEnergyJoules: number;
  batterySocPct: number;              // State of Charge %
  cumulativeDistanceM: number;
  cumulativeEnergyWh: number;
  cumulativeTimeSec: number;
}

export interface TerramechanicsPlanResult {
  waypoints: TraverseWaypoint[];
  pathCoordinates: [number, number][]; // [x, y] in ground meters
  totalDistanceM: number;
  totalEnergyJoules: number;
  totalEnergyWh: number;
  totalSolarGeneratedWh: number;
  netEnergyWh: number;
  peakTractiveForceN: number;
  peakPowerWatts: number;
  averageSlopeDeg: number;
  maxSlopeDeg: number;
  traverseDurationMin: number;
  isSafeTraverse: boolean;
  scientificSummary: string;
}

export const DEFAULT_ROVER_SPECS: RoverPhysicalModel = {
  massKg: 300.0,
  wheelCount: 4,
  wheelRadiusM: 0.25,
  wheelWidthM: 0.15,
  drivetrainEfficiency: 0.85,
  solarPanelAreaM2: 0.8,
  solarPanelEfficiency: 0.28,
  nominalSpeedMPerS: 0.10,
  maxSafeSlopeDeg: 15.0,
};

export class TerramechanicsPlannerService {
  public static readonly LUNAR_GRAVITY = 1.62; // m/s²
  public static readonly LUNAR_SOLAR_CONSTANT = 1361.0; // W/m²
  public static readonly REGOLITH_ROLLING_COEFF = 0.08; // Dimensionless rolling resistance on lunar regolith

  /**
   * Computes Bekker terramechanic tractive resistance force (Newtons)
   * for a rover traversing a regolith slope of inclination theta (degrees).
   *
   * F_tractive = F_gravity_slope + F_rolling_resistance + R_sinkage
   */
  public static computeTractiveForce(
    slopeDeg: number,
    rover: RoverPhysicalModel = DEFAULT_ROVER_SPECS
  ): {
    tractiveForceN: number;
    gradeForceN: number;
    rollingForceN: number;
    sinkageForceN: number;
    isTraversable: boolean;
  } {
    if (Math.abs(slopeDeg) > rover.maxSafeSlopeDeg) {
      return {
        tractiveForceN: Infinity,
        gradeForceN: Infinity,
        rollingForceN: Infinity,
        sinkageForceN: Infinity,
        isTraversable: false,
      };
    }

    const slopeRad = (slopeDeg * Math.PI) / 180.0;
    const normalWeight = rover.massKg * this.LUNAR_GRAVITY * Math.cos(slopeRad);

    // 1. Gravitational Grade Resistance (positive for uphill climbing)
    const gradeForceN = rover.massKg * this.LUNAR_GRAVITY * Math.sin(slopeRad);

    // 2. Regolith Rolling Resistance
    const rollingForceN = this.REGOLITH_ROLLING_COEFF * normalWeight;

    // 3. Bekker Soil Sinkage Compaction Resistance
    // Normal load per wheel
    const loadPerWheel = normalWeight / rover.wheelCount;
    // Estimated sinkage z = 0.015m * (load / 120N) on loose lunar polar dust
    const sinkageM = Math.min(0.04, 0.015 * (loadPerWheel / 121.5));
    // Compaction resistance: R = b * z * q_ult / 2
    const sinkageForceN = rover.wheelCount * (rover.wheelWidthM * sinkageM * 180000.0 * 0.02);

    const totalTractiveForce = gradeForceN + rollingForceN + sinkageForceN;

    return {
      tractiveForceN: Number(totalTractiveForce.toFixed(2)),
      gradeForceN: Number(gradeForceN.toFixed(2)),
      rollingForceN: Number(rollingForceN.toFixed(2)),
      sinkageForceN: Number(sinkageForceN.toFixed(2)),
      isTraversable: true,
    };
  }

  /**
   * Executes energy-optimal A* pathfinding considering terrain slope,
   * wheel sinkage, and solar photovoltaic recharge.
   */
  public static planTraverse(
    gridCells: GridCell[][],
    gridCols: number,
    gridRows: number,
    actualCellMeters: number,
    startZone: SafeLandingZone,
    targetZone?: SafeLandingZone,
    sunElevationDeg: number = 5.0,
    rover: RoverPhysicalModel = DEFAULT_ROVER_SPECS
  ): TerramechanicsPlanResult | null {
    if (!gridCells || gridCols <= 0 || gridRows <= 0) return null;

    const startGx = Math.max(0, Math.min(gridCols - 1, Math.round(startZone.centerGrid[0])));
    const startGy = Math.max(0, Math.min(gridRows - 1, Math.round(startZone.centerGrid[1])));

    let targetGx = startGx;
    let targetGy = startGy;

    if (targetZone) {
      targetGx = Math.max(0, Math.min(gridCols - 1, Math.round(targetZone.centerGrid[0])));
      targetGy = Math.max(0, Math.min(gridRows - 1, Math.round(targetZone.centerGrid[1])));
    } else {
      // Find farthest safe boundary cell
      let maxDist = 0;
      for (const [gx, gy] of startZone.cells) {
        const d = Math.hypot(gx - startGx, gy - startGy);
        if (d > maxDist) {
          maxDist = d;
          targetGx = gx;
          targetGy = gy;
        }
      }
    }

    if (startGx === targetGx && startGy === targetGy) {
      return null;
    }

    interface AStarNode {
      gx: number;
      gy: number;
      gEnergy: number; // Cumulative Joules of energy
      hEnergy: number;
      fEnergy: number;
      distanceM: number;
      parent?: AStarNode;
    }

    const openList: AStarNode[] = [];
    const closedSet = new Set<string>();

    const hInitial = Math.hypot((targetGx - startGx) * actualCellMeters, (targetGy - startGy) * actualCellMeters) * 80.0;
    openList.push({
      gx: startGx,
      gy: startGy,
      gEnergy: 0,
      hEnergy: hInitial,
      fEnergy: hInitial,
      distanceM: 0,
    });

    const neighbors = [
      [0, -1, 1.0], [1, 0, 1.0], [0, 1, 1.0], [-1, 0, 1.0],
      [1, -1, 1.414], [1, 1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
    ];

    let goalNode: AStarNode | null = null;
    let iterations = 0;
    const maxIterations = 20000;

    while (openList.length > 0 && iterations++ < maxIterations) {
      openList.sort((a, b) => a.fEnergy - b.fEnergy);
      const current = openList.shift()!;
      const key = `${current.gx},${current.gy}`;

      if (current.gx === targetGx && current.gy === targetGy) {
        goalNode = current;
        break;
      }

      closedSet.add(key);

      for (const [dx, dy, distFactor] of neighbors) {
        const nx = current.gx + dx;
        const ny = current.gy + dy;

        if (nx < 0 || nx >= gridCols || ny < 0 || ny >= gridRows) continue;
        if (closedSet.has(`${nx},${ny}`)) continue;

        const targetCell = gridCells[ny][nx];
        const stepDistM = actualCellMeters * distFactor;

        // Terramechanic tractive check
        const { tractiveForceN, isTraversable } = this.computeTractiveForce(targetCell.meanSlopeDeg, rover);
        if (!isTraversable || (!targetCell.isSafe && targetCell.meanSlopeDeg > rover.maxSafeSlopeDeg)) {
          continue; // Impassable terrain / tip-over hazard
        }

        // Energy consumed on step (Joules): W = (F * dist) / efficiency
        const mechanicalWorkJ = Math.max(0, tractiveForceN * stepDistM) / rover.drivetrainEfficiency;
        const hazardPenaltyJ = targetCell.isSafe ? 0 : 25000.0; // Avoid obstacle zones unless unavoidable

        // Solar recharge during segment traversal time (sec = dist / speed)
        const stepTimeSec = stepDistM / rover.nominalSpeedMPerS;
        const sunRad = (sunElevationDeg * Math.PI) / 180.0;
        const solarPowerW = rover.solarPanelAreaM2 * this.LUNAR_SOLAR_CONSTANT * rover.solarPanelEfficiency * Math.max(0, Math.sin(sunRad));
        const solarHarvestJ = solarPowerW * stepTimeSec;

        const netStepEnergyJ = Math.max(10.0, mechanicalWorkJ - solarHarvestJ * 0.5 + hazardPenaltyJ);

        const newGEnergy = current.gEnergy + netStepEnergyJ;
        const euclideanDistToGoalM = Math.hypot((targetGx - nx) * actualCellMeters, (targetGy - ny) * actualCellMeters);
        const newHEnergy = euclideanDistToGoalM * 75.0;
        const newFEnergy = newGEnergy + newHEnergy;

        const existing = openList.find(n => n.gx === nx && n.gy === ny);
        if (existing) {
          if (newGEnergy < existing.gEnergy) {
            existing.gEnergy = newGEnergy;
            existing.fEnergy = newFEnergy;
            existing.distanceM = current.distanceM + stepDistM;
            existing.parent = current;
          }
        } else {
          openList.push({
            gx: nx,
            gy: ny,
            gEnergy: newGEnergy,
            hEnergy: newHEnergy,
            fEnergy: newFEnergy,
            distanceM: current.distanceM + stepDistM,
            parent: current,
          });
        }
      }
    }

    if (!goalNode) return null;

    // Reconstruct Path Backwards
    const reversedNodes: AStarNode[] = [];
    let curr: AStarNode | undefined = goalNode;
    while (curr) {
      reversedNodes.push(curr);
      curr = curr.parent;
    }
    reversedNodes.reverse();

    // Compile Telemetry Waypoints
    const waypoints: TraverseWaypoint[] = [];
    const pathCoordinates: [number, number][] = [];
    let cumulativeDistM = 0;
    let cumulativeEnergyJ = 0;
    let cumulativeSolarJ = 0;
    let peakForceN = 0;
    let peakPowerW = 0;
    let slopeSum = 0;
    let maxSlope = 0;

    const INITIAL_BATTERY_WH = 600.0; // 600 Wh rover battery pack (e.g. VIPER spec)

    for (let i = 0; i < reversedNodes.length; i++) {
      const node = reversedNodes[i];
      const cell = gridCells[node.gy][node.gx];
      const xM = Number(((node.gx + 0.5) * actualCellMeters).toFixed(1));
      const yM = Number(((node.gy + 0.5) * actualCellMeters).toFixed(1));
      pathCoordinates.push([xM, yM]);

      let segDistM = 0;
      if (i > 0) {
        const prev = reversedNodes[i - 1];
        segDistM = Math.hypot((node.gx - prev.gx) * actualCellMeters, (node.gy - prev.gy) * actualCellMeters);
      }
      cumulativeDistM += segDistM;

      const { tractiveForceN } = this.computeTractiveForce(cell.meanSlopeDeg, rover);
      if (tractiveForceN > peakForceN && tractiveForceN !== Infinity) peakForceN = tractiveForceN;

      const segWorkJ = (Math.max(0, tractiveForceN * segDistM) / rover.drivetrainEfficiency);
      const segTimeSec = segDistM / rover.nominalSpeedMPerS;
      const powerWatts = segTimeSec > 0 ? (segWorkJ / segTimeSec) : 0;
      if (powerWatts > peakPowerW) peakPowerW = powerWatts;

      const sunRad = (sunElevationDeg * Math.PI) / 180.0;
      const solarPowerW = rover.solarPanelAreaM2 * this.LUNAR_SOLAR_CONSTANT * rover.solarPanelEfficiency * Math.max(0, Math.sin(sunRad));
      const segSolarJ = solarPowerW * segTimeSec;

      cumulativeEnergyJ += segWorkJ;
      cumulativeSolarJ += segSolarJ;
      slopeSum += cell.meanSlopeDeg;
      if (cell.meanSlopeDeg > maxSlope) maxSlope = cell.meanSlopeDeg;

      const cumWh = cumulativeEnergyJ / 3600.0;
      const batterySoc = Math.max(0, Math.min(100.0, ((INITIAL_BATTERY_WH - cumWh) / INITIAL_BATTERY_WH) * 100.0));

      waypoints.push({
        stepIndex: i + 1,
        gridX: node.gx,
        gridY: node.gy,
        xMeters: xM,
        yMeters: yM,
        slopeDeg: Number(cell.meanSlopeDeg.toFixed(2)),
        segmentDistanceM: Number(segDistM.toFixed(1)),
        tractiveForceN: Number(tractiveForceN.toFixed(1)),
        energyJoules: Number(segWorkJ.toFixed(1)),
        solarRechargeJoules: Number(segSolarJ.toFixed(1)),
        netEnergyJoules: Number((segWorkJ - segSolarJ).toFixed(1)),
        batterySocPct: Number(batterySoc.toFixed(1)),
        cumulativeDistanceM: Number(cumulativeDistM.toFixed(1)),
        cumulativeEnergyWh: Number(cumWh.toFixed(2)),
        cumulativeTimeSec: Number((cumulativeDistM / rover.nominalSpeedMPerS).toFixed(0)),
      });
    }

    const totalEnergyWh = Number((cumulativeEnergyJ / 3600.0).toFixed(2));
    const totalSolarWh = Number((cumulativeSolarJ / 3600.0).toFixed(2));
    const netEnergyWh = Number((totalEnergyWh - totalSolarWh).toFixed(2));
    const durationMin = Number(((cumulativeDistM / rover.nominalSpeedMPerS) / 60.0).toFixed(1));
    const avgSlope = Number((slopeSum / reversedNodes.length).toFixed(2));

    const isSafe = maxSlope <= rover.maxSafeSlopeDeg;

    return {
      waypoints,
      pathCoordinates,
      totalDistanceM: Number(cumulativeDistM.toFixed(1)),
      totalEnergyJoules: Number(cumulativeEnergyJ.toFixed(0)),
      totalEnergyWh,
      totalSolarGeneratedWh: totalSolarWh,
      netEnergyWh,
      peakTractiveForceN: Number(peakForceN.toFixed(1)),
      peakPowerWatts: Number(peakPowerW.toFixed(1)),
      averageSlopeDeg: avgSlope,
      maxSlopeDeg: Number(maxSlope.toFixed(2)),
      traverseDurationMin: durationMin,
      isSafeTraverse: isSafe,
      scientificSummary: `A* Bekker terramechanic traverse: ${cumulativeDistM.toFixed(0)}m length in ${durationMin} min | Net Energy: ${netEnergyWh} Wh (Drain: ${totalEnergyWh} Wh, Solar: +${totalSolarWh} Wh) | Peak Power: ${peakPowerW.toFixed(1)}W, Max Slope: ${maxSlope.toFixed(1)}°`,
    };
  }

  /**
   * Evaluates an existing pixel waypoint path against terrain slopes and Bekker mechanics.
   */
  public static evaluateTraverse(
    waypoints: [number, number][],
    slopeMap: Float32Array | number[] | undefined,
    width: number,
    pixelScaleMeters: number,
    rover: RoverPhysicalModel = DEFAULT_ROVER_SPECS,
    sunElevationDeg: number = 5.0
  ): TerramechanicsPlanResult | null {
    if (!waypoints || waypoints.length < 2) return null;

    let cumulativeDistM = 0;
    let cumulativeEnergyJ = 0;
    let cumulativeSolarJ = 0;
    let peakForceN = 0;
    let peakPowerW = 0;
    let slopeSum = 0;
    let maxSlope = 0;
    const pathCoordinates: [number, number][] = [];
    const traverseWaypoints: TraverseWaypoint[] = [];
    const INITIAL_BATTERY_WH = 600.0;

    for (let i = 0; i < waypoints.length; i++) {
      const [px, py] = waypoints[i];
      const xM = Number((px * pixelScaleMeters).toFixed(1));
      const yM = Number((py * pixelScaleMeters).toFixed(1));
      pathCoordinates.push([xM, yM]);

      let segDistM = 0;
      if (i > 0) {
        const [prevPx, prevPy] = waypoints[i - 1];
        segDistM = Math.hypot((px - prevPx) * pixelScaleMeters, (py - prevPy) * pixelScaleMeters);
      }
      cumulativeDistM += segDistM;

      let slopeDeg = 3.5;
      if (slopeMap && width > 0) {
        const ix = Math.min(width - 1, Math.max(0, Math.floor(px)));
        const iy = Math.floor(py);
        const idx = iy * width + ix;
        if (idx >= 0 && idx < slopeMap.length) {
          slopeDeg = slopeMap[idx];
        }
      }

      const { tractiveForceN } = this.computeTractiveForce(slopeDeg, rover);
      if (tractiveForceN > peakForceN && tractiveForceN !== Infinity) peakForceN = tractiveForceN;

      const segWorkJ = (Math.max(0, tractiveForceN * segDistM) / rover.drivetrainEfficiency);
      const segTimeSec = segDistM / rover.nominalSpeedMPerS;
      const powerWatts = segTimeSec > 0 ? (segWorkJ / segTimeSec) : 0;
      if (powerWatts > peakPowerW) peakPowerW = powerWatts;

      const sunRad = (sunElevationDeg * Math.PI) / 180.0;
      const solarPowerW = rover.solarPanelAreaM2 * this.LUNAR_SOLAR_CONSTANT * rover.solarPanelEfficiency * Math.max(0, Math.sin(sunRad));
      const segSolarJ = solarPowerW * segTimeSec;

      cumulativeEnergyJ += segWorkJ;
      cumulativeSolarJ += segSolarJ;
      slopeSum += slopeDeg;
      if (slopeDeg > maxSlope) maxSlope = slopeDeg;

      const cumWh = cumulativeEnergyJ / 3600.0;
      const batterySoc = Math.max(0, Math.min(100.0, ((INITIAL_BATTERY_WH - cumWh) / INITIAL_BATTERY_WH) * 100.0));

      traverseWaypoints.push({
        stepIndex: i + 1,
        gridX: Math.floor(px / 24),
        gridY: Math.floor(py / 24),
        xMeters: xM,
        yMeters: yM,
        slopeDeg: Number(slopeDeg.toFixed(2)),
        segmentDistanceM: Number(segDistM.toFixed(1)),
        tractiveForceN: Number(tractiveForceN.toFixed(1)),
        energyJoules: Number(segWorkJ.toFixed(1)),
        solarRechargeJoules: Number(segSolarJ.toFixed(1)),
        netEnergyJoules: Number((segWorkJ - segSolarJ).toFixed(1)),
        batterySocPct: Number(batterySoc.toFixed(1)),
        cumulativeDistanceM: Number(cumulativeDistM.toFixed(1)),
        cumulativeEnergyWh: Number(cumWh.toFixed(2)),
        cumulativeTimeSec: Number((cumulativeDistM / rover.nominalSpeedMPerS).toFixed(0)),
      });
    }

    const totalEnergyWh = Number((cumulativeEnergyJ / 3600.0).toFixed(2));
    const totalSolarWh = Number((cumulativeSolarJ / 3600.0).toFixed(2));
    const netEnergyWh = Number((totalEnergyWh - totalSolarWh).toFixed(2));
    const durationMin = Number(((cumulativeDistM / rover.nominalSpeedMPerS) / 60.0).toFixed(1));
    const avgSlope = Number((slopeSum / waypoints.length).toFixed(2));
    const isSafe = maxSlope <= rover.maxSafeSlopeDeg;

    return {
      waypoints: traverseWaypoints,
      pathCoordinates,
      totalDistanceM: Number(cumulativeDistM.toFixed(1)),
      totalEnergyJoules: Number(cumulativeEnergyJ.toFixed(0)),
      totalEnergyWh,
      totalSolarGeneratedWh: totalSolarWh,
      netEnergyWh,
      peakTractiveForceN: Number(peakForceN.toFixed(1)),
      peakPowerWatts: Number(peakPowerW.toFixed(1)),
      averageSlopeDeg: avgSlope,
      maxSlopeDeg: Number(maxSlope.toFixed(2)),
      traverseDurationMin: durationMin,
      isSafeTraverse: isSafe,
      scientificSummary: `A* Bekker terramechanic traverse: ${cumulativeDistM.toFixed(0)}m length in ${durationMin} min | Net Energy: ${netEnergyWh} Wh (Drain: ${totalEnergyWh} Wh, Solar: +${totalSolarWh} Wh) | Peak Power: ${peakPowerW.toFixed(1)}W, Max Slope: ${maxSlope.toFixed(1)}°`,
    };
  }
}
