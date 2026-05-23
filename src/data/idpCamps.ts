export type IdpCamp = {
  slug: string;
  name: string;
  state: string;
  region: string;
  lga: string;
  capacity: number;
  population: number;
  households: number;
  established: string;
  manager: string;
  partners: string[];
  contact: { phone: string; email: string };
  coordinates: { lat: number; lng: number };
  services: string[];
  demographics: { children: number; women: number; men: number; elderly: number };
  facilities: string[];
  needs: string[];
  status: "Active" | "Transitioning" | "Decommissioning";
  overview: string;
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const raw: Omit<IdpCamp, "slug">[] = [
  {
    name: "Bakassi IDP Camp",
    state: "Borno",
    region: "North-East",
    lga: "Maiduguri",
    capacity: 12000,
    population: 9800,
    households: 2150,
    established: "2014",
    manager: "NCFRMI / SEMA Borno",
    partners: ["UNHCR", "IOM", "WFP", "ICRC", "NEMA"],
    contact: { phone: "+234 803 000 1101", email: "bakassi.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 11.8333, lng: 13.1500 },
    services: ["Primary Healthcare", "Food Distribution", "Shelter & NFI", "Education", "Psychosocial Support", "WASH"],
    demographics: { children: 4900, women: 2940, men: 1470, elderly: 490 },
    facilities: ["1 Health Clinic", "3 Primary Schools", "12 Water Boreholes", "240 Latrine Blocks", "1 Women Safe Space"],
    needs: ["Additional shelter kits", "Specialized medical supplies", "Vocational training materials"],
    status: "Active",
    overview:
      "Bakassi is one of the largest IDP settlements in Borno State, hosting families displaced by insurgency across the North-East. The camp delivers integrated humanitarian services through a coordinated partnership between NCFRMI, SEMA, and UN agencies.",
  },
  {
    name: "Dalori Camp I",
    state: "Borno",
    region: "North-East",
    lga: "Konduga",
    capacity: 18000,
    population: 16500,
    households: 3680,
    established: "2015",
    manager: "NCFRMI / SEMA Borno",
    partners: ["UNHCR", "WFP", "UNICEF", "MSF"],
    contact: { phone: "+234 803 000 1102", email: "dalori1.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 11.7500, lng: 13.2167 },
    services: ["Health", "WASH", "Food", "Child Protection", "GBV Response"],
    demographics: { children: 8250, women: 4950, men: 2475, elderly: 825 },
    facilities: ["2 Health Posts", "5 Learning Centers", "18 Boreholes", "1 Nutrition Center"],
    needs: ["Expanded nutrition support", "Solar lighting", "Teachers"],
    status: "Active",
    overview:
      "Dalori Camp I supports a large population of IDPs from Konduga, Bama and Mafa LGAs with a strong focus on child protection, nutrition and women-led livelihoods.",
  },
  {
    name: "Durumi IDP Settlement",
    state: "FCT",
    region: "North-Central",
    lga: "AMAC",
    capacity: 4500,
    population: 3900,
    households: 820,
    established: "2014",
    manager: "NCFRMI / FCT Emergency Management",
    partners: ["NEMA", "Red Cross", "Caritas Nigeria"],
    contact: { phone: "+234 803 000 1103", email: "durumi.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 9.0211, lng: 7.4951 },
    services: ["Healthcare", "Basic Education", "Skills Acquisition", "Food Aid"],
    demographics: { children: 1950, women: 1170, men: 585, elderly: 195 },
    facilities: ["1 Clinic", "1 School", "6 Boreholes", "Skills Training Center"],
    needs: ["Permanent shelter solutions", "Income-generating equipment"],
    status: "Active",
    overview:
      "Durumi hosts predominantly IDPs from Borno and Adamawa relocated to the Federal Capital Territory. NCFRMI coordinates durable solutions including resettlement and livelihood programmes.",
  },
  {
    name: "Wassa Camp",
    state: "FCT",
    region: "North-Central",
    lga: "AMAC",
    capacity: 3000,
    population: 2700,
    households: 590,
    established: "2014",
    manager: "NCFRMI / FCT Emergency Management",
    partners: ["NEMA", "FCT SEMA", "Red Cross"],
    contact: { phone: "+234 803 000 1104", email: "wassa.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 8.9833, lng: 7.5333 },
    services: ["Food Distribution", "Shelter", "Primary Healthcare"],
    demographics: { children: 1350, women: 810, men: 405, elderly: 135 },
    facilities: ["1 Health Post", "1 Learning Center", "5 Boreholes"],
    needs: ["School supplies", "Reinforced shelters"],
    status: "Active",
    overview:
      "Wassa Camp accommodates IDPs from the North-East and is part of NCFRMI's coordinated FCT response, focused on stabilization and transition to host community integration.",
  },
  {
    name: "Malkohi Camp",
    state: "Adamawa",
    region: "North-East",
    lga: "Yola South",
    capacity: 6500,
    population: 5200,
    households: 1150,
    established: "2014",
    manager: "NCFRMI / ADSEMA",
    partners: ["UNHCR", "WFP", "American University of Nigeria"],
    contact: { phone: "+234 803 000 1105", email: "malkohi.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 9.2035, lng: 12.4954 },
    services: ["Health", "Food", "WASH", "Education", "Livelihoods"],
    demographics: { children: 2600, women: 1560, men: 780, elderly: 260 },
    facilities: ["1 Clinic", "2 Schools", "8 Boreholes", "Agricultural plot"],
    needs: ["Seeds and farm inputs", "Health worker capacity"],
    status: "Active",
    overview:
      "Malkohi serves displaced families from Adamawa and southern Borno, integrating humanitarian assistance with agricultural livelihoods support.",
  },
  {
    name: "Geidam Transit Site",
    state: "Yobe",
    region: "North-East",
    lga: "Geidam",
    capacity: 2200,
    population: 1700,
    households: 360,
    established: "2019",
    manager: "NCFRMI / YOSEMA",
    partners: ["IOM", "UNHCR"],
    contact: { phone: "+234 803 000 1106", email: "geidam.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 12.8949, lng: 11.9269 },
    services: ["Shelter", "Non-Food Items", "Registration", "Protection"],
    demographics: { children: 850, women: 510, men: 255, elderly: 85 },
    facilities: ["Registration center", "4 Boreholes", "Mobile clinic visits"],
    needs: ["Permanent health facility", "Education tents"],
    status: "Transitioning",
    overview:
      "Geidam Transit Site provides emergency reception and onward processing for newly displaced and returnee populations along the Yobe corridor.",
  },
  {
    name: "Anguwan Rimi Camp",
    state: "Kaduna",
    region: "North-West",
    lga: "Kaduna North",
    capacity: 1800,
    population: 1250,
    households: 275,
    established: "2017",
    manager: "NCFRMI / KAD-SEMA",
    partners: ["Red Cross", "Caritas"],
    contact: { phone: "+234 803 000 1107", email: "anguwanrimi.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 10.5264, lng: 7.4382 },
    services: ["Food", "Health", "Protection"],
    demographics: { children: 625, women: 375, men: 187, elderly: 63 },
    facilities: ["1 Health post", "3 Boreholes"],
    needs: ["School integration support", "Trauma counseling"],
    status: "Active",
    overview:
      "Anguwan Rimi hosts populations displaced by banditry and inter-communal conflict across the North-West, with strong host-community integration efforts.",
  },
  {
    name: "Tegina Settlement",
    state: "Niger",
    region: "North-Central",
    lga: "Rafi",
    capacity: 2400,
    population: 2100,
    households: 470,
    established: "2021",
    manager: "NCFRMI / NSEMA",
    partners: ["NEMA", "Red Cross"],
    contact: { phone: "+234 803 000 1108", email: "tegina.camp@ncfrmi.gov.ng" },
    coordinates: { lat: 10.0667, lng: 6.1833 },
    services: ["Shelter", "Food", "Child Protection"],
    demographics: { children: 1050, women: 630, men: 315, elderly: 105 },
    facilities: ["2 Schools", "5 Boreholes", "1 Health post"],
    needs: ["Mental health services", "Vocational kits"],
    status: "Active",
    overview:
      "Tegina Settlement supports families displaced by armed-group activity in Niger State, with priority on child protection and educational continuity.",
  },
];

export const idpCamps: IdpCamp[] = raw.map((c) => ({ ...c, slug: slugify(c.name) }));

export const getCampBySlug = (slug: string) => idpCamps.find((c) => c.slug === slug);
