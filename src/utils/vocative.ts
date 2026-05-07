const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Conservative vocative for Serbian first names. Reliable transforms only:
 *   vowel  → unchanged  (Marko, Pero, Ana, Marija, Nikola, Nemanja…)
 *   cons.  → + "e"      (Ivan → Ivane, Petar → Petare)
 *
 * The classic -a → -o rule is intentionally skipped: it would mangle
 * common male names ending in -a (Nikola, Nemanja, Luka, …). Leaving
 * those names unchanged is preferable to producing wrong forms.
 */
export function toVocative(name: string): string {
  if (!name) return name;

  const last = name[name.length - 1].toLowerCase();

  if (VOWELS.has(last)) {
    return name;
  }

  return name + "e";
}
