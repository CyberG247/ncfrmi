export interface Registrant {
  id: string;
  reference: string;
  category: "idp" | "refugee" | "migrant" | "returnee";
  full_name: string;
  address: string;
  phone: string;
  dob: string;
  gender: string;
  nationality: string;
  state_origin: string;
  lga: string;
  dependants: number;
  circumstances: string;
  created_at: string;
  is_local?: boolean;
}

export const generateRealisticSeedData = (): Registrant[] => {
  const seed: Registrant[] = [];
  
  // Helper to generate a date between Jan 1, 2026 and Jul 15, 2026
  const getRandomDate2026 = (monthIdx: number) => {
    const day = Math.floor(Math.random() * 28) + 1;
    const hour = Math.floor(Math.random() * 24);
    const min = Math.floor(Math.random() * 60);
    const date = new Date(2026, monthIdx, day, hour, min);
    return date.toISOString();
  };

  // Helper to create random phone number
  const getRandomPhone = () => {
    const num = Math.floor(1000000 + Math.random() * 9000000);
    return `+234 803 ${num}`;
  };

  // --- 15 IDP RECORDS ---
  const idpNames = [
    { name: "Fatima Ibrahim", state: "Borno", lga: "Maiduguri", address: "Bakassi IDP Camp, Zone A", circumstances: "Displaced by conflict in Bama, residing in Bakassi camp with family." },
    { name: "Musa Bala", state: "Yobe", lga: "Damaturu", address: "Kukareta IDP Settlement", circumstances: "Fled insurgent raid on agricultural village, lost primary livelihood." },
    { name: "Deborah Jonah", state: "Benue", lga: "Guma", address: "Daudu IDP Camp 1", circumstances: "Displaced by community conflict in Guma agricultural border area." },
    { name: "Yusuf Mohammed", state: "Borno", lga: "Bama", address: "Dalori Camp I, Block 4", circumstances: "Insurgency survivor, seeking permanent durable housing solutions." },
    { name: "Amina Garba", state: "Adamawa", lga: "Madagali", address: "Malkohi Camp, Sector 2", circumstances: "Fled cross-border border conflicts, receives food and wash support." },
    { name: "Ezekiel Bitrus", state: "Borno", lga: "Gwoza", address: "Bakassi IDP Camp, Zone B", circumstances: "Family home destroyed by insurgent group. Registered for shelter assistance." },
    { name: "Ibrahim Hassan", state: "Yobe", lga: "Geidam", address: "Geidam Transit Site", circumstances: "Temporarily housed at transit site following border village instability." },
    { name: "Grace Samuel", state: "Benue", lga: "Makurdi", address: "Daudu Camp 2", circumstances: "Farmer displaced due to local agricultural conflicts, requiring seed inputs." },
    { name: "Kabiru Aliyu", state: "Borno", lga: "Monguno", address: "Monguno Zonal Camp", circumstances: "Displaced from northern Lake Chad shores, fisherman seeking relocation." },
    { name: "Zainab Audu", state: "Adamawa", lga: "Michika", address: "Malkohi Camp", circumstances: "Michika attack survivor, seeking resettlement and micro-grant support." },
    { name: "Sunday Oche", state: "Benue", lga: "Logo", address: "Anyiin IDP Camp", circumstances: "Communal clashes displaced entire village. Housed in temporary tents." },
    { name: "Maryam Isa", state: "Borno", lga: "Dikwa", address: "Dalori Camp II", circumstances: "Displaced mother of three seeking child nutrition and medical aid." },
    { name: "Mustapha Kyari", state: "Borno", lga: "Kukawa", address: "Bakassi IDP Camp", circumstances: "Fled Lake Chad island skirmishes. Registered for biometric capture." },
    { name: "Aisha Umar", state: "Yobe", lga: "Gujba", address: "Kukareta Settlement", circumstances: "Primary school teacher displaced by school raid. Seeks integration." },
    { name: "Paul Agbaji", state: "Benue", lga: "Katsina-Ala", address: "Gbajimba Camp", circumstances: "Displaced during harvesting season, requiring food assistance and shelter." }
  ];

  idpNames.forEach((item, idx) => {
    seed.push({
      id: `idp-seed-${idx + 1}`,
      reference: `NCF/2026/IDP/${1000 + idx}`,
      category: "idp",
      full_name: item.name,
      address: item.address,
      phone: getRandomPhone(),
      dob: new Date(1975 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().slice(0, 10),
      gender: idx % 2 === 0 ? "Female" : "Male",
      nationality: "Nigeria",
      state_origin: item.state,
      lga: item.lga,
      dependants: 2 + (idx % 4),
      circumstances: item.circumstances,
      created_at: getRandomDate2026(idx % 6),
      is_local: false
    });
  });

  // --- 15 REFUGEE RECORDS ---
  const refugeeNames = [
    { name: "Jean-Pierre Mbappe", nation: "Cameroon", state: "Cross River", lga: "Ogoja", address: "Adagom Refugee Settlement", circumstances: "Cameroonian refugee fleeing Anglophone crisis. Seeking protection." },
    { name: "Chantal Soua", nation: "Cameroon", state: "Cross River", lga: "Ogoja", address: "Adagom Settlement", circumstances: "Fled regional violence with children. Seeking educational support." },
    { name: "Marc Oumarou", nation: "Cameroon", state: "Taraba", lga: "Kurmi", address: "Kurmi Zonal Host Community", circumstances: "Registered Cameroonian refugee living with host community relatives." },
    { name: "Marie-Therese Foe", nation: "Cameroon", state: "Benue", lga: "Kwande", address: "Kwande Border Host Area", circumstances: "Escaped border skirmishes, receives NCFRMI agricultural assistance." },
    { name: "Harouna Souleymane", nation: "Niger", state: "Yobe", lga: "Machina", address: "Machina Town Host Community", circumstances: "Nigerien national displaced by border security ops. Enrolled for safety." },
    { name: "Amadou Issoufou", nation: "Niger", state: "Borno", lga: "Mobbar", address: "Mobbar Community Center", circumstances: "Displaced Nigerien pastoralist seeking temporary asylum." },
    { name: "Youssouf Idris", nation: "Chad", state: "Borno", lga: "Ngala", address: "Ngala Host Community", circumstances: "Chadian national seeking protection due to Lake Chad security crisis." },
    { name: "Khadija Al-Faisal", nation: "Syria", state: "Lagos", lga: "Ikeja", address: "Urban Area, Ikeja", circumstances: "Syrian refugee family receiving urban integration and language support." },
    { name: "Tareq Al-Homsi", nation: "Syria", state: "FCT", lga: "AMAC", address: "Abuja Urban Area", circumstances: "Refugee professional receiving residency authorization and legal counseling." },
    { name: "Abdelrahman Bashir", nation: "Sudan", state: "Kano", lga: "Tarauni", address: "Tarauni Town", circumstances: "Sudanese student fleeing Khartoum conflict. Enrolled for educational asylum." },
    { name: "Omer Hassan", nation: "Sudan", state: "Borno", lga: "Maiduguri", address: "Maiduguri Host Ward", circumstances: "Sudanese doctor seeking asylum and professional integration clearance." },
    { name: "Florence Ngalula", nation: "C.A.R.", state: "Cross River", lga: "Calabar South", address: "Calabar Urban Center", circumstances: "Central African Republic national seeking asylum and legal protection." },
    { name: "Pierre Mukendi", nation: "Congo", state: "Lagos", lga: "Surulere", address: "Surulere Area", circumstances: "Congolese asylum seeker under humanitarian protection review." },
    { name: "Samuel Ngassa", nation: "Cameroon", state: "Cross River", lga: "Ogoja", address: "Okende Refugee Settlement", circumstances: "Cameroonian refugee, community representative at Okende camp." },
    { name: "Celine Bella", nation: "Cameroon", state: "Cross River", lga: "Ogoja", address: "Adagom III Settlement", circumstances: "Displaced mother seeking maternal healthcare at settlement clinic." }
  ];

  refugeeNames.forEach((item, idx) => {
    seed.push({
      id: `ref-seed-${idx + 1}`,
      reference: `NCF/2026/REF/${2000 + idx}`,
      category: "refugee",
      full_name: item.name,
      address: item.address,
      phone: getRandomPhone(),
      dob: new Date(1980 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().slice(0, 10),
      gender: idx % 2 === 0 ? "Female" : "Male",
      nationality: item.nation,
      state_origin: item.state,
      lga: item.lga,
      dependants: 1 + (idx % 5),
      circumstances: item.circumstances,
      created_at: getRandomDate2026(idx % 6),
      is_local: false
    });
  });

  // --- 15 MIGRANT / RETURNEE RECORDS ---
  const migrantNames = [
    { name: "Osaze Efe", state: "Edo", lga: "Oredo", cat: "returnee", circumstances: "Assisted voluntary returnee from Libya. Enrolled for tailoring training." },
    { name: "Blessing Okon", state: "Delta", lga: "Warri South", cat: "returnee", circumstances: "Libya transit returnee. Enrolled in NCFRMI micro-grant program." },
    { name: "Kelechi Umeh", state: "Imo", lga: "Owerri Municipal", cat: "returnee", circumstances: "Returned from Europe voluntary repatriation. Seeking IT training." },
    { name: "Tunde Babalola", state: "Lagos", lga: "Alimosho", cat: "returnee", circumstances: "Returnee from Niger border transit corridor. Seeking resettlement." },
    { name: "Efe Igbinosa", state: "Edo", lga: "Ikpoba Okha", cat: "returnee", circumstances: "Returned from Libya. Participating in agricultural integration." },
    { name: "Gift Edosa", state: "Edo", lga: "Egor", cat: "returnee", circumstances: "Libya returnee receiving psychological rehab and catering starter kit." },
    { name: "Chidi Nwosu", state: "Abia", lga: "Aba North", cat: "returnee", circumstances: "Voluntary returnee from Mediterranean route. Seeks shoe-making grant." },
    { name: "Toyin Adeleke", state: "Ogun", lga: "Abeokuta South", cat: "returnee", circumstances: "Returned from West African transit point. Enrolled in beauty trade academy." },
    { name: "Emeka Okafor", state: "Anambra", lga: "Onitsha North", cat: "returnee", circumstances: "Mediterranean transit survivor. Enrolled for trading startup kit." },
    { name: "Precious Osas", state: "Edo", lga: "Oredo", cat: "returnee", circumstances: "Returned from Tripoli under joint NCFRMI-IOM charter. Trainee." },
    { name: "Monday Idahosa", state: "Edo", lga: "Esan West", cat: "returnee", circumstances: "Voluntary returnee from Niger Republic transit camps. Farmer." },
    { name: "Samuel Ojo", state: "Ondo", lga: "Akure South", cat: "migrant", circumstances: "Regularized ECOWAS migrant registering residency for work permit." },
    { name: "Daniel Harrison", state: "Lagos", lga: "Ikeja", cat: "migrant", circumstances: "ECOWAS transit worker regularizing identity credentials." },
    { name: "Kelvin Okoro", state: "Delta", lga: "Ughelli North", cat: "returnee", circumstances: "Returned from Libya, participating in community sensitization programs." },
    { name: "Fatimah Yusuf", state: "Kano", lga: "Nassarawa", cat: "returnee", circumstances: "Returned from Niger Republic. Enrolled in family reunification program." }
  ];

  migrantNames.forEach((item, idx) => {
    seed.push({
      id: `mig-seed-${idx + 1}`,
      reference: `NCF/2026/MIG/${3000 + idx}`,
      category: item.cat as any,
      full_name: item.name,
      address: `${item.lga}, ${item.state} State`,
      phone: getRandomPhone(),
      dob: new Date(1985 + Math.floor(Math.random() * 18), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().slice(0, 10),
      gender: idx % 2 === 0 ? "Female" : "Male",
      nationality: "Nigeria",
      state_origin: item.state,
      lga: item.lga,
      dependants: idx % 3,
      circumstances: item.circumstances,
      created_at: getRandomDate2026(idx % 6),
      is_local: false
    });
  });

  return seed;
};
