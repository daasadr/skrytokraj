import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Seed — první admin + ukázkové body navázané na příběhy z Kroniky.
// Souřadnice jsou přibližné (okolí Petřvaldu na Novojičínsku) — admin je
// pak na mapě doladí na přesná místa.

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@skrytokraj.cz";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "skrytokraj-admin";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Kronikář (admin)";

async function main() {
  // 1) Admin (idempotentně)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin" },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: "admin",
    },
  });
  console.log(`✔ Admin: ${admin.email}`);

  // 2) Ukázkové body — jen pokud ještě žádné nejsou
  const existing = await prisma.mapPoint.count();
  if (existing > 0) {
    console.log(`ℹ Body už existují (${existing}), přeskakuji ukázková data.`);
    return;
  }

  const seedPoints = [
    {
      type: "story_location" as const,
      name: "Skrytci z Hončovy hůrky",
      description:
        "Nejstarší kopec v kraji — prý bývalá sopka. V jeho chodbách čekají poslední kopáči vrstev. Naslouchej znamením v kůře a kamíncích.",
      lat: 49.6975,
      lng: 18.135,
    },
    {
      type: "story_location" as const,
      name: "Páví strážci Petřvaldu",
      description:
        "Erb rodu Petřvaldských nese páva ne pro ozdobu, ale jako slib. Každé oko na peří vidí do jiné vrstvy světa.",
      lat: 49.755,
      lng: 18.1667,
    },
    {
      type: "story_location" as const,
      name: "Švejťák — sklepení ve Staré Vsi",
      description:
        "Nejtemnější z příběhů. Kdo sestoupí bez zbraně a vyslechne příběh až do konce, může jednoho z uvězněných propustit. Linka pro zkušenější.",
      lat: 49.7386,
      lng: 18.129,
    },
    {
      type: "story_location" as const,
      name: "Paní mlh z Poodří",
      description:
        "Tam, kde se Lubina blíží k Odře, drží se mlha déle, než má. Mluví jen v hádankách a za odpovědi žádá to, co je skutečné a upřímné.",
      lat: 49.72,
      lng: 18.1,
    },
    {
      type: "story_location" as const,
      name: "Harty — vesnice, která se propadla",
      description:
        "Kříž přenesený z Hartů do Petřvaldu je jediný pevný bod mezi starou, propadlou vesnicí a tou dnešní. O výročí prý zaslechneš zvon zvonit odjinud.",
      lat: 49.7555,
      lng: 18.16,
    },
    {
      type: "story_location" as const,
      name: "Hraniční strom, Trnávka",
      description:
        "U rybníka v trnáveckém parku roste strom, kde se vrstvy dotýkají nejblíž. Zápisek zanechaný vlastní rukou je slyšet napříč celým krajem.",
      lat: 49.7007,
      lng: 18.095,
    },
    {
      type: "quest" as const,
      name: "Naslouchání u pramene",
      description:
        "Zkušební úkol pro nové kronikáře: najdi znamení u vody a rozlušti, co ti kraj vzkazuje.",
      lat: 49.752,
      lng: 18.158,
    },
    {
      type: "treasure" as const,
      name: "Schránka Kronikářů",
      description: "Ukrytý poklad s prvním střípkem kroniky.",
      lat: 49.7495,
      lng: 18.171,
    },
    {
      type: "ar_location" as const,
      name: "Zjevení pávího strážce",
      description:
        "Místo, kde se v budoucnu (AR) zjeví páví strážce těm, kdo se zastaví bez spěchu.",
      lat: 49.7565,
      lng: 18.1685,
    },
  ];

  await prisma.mapPoint.createMany({
    data: seedPoints.map((p) => ({
      ...p,
      visibility: "public" as const,
      createdById: admin.id,
    })),
  });
  console.log(`✔ Vytvořeno ${seedPoints.length} ukázkových bodů.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
