import type { ReligionId } from "./types";

export type DenFighter = {
  id: string;
  name: string;
  title: string;
  religionId: ReligionId;
  city: string;
  lane: string;
  bio: string;
  portraitSeed: string;
  summonName: string;
};

export const denFighters: DenFighter[] = [
  {
    id: "fighter-mara-ember",
    name: "Mara Okonkwo",
    title: "Hearthbrand zealot",
    religionId: "ember_covenant",
    city: "Cleveland, OH",
    lane: "Operator",
    bio: "Runs a three-bay fab shop by day. Swears the forge answers honest questions.",
    portraitSeed: "mara-okonkwo-ember",
    summonName: "Brass Tick"
  },
  {
    id: "fighter-tom-ember",
    name: "Tomás Delgado",
    title: "Coal choir captain",
    religionId: "ember_covenant",
    city: "San Antonio, TX",
    lane: "Builder",
    bio: "Welds food-truck frames and sings to the torch like it is family.",
    portraitSeed: "tomas-delgado-ember",
    summonName: "Candle Mole"
  },
  {
    id: "fighter-elise-tide",
    name: "Elise Whitaker",
    title: "Salt Psalm reader",
    religionId: "tide_canticle",
    city: "Tampa, FL",
    lane: "Connector",
    bio: "Books harbor vendors and always returns borrowed luck with interest.",
    portraitSeed: "elise-whitaker-tide",
    summonName: "Paper Wren"
  },
  {
    id: "fighter-jun-tide",
    name: "Jun Park",
    title: "Brine registrar",
    religionId: "tide_canticle",
    city: "Seattle, WA",
    lane: "Backer",
    bio: "Keeps tide tables in a pocket notebook and funds boring, beautiful fixes.",
    portraitSeed: "jun-park-tide",
    summonName: "Goop Kit"
  },
  {
    id: "fighter-rosa-veil",
    name: "Rosa Mendez",
    title: "Mirror Debt broker",
    religionId: "copper_veil",
    city: "Chicago, IL",
    lane: "Connector",
    bio: "Introduces people who should have met years ago, then disappears.",
    portraitSeed: "rosa-mendez-veil",
    summonName: "Paper Wren"
  },
  {
    id: "fighter-ian-veil",
    name: "Ian Mercer",
    title: "Velvet knocker",
    religionId: "copper_veil",
    city: "Nashville, TN",
    lane: "Spark",
    bio: "Finds half-dead venues and convinces them they are still worth a crowd.",
    portraitSeed: "ian-mercer-veil",
    summonName: "Coil Mouse"
  },
  {
    id: "fighter-grace-root",
    name: "Grace Holloway",
    title: "Loam Oath keeper",
    religionId: "root_compact",
    city: "Boise, ID",
    lane: "Builder",
    bio: "Grows starter plants for restaurant patios and refuses fast money.",
    portraitSeed: "grace-holloway-root",
    summonName: "Candle Mole"
  },
  {
    id: "fighter-darnell-root",
    name: "Darnell Brooks",
    title: "Root compact marshal",
    religionId: "root_compact",
    city: "Atlanta, GA",
    lane: "Operator",
    bio: "Schedules crews like orchard rows — slow, steady, impossible to uproot.",
    portraitSeed: "darnell-brooks-root",
    summonName: "Brass Tick"
  },
  {
    id: "fighter-priya-spark",
    name: "Priya Shah",
    title: "Coil Cant inventor",
    religionId: "spark_choir",
    city: "Austin, TX",
    lane: "Spark",
    bio: "Prototypes odd machines in a garage that smells like ozone and coffee.",
    portraitSeed: "priya-shah-spark",
    summonName: "Coil Mouse"
  },
  {
    id: "fighter-omar-spark",
    name: "Omar Haddad",
    title: "Spark choir conductor",
    religionId: "spark_choir",
    city: "Detroit, MI",
    lane: "Builder",
    bio: "Turns dead retail boxes into maker floors one honest lease at a time.",
    portraitSeed: "omar-haddad-spark",
    summonName: "Goop Kit"
  }
];

export const fighterById = Object.fromEntries(denFighters.map((f) => [f.id, f])) as Record<
  string,
  DenFighter
>;

export function fightersForReligion(religionId: ReligionId): DenFighter[] {
  return denFighters.filter((f) => f.religionId === religionId);
}

export function defaultOpponent(religionId: ReligionId): DenFighter {
  return fightersForReligion(religionId)[0] ?? denFighters[0]!;
}

export function playerHerald(religionId: ReligionId | null, seed = "player-herald"): DenFighter {
  if (!religionId) {
    return {
      id: "player-unpledged",
      name: "You",
      title: "Unpledged wanderer",
      religionId: "copper_veil",
      city: "The Den",
      lane: "Connector",
      bio: "Pick a religion to stand with a crew.",
      portraitSeed: seed,
      summonName: "—"
    };
  }
  const pool = fightersForReligion(religionId);
  const pick = pool[hashPick(seed, pool.length)] ?? pool[0]!;
  return {
    ...pick,
    id: "player-herald",
    name: "You",
    title: `${pick.title} (your mantle)`,
    bio: `Standing with ${pick.name}'s tradition — same fire, your hands.`,
    portraitSeed: `${seed}-${religionId}`
  };
}

function hashPick(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h + seed.charCodeAt(i) * (i + 1)) % mod;
  return h;
}
