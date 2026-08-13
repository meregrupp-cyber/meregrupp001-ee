# 90 päeva ülevaatus — Search Console'i võrdlusprotokoll

Käivitada ~90 päeva pärast cutover'it (cutover'i kuupäev: ____-__-__ → ülevaatus: ____-__-__).
Eeldus: kõik kolm keskkonda (meregrupp.ee, freediving-tee, freedive.ee) on Search Console'is
verifitseeritud ja ühes analüütikas. Seisuga 2026-08-13 ligipääsu polnud — omanik lisab.

## 1. Näitamised ja klikid domeeni ja klastri kaupa

Iga `docs/keyword-ownership.csv` klastri kohta: näitamised, klikid, keskmine positsioon
võrdluses cutover'i-eelse 90 päevaga (Search Console → Performance → võrdlusrežiim).

| klaster | omanik-URL | enne (näit/klikid/pos) | pärast | muutus | otsus |
|---|---|---|---|---|---|
| (täida CSV-st) | | | | | |

Punane lipp: klaster, mille omanik-URL kaotas >30% klikke ilma, et teine oma leht võitis.

## 2. Kannibalisatsiooni kontroll

Search Console → iga kursuseklastri päring → milised URL-id said näitamisi.
Kui freedive.ee saab endiselt näitamisi kursusepäringutele (`freediving course`, `Level 1`,
`price`), kontrolli: (a) kas fragmendikaardistus töötab, (b) kas Google on uue värava sisu
indekseerinud (URL Inspection), (c) kas Vaade B on sitemapis ja indekseeritud.
Kahe domeeni sama päringu esinemus = defekt, mitte võit.

## 3. Värav → broneerimissaidi suunamismäär

Analüütikas: seansid freedive.ee-lt, mis jõuavad Vaatele B
(`utm_source=freedive_ee & utm_medium=referral & utm_campaign=gateway`), ja neist
`start_form`/`submit_lead` sündmusteni jõudnute osakaal. Kui üleandmine on <5% värava
seanssidest, vaata üle värava CTA-d ja "Start here" sektsioon.

## 4. Konsolideerimisotsus

Alles nende andmete põhjal otsustada, kas freedive.ee jääb eraldi väravaks või
konsolideeritakse meregrupp.ee alla (301-dega). **Mitte varem** (§6.2: kogu domeeni
ümbersuunamise otsust ei tehta ilma 90 päeva otsinguandmete või eraldi korralduseta).

## 5. Tehniline kontroll samal ülevaatusel

- soft-404 ja 404 raport mõlemal domeenil — kas mõni vana URL kukub tundmatult
- Core Web Vitals väljas (field data) vs meie lab-mõõtmised
- llms.txt ja robots.txt endiselt kättesaadavad
- sitemap'i kaetus: kõik esitatud URL-id indekseeritud või põhjendatud erand
