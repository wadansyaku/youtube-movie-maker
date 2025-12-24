
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const seriesId = 'c5034bb9-366e-487b-86d4-73a7a57e002d';

    // Get the last episode number
    const lastEpisode = await prisma.episode.findFirst({
        where: { seriesId },
        orderBy: { episodeNumber: 'desc' },
    });
    const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1;

    const episode = await prisma.episode.create({
        data: {
            seriesId,
            episodeNumber,
            title: "The Beginning of the Rot 🚽",
            synopsis: "The Generic Mascot finds a glitch in reality and clips into the Backrooms, only to be chased by low-poly entities complaining about tax evasion.",
            status: "draft"
        }
    });

    console.log(`Successfully created Episode ${episode.episodeNumber}: ${episode.title}`);
    console.log(`Episode ID: ${episode.id}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
