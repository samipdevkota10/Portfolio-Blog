import { firestore } from "@/lib/firebase/admin";
import { htmlToTiptapJson, tiptapToHtml, tiptapToText } from "@/lib/content/richtext";
import { slugify } from "@/lib/utils";

function paragraphsToHtml(...blocks: (string | undefined | null)[]): string {
  return blocks
    .map((block) => (block ?? "").trim())
    .filter(Boolean)
    .map((block) => `<p>${block}</p>`)
    .join("\n");
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Best-effort parse of a period string like "August 2024 - December 2024" into a start Date. */
function parseStartDate(period: string): Date {
  const start = period.split(/[-–—]/)[0]?.trim() ?? "";
  const match = start.match(/([a-zA-Z]+)?\s*(\d{4})/);
  if (match) {
    const month = match[1] ? MONTHS[match[1].toLowerCase()] ?? 0 : 0;
    const year = Number(match[2]);
    return new Date(Date.UTC(year, month, 1));
  }
  return new Date(0);
}

async function migrateProjects(db: FirebaseFirestore.Firestore) {
  const snapshot = await db.collection("projects").get();
  let migrated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Already normalized — leave it alone.
    if (data.title && data.bodyHtml) {
      skipped += 1;
      continue;
    }

    const name = String(data.Name ?? data.name ?? "").trim();
    if (!name) {
      console.log(`  skip junk project doc ${doc.id} (no name)`);
      skipped += 1;
      continue;
    }

    const description = String(data.description ?? "").trim();
    const bodyJson = htmlToTiptapJson(paragraphsToHtml(description) || "<p></p>");
    const technologies = toStringArray(data.tech ?? data.technologies);
    const link = String(data.link ?? "").trim();
    const githubUrl = String(data.githubUrl ?? "").trim();

    const now = new Date();
    await doc.ref.set(
      {
        slug: slugify(name),
        title: name,
        summary: description,
        bodyJson,
        bodyHtml: tiptapToHtml(bodyJson),
        bodyText: tiptapToText(bodyJson),
        role: "",
        technologies,
        impact: [],
        githubUrl: githubUrl || null,
        liveUrl: link || null,
        coverImage: data.coverImage ?? null,
        status: "published",
        featured: true,
        publishedAt: now,
        updatedAt: now,
        createdAt: data.createdAt ?? now,
      },
      { merge: true },
    );
    console.log(`  migrated project: ${name}`);
    migrated += 1;
  }

  console.log(`projects: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateExperiences(db: FirebaseFirestore.Firestore) {
  const snapshot = await db.collection("Experiences").get();
  let migrated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Already normalized — leave it alone.
    if (data.title && data.bodyHtml) {
      skipped += 1;
      continue;
    }

    const role = String(data.role ?? data.title ?? "").trim();
    if (!role) {
      console.log(`  skip junk experience doc ${doc.id} (no role)`);
      skipped += 1;
      continue;
    }

    const company = String(data.company ?? data.Company ?? "").trim();
    const description = String(data.description ?? "").trim();
    const description2 = String(data.description2 ?? "").trim();
    const period = String(data.year ?? data.period ?? "").trim();
    const technologies = toStringArray(data.technologies);
    const bodyJson = htmlToTiptapJson(paragraphsToHtml(description, description2) || "<p></p>");

    const now = new Date();
    await doc.ref.set(
      {
        slug: slugify(`${role}-${company}`),
        title: role,
        company,
        location: String(data.location ?? "").trim(),
        summary: description,
        bodyJson,
        bodyHtml: tiptapToHtml(bodyJson),
        bodyText: tiptapToText(bodyJson),
        technologies,
        featured: true,
        period,
        startDate: parseStartDate(period),
        endDate: null,
        updatedAt: now,
        createdAt: data.createdAt ?? now,
      },
      { merge: true },
    );
    console.log(`  migrated experience: ${role} @ ${company}`);
    migrated += 1;
  }

  console.log(`experiences: ${migrated} migrated, ${skipped} skipped`);
}

async function main() {
  if (!firestore) {
    throw new Error("Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT.");
  }
  await migrateProjects(firestore);
  await migrateExperiences(firestore);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
