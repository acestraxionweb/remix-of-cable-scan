export type CableRecord = Record<string, unknown> & {
  elid: string;
  _entityType: "cableMaster" | "powerCable" | "dataCable";
};

/**
 * Demo dataset used when no FNT server is configured (FNT_BASE_URL unset).
 * Mirrors the real FNT REST response shape exactly.
 */
export const DEMO_CABLES: CableRecord[] = [
  {
    _entityType: "cableMaster",
    elid: "HDGBQY02DZI4QV",
    type: "LWL-UNIVERSAL",
    explanation: "Universal loose tube fiber-optic cable with 48 fibers G50/125",
    connector1: "COMMON",
    connector2: "COMMON",
    medium: "FO",
    category: "NETWORK",
    diameter: 12.5,
    weight: 185,
    manufacturer: "Nexans",
    manufacturerArticleNumber: "ABC-123",
    deliverLength: 2000,
    isStandard: false,
    prefix: "FCBL-",
  },
  {
    _entityType: "cableMaster",
    elid: "ET45DWFK89DZCD",
    type: "NYY-J 5x16",
    explanation: "PVC insulated power cable, 5 conductors, 16 mm2",
    connector1: "OPEN",
    connector2: "OPEN",
    medium: "CU",
    category: "POWER",
    diameter: 21.4,
    weight: 940,
    manufacturer: "Lapp",
    manufacturerArticleNumber: "NYY-5X16",
    deliverLength: 500,
    isStandard: true,
    prefix: "PWR-",
  },
  {
    _entityType: "powerCable",
    elid: "060I5XCW2PRIPB",
    id: "PWR-1044",
    visibleId: "PWR-1044",
    typeElid: "ET45DWFK89DZCD",
    length: 84.5,
    lengthIn: 2.5,
    lengthOut: 3,
    installDate: "2023-04-18",
    attenuation: null,
    resistance: 0.42,
    emvEmission: "LOW",
    emvResistance: "HIGH",
    remark: "Feeder from main distribution board to rack row B",
  },
  {
    _entityType: "dataCable",
    elid: "WZ41CWBR8A1D1K",
    id: "FCBL-1072",
    visibleId: "FCBL-1072",
    typeElid: "HDGBQY02DZI4QV",
    length: 412,
    planStatus: "ACTUAL",
    tcoLinename: "DC1-DC2 Backbone 03",
    tcoServiceType: "DARK FIBER",
    tcoStatus: "IN OPERATION",
  },
];
