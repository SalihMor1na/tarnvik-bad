# Tärnvik Bad

Kallbadhus och spa i Fjällbacka, Bohuslän. Statisk sajt — HTML, CSS och
vanilla JS med GSAP och Lenis från CDN. Ingen byggkedja.

## Kör lokalt

```bash
python -m http.server 5183 --directory tarnvik-bad
```

Sedan `http://localhost:5183`. Vilken statisk server som helst duger.

## Filer

```
index.html              startsidan
404.html                egen felsida
integritetspolicy.html
villkor.html
tillganglighet.html     inklusive kända brister
nyhetsbrev.html
css/style.css           hela designsystemet
js/main.js              rörelsesystemet för startsidan
js/sida.js              reducerad version för undersidorna
favicon.svg
```

## Designsystem

Alla värden ligger som CSS-variabler i `:root` högst upp i `style.css`.
Sektioner byter yta via `data-bg="light|dark"`, som skriver om `--bg`,
`--fg`, `--fg-soft`, `--rule` och `--shadow`. Header och scrollindikator
följer med genom `initThemeChange`, som sätter `theme_on-light` respektive
`theme_on-dark` på varje `[data-theme]`.

**Färg.** En kall tallgrön bas (`--pine-900` `#0E1B18`), en varm linnetonad
ljusyta (`--linen-50` `#F5F0E7`) och en enda accent, kopparbränd
(`--copper` `#A6653C`). Alla gråtoner är tonade åt samma håll. Skuggor bär
underlagets kulör i stället för svart.

**Typografi.** Fraunces som display med variabelaxlarna `SOFT` och `WONK` —
kursiven med `WONK 1` gör accentorden. DM Sans till brödtext, etiketter och
formulär. Siffror sätts med `font-variant-numeric: tabular-nums` via
klassen `.num`.

**Rytm.** `--sec-t` / `--sec-b` ger sektionerna optiskt tyngre bottenmarginal
än toppmarginal. Radier varieras medvetet: hårdare inuti, mjukare på
behållare.

**Bilder** har ett gemensamt duotonlager (`.duotone`) ovanpå
`filter: grayscale(1)`. Det gör att vilken bild som helst läser som samma
art direction.

## Rörelsesystemet

Ett gemensamt ordförråd, samma tidsvärden överallt:

| | |
|---|---|
| `durS` / `durM` / `durL` | 0,4 / 0,8 / 1,2 s |
| `stagger` | 0,1 s |
| `delayReveal` | 0,3 s |
| `InOut` | `0.75,0,0.25,1` |
| `Out` | `0.25,1,0.5,1` |
| `In` | `0.5,0,0.75,0` |
| `diveIn` | `0.6,0,0,1` |

### Attribut

Sätt `data-scroll-reveal="w"` på ett block och låt barnen bära typen. Hela
gruppen kaskadar då från en enda trigger.

| Attribut | Vad som händer |
|---|---|
| `data-scroll-reveal="a"` | displaytecken tumlar in i X-led, `rotateX 90 → 0` |
| `data-scroll-reveal="h"` | rubriktecken svänger in kring Y-axeln |
| `data-scroll-reveal="p"` | hela rader stiger ur sin egen mask |
| `data-scroll-reveal="ctn"` | behållare och knappar lyfter och tonar in |
| `data-scroll-reveal="line"` | linjer ritar sig uppifrån och ned |
| `data-scroll-reveal="slide"` | bild sveper upp medan fotot inuti går tillbaka till skala 1 |
| `data-parallax="w"` + `img` / `img-out` / `ctn-up` / `ctn-down` | fyra parallaxdjup, bara `transform` |
| `data-magnetic-btn` (+ `data-magnetic-strength`) | knappen dras mot pekaren, släpper elastiskt |
| `hover-link` med två `[hover="text"]` | tecken flippar ut i Y-led, understrykning dras undan |
| `hover-nav-item` med två `[hover="text"]` | två etiketter rullar över varandra |
| `data-scroll-horizontal` + `data-horizontal-track` | pinnad sektion som scrubbas i sidled |
| `data-index` + `data-index="text"` | numrerar om till 1.0, 2.0, 3.0 från DOM-ordning |

### Fem fällor som är lösta i koden

**Texten delas först när typsnittet har landat.** Delas en text under
webbfontens blockperiod mäts varje ord till noll bredd och stycket hamnar
med ett ord per rad. Boot väntar därför på `document.fonts.ready` (med tak
på 3 s), och alla `SplitText` körs med `autoSplit: true` så att de delas om
vid fontbyte och storleksändring. `onSplit` återställer elementets läge via
`el._state`.

**Delad text kollapsar i varje shrink-to-fit-låda.** `SplitText` byter ut
texten mot radmasker på blocknivå. Sitter elementet i en flexkolumn med
`align-items: start`, i ett krympande flexobjekt i rad, eller i något annat
som mäter `fit-content`, blir bredden lika med det längsta ordet — ett ord
per rad. Därför har inga kolumncontainrar med brödtext `align-items: start`
längre; knappar och länkar som inte ska sträckas får `align-self: start`
var för sig. Lägger du till en ny sektion: ge textelementet full bredd, inte
containern `align-items: start`.

**Reveals inuti den pinnade horisontella sektionen triggas på sektionen,
inte på korten.** En `containerAnimation`-trigger kräver att spåret faktiskt
rör sig. På breda skärmar ryms hela spåret, sträckan blir noll, triggern
avfyras aldrig och texten står kvar i sitt dolda utgångsläge för alltid.
Spåret pinnas dessutom bara när det faktiskt är bredare än fönstret.

**Header-temat räknas ut per bildruta.** Varje fast element frågar vilket
`[data-bg]`-band dess egen mittpunkt ligger i. Den tidigare lösningen sparade
elementens position en gång vid start; positionerna blev inaktuella så fort
pin-spacern ändrade dokumenthöjden, och överlappande trigger-intervall gjorde
att resultatet berodde på händelseordning i stället för på vad som faktiskt
låg bakom headern.

**Flikar som laddas i bakgrunden får ingen rAF-tick.** Utan skydd står
introt kvar på frame 0 med sidan scrolllåst bakom sig. `initPreloader`
hoppar direkt till sajten om `document.visibilityState` är `hidden`, och en
`setTimeout`-vakthund — som tickar även när rAF inte gör det — avslutar
introt om det ändå fastnar.

`prefers-reduced-motion: reduce` tar bort introt, stänger av Lenis och
visar allt direkt.

## Kontroll före leverans

```
tools/audit.js
```

Öppna den körande sidan i webbläsaren, klistra in filens innehåll i
konsolen och kör `await audit()`. Elva kontroller mot den DOM som
JavaScript faktiskt producerat.

Den granskar sådant som ögat inte ser och som **inte finns** i HTML-filen —
kollapsad delad text, reveals som aldrig avfyrat, delningsmål som blivit
flexcontainrar, horisontell overflow, trasiga bilder, döda länkar, stillastående
ticker. Den scrollar igenom hela sidan först så att varje trigger hinner gå.

Första kontrollen är instrumentet självt: är fliken dold eller saknar layout
avbryter den med `renderer not live` i stället för att svara. En dold flik får
ingen requestAnimationFrame-tick, layouten nollställs och varje mätning blir
skräp — som ser exakt ut som en riktig bugg. Ett falskt grönt är värre än inget
svar.

Kör den efter varje ändring i `main.js`, `sida.js` eller layoutdelarna av
`style.css`, och på undersidorna också — de har ett eget skript.

## Innan lansering

- **Fotografierna är platshållare** från `picsum.photos` (fasta bild-id, inte
  slumpade seeds, så uppslaget är stabilt). Byt mot riktiga bilder och skriv
  om `alt`-texterna samtidigt — de beskriver i dag platshållarna.
- **Formuläret postar ingenstans.** `initForm` gör klientvalidering och
  simulerar svaret med en `setTimeout`. Koppla på en riktig endpoint.
- **Verksamhetsuppgifterna är påhittade** — namn, adress, organisationsnummer,
  telefon, priser och citat. Byt ut allt före publicering.
- Lägg till analys om det behövs. Kakrutan hanterar i dag bara valet i
  `localStorage`; den laddar inga skript.
- Servern behöver peka 404 mot `404.html`.
- **Cache:** `style.css` och `main.js` länkas med `?v=<tidsstämpel>`. Bumpa
  den när du ändrat filerna, annars serverar webbläsaren gamla versioner.
  Själva HTML-filen cachas också — hårduppdatera (Ctrl+F5) vid test.

## Tillgänglighet

Semantisk HTML, synlig fokusmarkering, hoppa-till-innehåll-länk, formulär
med etiketter och inline-fel på svenska, `aria-live` på formulärstatus, och
`prefers-reduced-motion` genom hela rörelsesystemet. Kända kvarvarande
brister står på `tillganglighet.html`.
