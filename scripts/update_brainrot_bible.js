
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const seriesId = 'c5034bb9-366e-487b-86d4-73a7a57e002d';

    const worldBibleData = {
        visualStyle: JSON.stringify({
            colorPalette: ["#FF00FF", "#00FF00", "#FFFF00", "#FF0000", "#0000FF"],
            lightingStyle: "harsh-flash-overexposed",
            cameraStyle: "shaky-cam-zoom-abuse-dynamic",
            aspectRatio: "9:16",
            runwayWorkflow: "gen3-alpha-turbo",
            notes: "Overstimulated visual chaos, deep fried filters, glitch effects, subconscious imagery"
        }),
        audioStyle: JSON.stringify({
            genre: "brainrot-core/phonk/breakcore",
            tempo: "extreme-rapid",
            mood: "chaotic-absurdist-hyperactive",
            instruments: ["vine-boom", "air-horn", "bass-boosted-808", "tts-voice", "metal-pipe-falling"],
            sunoStyle: "chaotic electronic, rapid fire vocal samples",
            notes: "Constant audio stimulation, ZERO silence allowed from start to finish"
        }),
        characters: JSON.stringify([
            {
                name: "The Generic Mascot",
                description: "An uncanny valley mascot character that guides the viewer through the nonsense.",
                visualTraits: "Low poly, wide eyes, fixed smile, possibly floating",
                voiceStyle: "AI TTS (Male fast / Chipmunk pitch)"
            },
            {
                name: "Glitch Entity",
                description: "A being made of datamoshing artifacts.",
                visualTraits: "Constantly shifting pixels, RGB split",
                voiceStyle: "Bitcrushed noise"
            }
        ]),
        settings: JSON.stringify([
            {
                name: "Liminal Backrooms",
                description: "The default background for most scenes.",
                visualDescription: "Yellow wallpaper, fluorescent buzz, infinite empty office space",
                promptKeywords: ["liminal space", "backrooms", "unsetyling", "fluorescent light"]
            },
            {
                name: "The Void",
                description: "A checkerboard plane where PNGs float.",
                visualDescription: "Retro CGI, vaporwave aesthetic, floating objects",
                promptKeywords: ["checkerboard floor", "90s cgi", "floating objects", "surreal"]
            }
        ]),
        rules: JSON.stringify({
            mustInclude: [
                "Rapid fire subtitles (center screen)",
                "At least one 'Vine Boom' every 5 seconds",
                "Visual overstimulation (Gameplay footage split screen if needed)"
            ],
            mustAvoid: [
                "Logic",
                "Silence",
                "Slow pacing",
                "Coherent storytelling (keep it dreamlike)"
            ],
            styleGuidelines: [
                "Edit needs to be faster than cognitive comprehension",
                "Use high contrast and saturation",
                "Target Gen Alpha humor/memes"
            ]
        })
    };

    await prisma.worldBible.upsert({
        where: { seriesId },
        update: worldBibleData,
        create: {
            seriesId,
            ...worldBibleData
        }
    });

    console.log('Successfully updated World Bible for New Brainrot');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
