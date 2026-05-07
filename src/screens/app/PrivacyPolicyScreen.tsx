import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "1. Prikupljanje podataka",
    body: "Prikupljamo sledeće lične podatke: ime i prezime, email adresu, broj telefona i datum rođenja. Ovi podaci se koriste isključivo za upravljanje zakazivanjem termina u ordinaciji.",
  },
  {
    title: "2. Upotreba podataka",
    body: "Vaši podaci se koriste za: zakazivanje i upravljanje terminima, slanje podsetnika o terminima putem push notifikacija, te komunikaciju između pacijenta i ordinacije.",
  },
  {
    title: "3. Čuvanje podataka",
    body: "Podaci se čuvaju na sigurnim serverima kompanije Supabase, u skladu sa GDPR regulativom. Pristup podacima imaju isključivo ovlašćeni zaposleni ordinacije.",
  },
  {
    title: "4. Vaša prava",
    body: "Imate pravo da zatražite uvid u, ispravku ili brisanje vaših ličnih podataka. Za sve zahteve možete kontaktirati ordinaciju na adresu: kontakt@stomaordinacija.rs",
  },
  {
    title: "5. Lokalno skladište",
    body: "Aplikacija koristi lokalno skladište uređaja (AsyncStorage) isključivo za čuvanje sesije i email adrese za auto-popunjavanje pri prijavi. Ovi podaci se ne dele sa trećim stranama.",
  },
  {
    title: "6. Push notifikacije",
    body: "Sa vašim pristankom, šaljemo podsetnik 24 sata pre zakazanog termina i potvrdu neposredno nakon zakazivanja. Notifikacije možete isključiti u podešavanjima uređaja.",
  },
  {
    title: "7. Izmene politike",
    body: "Zadržavamo pravo izmene ove politike privatnosti. O svim značajnim izmenama bićete obavešteni putem aplikacije.",
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Poslednje ažuriranje: 1. januar 2025.</Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: "#9CA3AF", marginBottom: 20 },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  sectionBody: { fontSize: 14, color: "#4B5563", lineHeight: 22 },
});
