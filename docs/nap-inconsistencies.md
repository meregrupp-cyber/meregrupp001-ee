# NAP-lahknevused (nimi, aadress, telefon, e-post)

Seis 2026-08-13. Reegel: üks NAP kõikjal, jõustatud failist `data/organisation.json` (§3.7).
Ükski alljärgnev lahknevus EI ole saidile kopeeritud.

## E-post — kolm varianti ringluses (defekt)

| allikas | väärtus |
|---|---|
| meregrupp.ee UI (jalus + mailto) | `allveeakadeemia@meregrupp.ee` |
| meregrupp.ee JSON-LD | `info@meregrupp.ee` |
| freedive.ee (cdn-cgi obfuskeeritud) | `meregrupp@gmail.com` |

**OTSUSTATUD (omanik, 2026-08-13):** ametlik avalik aadress on **`meregrupp@gmail.com`**.
Kogu uus teostus (UI, mailto-lingid, JSON-LD, llms.txt, `data/organisation.json`) kasutab
ainult seda. `allveeakadeemia@meregrupp.ee` ja `info@meregrupp.ee` on saidilt eemaldatud;
omanik otsustab ise, kas hoiab need aadressid edasisuunamisel.

## Aadress

| allikas | väärtus |
|---|---|
| meregrupp.ee jalus + JSON-LD | Kauri tee **12-5**, Alliku küla, Saue vald, Harju maakond, 76401 |
| freedive.ee | postiaadress puudub üldse |
| TripAdvisor / freedivingcentre.com / Google (prompti §4.2 järgi) | Kauri tee **12/1** |

**Otsus vajalik:** omanik kinnitab õige vormingu (12-5 eeldatav, kuna see on tema enda saidil)
ja parandab kolmandate osapoolte kirjed ise — meie neid ei muuda ega kopeeri.

## Telefon

`+372 510 5573` — kattub kõigis allikates. Kirjapilt ühtlustatud kujule `+372 510 5573`
(vana jalus näitas `+372 5105573`).

## Lahtiolekuloogika

Kummalgi saidil pole avaldatud lahtiolekuaegu ega broneerimisakent. Ei lisatud —
`needs_confirmation`.

## Google Business Profile

Prompti §14.4: GBP peab osutama ühele põhi-URL-ile. **Soovitus: `https://meregrupp.ee/`.**
Vajab omaniku tegevust GBP kontol; siit repost seda muuta ei saa.

## Kolmandate osapoolte kataloogid (mitte kopeerida)

TripAdvisor, freedivingcentre.com ja Google näitavad aadressivarianti 12/1 ja hindu, mis
võivad olla aegunud. Tegevus omanikule: pärast e-posti ja aadressi kinnitamist uuendada
kirjed käsitsi igas kataloogis. Nende sisu ei ole üle kantud saidile.
