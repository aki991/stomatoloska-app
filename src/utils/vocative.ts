const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Converts a Serbian first name to its vocative form.
 * Simplified rules (covers the vast majority of Serbian names):
 *   -ica  →  -ice   (Milica → Milice, Jelica → Jelice, Danica → Danice)
 *   -a    →  -o     (Marija → Marijo, Luka → Luko, Ana → Ano)
 *   vowel →  same   (Marko, Pero, Miloje — already sound like vocative)
 *   cons. →  + "e"  (Ivan → Ivane, Petar → Petare [simplified])
 */
export function toVocative(name: string): string {
  if (!name) return name;

  const lower = name.toLowerCase();
  const last = lower[lower.length - 1];

  if (lower.endsWith("ica")) {
    return name.slice(0, -3) + "ice";
  }

  if (last === "a") {
    return name.slice(0, -1) + "o";
  }

  if (VOWELS.has(last)) {
    return name;
  }

  return name + "e";
}
