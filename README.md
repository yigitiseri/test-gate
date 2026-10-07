# Age of Dynasties

**English** | [Türkçe](README.tr.md)

A turn-based historical grand strategy game played on a map, right in the browser. The year is 1451: young
Mehmed II has just taken the Ottoman throne and the walls of Constantinople still stand. Pick one of 28 realms
across the Balkans, Anatolia, the Caucasus, Mesopotamia, the Levant, Egypt and southern Italy, and rule it until
1531.

The game is available in **English and Turkish** (switch on the start screen or in the menu).

**Play:** https://yigitiseri.github.io/test-gate/ (or open `index.html` in any modern browser: no install, no server).

## How to play

- **Armies and garrisons.** Every realm fields armies that march across the map under their own banner: the
  realm's coat of arms, the troop count, and the commander's initials on a red wax seal. Tap a banner, then a
  province: the route appears as a gold dashed line. Armies can be merged, split and disbanded. Cities are held
  by garrisons, which defend but never march.
- **Battles.** Field battles are fought between armies; assaults hit the walls, the garrison and the local
  militia. Fortresses, mountains, winter, commanders and a little luck all count. After a battle the
  **battle card** shows why you won or lost, with its dice.
- **Sieges and peace.** Walled cities must be besieged: a camp rises before the walls and a stone strip shows
  how much of the walls still stands (Constantinople holds for about six seasons without cannon, two with
  Urban's guns). When you take a city you choose: **annex** it at once, or keep it occupied (striped in
  your colour, half its taxes yours) as a bargaining chip for the **Peace Table**, where you fill a basket
  with cities and gold priced by your war score. Long wars wear realms down.
- **A living world.** AI realms pick campaign goals, gather their armies, besiege what they can take and make
  peace; realms that grow too fast frighten their neighbours into coalitions.
- **Commanders.** Pashas, princes and even the sultan himself can lead an army; each has skill stars and traits
  (an akıncı raider marches further). Appoint or move commanders from the army panel; an army that loses its
  commander in battle or to captivity gets a free replacement at the end of the round.
- **Long marches.** Tap a far province with an army selected and press Set out: the army marches as far as it
  can each season, on its own at the end of every turn, and besieges an enemy town when it arrives.
- **Shortcuts.** Tap **Army** or **Provinces** in the top bar to jump through your armies or provinces one
  by one, so a forgotten island or a lost army is always one tap away.
- **Vassals.** Instead of annexing a beaten realm, make it a tributary at the Peace Table: it keeps its land,
  pays you tribute every season and follows you to war, but it longs for freedom and may rise if you grow weak.
  Loyal vassals can be annexed peacefully for gold.
- **Trade and great works.** The Silk Road, the Spice Road, the Black Sea road and the Venice–Levant sea route
  pay whoever holds their stops; war and sieges choke them. Raise mosque complexes, cathedrals, covered markets,
  caravanserais, arsenals, citadels and madrasas for lasting bonuses.
- **Saves and the Ledger.** Named save slots, export and import as a file (also on iPhone), and a Ledger with
  charts of income, army, land and score against your rivals, the ranking of the realms and the history of wars.
- **Dynasties.** Rulers age, die and are succeeded by their heirs; Venice elects doges; succession crises break
  out when there is no heir.
- **Economy.** Income comes from developed provinces. Build markets, barracks, walls and new quarters; pay your
  soldiers every season.
- **Diplomacy.** Declare war, make peace or demand tribute, form alliances, send gifts. Allies come to help in
  defensive wars. AI realms have personalities and remember what you did.
- **History to 1529.** Event chains for 1453, Belgrade, Otlukbeli, Prince Cem, Otranto, Chaldiran, Marj Dabiq
  and Ridaniya, Rhodes, Mohács (and the Habsburg inheritance of Hungary) and Vienna; empty thrones can bring a
  pretender's civil war; the chronicle names great battles.
- **Missions and history.** Every realm has historical missions (the conquest of Constantinople, the siege of
  Belgrade, the defiance of Krujë, Tabriz …) and event chains: 1453, Belgrade 1456, Otlukbeli 1473, Prince Cem
  1481, Urban's great guns, the rise of the Safavids in 1501, plague, caravans, revolts and mercenaries.
- **Campaign news.** At the end of each season the moves and battles of the turn replay briefly on the map;
  skip them any time.
- **The Vizier.** Your vizier gives short advice when something needs your attention, and a step-by-step
  tutorial teaches the first turns. The in-game **guide** explains money, war, buildings and diplomacy in plain
  words.
- **Victory.** Rule half of the provinces, or hold the highest score in 1531.

The game saves itself after every move; "Continue" on the start screen brings you back.

## Sound and look

Background music in the Hijaz maqam with ney, oud, davul and def, turning into a mehter march in wartime;
marching, swords, cannon, victory horns, gongs and bells. All of it is synthesized with Web Audio: there are
no sound files.

The interface looks like an illuminated manuscript: parchment panels, a leather top bar, wax-sealed decrees and
an SVG coat of arms for every realm. The map is drawn like an old portolan chart, with compass roses, rhumb
lines and galleys. In 3D, cities get domes and minarets, churches or bell towers, capitals fly their banners,
and lateen-sailed galleys cross the sea.

The map stays sharp at any zoom: coasts, borders and rivers are drawn as ink lines, and the land is painted
with mountains, hills, oak and pine woods, palm groves along the Nile, desert dunes, marsh reeds, sea waves
and a couple of sea serpents. The seasons change it: fresh green in spring, dry summers in the south, russet
woods in autumn, and in winter snow over the north and the high mountains, bare trees and frozen rivers.
Towns look like what they are (a hamlet, a town round its mosque or church, a walled city, a great city with
its citadel), with harbours, markets and the capital's banner; armies march with soldiers dressed as their
realm fought. Battle cards and decrees open with a small painted miniature, and portraits sit in gilt niches.

## Install on iPhone or Android

The game is a web app (PWA) with an icon, full-screen launch and an offline cache.

1. Open the game over HTTPS (for example the GitHub Pages address above) in **Safari** on iPhone.
2. Tap **Share** → **Add to Home Screen** → **Add**.

It opens from the home screen without browser bars and works offline after the first launch.

## Technical

- One HTML file, built from `src/`; no framework and no dependencies at run time except three.js from a CDN.
- The map is generated procedurally on every launch: coastlines from latitude/longitude polygons with noise,
  provinces as a Voronoi partition of real city coordinates clipped to land, plus rivers, mountains and sea lanes.
- 3D (three.js, WebGL): terrain mesh from a height map, sunlight and shadows, animated water, castles and
  regiments. It renders only when something changes, to save battery; phones start in 2D. If three.js cannot
  load, the game runs in 2D.
- Two languages: player-facing text is written as Turkish/English pairs; the language is chosen from the device
  and can be switched at any time.

## Development

`index.html` is never edited by hand: it is built from the template, CSS and JS parts in `src/` with
`node build.js`. Tests (Playwright, headless Chromium): `tests/run-all.sh`, and `node tests/i18n.js` for English
coverage. See [CONTRIBUTING.md](CONTRIBUTING.md) for the file layout and conventions.
