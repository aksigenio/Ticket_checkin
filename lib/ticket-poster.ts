import { readFile } from "fs/promises";
import { join } from "path";

const POSTER_CID = "ticket-poster@mir-dver";

const CANDIDATES = [
  { name: "ticket-poster.png" as const, ext: "png" as const },
  { name: "ticket-poster.jpg" as const, ext: "jpeg" as const },
  { name: "ticket-poster.jpeg" as const, ext: "jpeg" as const },
];

/** Афиша для письма с билетом: положите `ticket-poster.png` (или .jpg) в папку `email-assets/`. */
export async function loadTicketPosterForEmail(): Promise<{
  buffer: Buffer;
  attachmentFilename: string;
} | null> {
  const dir = join(process.cwd(), "email-assets");
  for (const { name, ext } of CANDIDATES) {
    try {
      const buffer = await readFile(join(dir, name));
      return { buffer, attachmentFilename: ext === "png" ? "afisha.png" : "afisha.jpg" };
    } catch {
      /* try next */
    }
  }
  return null;
}

export { POSTER_CID };
