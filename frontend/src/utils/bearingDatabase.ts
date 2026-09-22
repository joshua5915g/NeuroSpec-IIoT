export interface BearingSpec {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  dp: number;      // Pitch diameter (mm)
  d: number;       // Ball / roller diameter (mm)
  n: number;       // Number of rolling elements
  alpha: number;   // Contact angle (degrees)
  description: string;
}

export interface KinematicFrequencies {
  '1X': number;
  '2X': number;
  'BPFO': number;
  'BPFI': number;
  'BSF': number;
  'FTF': number;
}

export const BEARING_CATALOG: BearingSpec[] = [
  {
    id: 'SKF_6205',
    name: 'SKF 6205',
    manufacturer: 'SKF',
    type: 'Deep Groove Ball Bearing',
    dp: 39.04,
    d: 7.94,
    n: 9,
    alpha: 0,
    description: 'Standard industrial electric motor bearing (45kW baseline)',
  },
  {
    id: 'SKF_6308',
    name: 'SKF 6308',
    manufacturer: 'SKF',
    type: 'Heavy-Duty Ball Bearing',
    dp: 65.0,
    d: 15.08,
    n: 8,
    alpha: 0,
    description: 'High-torque centrifugal pump and industrial blower drive',
  },
  {
    id: 'FAG_22216',
    name: 'FAG 22216-E1',
    manufacturer: 'Schaeffler / FAG',
    type: 'Spherical Roller Bearing',
    dp: 110.0,
    d: 18.0,
    n: 17,
    alpha: 10.0,
    description: 'Self-aligning heavy vibration crushing & vibrating screen unit',
  },
  {
    id: 'NSK_6004',
    name: 'NSK 6004',
    manufacturer: 'NSK',
    type: 'High-Speed Miniature Spindle',
    dp: 31.0,
    d: 6.35,
    n: 9,
    alpha: 0,
    description: 'High-precision CNC spindle and high-RPM compressor',
  },
  {
    id: 'TIMKEN_32208',
    name: 'Timken 32208',
    manufacturer: 'Timken',
    type: 'Tapered Roller Bearing',
    dp: 57.5,
    d: 11.5,
    n: 15,
    alpha: 14.0,
    description: 'High axial & radial thrust industrial planetary gearbox',
  },
  {
    id: 'NTN_NJ206',
    name: 'NTN NJ206',
    manufacturer: 'NTN',
    type: 'Cylindrical Roller Bearing',
    dp: 46.0,
    d: 9.0,
    n: 12,
    alpha: 0,
    description: 'Extreme radial load traction motor & crane hoist',
  },
];

/**
 * Calculates exact kinematic defect frequencies given bearing geometry and rotational speed.
 * @param bearing Bearing geometry specification
 * @param rpm Machine rotational speed in RPM
 */
export function calculateKinematics(bearing: BearingSpec, rpm: number): KinematicFrequencies {
  const fr = rpm / 60.0; // Fundamental shaft frequency 1X in Hz
  const alphaRad = (bearing.alpha * Math.PI) / 180.0;
  const cosA = Math.cos(alphaRad);
  const ratio = bearing.d / bearing.dp;

  // Exact bearing kinematic equations
  // BPFO: Ball Pass Frequency Outer Race
  const bpfo = (bearing.n * fr / 2.0) * (1.0 - ratio * cosA);

  // BPFI: Ball Pass Frequency Inner Race
  const bpfi = (bearing.n * fr / 2.0) * (1.0 + ratio * cosA);

  // BSF: Ball Spin Frequency
  const bsf = (bearing.dp * fr / (2.0 * bearing.d)) * (1.0 - Math.pow(ratio * cosA, 2));

  // FTF: Fundamental Train Frequency (Cage speed)
  const ftf = (fr / 2.0) * (1.0 - ratio * cosA);

  return {
    '1X': Math.round(fr * 10) / 10,
    '2X': Math.round(2.0 * fr * 10) / 10,
    'BPFO': Math.round(bpfo * 10) / 10,
    'BPFI': Math.round(bpfi * 10) / 10,
    'BSF': Math.round(bsf * 10) / 10,
    'FTF': Math.round(ftf * 10) / 10,
  };
}
