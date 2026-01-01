import { prisma } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

interface TemplateData {
    type: string;
    lane: string | null;
    name: string;
    isDefault: boolean;
    content: Record<string, unknown>;
    variables: string[];
}

interface TemplatesFile {
    templates: TemplateData[];
}

async function seedTemplates() {
    console.log('🌱 Seeding production templates...');

    const templatesPath = path.join(__dirname, '../templates/production-templates.json');
    const templatesData: TemplatesFile = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

    for (const template of templatesData.templates) {
        const existing = await prisma.productionTemplate.findFirst({
            where: {
                type: template.type,
                name: template.name,
            },
        });

        if (existing) {
            console.log(`  ⏭️  Skipping existing: ${template.name}`);
            continue;
        }

        await prisma.productionTemplate.create({
            data: {
                type: template.type,
                name: template.name,
                lane: template.lane,
                content: JSON.stringify(template.content),
                variables: JSON.stringify(template.variables),
                isDefault: template.isDefault,
            },
        });

        console.log(`  ✅ Created: ${template.name}`);
    }

    console.log('✨ Template seeding complete!');
}

seedTemplates()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
