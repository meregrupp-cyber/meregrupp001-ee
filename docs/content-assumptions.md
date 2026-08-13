# Sisueeldused — kinnitatud, kontrollimist vajavad ja mitteavaldatavad ärifaktid

Seis 2026-08-13. Iga avalik fakt on kas `confirmed` (avalikult mõlemas allikas järjepidev ja
juba avaldatud) või `needs_confirmation` (ei renderdata avalikus UI-s faktina).
Vt ka `docs/needs-confirmation.md` (koondnimekiri omanikule) ja `data/offers.json`
(masinloetav olek iga pakkumise kohta).

## Kinnitatud (avalikult järjepidevad, juba avaldatud faktid)

| fakt | allikas |
|---|---|
| MTÜ Meregrupp, reg 80390699, EHIS 2145600 | mõlemad saidid + prompt |
| Bränd: Allvee Akadeemia / Aquatic Academy | meregrupp.ee |
| Tegutsenud alates 2018 | mõlemad |
| Telefon +372 510 5573 | mõlemad saidid, kattub |
| Aadress: Kauri tee 12-5, Alliku küla, Saue vald, Harju maakond, 76401 | meregrupp.ee jalus + JSON-LD (postiindeks ainult JSON-LD-s) |
| Treeningud Tallinnas ja avavees, aastaringselt | mõlemad |
| Kaheksa renderdatud programmi (01–08) | meregrupp.ee DOM |
| Facebook: facebook.com/meregrupp | mõlemad |
| Domeenid meregrupp.ee, freedive.ee, merehunt.ee kuuluvad organisatsioonile | jalus |

## Lahendatud vastuolud (otsus tehtud, omanik kinnitab üle)

1. **"Päris meri" vs "Real water".** Live-sait: "Päris treening. Päris meri." Projektidokument:
   "Real training. Real water. One breath." → Teostatud projektidokumendi sõnastus
   ("Päris treening. Päris vesi. Üks hingetõmme." / "Real training. Real water. One breath.").
   **Omanik kinnitab.**
2. **"Üheksa programmi" vs 8 plokki.** Tekst ja twitter:description ütlesid "üheksa"; DOM-is ja
   JSON-LD ItemList'is on 8. Otsus: programmide arv tuleb `data/offers.json` massiivist (8);
   kõvakodeeritud "üheksa" eemaldatud kõikjalt (tekst, meta, JSON-LD kirjeldus). Üheksandat
   programmi EI leiutatud. **Omanik ütleb, kas üheksas programm on olemas ja mis see on.**
3. **JSON-LD ItemList defekt.** Vana graaf dubleeris DPV-d (position 5 kaks korda) ja ujumine
   (01) puudus. Parandatud: 8 kirjet positsioonidel 1–8, genereeritud samast andmestikust.
4. **Allveevõitluse areen 3×3 vs 4×4.** UI ütles 4×4 m, JSON-LD 3×3 m. UI on uuem → 4×4 m
   ühtlustatud; **omanik kinnitab õige mõõdu.**
5. **404-lehe auto-redirect avalehele** (meta-refresh 2 s) — eemaldatud kui soft-404 muster.
   Abistav 404-leht linkidega jääb, staatus on päris 404.

## Omaniku otsused 2026-08-13

- **Level 1 hind 180 EUR** — kinnitatud, avaldatud subdomeenil (EN + ET leht, sama URL-paar).
- **AIDA jääb mainimata** — ei staatust, ei isiklikku sertifikaati, ei alla-16 tabelit.
- **freedive.ee cutover lükatud edasi** — staging ootab (vt seo-baseline M2).

## needs_confirmation — EI avaldata faktina enne omaniku kinnitust

Need on freedive.ee-l või mujal avalikult nähtud lähteandmed, mitte avaldamisluba (§10, §18):

- Freediving Level 1 HIND: **180 EUR — confirmed (omanik, 2026-08-13)**. Avaldatud ainult
  freediving.meregrupp.ee-l (hinna ainuke kodu, §3.8). Ülejäänud Level 1 detailid ("all
  included", max 5 m, vanus 18+ / 16–18 hooldajaga, ujumisoskus 100 m, "3 h teooriat + 3 h
  basseini") on endiselt needs_confirmation ega ole avaldatud.
- Level 2: kuni 14 m, eeldab Level 1 — sama olek.
- Introduction/Starter vs Level 1 eristus — omanik defineerib.
- Rummu: sügavused, nähtavus, ligipääs, hooajad, transport, tühistamisloogika, go/no-go protsess.
- Vaate C kuupõhise hooajatabeli iga arv (veetemperatuur, nähtavus, jää, valgus) —
  `data/seasons.json` väljad on `needs_confirmation`; UI näitab kvalitatiivseid vahemikke
  märkega "typical, not guaranteed" ainult seal, kus freedive.ee on sama juba avaldanud
  (aastaringne sh talvine treening), numbrilised väärtused on UI-st väljas.
- Instruktorite pädevusnimetused täpsel kujul (praegused bio-tekstid säilitatud sellisel kujul
  nagu nad juba avalikud on; uusi väiteid ei lisatud).
- Mermaid Sport: lansseerimise hooaeg ("sügis 2026" tuleb `data/offers.json` väljast
  `launch_season_et/en`), sihtrühm, vanusepiirid, waitlist'i omanik.
- Vormide päris sihtkoht, automaatvastus ja lubatav vastamisaeg ("kaks tööpäeva" EI ole
  avaldatud, kuna teenindusstandard pole kinnitatud).
- Arvustused/testimonialid: ühtegi salvestatud loaga arvustust pole → sektsioonid välja jäetud.

## do_not_publish

- Kolmandate osapoolte kataloogide hinnad ja aadressivariant `Kauri tee 12/1` — ei kopeerita.
- Organisatsiooniline AIDA-staatus mis tahes kujul ("AIDA kool/keskus/liige") — keelatud (§3.6).
- Väljamõeldud veetemperatuurid, nähtavusnumbrid, paketihinnad, arvustused, statistika.
- Terviseandmete kogumine turundusvormis (GDPR eriliigiline andme) — vorme ei ehitatud seda küsima.
