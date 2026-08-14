# freedive.ee värava deploy-juhis (Vaade C)

See kaust on **staging** meregrupp.ee repos. freedive.ee on eraldi staatiline sait
Cloudflare'i taga — sellele repole siit ligipääsu ei ole, seega cutover on käsitsi samm.

## Eeltingimus (§6.3)

**Vaade B (`https://meregrupp.ee/en/freediving/`) peab olema live enne**, kui freedive.ee
kursusesisu asendatakse — muidu kaotavad kursusepäringud sihtkoha.

## Sammud

1. Kopeeri `index.html` freedive.ee origin'i juureks.
2. **Eemalda** rida `<meta name="robots" content="noindex" />` (staging-kaitse; §6.3 —
   production'i ei tohi noindex kaasa tulla).
3. Asenda `../assets/...` viited freedive.ee omadega:
   - CSS/JS/fondid: kopeeri `assets/css/`, `assets/js/`, `assets/fonts/` kaustad kaasa
     (sh `assets/js/analytics-config.js` — tühi šabloon; ID-d täidab omanik, vt
     `docs/owner-actions.md`. Ilma failita ei laadi leht ühtegi mõõtmisskripti.)
     (või viita absoluutselt `https://meregrupp.ee/assets/...` — NB: siis sõltub värav
     meregrupp.ee kättesaadavusest; kopeerimine on eelistatud).
   - Fotod: asenda asset-slot'id (hero, Rummu galerii, jää) freedive.ee `media/` päris
     piltidega, kui omanik need annab (vt puuduvate sisendite nimekiri lõppraportis).
4. Kontrolli Cloudflare'is ENNE origin-muudatusi (§6.1): olemasolevad Page Rules,
   Bulk Redirects ja Workerid — ära lisa konkureerivat redirect-kihti. Fragmendid
   (#courses, #youth) EI vaja Cloudflare'i reegleid: kaardistus on lehe JS-is.
5. E-posti kaitse: vana leht kasutas `cdn-cgi/l/email-protection`. Uus leht EI avalda
   ühtki paljast mailto-aadressi peale seasons-waitlisti mailto (mis on Cloudflare'i
   automaatse obfuskatsiooni all, kui "Email Address Obfuscation" on sees — kontrolli,
   et see funktsioon on lubatud, või asenda link viitega meregrupp.ee kontaktile).
6. Smoke-testid pärast cutover'it: `/` annab 200; `#method`, `#training`, `#contact`
   keritakse õigesse kohta; `#courses` viib Vaate B Start-sektsioonile koos
   `utm_source=freedive_ee&route=start` parameetritega; üleandmisklikk jõuab B-sse ühe
   seansina (§13 cross-domain test); mobiilivaade 320 px ilma horisontaalse scroll'ita.
7. Rollback: hoia vana `index.html` origin'is nimega `index.legacy.html` kuni 90 päeva
   ülevaatuseni (docs/90-day-review.md) — tagasipööramine on üks failivahetus.

## Mida siia EI tohi lisada (§11, §22)

Hinda, kursusekaarti, broneerimisvormi, AIDA organisatsiooniväiteid, alla-16 tabelit
(kuni omaniku otsuseta), väljamõeldud temperatuure/nähtavusi.
