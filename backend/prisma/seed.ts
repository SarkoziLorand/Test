import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const agentId = '0b03932f-50b7-486e-b9eb-35445e6ce59d';
    const integrationId = "cmfktfft90000k1u84l3j69wp";
    const name = "Assistant_max_token";
    const key = "1000";

    const integraion = await prisma.integrations.create({
        data: {
            name: "ElevenLabs"
        }
    });

    console.log(integraion);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });