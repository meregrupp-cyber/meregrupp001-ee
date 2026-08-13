# NEEDS_CONFIRMATION — omaniku kinnitust ootavad sisendid

See on §18 nõutud nähtav nimekiri. Ühtegi rida ei ole täidetud oletusega; kinnitamata
väärtus EI ilmu avalikus UI-s faktina. Masinloetav olek: `data/offers.json` →
`fact_status`. Kinnitamiseks: omanik märgib väärtuse, kuupäeva ja nime; seejärel muudetakse
`fact_status: confirmed` ja UI uuendatakse.

## Kursused ja hinnad
- [ ] Introduction/Starter vs Level 1 — kas on kaks eri toodet ja mis neid eristab?
- [x] Level 1 hind: **180 EUR** (omanik kinnitas 2026-08-13; avaldatud ainult freediving.meregrupp.ee-l). Mis hinna sees on — endiselt kinnitamata
- [ ] Level 1 kestus ja jaotus (nähtud: 3 h teooria + 3 h bassein — kas kehtib?)
- [ ] Level 1 sügavus (nähtud: kuni 5 m), vanusepiir (18+ / 16–18 hooldajaga), ujumisnõue (100 m)
- [ ] Level 2 tingimused (kuni 14 m, eeldab Level 1)
- [ ] Järgmised kursusekuupäevad ja mahutavus
- [ ] Tervisenõuded (kus ja kuidas küsitakse — MITTE turundusvormis)

## Rummu
- [ ] Avaldatavad sügavus-, nähtavus- ja temperatuurivahemikud
- [ ] Hooajad ja ligipääs (kas ala on avalik/tasuline/loaga?)
- [ ] Varustus, transport, grupi suurus, buddy/surface-safety protsess
- [ ] Tühistamise loogika ja go/no-go otsustaja sõnastus

## Vaade C hooajatabel
- [ ] Iga kuu veetemperatuur, tüüpiline nähtavus, jää olek, valgustunnid (`data/seasons.json`)

## Inimesed ja pädevused
- [ ] Taniel — pädevusnimetuste täpne loetelu ja sõnastus (praegu avaldatud kujul säilitatud)
- [ ] Ilona — sama
- [x] AIDA: **jääb mainimata** (omaniku otsus 2026-08-13) — ei organisatsiooni staatust,
      ei isiklikku sertifikaati, ei alla-16 tabelit üheski vaates. Testid jõustavad
      (AIDA-stringi keeld mõlemas repos).

## Mermaid Sport
- [ ] Lõplik nimi, sihtrühm, vanusepiirid
- [ ] Lansseerimise aeg (praegu andmefailis "sügis 2026" märkega needs_confirmation)
- [ ] Waitlist'i omanik ja e-posti kogumise õiguslik alus

## Vormid ja teenindus
- [ ] Vormide päris sihtkoht (endpoint/CRM/e-post) — praegu vormid saadavad struktureeritud
      e-kirja kasutaja enda meilikliendi kaudu (mailto), sest backend'i pole
- [ ] Automaatvastus ja lubatav vastamisaeg ("2 tööpäeva" EI ole avaldatud)
- [ ] Privaatsuspoliitika ja turundusnõusoleku tekst (lehte pole — link on jaluses märgitud
      "coming" olekus alles siis, kui omanik teksti annab; praegu linki ei näidata)

## Identiteet
- [x] Ametlik avalik e-post: **meregrupp@gmail.com** (omanik kinnitas 2026-08-13; teostatud kõikjal)
- [ ] Aadressi vorming 12-5 vs 12/1 + kolmandate osapoolte kataloogide parandus
- [ ] Kas "üheksa programmi" oli tekstiviga või on olemas üheksas programm?
- [ ] Allveevõitluse areeni mõõt: 3×3 m või 4×4 m?
- [ ] Hero-sõnastus: "Päris vesi" (projektidokument, teostatud) vs "Päris meri" (vana live)
- [ ] Arvustuste ja fotode/videote avaldamisload (ühtegi arvustust ei avaldatud)
