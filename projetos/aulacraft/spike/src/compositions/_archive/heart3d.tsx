import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export type AnatomyPart =
  | 'whole'
  | 'right-atrium'
  | 'left-atrium'
  | 'right-ventricle'
  | 'left-ventricle'
  | 'aorta'
  | 'lungs';

// 3D world positions of each anatomical part (for annotation projection)
export const PART_POSITIONS: Record<AnatomyPart, [number, number, number]> = {
  'whole':           [0, 0, 0],
  'right-atrium':    [-1.0, 1.2, 0],
  'left-atrium':     [1.0, 1.2, 0],
  'right-ventricle': [-1.2, -0.6, 0],
  'left-ventricle':  [1.2, -0.6, 0],
  'aorta':           [0.0, 2.6, 0],
  'lungs':           [0, 0.4, -1.5],
};

// Screen-space label positions (anchored outside the model so leader lines work)
export const ANNOTATION_SCREEN_POSITIONS: Record<AnatomyPart, { x: string; y: string; anchor: 'left' | 'right' }> = {
  'whole':           { x: '12%', y: '50%', anchor: 'left' },
  'right-atrium':    { x: '14%', y: '26%', anchor: 'left' },
  'left-atrium':     { x: '86%', y: '26%', anchor: 'right' },
  'right-ventricle': { x: '11%', y: '62%', anchor: 'left' },
  'left-ventricle':  { x: '89%', y: '62%', anchor: 'right' },
  'aorta':           { x: '60%', y: '12%', anchor: 'right' },
  'lungs':           { x: '8%',  y: '42%', anchor: 'left' },
};

// =====================================================================
// Build a 2D heart silhouette as a Shape, then extrude to give it depth.
// EdgesGeometry extracts just the outline — that's our blueprint look.
// =====================================================================
function buildHeartSilhouette(): THREE.Shape {
  const shape = new THREE.Shape();
  // Heart drawn with bezier curves. Origin (0,0) is center.
  // Top of heart has two lobes (left and right atrium look).
  shape.moveTo(0, 2.4);
  // Left lobe (right atrium from anatomical POV)
  shape.bezierCurveTo(-1.4, 3.1, -2.7, 2.6, -2.7, 1.0);
  // Down to bottom point
  shape.bezierCurveTo(-2.7, -0.6, -1.8, -1.6, 0, -3.0);
  // Right side back up
  shape.bezierCurveTo(1.8, -1.6, 2.7, -0.6, 2.7, 1.0);
  // Right lobe (left atrium from anatomical POV)
  shape.bezierCurveTo(2.7, 2.6, 1.4, 3.1, 0, 2.4);
  return shape;
}

// =====================================================================
// Chamber divider lines (internal anatomical structure)
// =====================================================================
function buildChamberLines(): THREE.BufferGeometry {
  const points: number[] = [];
  // Vertical septum (separates right and left chambers)
  // From top center down to bottom point
  const septumPoints = [
    [0, 2.4, 0], [0, 1.5, 0], [0, 0.3, 0], [0, -1.2, 0], [0, -2.5, 0],
  ];
  for (let i = 0; i < septumPoints.length - 1; i++) {
    points.push(...septumPoints[i], ...septumPoints[i + 1]);
  }
  // Horizontal AV valve line (separates atria from ventricles)
  const avPoints = [
    [-2.4, 0.3, 0], [-1.4, 0.35, 0], [0, 0.3, 0], [1.4, 0.35, 0], [2.4, 0.3, 0],
  ];
  for (let i = 0; i < avPoints.length - 1; i++) {
    points.push(...avPoints[i], ...avPoints[i + 1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// =====================================================================
// Aorta as a curved tube outline (top of heart, exits to the right)
// =====================================================================
function buildAortaPath(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5, 2.3, 0),
    new THREE.Vector3(0.7, 2.9, 0),
    new THREE.Vector3(0.6, 3.5, 0),
    new THREE.Vector3(0.2, 3.9, 0),
    new THREE.Vector3(-0.3, 3.9, 0),
  ]);
}

function buildPulmonaryArteryPath(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5, 2.3, 0),
    new THREE.Vector3(-0.6, 2.9, 0),
    new THREE.Vector3(-0.4, 3.3, 0),
  ]);
}

// Tick marks around a circle for "radar/blueprint" feel
function buildTickRing(radius: number, count: number): THREE.BufferGeometry {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const inner = radius;
    const outer = radius + (i % 4 === 0 ? 0.25 : 0.12);
    const x1 = Math.cos(angle) * inner;
    const z1 = Math.sin(angle) * inner;
    const x2 = Math.cos(angle) * outer;
    const z2 = Math.sin(angle) * outer;
    points.push(x1, -2.6, z1, x2, -2.6, z2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// Concentric circles for the base reticle
function buildBaseRings(): THREE.BufferGeometry {
  const points: number[] = [];
  const radii = [2.5, 3.5, 4.5];
  const segments = 64;
  for (const r of radii) {
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      points.push(Math.cos(a1) * r, -2.6, Math.sin(a1) * r);
      points.push(Math.cos(a2) * r, -2.6, Math.sin(a2) * r);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// Crosshair on the base
function buildCrosshair(): THREE.BufferGeometry {
  const points: number[] = [-4.5, -2.6, 0, 4.5, -2.6, 0, 0, -2.6, -4.5, 0, -2.6, 4.5];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// =====================================================================
// HeartWireframe — extruded heart shape rendered as edge lines only
// =====================================================================
const HeartWireframe: React.FC<{
  accent: string;
  highlights: AnatomyPart[];
  beat: number;
}> = ({ accent, highlights, beat }) => {
  // Build geometries (memoized — only once)
  const { heartEdges, chamberLines, aortaTube, pulmTube, tickRing, baseRings, crosshair, chamberMarkers } = useMemo(() => {
    const shape = buildHeartSilhouette();
    const extrudeSettings = { depth: 1.4, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3, steps: 1 };
    const extruded = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center on Z
    extruded.translate(0, 0, -0.7);
    const heartEdges = new THREE.EdgesGeometry(extruded, 18); // 18 degrees threshold

    const chamberLines = buildChamberLines();

    // Aorta as tube wireframe
    const aortaCurve = buildAortaPath();
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 20, 0.35, 12, false);
    const aortaTube = new THREE.EdgesGeometry(aortaGeo, 20);

    const pulmCurve = buildPulmonaryArteryPath();
    const pulmGeo = new THREE.TubeGeometry(pulmCurve, 16, 0.25, 10, false);
    const pulmTube = new THREE.EdgesGeometry(pulmGeo, 20);

    const tickRing = buildTickRing(3.0, 48);
    const baseRings = buildBaseRings();
    const crosshair = buildCrosshair();

    // Small chamber marker circles (4 small rings at chamber positions)
    const chamberMarkers = new THREE.BufferGeometry();
    const markerPoints: number[] = [];
    const chambers: [number, number, number, number][] = [
      // x, y, radius, type-id (0=RA, 1=LA, 2=RV, 3=LV)
      [-1.0, 1.2, 0.55, 0],
      [1.0, 1.2, 0.55, 1],
      [-1.2, -0.6, 0.65, 2],
      [1.2, -0.6, 0.7, 3],
    ];
    for (const [cx, cy, r] of chambers) {
      const segs = 28;
      for (let i = 0; i < segs; i++) {
        const a1 = (i / segs) * Math.PI * 2;
        const a2 = ((i + 1) / segs) * Math.PI * 2;
        markerPoints.push(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 0.71);
        markerPoints.push(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, 0.71);
        markerPoints.push(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, -0.71);
        markerPoints.push(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, -0.71);
      }
    }
    chamberMarkers.setAttribute('position', new THREE.Float32BufferAttribute(markerPoints, 3));

    return { heartEdges, chamberLines, aortaTube, pulmTube, tickRing, baseRings, crosshair, chamberMarkers };
  }, []);

  // Highlight color: brighter / accent. Non-highlight: dimmer cyan-grey
  const isFullHighlight = highlights.includes('whole');
  const baseLineColor = new THREE.Color(isFullHighlight ? accent : '#5B6B7E');
  const aortaColor = new THREE.Color(highlights.includes('aorta') || isFullHighlight ? accent : '#5B6B7E');
  const pulmColor = new THREE.Color(highlights.includes('right-ventricle') || isFullHighlight ? '#0EA5E9' : '#5B6B7E');

  return (
    <group scale={[beat, beat, beat]}>
      {/* Main heart silhouette edges */}
      <lineSegments geometry={heartEdges}>
        <lineBasicMaterial color={baseLineColor} linewidth={2} transparent opacity={0.95} />
      </lineSegments>

      {/* Internal chamber divider lines (septum + AV valve) */}
      <lineSegments geometry={chamberLines}>
        <lineBasicMaterial color={baseLineColor} transparent opacity={0.65} />
      </lineSegments>

      {/* Chamber boundary markers (rings around each chamber) */}
      <lineSegments geometry={chamberMarkers}>
        <lineBasicMaterial color={baseLineColor} transparent opacity={0.55} />
      </lineSegments>

      {/* Aorta tube wireframe */}
      <lineSegments geometry={aortaTube}>
        <lineBasicMaterial color={aortaColor} transparent opacity={0.85} />
      </lineSegments>

      {/* Pulmonary artery */}
      <lineSegments geometry={pulmTube}>
        <lineBasicMaterial color={pulmColor} transparent opacity={0.7} />
      </lineSegments>

      {/* Base ring tick marks */}
      <lineSegments geometry={tickRing}>
        <lineBasicMaterial color={accent} transparent opacity={0.55} />
      </lineSegments>

      {/* Concentric base rings */}
      <lineSegments geometry={baseRings}>
        <lineBasicMaterial color={accent} transparent opacity={0.18} />
      </lineSegments>

      {/* Crosshair on base */}
      <lineSegments geometry={crosshair}>
        <lineBasicMaterial color={accent} transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
};

// Heartbeat scale animation
function useHeartbeat(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cycle = (t % 0.85) / 0.85;
  return Math.sin(cycle * Math.PI * 2) * 0.025 + 1;
}

export const Heart3DModel: React.FC<{
  highlights?: AnatomyPart[];
  cameraTilt?: number;
  accent?: string;
}> = ({ highlights = ['whole'], cameraTilt = 1, accent = '#22D3EE' }) => {
  const beat = useHeartbeat();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Continuous gentle Y rotation
  const rotY = t * 0.25 * cameraTilt;
  // Slight tilt forward so the perspective is clear
  const rotX = -0.15;

  return (
    <group rotation={[rotX, rotY, 0]}>
      <HeartWireframe accent={accent} highlights={highlights} beat={beat} />
    </group>
  );
};

// Camera positions per focus
export function cameraPositionFor(focus: AnatomyPart): [number, number, number] {
  switch (focus) {
    case 'whole':           return [0, 0.3, 10];
    case 'right-atrium':    return [-1.5, 1.4, 7];
    case 'left-atrium':     return [1.5, 1.4, 7];
    case 'right-ventricle': return [-1.8, -0.4, 7];
    case 'left-ventricle':  return [2.0, -0.4, 7];
    case 'aorta':           return [0.8, 2.8, 7];
    case 'lungs':           return [0, 0.5, 11];
  }
}
