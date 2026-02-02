import { db } from "./db";

async function main() {
  // Contract accounts (unique by enum name)
  await db.contractAccount.upsert({
    where: { accountName: "OCU" },
    create: { accountName: "OCU" },
    update: {},
  });
  await db.contractAccount.upsert({
    where: { accountName: "BASS" },
    create: { accountName: "BASS" },
    update: {},
  });
  await db.contractAccount.upsert({
    where: { accountName: "EVO" },
    create: { accountName: "EVO" },
    update: {},
  });
  await db.contractAccount.upsert({
    where: { accountName: "Academy" },
    create: { accountName: "Academy" },
    update: {},
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
