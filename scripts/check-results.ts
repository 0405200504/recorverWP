import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log("== LEADS ==");
    const leads = await prisma.lead.findMany();
    console.log(leads);

    console.log("\n== ORDERS ==");
    const orders = await prisma.order.findMany();
    console.log(orders);

    console.log("\n== RECOVERY RUNS ==");
    const runs = await prisma.recoveryRun.findMany({ include: { dispatches: true } });
    console.log(JSON.stringify(runs, null, 2));

    await prisma.$disconnect();
}

run().catch(console.error);
