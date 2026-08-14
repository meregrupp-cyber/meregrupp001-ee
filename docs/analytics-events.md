# Mõõtmise skeem — üks sündmusekeel kõigi kolme domeeni jaoks

Rakendus: `assets/js/analytics.js`. Seadistus: `assets/js/analytics-config.js` (tühi šabloon —
production-ID-d täidab omanik, vt `docs/owner-actions.md`).

## Põhireeglid

1. **Enne nõusolekut ei laadita ühtegi kolmanda osapoole skripti** ega saadeta ühtegi baiti
   välja. Nõusolekuriba kuvatakse ainult siis, kui mõni mõõtmise ID on seadistatud.
2. **Üks tegevus = üks sündmus.** Iga sündmus saab `event_id` ja sama `event_id` ei lähe
   aknas teist korda välja (tavasündmus 10 s, konversioon 30 min ja üle lehe värskenduse,
   sest ID-d elavad `sessionStorage`'is).
3. **Isikuandmeid analüütikasse ei saadeta.** Nimi, e-post, telefon, sõnum, terviseandmed
   filtreeritakse nii võtme kui väärtuse mustri järgi.
4. **Konversioon alles serveri kinnituse järel.** `submit_lead` käivitub ainult pärast
   HTTP 2xx vastust vormi endpoint'ilt (`assets/js/forms.js`).

## Sündmused

| Sündmus | Millal | Kohustuslikud parameetrid |
|---|---|---|
| `view_offer` | pakkumise/raja plokk on vaadatud | `offer`, `language` |
| `select_date` | kasutaja valib kuupäeva või ajavahemiku | `offer`, `horizon` |
| `start_form` | esimene fookus vormil | `offer`, `language` |
| `submit_lead` | endpoint vastas 2xx | `offer`, `language`, `group_size_bucket`, `horizon` |
| `qualified_lead` | server/CRM märgib päringu kvalifitseerituks | `offer`, `source` |
| `booking_confirmed` | koht on päriselt kinnitatud | `offer` |
| `join_waitlist` | ootenimekirjaga liitumine | `list_type`, `language` |

`qualified_lead` ja `booking_confirmed` **ei tohi** tulla brauserist oletusena — need
saadab server või CRM kinnitatud olekust.

Iga sündmus saab automaatselt kaasa: `event_id`, `language`, `campaign_source`,
`campaign_medium`, `campaign_name`, `original_referrer`.

## Kutsumine

```js
window.mgTrack && mgTrack('view_offer', { offer: 'rummu-fundive', language: 'et' });

// oma dedup-võti, kui parameetrid muutuvad, aga tegevus on sama
mgTrack('submit_lead', { offer: 'start' }, { dedupeKey: 'start|2026-09' });
```

## Omistamine üle domeenide

`freedive.ee → freediving.meregrupp.ee` hüppel peab kampaaniaallikas säilima:

- esimene UTM-iga külastus salvestatakse sessiooni; ilma UTM-ita külastus **ei kustuta**
  olemasolevat allikat;
- algne (väline) viitaja salvestatakse eraldi ja liigub edasi parameetriga `mg_or`;
- väljuvad lingid teistele oma domeenidele (`crossDomains`) saavad puuduvad `utm_*` ja
  `mg_or` automaatselt külge;
- kui GA4 on sees, lisatakse ka natiivne linker (`linker.domains`, `accept_incoming`).

## Kontroll enne reklaami avamist

```js
// 1. konsoolis: sündmused ilma nõusolekuta jäävad ainult mällu
mgConsent.get()            // null
mgTrack('view_offer', {offer:'test'})
mgEventQueue.length        // 1
// 2. dubleerimise test: sama sündmus uuesti
mgTrack('view_offer', {offer:'test'})
mgEventQueue.length        // ikka 1 — duplikaat jäi vahele
// 3. nõusolek + üks vormisaatmine = täpselt üks submit_lead
mgConsent.grant()
```

Automaattest: `node tests/check.mjs` kontrollib, et konto-ID-sid ei ole koodis ja et
deduplikatsiooni- ning PII-loogika on failis olemas; `node tests/analytics.test.mjs`
käivitab dedup-loogika päriselt (JSDOM-ita, minimaalse storage-mock'iga).
