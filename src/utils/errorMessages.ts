const ERROR_MAP: Record<string, string> = {
  "invalid login credentials": "Netačan email ili lozinka. Molimo pokušajte ponovo.",
  "invalid_credentials": "Netačan email ili lozinka. Molimo pokušajte ponovo.",
  "email not confirmed": "Email adresa nije potvrđena. Proverite vaš inbox.",
  "user already registered": "Nalog sa ovim emailom već postoji.",
  "email already in use": "Nalog sa ovim emailom već postoji.",
  "password should be at least": "Lozinka mora imati najmanje 8 karaktera.",
  "weak password": "Lozinka nije dovoljno jaka. Dodajte velika slova i brojeve.",
  "network request failed": "Greška u mreži. Proverite internet konekciju.",
  "fetch error": "Greška u mreži. Proverite internet konekciju.",
  "user not found": "Korisnik nije pronađen.",
  "too many requests": "Previše pokušaja. Sačekajte nekoliko minuta pa pokušajte ponovo.",
  "rate limit exceeded": "Previše pokušaja. Sačekajte nekoliko minuta pa pokušajte ponovo.",
  "email change": "Promena emaila je poslata — proverite inbox.",
  "password recovery": "Link za oporavak lozinke je poslat na vaš email.",
  "token expired": "Sesija je istekla. Prijavite se ponovo.",
  "jwt expired": "Sesija je istekla. Prijavite se ponovo.",
};

export function translateError(message: string): string {
  if (!message) return "Došlo je do greške. Molimo pokušajte ponovo.";
  const lower = message.toLowerCase();
  for (const [key, translation] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return translation;
  }
  return "Došlo je do greške. Molimo pokušajte ponovo.";
}
