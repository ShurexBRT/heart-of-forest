# Heart of Forest - Campaign and Implementation Guide

Ovaj dokument je zivi izvor istine za pricu, dogovorene sisteme, redosled rada i
ono sto je vec implementirano. Azurira se na kraju svake faze, pre commita i
pusha na `main`.

## Jedna recenica

Heart of Forest je ARPG pripreme i obnove sveta, gde Homestead pretvara ono sto
Ayla pronadje u moc potrebnu da oslobodi sledeci region.

## Stubovi igre

1. Borba mora biti brza, citljiva i taktilna.
2. Priprema olaksava borbu, ali nikada nije obavezna ulaznica.
3. Povratak kuci donosi odmor, odnose, crafting i vidljiv napredak.
4. Svaki porazeni cuvar trajno menja svet i otvara novu mogucnost.
5. Talenti, oprema i loadouti menjaju stil igre, ne samo procente.

## Core loop

```text
Homestead
-> prica i priprema
-> istrazivanje regiona
-> resursi, oprema i side questovi
-> regionalni boss
-> povratak ljudi i usluga
-> obnova korena
-> sledeci region
```

## Prica

### Pre pocetka

Veliko Drvo nije izvor zivota nego spona izmedju sest starih korena. Pre mnogo
godina cuvari su pokusali da zaustave zvezdanu bolest zatvaranjem tih korena.
Time su usporili korupciju, ali su prekinuli prirodni tok secanja, vode, toplote
i godisnjih doba. Aylina majka, poslednja Hearthkeeperka, sakrila je dete i
uspavala Hearthroot da bi sacuvala poslednju zdravu iskru.

### Pocetak

Ayla se budi u zapustenom Homesteadu bez potpunog secanja na noc kada je suma
utihnula. Hearthroot odgovara na njen dodir i pokazuje da korupcija nije zaseban
neprijatelj u svakom biomu, vec ista rana koja putuje kroz podzemno korenje.
Prvih pet questova uce kretanje, interakciju, farming, odmor, borbu i alchemy.

### Heartwood - The Homestead Wakes

Ayla obnavlja Hearthroot, uzgaja prvi Moonleaf i oslobadja put kroz Whispering
Woods. Rootwarden nije zao: stari cuvar napada jer vise ne razlikuje Ayline
namere od glasa korupcije. Njegovim oslobadjanjem vracaju se Rowan, Tamsin i
prve usluge. Otkljucavaju se Journal, Training Grove i prvi loadout.

### Stillwater - The Drowned Road

Voda cuva secanja koja je suma pokusala da potisne. Nettle vodi Aylu kroz
zatrovane korene do Chapel of Tides, gde Bog Matron cuva poplavljene uspomene
na prve cuvare. Ayla saznaje da njena porodica nije samo branila Heart, vec je
ucestvovala u njegovom zatvaranju.

### Ember - Ash Under Bark

Vatra je bila alat za spaljivanje zarazenog korena, ali je ostavljena bez
cuvara. Ayla pali tri warding totema i zatim oslobadja Cinder Wardena. Pobeda
vraca kovacnicu i omogucava drugi loadout: igra prvi put jasno trazi izbor
izmedju pripreme za put i pripreme za bossa.

### Frost - Frostpine Silence

Neprirodna zima cuva poslednju poruku Aylinoj majci. Veil Seraph je odrzavao
pecat da se zvezdani glas ne bi probudio. Njegov poraz ne otkriva izdaju, vec
tesku odluku prethodnih cuvara. Otkljucava se treci loadout i puna mreza
waystone putovanja.

### Scarroot - Hollowheart Rot

Korupcija vise ne moze da se skriva iza zarazenih cuvara. Elder Hollow je
ostatak prvog cuvara koji je pokusao da koristi zvezdanu moc umesto da je
uskladi sa sumom. Ovde Ayla bira svoj Signature ultimate: staff, magic ili
rootcraft izraz njenog dotadasnjeg puta.

### Rootlight - Starfall Sanctum

U Ancient Heartu Ayla nalazi pali zvezdani izvor. Starwoken Sentinel nije
osvajac vec automatski cuvar koji smatra svaku promenu greskom. Zavrsna borba
proverava sve sto je igrac naucio: citanje napada, loadout, pripremu, mobilnost
i odabrani ultimate. Ayla ne unistava zvezdanu iskru, vec je vezuje za sest
obnovljenih korena i vraca svetu mogucnost da se menja.

### Kraj i postgame - Second Spring

Igra se zavrsava povratkom u Homestead. NPC-jevi dolaze na prvo zajednicko
prolece, regioni dobijaju obnovljene varijante, a Ayla zasadi Heartseed umesto
da zauzme presto cuvara. Posle credits sekvence pocinje Second Spring:
Corruption Echo encounteri postaju opcioni izazovi, Bestiary vodi lov na
varijante, Training Grove podrzava build testove, a optional dungeoni daju
materijale za attunement i kozmeticku obnovu doma.

## Regioni

| Poglavlje | Hub | Zone i boss | Damage | Priprema |
| --- | --- | --- | --- | --- |
| Heartwood | Homestead | Whispering Woods, Mossy Ruins, Rootwarden | Thorn | Barkskin Draught |
| Stillwater | Moonlit Marsh | Chapel of Tides, Bog Matron | Mire | Antitoxin Bloom |
| Ember | Ember Hollow | Emberpine Grove, Cinder Warden | Fire | Emberward Infusion |
| Frost | Frostpine Tundra | Frostveil Tundra, Veil Seraph | Frost | Cinderheart Cordial |
| Scarroot | Blighted Woods | Hollowheart Ruins, Elder Hollow | Corruption | Heartcleanse Elixir |
| Rootlight | Ancient Heart | Starfall Sanctum, Starwoken Sentinel | Astral | Starward Draught |

Sunken Reliquary ostaje opcioni dungeon i ne blokira glavnu kampanju.

## Quest pravila

- Main questovi vode kroz pripremu, regionalni problem, bossa i povratak u hub.
- Side questovi menjaju ljude ili prostor i daju predah od glavne pretnje.
- Optional dungeon questovi daju lore, named loot i build mogucnosti.
- Quest reward treba prvenstveno da bude unlock, recept, odnos ili predmet.
- Boss defeat i region restoration su odvojeni dogadjaji.
- Tutorial Moonleaf sazreva nakon jednog spavanja.

## Sistemski dogovori

### Combat feel i citljivost

- Boss telegraph mora biti iznad sveta i ispod HUD-a.
- Znacajni udarci dobijaju kratak hit-stop, jasan flash i damage broj.
- Screen shake ima podesiv intenzitet.
- Broj cestica je ogranicen da efekti ne sakriju napad.
- Crvena, narandzasta i bela se cuvaju za opasnost i impact; biom ostaje pozadina.

### Loot, poredjenje i loadouti

- Loot ostaje auto-pickup da borba ne gubi ritam.
- Inventory prikazuje kandidat naspram opremljenog predmeta i neto promenu.
- Predmet moze da se zakljuca i tada ne moze slucajno da se proda.
- Oprema pokazuje kojoj talent grani prirodno odgovara.
- Loadout menja equipment, action slots i pripremu, ne potrosene talent poene.
- Slotovi se otkljucavaju kroz Heartwood, Ember i Frost.
- Loadout ne sme besplatno da aktivira vec potrosen preparation elixir. U prvoj
  verziji cuva equipment i action slots; izbor preparation recepta se dodaje
  uz punu alchemy/loadout integraciju.

### Training Grove

- Otkljucava se po obnovi Heartwooda.
- Ima mirnu metu, grupu meta i simulirani elite napad.
- Prikazuje DPS samo kao alat za poredjenje, ne kao glavni cilj igre.
- Dozvoljava besplatno menjanje loadouta i proveru talent interakcija.

### Navigacija i Bestiary

- Journal spaja questove, mapu regiona, Bestiary i lore.
- Mapa pokazuje status `infested`, `unstable`, `secured` ili `restored`.
- Bestiary prvo prikazuje siluetu, zatim damage tip, pa counter savet.
- Navigacija pokazuje sledeci cilj, ali ne crta neprekidnu liniju kroz svet.

### Ekonomija i alchemy

- Obicni neprijatelji daju 0-3 silvera, elite 8-15, boss 50-80.
- Prodaja vraca oko 25% vrednosti.
- Brewing i attunement su glavni money sinkovi.
- Jedan preparation elixir ostaje aktivan do spavanja ili zamene.
- Counter elixir smanjuje odgovarajucu regionalnu stetu oko 25%.
- Recepti se otkljucavaju questom, ne kupuju svi odmah.

## Talenti

Tri grane imaju po pet znacajnih nodova i jedan zavrsni ultimate:

- Thornwarden: staff attack, bliska borba, guard i Heartwood Tempest.
- Spiritweaver: magic attack, Spirit Bolt, pulse i Verdant Nova.
- Rootcaller: root, sustain, alchemy utility i Awaken the Grove.

Kampanja daje najvise osam poena. Waystone nudi respec ili gear attunement, ne
beskonacnu kupovinu talent poena.

## Faze

| Faza | Sadrzaj | Status |
| --- | --- | --- |
| 0 | Campaign/save temelj, combat citljivost, loot zastita, zivi dokument | Zavrseno |
| 1 | Heartwood prica, Training Grove, Journal, prvi loadout | Zavrseno |
| 2 | Stillwater, Bestiary i regionalna navigacija | Zavrseno |
| 3 | Ember prica i drugi loadout | Zavrseno |
| 4 | Frost prica i treci loadout | Zavrseno |
| 5 | Scarroot prica i Signature ultimate izbor | Zavrseno |
| 5A | Heartwood onboarding i polish prvih questova | Zavrseno |
| 6 | Rootlight finale i zavrsna sekvenca | Zavrseno |
| 6A | First-hour quest feedback polish | Zavrseno |
| 7 | Second Spring postgame i optional challenge loop | U toku |
| 7A | Daily Corruption Echo loop | Zavrseno |
| 7B | Second Spring Homestead board | Zavrseno |
| 7C | Sunken Reliquary daily trial rewards | Zavrseno |
| 7D | First-hour quest polish i collision reachability audit | Zavrseno |
| 7E | HUD modernization pass | Zavrseno |
| 7F | Biome floor and building texture pass | Zavrseno |
| 8AB | Enemy hit-flash mask bugfix | Zavrseno |
| 8AC | Terrain water, ice, path and floor relief polish | Zavrseno |
| 8AD | Ayla and NPC runtime presence polish | Zavrseno |
| 8AE | Enemy windup and recover readability polish | Zavrseno |

## Dnevnik implementacije

### Faza 0

- Datum: 2026-06-13
- Status: zavrseno
- Cilj: uvesti stabilan campaign model, odvojiti regionalne boss questove,
  poboljsati osnovni combat feedback i zastititi vrednu opremu od prodaje.
- Uveden je persistent campaign model sa aktivnim i zavrsenim poglavljima,
  obnovljenim korenima, aspect unlockovima i buducim loadout slotovima.
- Svi postojeci questovi sada imaju `chapter` i `kind` metapodatke.
- Ember i Frost dobijaju zasebne guardian questove. Totemi i scout vise ne
  obnavljaju region pre pobede nad Cinder Wardenom i Veil Seraphom.
- Glavni quest redosled je povezan Heartwood -> Stillwater -> Ember -> Frost
  -> Scarroot -> Rootlight. Optional Reliquary vise nije uslov za kampanju.
- Save format je podignut na `0.4.0`; stari save i settings podaci se
  normalizuju bez brisanja inventara, questova ili scene progressa.
- Boss telegraphi se crtaju iznad sveta, a udarci imaju kratak hit-stop,
  ogranicene damage brojeve i kontrolisan broj cestica.
- Screen shake intenzitet je dodat u Options i cuva se izmedju sesija.
- Auto-pickup loot ostaje nepromenjen.
- Inventory sada podrzava `Lock/Unlock` misem i tasterom `K`. Zakljucan
  predmet ne moze da se proda.
- Gear poredjenje prikazuje `opremljeno -> kandidat` i neto promenu, uz
  Thornwarden, Spiritweaver ili Rootcaller build affinity.
- Options i inventory raspored su provereni na `1280x720` i `800x720`.
- Automatizovana provera: `29/29` testova prolazi.

### Faza 1

- Datum: 2026-06-13
- Status: zavrseno
- Cilj: zatvoriti prvi Heartwood vertikalni iseck kroz pricu, trajni Journal,
  build test i prvi loadout.
- Uvodni Heartwood questovi sada jasnije povezuju budjenje Hearthroota,
  Moonleaf ritam, Barkskin pripremu i oslobadjanje Rootwardena.
- Hearthroot ima dijalog pre budjenja, tokom Heartwood rane i nakon obnove.
  Lysa igracu objasnjava Training Grove i cuvanje builda.
- Quest Log je preradjen u `Field Journal`: cuva aktivne, dostupne, zavrsene i
  arhivirane questove, prikazuje `main/side/optional`, poglavlje, objective i
  reward podatke.
- Journal dobija prve progresivne Bestiary zapise. Thornling se otkriva kroz
  borbu na putu, Rootwarden kroz guardian quest; svaki dobija citljive combat
  savete tek kada ih Ayla zaista sretne.
- Obnovljeni Homestead dobija fizicki Training Grove i woven metu. Prvi
  `Steady Target` drill traje 20 sekundi, prikazuje damage, hitove, trenutni
  DPS i trajno pamti najbolji rezultat.
- Training meta ne daje XP, silver ni loot i ne moze da pokrene quest kill
  countere.
- Heartwood otkljucava `Grove Loadout I`. Loadout bez dupliranja predmeta
  cuva i vraca equipment i dostupne quick/action slotove.
- Preparation elixir se namerno ne reaktivira kroz loadout, kako promena
  builda ne bi stvarala besplatne potrosne buffove.
- Dodat je `debugProgress=heartwood` QA fixture za stabilnu proveru obnovljenog
  Homesteada, Journala i loadout UI-ja bez menjanja regularnog save toka.
- Field Journal je vizuelno proveren na `1280x720` i `800x720`; Character
  loadout i obnovljeni Homestead na `1280x720`.
- Automatizovana provera: `33/33` testova prolazi.

### Faza 2

- Datum: 2026-06-14
- Status: zavrseno
- Cilj: zatvoriti Stillwater pricu povratkom u hub i povezati Journal,
  Bestiary, mapu i drugi Training Grove drill u jedan citljiv regionalni loop.
- Bog Matron vise ne obnavlja region samim porazom. Ayla prvo cisti crne
  korene, vraca dva Tide Seala, pali chapel braziere i oslobadja Matron.
- Nakon borbe u Chapel of Tides ostaje interaktivno secanje. Tek kada ga Ayla
  odnese Nettle kroz novi quest `What the Water Kept`, Stillwater dobija status
  `restored` i kampanja prelazi u Ember.
- Nettle dobija quest-specific dijalog pre i posle svake glavne Stillwater
  etape. Obnovljeni marsh vraca stanovnike, tople lanterns i mirnije okruzenje.
- Field Journal sada prikazuje regionalni status, broj otkrivenih lokacija,
  dominantni damage tip, counter recept i sledeci campaign lead.
- Travel Map oznacava relevantnu sledecu zonu diskretnim markerom. Posebna
  logika vodi ka preostalom Tide Sealu, Matroninom secanju ili povratku Nettle.
- Stillwater Bestiary uvodi Mire Spittera, Bog Lurkera i Bog Matron. Zapisi
  postepeno otkrivaju ulogu neprijatelja, mire damage i Antitoxin savet.
- Obnovljeni Stillwater otkljucava `Target Circle`, grupni Training Grove
  drill sa tri mete i zasebnim najboljim DPS rezultatom po modu.
- Chapel hazards nestaju nakon ciscenja, a Stillwater interactables i novo
  secanje imaju proverene dostupne interaction tacke.
- Dodat je `debugProgress=stillwater-active` i `debugProgress=stillwater` QA
  fixture za proveru aktivnog i obnovljenog regiona.
- Journal je vizuelno proveren na `1280x720` i `800x720`, a Travel Map i
  obnovljeni Homestead na `1280x720`.
- Automatizovana provera: `38/38` testova prolazi.

### Faza 3

- Datum: 2026-06-14
- Status: zavrseno
- Cilj: pretvoriti Ember u smislen dvostepeni guardian region i otkljucati
  drugi build loadout tek kada Ayla vrati kontrolisanu vatru ljudima.
- Prvi ulazak u Ember Hollow vise ne pokrece Cinder Wardena. Ayla prvo cisti
  ashbound encounter, zatim pali tri warding totema i vraca se Garricku.
- Zavrseni totem quest ponovo otvara istu scenu u guardian rezimu. Tek tada
  drugi combat prolaz vodi do Cinder Wardena.
- Prvi clear staged boss scene vise ne oznacava guardian defeat. Ember status
  ide `infested -> unstable -> secured -> restored` pravim redosledom.
- Cinder Warden vise ne obnavlja region direktno. Posle borbe ostavlja
  Firewatch Ember; novi quest `A Fire Worth Keeping` trazi da ga Ayla vrati
  Garricku i tek tada pali obnovljenu kovacnicu.
- Povratni questovi za Stillwater i Ember postaju dostupni tek kada je njihov
  memory/ember predmet pronadjen, pa nema nepotrebnog trcanja keeper -> arena
  -> keeper.
- Obnovljeni Ember Hollow uklanja fire hazards, vraca ljude i dobija vidljivu,
  interaktivnu Firewatch kovacnicu sa mirnom vatrom.
- Stillwater povratak sada sigurno otkljucava Emberward Infusion pre glavnog
  Ember guardian susreta. Ember totemi i dalje otkljucavaju frost preparation.
- Ember Bestiary uvodi Cinder Impa, Ash Brutea i Cinder Wardena sa postepenim
  fire damage i Emberward savetima.
- Journal i mapa vode kroz toteme, guardian road, Firewatch Ember i Garrickov
  povratak bez neprekidne navigacione linije.
- Character panel sada prikazuje sva tri campaign loadout slota sa
  `locked`, `saved` i `active` stanjem. Ember otkljucava Grove Loadout II.
- Svaki loadout nezavisno cuva equipment i quick slots. Aktiviranje vraca
  predmete bez dupliranja i ne obnavlja potroseni preparation elixir.
- Stari save koji je vec legitimno obnovio Ember automatski dobija zavrsen
  povratni korak bez ponovnog oduzimanja progresa ili dupliranja nagrade.
- Dodat je `debugScene` QA parametar, kao i `debugProgress=ember-active`,
  `ember-return` i `ember`.
- Ember Journal, povratni lead i Character loadouti vizuelno su provereni na
  `1280x720`; Character panel je proveren i na `800x720`.
- Automatizovana provera: `43/43` testova prolazi.

### Faza 4

- Datum: 2026-06-14
- Status: zavrseno
- Cilj: pretvoriti Frost u pricu o duznosti koja je postala zatvor, povezati
  poslednju poruku Aylinoj majci sa obnovom waystone mreze i zatvoriti
  campaign loadout progression.
- Prvi Frost prolaz sada cisti lower ridge bez prevremenog Veil Seraph
  susreta. Izgubljeni scout otkriva da guardian odrzava pecat zato sto veruje
  da bi promena probudila zvezdani glas.
- Zavrseni scout quest ponovo otvara staged scenu i tek tada aktivira Veil
  Serapha. Poraz cuvara oslobadja pecat, ali vise ne obnavlja Frost direktno.
- Posle borbe ostaje Seraphova poruka. Novi povratni quest `The Winter Letter`
  vodi Aylu nazad Vesperu i otkriva da je njena majka trazila privremenu zimu
  dok koreni ne budu spremni da se promene.
- Frost dobija pravi tok `infested -> unstable -> secured -> restored`.
  Obnova se desava tek po predaji poruke, kada se pali i puna waystone mreza.
- Frost Bestiary uvodi Frost Wispa, Icebound Guardiana i Veil Serapha sa
  postepenim frost damage i Cinderheart savetima.
- Journal i regionalna navigacija razlikuju potragu za scoutom, guardian
  prolaz, Seraphovu poruku i povratak Vesperu.
- Obnovljeni Frost uklanja aktivnu borbu, dobija vidljiv waystone i mirnije
  stanje regiona. Obnovljeni Homestead dobija novi Veil Drill poligon.
- Frost povratak otkljucava `Grove Loadout III`. Character panel prikazuje sva
  tri nezavisna loadouta bez dupliranja opreme ili preparation efekata.
- Veil Drill simulira citljiv elite telegraph bez gubitka healtha, belezi
  uspesna izmicanja i uhvacene udare i cuva rezultat odvojeno od DPS drillova.
- Stari save koji je vec legitimno obnovio Frost automatski dobija zavrsen
  Winter Letter povratak bez gubitka regionalnog progresa.
- Dodati su `debugProgress=frost-active`, `frost-return` i `frost` QA fixturei.
- Frost Journal, Character panel, obnovljena tundra i Homestead vizuelno su
  provereni na `1280x720`; Homestead je proveren i na `800x720`.
- Automatizovana provera: `47/47` testova prolazi.

### Faza 5

- Datum: 2026-06-15
- Status: zavrseno
- Cilj: povezati Scarroot sa prvom greskom cuvara, odvojiti pobedu nad Elder
  Hollowom od stvarne obnove regiona i pretvoriti talent capstone nodove u
  tri razlicita Signature ultimate napada.
- `Blight Watch` sada koristi stvarne Scarroot neprijatelje i dve effigy mete.
  Zavrsavanje border questa otvara Hollowheart Court, ali ne obnavlja region.
- Elder Hollow predstavlja prvog cuvara koji je svaku promenu proglasio
  korupcijom i pokusao da natera zvezdani glas na jedan bezbedan odgovor.
- Posle borbe ostaje interaktivno secanje prvog cuvara. Tek novi povratni
  quest `The Choice Beneath the Bark` vodi Aylu Bramu, obnavlja Scarroot i
  otkljucava Rootsong Rite za izbor Signature ultimate-a.
- Novi side quest `The Smallest Grove` trazi da Ayla neguje tri obicna
  saplinga. Obnovljeni border dobija trajni mali gaj kao miran dokaz promene.
- Scarroot Bestiary uvodi Blight Hounda, Rot Weavera i Elder Hollowa sa
  corruption damage identitetom, Heartcleanse savetima i postepenim cluevima.
- Journal i navigacija razlikuju border clear, guardian prolaz, preuzimanje
  secanja i povratak Bramu. Ancient Heart ostaje zakljucan do obnove Scarroota.
- Poslednji nod svake grane je world-gated do Rootsong Rite-a i samo jedan
  Signature moze biti naucen:
  `Heartwood Tempest` pravi tri staff sweepa, `Verdant Nova` detonira Bloom i
  cisti projectiles, a `Awaken the Grove` dugo rootuje, leci i ostavlja polje.
- HUD sada koristi stvarni naziv izabranog Signature napada, cenu `0 Spirit`
  i tacan cooldown, dok se napad aktivira punim Heart Chargeom.
- Legacy save koji je legitimno obnovio Scarroot dobija zavrsen povratni quest
  i Signature unlock bez gubitka regionalnog progresa.
- Dodati su `debugProgress=scarroot-active`, `scarroot-return`, `scarroot` i
  `scarroot-side` QA fixturei.
- Scarroot Journal, talent tooltip i obnovljeni Blighted Woods vizuelno su
  provereni na `1280x720`; talent ekran je proveren i na `900x700`.
- Automatizovana provera: `53/53` testova prolazi.

### Faza 5A

- Datum: 2026-06-15
- Status: zavrseno
- Cilj: ukloniti rupe u prvom satu igre i povezati homestead radnje sa
  pricom, navigacijom i jasnim redosledom Heartwood kampanje.
- Novi save vise ne pocinje sa Moonleaf semenkama. Ayla dobija prve dve tek
  kada probudi Hearthroot, pa prvi quest ima stvarnu posledicu i nagradu.
- Hearthroot dijalog sada prati trenutnu etapu: prvo trazi negu, zatim tumaci
  thorn-mark na prvoj berbi, objasnjava zasto je Barkskin potreban i priprema
  igraca za otvorenu liniju u Root Crown napadu.
- `First Moonleaf` je razlozen na cetiri vidljiva objective-a: sadnja,
  zalivanje, jedno spavanje i berba. Biljka sazreva posle jednog pravilno
  zalivenog nocenja, bez drugog tutorial dana.
- Krevet menja prompt prema trenutnom koraku i ne dozvoljava tutorial
  spavanje pre sadnje i zalivanja. Kada je usev spreman, sleep transition
  jasno govori da Moonleaf raste do zore.
- Pinned quest, Journal i regionalna navigacija uvek prikazuju sledeci
  konkretan Moonleaf korak, a zatim vode na Whispering Woods, cauldron i
  Mossy Ruins pravim redosledom.
- Homestead izlaz ostaje zatvoren do prve berbe. Ruin trail ostaje zatvoren
  do Barkskin kuvanja, a Moonlit Marsh do obnove Heartwooda, pa vise nije
  moguce ubiti ili preskociti buduce quest mete pre njihove price.
- Gate kill counter sada broji Thornling/Barkling neprijatelje samo dok je
  `Thorns at the Gate` aktivan.
- Stari save sa zavrsenim tutorial questovima automatski dobija nove road
  flagove i popunjene mikro-korake bez gubitka progressa.
- Dodati su `debugProgress=onboarding-awake`, `onboarding-watered` i
  `onboarding-brew` QA fixturei.
- Pinned quest i Journal vizuelno su provereni na `1280x720`, a Journal i na
  `900x700`.
- Automatizovana provera: `57/57` testova prolazi.

### Faza 6

- Datum: 2026-06-16
- Status: zavrseno
- Cilj: zatvoriti glavnu kampanju kroz Rootlight finale, odvojiti arhivsku
  istinu, Sentinel borbu, poslednju odluku i povratak u Homestead u citljiv
  kraj koji prati celu pricu.
- `Pilgrim's Lantern` sada sabira pet obnovljenih korena kroz Heart Blooms i
  Star Seals u Ancient Heartu. Quest otvara Starfall Sanctum bez uvodjenja
  nove hub mape.
- `Starfall Sanctum` je staged susret. Prvi clear otkriva zasto je Aylina
  majka sakrila zvezdani koren i resetuje scenu da bi tek drugi prolaz
  aktivirao Starwoken Sentinel encounter.
- Starwoken Sentinel dobija Rootlight identitet, astral Bestiary zapis i
  Signature-style napad `Sixfold Verdict`, pa poslednja borba testira citanje
  otvorene linije, pripremu, add priority i Heart Charge timing.
- Pobeda nad Sentinelom vise ne obnavlja Rootlight sama. Posle borbe ostaje
  `Starwoken Echo`; tek kada Ayla odnese echo Selki, quest `The Sixth Answer`
  harmonizuje svih sest korena i otkljucava epilog.
- `The Sixth Answer` objasnjava zavrsnu temu: zvezdana iskra nije cisto zlo,
  nego moc koju stari cuvari nisu umeli da zamisle bez kontrole ili unistenja.
  Ayla je vezuje za hor sest razlicitih korena, a ne za novi presto cuvara.
- Homestead dobija epilog stanje sa Halenom, Selkom i pripremljenom zemljom za
  Heartseed. `Second Spring` je auto-aktivni zavrsni quest koji trosi stvarni
  Heartseed predmet i tek po sadnji postavlja `rootlight_restored` i campaign
  completion.
- Posle sadnje Heartseeda Homestead prikazuje trajni `Second Spring Sapling`,
  a Ancient Heart dobija `Six-Root Chorus` kao miran dokaz da je finalna odluka
  ostala u svetu.
- Rootlight Bestiary uvodi Relic Sentinela, Starbound Archera i Starwoken
  Sentinela sa astral damage identitetom i Starward savetima.
- Journal i navigacija razlikuju pripremu lantern rituala, archive truth,
  Sentinel borbu, preuzimanje echo-a, povratak Selki i finalnu sadnju u
  Homesteadu.
- Legacy save koji je vec imao obnovljen Rootlight i porazen Starfall guardian
  dobija `The Sixth Answer`, `Second Spring` i epilog flagove bez gubitka
  progresa.
- Dodati su `debugProgress=rootlight-active`, `rootlight-archive`,
  `rootlight-return`, `rootlight` i `second-spring` QA fixturei.
- Browser runtime provera je uradjena na svih pet Rootlight fixture-a na
  `1280x720`; nema boot, canvas, DOM ili console errora. Screenshot API za
  canvas se blokirao u alatu, pa je vizuelni dokaz ogranicen na runtime QA i
  reachability testove.
- Automatizovana provera: `61/61` testova prolazi.

### Faza 6A

- Datum: 2026-06-16
- Status: zavrseno
- Cilj: dodatno ispolirati prvi sat igre bez menjanja vec stabilnog
  Heartwood progression toka.
- Prvih pet Heartwood main questova dobijaju konkretnije objective label-e
  koji govore sta Ayla radi u svetu, a ne samo koji counter raste.
- Uveden je opcioni `completeToast` na quest definiciji. Pocetni questovi ga
  koriste da igracu odmah kazu sta je otkljucano ili zasto je sledeci korak
  bitan: seme i ironbark, otvaranje gate-a, Barkskin recept, Mossy Ruins trail
  i Heartwood obnovu.
- Ovaj polish je namerno tekstualno/feedback orijentisan. Ne dira redosled
  questova, ne menja countere i ne otvara nove sisteme pre postgame faze.
- Automatizovana provera: `61/61` testova prolazi.

### Faza 7A

- Datum: 2026-06-16
- Status: zavrseno
- Cilj: pretvoriti `Second Spring` iz statickog epiloga u prvi pravi postgame
  loop bez rollbacka obnovljenog sveta.
- Svaki region sada ima eksplicitnu postgame echo lokaciju:
  Whispering Woods, Chapel of Tides, Emberpine Grove, Frostveil Tundra,
  Hollowheart Ruins i Starfall Sanctum.
- Posle zavrsene kampanje, ociscena echo lokacija moze jednom dnevno da
  pokrene kratki `Second Spring Echo` encounter. Region ostaje `restored`, a
  `sceneProgress.cleared` se ne dira.
- Echo clear koristi isti dnevni `regionProgress.echoDay` tracking kao raniji
  unstable echo sistem, ali sada radi i na obnovljenim regionima.
- Nagrade su male i vezane za postgame ekonomiju: regionalni materijali,
  relic shardovi i silver za attunement/crafting bez uvodjenja nove valute.
- Journal i campaign navigation sada pokazuju sledeci dnevni echo lead. Kada
  je regionov echo vec ociscen tog dana, Journal jasno kaze da treba prespavati
  za novi talas.
- Dodat je `debugProgress=postgame-echo` QA fixture za brzu proveru dnevnog
  echo susreta posle Second Spring kraja.
- Automatizovana provera: `63/63` testova prolazi.

### Faza 7B

- Datum: 2026-07-21
- Status: zavrseno
- Cilj: napraviti da se Second Spring dnevni loop vidi i u Homesteadu, ne samo
  u Journalu.
- Homestead posle sadnje Heartseeda dobija fizicku `Second Spring Board`
  interakciju pored nove mladice.
- Tabla koristi stvarni dan, region progress i scene progress da prikaze koliko
  je dnevnih echo lokacija jos otvoreno, koliko je vec mirno i koja je sledeca
  preporucena lokacija.
- Board tekst ide kroz postojeci dialogue box u nekoliko kratkih kartica:
  dnevni rezime, sledeci poziv, otvoreni echo regioni i mirni echo regioni.
- Dodat je mali pixel-art render table sa sest root oznaka i zaseban path patch
  da objekat izgleda namerno postavljen u Homesteadu.
- Regresioni testovi proveravaju board helper, Homestead restoration contract i
  reachable interaction point za novu tablu.
- Automatizovana provera: `64/64` testova prolazi.

### Faza 7C

- Datum: 2026-07-21
- Status: zavrseno
- Cilj: pretvoriti Sunken Reliquary u smislen postgame challenge reward loop
  koji podrzava attunement, build eksperimentisanje i vidljivu obnovu doma.
- Posle Second Spring-a, ako je Sunken Reliquary vec otvoren i ociscen, ulazak
  u tu scenu jednom dnevno pokrece `Reliquary Trial` umesto mirne ociscene
  scene.
- Trial ne brise niti vraca `sceneProgress.cleared`; isti dungeon ostaje
  legitimno ociscen, ali dobija dnevni izazov dok je dostupan.
- Rootbound Custodian u trial varijanti vise ne duplira named gear
  (`Custodian Spindle`, `Reliquary Loop`). Umesto toga daje endgame materijale
  i silver, a clear nagrada daje relic shardove, consumable za build test i
  `homesteadRenewalSupplies` counter.
- Second Spring Board sada javlja i stanje Reliquary Triala: dostupan, miran
  danas ili jos zakljucan/neociscen.
- Homestead posle prvog renewal supply-a dobija fizicki `Renewal Supplies`
  cache kod Second Spring kutka; dodatni supply-i malo ulepsavaju isti prostor.
- Dodat je `debugProgress=reliquary-trial` QA fixture za direktan runtime test
  ociscenog Sunken Reliquary postgame izazova.
- Regresioni testovi proveravaju daily lockout, rewarde, nedupliranje named
  boss geara, board signal i reachability renewal cache-a.
- Automatizovana provera: `66/66` testova prolazi.

### Faza 7D

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: dodatno ispolirati prvi sat igre i proveriti sumnjive collision slucajeve
  bez menjanja stabilnog Heartwood progression toka.
- Prvih pet Heartwood main questova dobija `startToast` poruke. Auto-start,
  quest panel accept i NPC accept sada koriste isti helper i mogu igracu odmah
  reci sta sledece radi, umesto generickog `Quest Started` teksta.
- First-hour navigation i farming feedback sada jasnije povezuju Hearthroot,
  Moonleaf, odmor, Barkskin i Rootwarden citanje otvorenih linija.
- Rowan i Tamsin dobijaju malo toplije barkove za rani Heartwood, tako da
  side questovi zvuce kao deo sela, a ne kao izdvojeni counteri.
- Layout testovi sada ne proveravaju samo da postoji slobodna interaction tacka
  oko objekta, vec i da je do nje moguce stici iz player/entry spawn mreze.
  Time se automatski hvataju itemi i quest objekti koje bi kolizija mogla da
  odsece od igraca.
- Ovaj segment nije nasao trenutno blokirane interactable objekte, ali sada ima
  regresioni test za bas taj problem.
- Automatizovana provera: `67/67` testova prolazi.

### Faza 7E

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: modernizovati stalni HUD bez gubitka citljivosti borbe i bez uvodjenja
  velikih overlay-a preko sredine ekrana.
- Persistent HUD sada ima manji, koherentniji bottom combat bar sa istim
  pixel chrome jezikom za health/spirit orbove, ability slotove, quick iteme,
  buffove, silver i XP.
- Top-left quest tracker je pretvoren u `NEXT STEP` chip sa napretkom objective-a
  i Journal hintom. Na boss susretima se spusta ispod boss bara da se UI ne
  preklapa.
- Top-right scene panel je skracen u zone/status chip koji prikazuje scenu,
  region status, encounter stanje i dan/sat bez starog visokog info bloka.
- Toast poruke sada izgledaju kao kratke field-note kartice i bolje nose
  onboarding/start-quest tekst iz Faze 7D.
- Dodat je diskretan low-health/hurt edge vignette koji signalizira opasnost
  bez sakrivanja telegrapha i centra playfield-a.
- Runtime QA je proverio onboarding, obnovljeni Heartwood, Scarroot fixture i
  800px kompaktni viewport preko lokalnog browser testa; nema canvas, DOM ili
  console errora osim ignorisanog favicon 404.
- Automatizovana provera: `67/67` testova prolazi.

### Faza 7F

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: dati svakom biomu prepoznatljiviji pod i materijalni karakter bez
  rizicnog ukljucivanja prljavih atlas cropova.
- `terrainAssets` sada preko postojeceg cistog terrain atlasa dodaje proceduralni
  biome signature sloj: Heartwood listici/rootlets, Stillwater trska i ripples,
  Ember zarke pukotine, Frost ledeni glints, Scarroot thorn veins i Rootlight
  rune/star motes.
- Dodatni detalji su vezani za ground family (`natural`, `path`, `stone`,
  `water/ice`, `special`), pa putevi, arene i hazard povrsine ostaju citljive.
- Cottage/building renderer dobija biome trim: mahovina i list za Heartwood,
  reed tonovi za Stillwater, soot/ember za Ember, sneg za Frost, thorn veins za
  Scarroot i rune za Rootlight/Ancient scene.
- Nisu dodavani novi binary asseti u ovom segmentu, jer postojeći
  `assets/terrain/biome-terrain.png` daje cistiji materijalni izvor od velikih
  atlas sheet cropova. Veliki atlasi ostaju korisni kao inspiracija i za
  selektivne propove.
- Runtime QA je proverio svih sest bioma preko debug fixture-a na `1280x720`;
  nema canvas, DOM ili console errora.
- Automatizovana provera: `67/67` testova prolazi.

### Faza 7G

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: uciniti loot, poredjenje opreme i loadoute jasnijim bez uvodjenja
  novog inventory sistema.
- Inventory detail panel sada jasnije razdvaja rarity/category info, vrednost,
  sell price kod shop servisa, lock upozorenje i build affinity.
- Equipment comparison sortira stat promene po najvecoj razlici i prikazuje
  `UP`, `DOWN` i `SAME` chipove, tako da igrac brze vidi sta item stvarno menja.
- Tooltip poredjenja koristi isti format kao detail panel, pa hover i otvoreni
  inventory daju isti odgovor.
- Progression sistem dobija `getLoadoutPreview`, cist helper koji kaze da li je
  loadout spreman, koliko gear slotova menja, sta fali i koji quick slotovi ce
  se ocistiti ako nema consumable-a.
- Character panel loadout kartice sada prikazuju spremnost, missing gear i
  quick-slot warning direktno na kartici; hover dodatno objasnjava detalje i
  eksplicitno kaze da loadouti ne menjaju aktivni preparation elixir.
- Regresioni test pokriva vaznu granicu: missing gear blokira loadout, ali
  missing consumable samo cisti quick slot i ne zakljucava build.

### Faza 7H

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: uciniti navigaciju i Bestiary citljivijim kao Ayline terenske beleske,
  a ne samo listu internih countera.
- `getCampaignNavigation` sada vraca `leadLabel` i `routeNote`. UI moze jasno
  da razlikuje `AT LEAD`, `REPORT BACK`, `ECHO TODAY`, `NEW REGION` i slicna
  stanja bez ponovnog tumacenja quest statusa.
- Region overview u Journalu prikazuje lead oznaku i koristi `routeNote`, pa
  igrac vidi da li treba putovati, pricati, javiti se nazad ili samo ostati na
  trenutnoj lokaciji.
- World Map footer koristi isti route note kao Journal, tako da mapa i Field
  Journal pricaju istim jezikom.
- `getBestiaryEntries` sada vraca `knowledgeLabel`, `progressLabel`,
  `counterKnown` i `nextStudyHint`. Time Bestiary jasno razlikuje nepoznato,
  procitano u borbi i potpuno naucen counter savet.
- Bestiary kartice sada prikazuju stage (`UNKNOWN`, `FIELD READ`,
  `COUNTER LOGGED`), napredak studiranja i counter item tek kada je zaista
  savladan.
- Regresioni testovi proveravaju da rana Homestead navigacija javlja `AT LEAD`
  i da Stillwater Bestiary odvaja field read od counter logged stanja.

### Faza 7I

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: pretvoriti Reliquary renewal supply iz kozmetickog postgame countera u
  malu, korisnu Homestead uslugu koja podrzava build eksperimentisanje.
- `Renewal Supplies` cache u Homesteadu sada otvara `Renewal Workbench` service
  kada Second Spring postoji i igrac ima bar jedan supply.
- Workbench trosi `homesteadRenewalSupplies` na tri namerne opcije:
  `Seed the Moonleaf Beds` za seme i Moonleaf, `Sort Attunement Relics` za
  relic shard/ironbark i `Pack a Road Kit` za osnovne potione uz mali silver fee.
- Service koristi postojeci service UI/action flow umesto novog overlay-a, tako
  da se uklapa sa cauldron, Waystone i stash sistemima.
- Progression dobija `spendQuestCounter`, da supply loop moze bezbedno da trosi
  countere i bude pokriven testom.
- Regresioni test proverava da Renewal Workbench trosi supply, dodaje materijale,
  naplacuje road kit i zakljucava opcije kada vise nema supply-a.
- Layout test sada proverava da je renewal cache i reachable i vezan za
  `homestead_renewal` service.
- Zavrsna provera ovog segmenta: syntax check, targeted service/layout testovi i
  full regresija.

### Sledeca faza

- Nema preostalog obaveznog segmenta iz ovog sestodelnog prolaza.
- Sledece potencijalno smisleno poliranje posle ovog commita: runtime vizuelni
  QA sa kompletnim browser automation paketom, dodatne generated prop teksture
  za pojedine zgrade i eventualno drugi nivo renewal nagrada ako postgame bude
  trazio duzi loop.

### Faza 8A

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: prvi dodatni polish posle sestodelnog prolaza, fokusiran na prop
  citljivost i combat feel bez uvodjenja novog sistema.
- Well, lantern i Renewal Supplies chest dobijaju bogatiji pixel tretman preko
  postojecih world material tekstura, senki, highlights i malih biome/service
  detalja.
- Renewal chest sada vizuelno nosi Second Spring identitet: leaf glow, svetliji
  lock i mekani zeleni highlight, pa igrac jasnije vidi da nije obican sanduk.
- Staff swing render sada razlikuje prazan zamah od pogotka i Bloom otvaranja:
  pogodak dobija puniji luk, topliji trag i kratke echo pixele.
- Combat damage numbers sada imaju `heavy` varijantu za boss/velike/kill hitove:
  malo veci font, duzi rise i citljiviji marker.
- Combat logika samo prosiruje postojece `swings` i `combatText` objekte
  (`hit`, `openedBloom`, `heavy`, `scale`), bez menjanja damage matematike.
- Provera: syntax check za `rendering/renderer.js` i `systems/combat.js`, plus
  targeted boss/signature/layout testovi.

### Faza 8B

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: dotegnuti prvi sat Heartwood questova tako da tutorial, priprema i prvi
  boss imaju jasniji narativni razlog bez menjanja progresije.
- Rani main quest opisi sada bolje objasnjavaju Ayline prve odluke: prvo slusaj
  Hearthroot, zatim obnovi jedan zivi ritam u Homesteadu, pa tek onda idi na put.
- `First Moonleaf`, `Thorns at the Gate`, `Brew Before Blood` i `The Rootwarden`
  dobijaju preciznije objective label-e koji govore igracu sledeci konkretan
  korak, ali zadrzavaju postojece countere i flow.
- `Whispering Call` i `Apothecary's Route` su uvezani sa obnovom sela posle
  Rootwardena: Rowan trazi dokaz da prvi patrolni put opet moze da se koristi,
  a Tamsin pretvara siguran put u realne potione i opremu.
- Prvi side questovi sada imaju quest-specific intro/progress/complete dijalog
  za quest panel, umesto da zavise samo od generickog NPC tona.
- Hearthroot shrine dijalog je poostren kroz iste rane faze: care pre komande,
  Barkskin kao prednost umesto kljuca, i Rootwarden kao guardian zarobljen u
  starom naredjenju.
- Nagrade, prerequisite-i, counteri i testirane toast fraze nisu menjani.
- Provera: syntax check za `data/storyData.js` i `world/arena.js`, targeted
  `quest-flow`, `heartwood-phase-one` i `homestead` testovi, plus puna
  regresija `node --test tests\*.test.mjs` sa 69/69 prolaza.

### Faza 8C

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: nastaviti atlas-inspirisan world art polish bez menjanja collision,
  spawnova ili scene layout-a.
- Fallback ruin renderer sada ima rasute kamene blokove, stubove, biome
  akcent linije i dodatni shadow/glow tretman, dok atlas ruin sprite ostaje
  prioritet kad je dostupan.
- Cottage renderer dobija jaci krovni overhang, ridge highlight, tamniji
  foundation, vertikalnu drvenu armaturu, prozorske plantere, dimnjak detalje
  i novi `drawCottagePorch` sloj.
- Marsh/Chapel cottage trim dobija poseban reed motiv umesto generickog leaf
  tretmana; forest leaf trim dobija male lisnate elipse.
- Hearthroot cauldron i shrine dobijaju citljivije postolje, materijalni stone
  sloj i meki glow, da interaktivni centri budu vidljiviji bez dodatnog HUD-a.
- Segment je renderer-only: hitboxi, interakcije, questovi i scene podaci nisu
  menjani.
- Provera: `node --check rendering\renderer.js`, targeted
  `layout/world-restoration/homestead` testovi sa 15/15 prolaza i puna regresija
  `node --test tests\*.test.mjs` sa 69/69 prolaza.

### Faza 8D

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: smanjiti sansu da mali quest/collectable item deluje nedostupno zbog
  blizine collision zona ili premalog click targeta.
- Combat loot ostaje auto-pickup; audit je pokazao da nema posebnog ground loot
  sistema koji bi mogao da zarobi drop u solid objectu.
- Svi collectable interactable-i (`collectKey`) sada dobijaju najmanje 64px
  interaction radius, osim ako vec imaju veci rucno postavljen radius.
- Hover/click box za collectable predmete je prosiren na 22px minimum, dok
  obicni objekti ostaju na starom manjem hover footprintu.
- Layout testovi sada proveravaju dodatne dinamicne scene state-ove:
  side-active Whispering Woods, active marsh/ruins/chapel/ancient-heart,
  recovery state za Ember/Frost/Scarroot i Starfall archive/echo state.
- Dodat je test da mali collectable (`spirit-flower-1`) ima forgiving radius i
  da ga hover hvata i kada je kursor malo izvan sprite centra.
- Provera: syntax check za `world/arena.js`, `systems/story.js` i
  `tests/layout.test.mjs`, targeted `layout` sa 11/11 prolaza i puna regresija
  `node --test tests\*.test.mjs` sa 71/71 prolaza.

### Faza 8E

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: poboljsati game feel kroz postojece WebAudio cue-ve bez dodavanja
  audio asset fajlova.
- Service akcije sada vracaju `audioCue`, pa main vise ne pogadja cue po tekstu
  rezultata. Kupovina/buyback ostaju `buy`, brewing vraca `brew`, attunement
  `attune`, full restore `heal`, respec `respec`, a Renewal Workbench `renewal`.
- Dodati su sinteticki cue-vi za `collect`, `brew`, `attune`, `heal`, `respec`,
  `renewal`, `training-start` i `training-complete`.
- Harvest sada koristi `collect`, Second Spring board koristi UI cue, a
  Training Grove start/finish vise ne zvuce kao quest completion.
- Quest collectable interactable-i sada queue-uju `collect`, dok obicni shrine
  i object use ostaju na `use-item`.
- Testovi proveravaju da Barkskin brewing i Renewal Workbench vracaju pravi
  `audioCue`, kao i da `spirit-flower-1` collectable queue-uje `collect`.
- Provera: syntax check za `systems/audio.js`, `systems/services.js`,
  `systems/story.js` i `main.js`, targeted `quest-flow/heartwood-phase-one` sa
  22/22 prolaza i puna regresija `node --test tests\*.test.mjs` sa 72/72 prolaza.

### Faza 8F

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: uciniti HUD quest tracker citljivijim bez novog panela ili dodatnog
  ekranskog zauzeca.
- `getActiveQuestEntries` i `getJournalQuestEntries` sada dodaju `stepLabel`
  izveden iz sledeceg nedovrsenog objective-a.
- Step label-i pokrivaju glavne namere: `NEW`, `TURN IN`, `CLAIM`, `BREW`,
  `FIGHT`, `TEND`, `GATHER`, `SEARCH` i fallback `TRACK`.
- Quest tracker prikazuje mali badge desno od quest naslova, sa bojom po tipu
  koraka, pa igrac odmah vidi da li sledi borba, brewing, tending, gathering ili
  pretraga.
- UI ne tumaci questove samostalno; koristi `stepLabel` iz story sloja.
- Test dodaje Heartwood proveru za `TEND`, `FIGHT`, `BREW` i `TURN IN` stanja.
- Provera: syntax check za `systems/story.js`, `ui/hud.js` i
  `tests/heartwood-phase-one.test.mjs`, targeted `heartwood-phase-one/quest-flow`
  sa 23/23 prolaza i puna regresija `node --test tests\*.test.mjs` sa 73/73
  prolaza.

### Faza 8G

- Datum: 2026-07-22
- Status: zavrseno
- Cilj: poboljsati citljivost loot-a i poredenja opreme bez uvodenja novog
  inventarskog ekrana.
- Progression sistem sada ima `getLootIntentLabel`, isti izvor istine za kratku
  gameplay ulogu itema: preparation, quick use, brewing material, attunement
  material ili equipment build fit.
- Combat loot toast za boss/elite/vazne consumable dropove prikazuje vodeci
  item, njegovu ulogu, dodatne iteme i silver, pa igrac odmah zna zasto je drop
  bitan.
- Inventory i shop detail paneli prikazuju `Role`, formatiraju procente,
  cooldown cut, trajanje i range citljivije, i dodaju kratak compare rezime:
  `Best for`, `Build shift`, `Gains` i `Tradeoffs`.
- Hover tooltip za opremu sada nosi isti WoW-like redosled informacija:
  opis, role, bonusi, attunement, equipped item, kratki compare rezime i top
  stat promene.
- Test pokriva loot intent role za preparation, quick use, seed, attunement
  material i dve equipment build grane.

### Faza 8H

- Datum: 2026-07-23
- Status: zavrseno
- Cilj: zavrsni terrain readability pass koji cini biome podove bogatijim bez
  menjanja collisiona, scena ili prljavih atlas tile cropova.
- `terrainAssets` sada koristi siru deterministic variant breakup logiku za
  natural, path, soil, stone, scorched i blight materijale, pa ponavljajuci
  tile pattern manje lici na ravnu tablu.
- Svaki tile dobija dodatni clipped surface breakup sloj: sneg ima meke
  plave drift senke, Ember naprsle korene i zar, kamen mikro pukotine, soil
  brazde, a blight jace tamne veins.
- Dodati su transition detalji po ivici materijala: put dobija travnate rubove,
  voda obalu i reeds, ruin stone mahovinu/rune, Ember spaljeni prelaz, a
  Scarroot thorn rub.
- Terrain pass ostaje renderer-only: nema promena u map layoutu, reachability,
  collision pravilima, spawnovima ili quest flow-u.
- Test dodaje terrain family grouping proveru zato sto transition renderer zavisi
  od stabilnih porodica materijala.
- Runtime QA je proverio Heartwood, Stillwater, Ember, Frost, Scarroot i
  Rootlight screenshotove preko headless Chrome debug fixture-a na `1280x720`.

### Faza 8I

- Datum: 2026-07-23
- Status: zavrseno
- Cilj: nastaviti atlas-inspirisan prop/building polish nakon terrain pass-a,
  bez menjanja collisiona, scena, spawnova ili quest toka.
- Cottage renderer dobija dodatni settlement sloj: krovne highlight linije,
  grounding senku, sitne shingle/nail detalje i biome-specific akcent koji
  prati isti `leaf/reed/ember/frost/thorn/rune` jezik kao terrain.
- Well sada izgleda kao nameran homestead prop, sa malim krovom, rope/bucket
  detaljem, materijalnim stone/timber slojem i diskretnim biome akcentom.
- Fallback fence renderer je prebacen sa ravne horizontalne trake na
  iso-aware rail/post crtanje koje postuje `fenceH` i buduci `fenceV`, uz
  sneg, trsku, rune, thorns, leaf ili ember detalje po biomu.
- Lantern glow je izdvojen u zajednicki helper i sada se dodaje i preko cistih
  atlas lantern spriteova, pa svetla imaju isti citljiv gameplay signal u svim
  scenama.
- Bridge fallback dobija rail/post sloj, materijalne plank detalje i biome
  akcent bez ukljucivanja rizicnih atlas bridge cropova.
- Signpost fallback dobija jasniji top trim, route mark i mali biome akcent,
  korisno posebno u scenama gde je atlas fallback namerno iskljucen.
- Runtime QA je proverio Homestead, Stillwater, Ember, Frost, Scarroot i
  Rootlight screenshotove preko headless Chrome debug fixture-a na `1280x720`.
- Automatizovana provera: syntax check za renderer/atlas/world material module i
  puna regresija `node --test tests\*.test.mjs` sa `75/75` prolaza.

### Faza 8J

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: poboljsati siluete neprijatelja, NPC presence i citljivost borbe bez
  menjanja AI-ja, statova, collisiona, spawnova ili quest toka.
- Enemy sprite pipeline vise ne koristi samo cetiri genericka archetype-a kroz
  `enemy.config.sprite`; renderer sada prosledjuje stvarni `enemy.type`, a
  pixel asset layer mapira svaki biome enemy na odgovarajuci archetype i profil.
- Dodati su posebni vizuelni profili za barkling, blight hound, bog lurker,
  ash brute, icebound guardian, relic sentinel, mire spitter, cinder imp,
  frost wisp, starbound archer, root stalker i rot weaver.
- NPC sprite dobija mali palette accent/trim i grounding halo, da likovi u
  obnovljenim hubovima izgledaju namernije i manje kao placeholder-i.
- Combat renderer dobija damage/role readability sloj: enemy grounding,
  role/damage pipove pored healthbara, elite ring, hit spark, boss aura i
  windup marker po ulozi.
- Windup signal sada razlikuje melee/ranged/support nameru: melee i ranged
  dobijaju pravac napada, support dobija manji aura/cross marker.
- Projektili dobijaju kratak pixel trail obojen po damage tipu, pa igrac lakse
  vidi kretanje neprijateljskih i Ayla spirit bolt projektila.
- Ovaj pass je namerno renderer-only u gameplay smislu: nema novih hitboxova,
  damage promena, loot promena ili quest uslova.
- Runtime QA je proverio Mossy Ruins, Chapel of Tides, Ember Hollow,
  Frostpine Tundra, Hollowheart Ruins i Starfall Sanctum screenshotove preko
  headless Chrome debug fixture-a na `1280x720`.
- Dodatni DevTools combat-lab screenshot u Ember Hollow proverio je enemy role
  pips, damage pips, windup marker po ulozi, hit spark i projectile trail u
  gustoj borbenoj situaciji.
- Automatizovana provera: syntax check za `main.js`, `world/arena.js`,
  `rendering/renderer.js`, `rendering/atlasAssets.js` i
  `rendering/pixelAssets.js`; puna regresija `node --test tests\*.test.mjs`
  prolazi sa `75/75`.

### Faza 8K

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: uciniti Ayla-u i interakcione ciljeve citljivijim bez menjanja
  collisiona, interaction radiusa, quest logike ili input pravila.
- Ayla dobija renderer-only grounding senku i mali zeleni/blue/red aura sloj
  za idle/move, dash i low-health stanja, pa se bolje odvaja od bogatih podova.
- `story.focus` i `story.hovered` sada imaju razlicite world markere:
  najblizi E cilj dobija tihi zeleni pulse, a direktan LMB hover dobija jaci
  zlatni target ring.
- Hover nad objektom van dometa crta topao dashed leash izmedju Ayla-e i cilja,
  tako da "Move closer" pravilo ima vizuelni nagovestaj pre klika.
- Quest/collectable objekti dobijaju diskretan glint kad nisu hover/focus, sto
  pomaze kod malih memory/root/flower/brazier objekata u gustim biome teksturama.
- NPC focus dobija mali palette-colored ring koji koristi vec postojece
  `story.focus` stanje i ne uvodi LMB interakciju sa NPC-jevima.
- Ovaj pass je renderer-only u gameplay smislu: nema novih solid zona, nema
  sirenja hover boxova, nema izmena questova, nagrada ili reachability pravila.
- Runtime QA je preko DevTools kontrolisanih screenshotova proverio in-range
  Homestead interaction marker i out-of-range Starfall Sanctum hover leash.
- Automatizovana provera: syntax check za `main.js`, `world/arena.js`,
  `rendering/renderer.js`, `rendering/atlasAssets.js` i
  `rendering/pixelAssets.js`; puna regresija `node --test tests\*.test.mjs`
  prolazi sa `75/75`.

### Faza 8L

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: poboljsati feedback za loot, quest collectable i quest reward bez
  uvodjenja fizickih dropova na podu i bez novih collision rizika.
- Dodat je `systems/rewardFeedback.js`, mali zajednicki helper koji inicijalizuje
  `particles`/`combatText`, crta kratki reward burst i dodaje floating reward
  label za vec dodeljene nagrade.
- Enemy loot sada na smrti prikazuje kratku potvrdu prvog dobitka (`+1 Ironbark`,
  `+1 Relic Shard`, itd.) i mali particle burst, dok postojece velike toast
  poruke ostaju rezervisane za boss/elite/vazne potion dropove.
- Quest collectable objekti sada daju lokalni `secured` reward label pored
  objekta, pa igrac jasnije vidi da je mali field objective stvarno pokupljen.
- Quest completion reward sada daje floating label kod Ayla-e za prvi reward,
  silver/XP ili level-up, bez menjanja quest nagrada ili ekonomije.
- Renderer razlikuje reward label od damage brojeva kroz mali pixel pill stil,
  pa reward feedback cita kao loot/UI signal, ne kao hit broj.
- Ovaj pass namerno ne uvodi item drop entitete, magnetizam, drop collision ili
  nove pickup hitboxove; time ne pravi nove situacije gde igrac ne moze da
  pridje itemu.
- QA: provereno screenshotom u Ember Hollow sceni i regresijom
  `node --test tests\*.test.mjs`; reward label se cita bez zaklanjanja HUD-a ili
  centralne borbe.

### Faza 8M

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: poboljsati citljivost action bara tako da igrac odmah razume da li je
  skill spreman, na cooldownu, zakljucan, puni ultimate ili nema dovoljno
  Spirit-a.
- `ui/hud.js` dobija `getHudAbilityReadiness`, zajednicki helper za stanja
  `ready`, `cooldown`, `spirit`, `charging` i `locked`.
- Bottom HUD ability slotovi sada imaju mali readiness strip. Blocked stanja
  dobijaju kratak badge (`NO SP`, `LOCK`), cooldown ostaje centralni broj, a
  signature ultimate i dalje pokazuje Heart Charge procenat.
- Hover tooltip za ability slot koristi isti readiness helper i prikazuje
  `Status`, kratak razlog, cenu i cooldown, pa vizuelni signal i tekst ne mogu
  da se razidju.
- Segment ne menja damage, cooldown vrednosti, resource matematiku, input
  pravila ili talent unlock uslove.
- QA: dodat `tests/hud.test.mjs`, screenshotovan Homestead HUD sa low-Spirit,
  cooldown i charging ultimate stanjem; nema fatal browser errora.

### Faza 8N

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: smanjiti osecaj "mrtvog inputa" kada igrac pritisne ability koji ne
  moze da se aktivira zbog cooldowna, Spirit-a, zakljucanog Pulse-a ili
  nedovoljno Heart Charge-a.
- `systems/combat.js` sada na blokiranom ability inputu prikazuje kratku
  floating poruku kod Ayle: `Need Spirit`, `Recharging`, `Dash recharging`,
  `Build Heart Charge` ili `Unlock Pulse`.
- Feedback ima rate-limit po ability/reason paru, pa brzo ponavljanje inputa ne
  zatrpava ekran i ne pretvara HUD u spam.
- Ability-denied tekst je odvojen od damage number settinga: cak i kada su
  damage brojevi iskljuceni, input feedback ostaje vidljiv jer nije damage.
- Segment ne menja cooldown trajanja, Spirit troskove, Heart Charge dobitak,
  damage, range, hitboxe ili talent uslove.
- QA: dodat `tests/combat-feedback.test.mjs`, koji proverava low-Spirit bolt,
  rate-limit, charging ultimate i locked Pulse slucajeve; runtime screenshot je
  proverio stvarni right-click input bez projektila i bez fatal browser errora.

### Faza 8O

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: podici kvalitet Ayle i NPC-jeva bez uvodjenja novog rizicnog bitmap
  spritesheet pipeline-a u sredini gameplay polish faze.
- Ayla proceduralni sprite sada bolje prati dogovoreni nacrt: svetliji hood,
  cistije lice u senci, vidljiviji zeleni sash, vise vine/leaf detalja i
  jaci spirit akcenat na staff vrhu tokom cast/idle varijanti.
- NPC renderer vise ne trazi jedan genericki `npc` sprite, vec prosledjuje
  `npc:<id>`, tako da svaki kljucni lik dobija svoj vizuelni potpis.
- Rowan dobija elder staff i svetliji beard/shoulder trim, Lysa training baton,
  Nettle reed charm, Halen road badge, Tamsin apothecary satchel, Orras relic
  tablet, Garrick ember gauntlet, Vesper frost scarf, Bram ranger pack, Selka
  heart lantern, a Mara lantern-tender detalje.
- Postojeci Ayla atlas ostaje referenca, ali nije ponovo ukljucen jer i dalje
  nosi concept-sheet/label artefakte. Sledeci art segment moze biti cisto
  generisanje production bitmap sheet-a ako zelimo veci skok od proceduralnog
  pass-a.
- Segment ne menja koliziju, AI, quest state, NPC pozicije, hitboxe, combat
  vrednosti ili item pickup logiku.

### Faza 8P

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: smanjiti frustraciju oko objekata koji blokiraju prazan prostor i ne
  dozvoljavaju Ayla-i da im pridje sa strana koje vizuelno deluju otvoreno.
- Collision sistem sada podrzava vise solid rect-ova po jednom objektu kroz
  `getSolidRects`, umesto da svaki prop mora da ima jedan veliki box.
- Kamenje, ruine, cottage i well dobijaju kompozitne footprint-e koji cuvaju
  solidnu bazu objekta, ali oslobadjaju prazne uglove i bocne pristupne lane-ove.
- Collision debug overlay sada crta sve rect-ove iz kompozitnog footprint-a, pa
  audit vise ne sakriva problem iza jednog laznog debug pravougaonika.
- Dodat je layout regression test koji proverava da veliki propovi imaju vise
  footprint delova, da centar ostaje solid, a prazni uglovi ostaju prohodni.
- Segment ne menja player radius, combat dodge, projectile collision pravila,
  NPC pozicije, quest objective pozicije ili interakcione radiuse.

### Faza 8Q

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: dati svim postojecim neprijateljima jasniju siluetu i biome identitet,
  tako da igrac brze prepozna melee, brute, ranged i support pretnje.
- `rendering/pixelAssets.js` enemy sprite pipeline sada koristi dodatne shape
  markere za thorn, bark, hound, lurker, spitter, wisp, imp, frost, star, root,
  rot, guardian, sentinel i ember varijante.
- Small melee grupa vise ne izgleda kao ista grudva: Thornling dobija izrazenije
  bodlje, Barkling bark-plate trup i root feet, Blight Hound nisku cetvoronoznu
  siluetu sa corrupted spike akcentima.
- Brute grupa dobija jaci regionalni read: Bog Lurker je nizi i mocvarniji,
  Ash Brute ima lava cracks/flame shoulders, Icebound Guardian crystal crown i
  ice plates, a Relic Sentinel stone/gold rune tretman.
- Ranged grupa je razdvojena: Mire Spitter vise cita kao spitter/blowpipe sa
  poison sac detaljem, dok Wisp/Cinder/Frost/Star varijante imaju jasnije
  elemental projectile i crown/trail signale.
- Support casteri dobijaju staff/orb/root/rot/thorn detalje koji govore da su
  pozadinska pretnja, a ne obican melee.
- Dodat je `docs/ENEMY_ART_DIRECTION.md` kao dogovoreni art direction za buduci
  bitmap sheet i animacione pass-ove.
- Segment ne menja enemy HP, damage, radius, AI, spawn table, quest uslove,
  projectile brzine, cooldown-e ili loot.

### Faza 8R

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: prevesti prihvaceni enemy concept sheet u citljiv in-game sprite pass.
- `rendering/pixelAssets.js` sada crta produkcionije profile za svih 16 enemy
  tipova, umesto da se vecina razlika oslanja na mali overlay tint.
- Thornling je spiked seed skirmisher, Barkling stump/root creature, a Blight
  Hound niska corrupted hound silueta sa purple spike akcentima.
- Mire Brute, Bog Lurker, Ash Brute, Icebound Guardian i Relic Sentinel dobijaju
  razlicite body planove: marsh hulk, low lurker, ember hulk, ice golem i stone
  idol sentinel.
- Wisp Archer, Mire Spitter, Cinder Imp, Frost Wisp i Starbound Archer sada
  jasnije pokazuju ranged alat ili projectile source u samom sprite-u.
- Root Stalker, Thorn Weaver i Rot Weaver dobijaju jaci support caster read
  kroz staff, orb, root/thorn/fungal detalje.
- Renderer vise ne nanosi stari normal-state sprite tint na neprijatelje, jer
  enemy profil sada sam nosi biome paletu; hit flash ostaje nepromenjen.
- Segment ne menja enemy HP, damage, radius, AI, spawn table, quest uslove,
  projectile brzine, cooldown-e, loot ili collision.

### Faza 8S

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: uskladiti Aylin sprite kvalitet sa novim neprijateljima bez rizika koji
  bi doneo prerani bitmap spritesheet swap.
- `rendering/pixelAssets.js` sada ima zaseban `buildAylaSprite` pipeline za
  Aylu, odvojen od NPC actor buildera.
- Ayla dobija jasniju produkcionu siluetu: svetli hood, tamni face slit, leaf
  mantle, zeleniji cloak/sash, stabilnije noge, prepoznatljiv staff i pose
  detalje za cast, attack i dash.
- `rendering/renderer.js` vise ne pokusava ugaseni Ayla atlas path; proceduralni
  player sprite je trenutno source of truth.
- Dodat je `docs/PLAYER_ART_DIRECTION.md` kao ugovor za buduci bitmap sheet i
  animacione pass-ove.
- QA: syntax check za `pixelAssets`, `renderer` i `atlasAssets`, puna regresija
  `node --test tests\*.test.mjs` sa `79/79` prolaza, proceduralni sprite preview
  za sve facing/pose kombinacije i browser smoke u Homestead sceni bez fatalnih
  runtime gresaka.
- Segment ne menja player collision radius, movement, damage, cooldown-e, NPC
  sprite profile, quest uslove, enemy art ili item pickup logiku.

### Faza 8T

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: generisati Aylin pravi bitmap sprite sheet na osnovu originalnog
  idejnog `ayla-sprite.png` sheet-a i ubaciti ga u igru bez gubljenja fallbacka.
- Novi AI-generisani source je sacuvan kao
  `assets/characters/ayla-v2-generated-source.png`, a ociscena transparentna
  verzija kao `assets/characters/ayla-v2-generated-transparent.png`.
- Iz transparentnog source-a je napravljen normalizovani engine sheet
  `assets/characters/ayla-v2-game-sheet.png` sa 128x128 frameovima i stabilnim
  bottom-center anchorom.
- `rendering/atlasAssets.js` sada ucitava `aylaV2`, gradi fixed-frame Ayla
  animacione bucket-e za down, right, left, up, cast, dash, hurt i death, dok
  stari Ayla atlas ostaje za portrait/reference.
- `rendering/renderer.js` ponovo koristi `drawAylaAtlasSprite` za igraca i dash
  afterimage, ali i dalje pada na proceduralni Ayla sprite ako bitmap atlas jos
  nije spreman.
- Vizuelni pravac sada mnogo vernije prati idejni sprite: veliki ivory hood,
  tamna okrugla face rupa, chibi proporcija, drveni staff sa ring glavom i mali
  zeleni spirit glow.
- QA: syntax check za `atlasAssets`, `renderer`, `pixelAssets`, `hud` i
  `startScreen`, puna regresija `node --test tests\*.test.mjs` sa `79/79`
  prolaza i browser smoke u Homestead sceni bez fatalnih runtime gresaka.
- Segment ne menja player collision radius, movement, damage, cooldown-e, quest
  uslove, enemy art, NPC profile ili item pickup logiku.

### Faza 8U

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: auditovati quest guidance za collectable objective-e, posebno drugi
  Waystone Seal u `The Sealed Reliquary`.
- Drugi Waystone Seal je u `Moonlit Marsh`, kod zapadnog prilaza severnom plank
  mostu; quest log sada izabrani `The Sealed Reliquary` vodi na
  `Whispering Woods` i `Moonlit Marsh`, a posle prvog pokupljenog seal-a ostaje
  samo `Moonlit Marsh`.
- Quest log sada za izabrani quest prikazuje `FIELD LEAD`/route note i za
  optional questove, ne samo za globalni main tracker.
- `Apothecary's Route`, `Depths of Memory` i `Stillwater Homecoming` target data
  dopunjeni su da pokriju stvarne collectable scene.
- Dodat je `getQuestNavigation` helper za bilo koji izabrani quest i regresioni
  test za cross-zone optional questove.
- Layout test sada proverava da static quest target data pokriva scene u kojima
  postoje collectable objective-i.
- QA: puna regresija `node --test tests\*.test.mjs` sa `81/81` prolaza i
  browser smoke koji selektuje `The Sealed Reliquary` posle prvog seal-a i
  potvrdjuje runtime target `Moonlit Marsh`.
- Segment ne menja quest nagrade, required countere, scene placement, collision,
  combat, item dropove ili unlock uslove.

### Faza 8V

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: popraviti stvarni staging drugog `Waystone Seal` objective-a u
  `Moonlit Marsh`, jer je bio postavljen preko vode/bridge vizuelnog sloja i
  igrac ga je mogao promasiti iako je tehnicki bio reachable.
- `waystone-seal-2` je pomeren sa `1198,244` na `1052,270`, na cist travnati
  zapadni prilaz severnom plank mostu.
- Navigation hint za `The Sealed Reliquary` sada opisuje novi staging:
  `western approach to the north plank bridge`.
- Dodat je layout regression test koji proverava da `waystone-seal-2` ostaje
  path-reachable i da ne sedi unutar `water` ili `bridge` vizuelnog bounds-a.
- QA: targeted syntax check za `world/arena.js`, `systems/navigation.js` i
  `tests/layout.test.mjs`, targeted `layout` + `heartwood-phase-one` testovi i
  browser screenshot potvrda da se seal vidi i da prompt radi sa normalnog
  prilaza.
- Segment ne menja quest countere, nagrade, interaction radius, combat, enemy
  spawnove, bridge/water collision ili Tide Seal staging.

### Faza 8W

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: zameniti Aylin prethodni single-read bitmap pass pravim cetvorosmernim
  sprite sheetom pre nego sto isti pipeline prenesemo na neprijatelje.
- Novi AI-generisani source je sacuvan kao
  `assets/characters/ayla-v3-directional-source.png`, a normalizovani engine
  sheet kao `assets/characters/ayla-v3-directional-game-sheet.png`.
- Sheet koristi 128x128 fixed cells: row 0 down, row 1 right, row 2 left, row 3
  up, row 4 action frames, sa stabilnim bottom-center anchorom za postojece
  senke i world sort.
- `rendering/atlasAssets.js` sada preferira `aylaV3`, zatim pada na v2 bitmap
  sheet, pa tek onda na stari concept atlas/procedural fallback.
- `rendering/renderer.js` sada tokom hodanja bira facing iz player velocity
  vektora, dok attack, cast i dash i dalje koriste aim angle.
- Ovo resava problem gde Ayla izgleda kao da je okrenuta u isti smer dok trci
  gore, dole, levo ili desno.
- QA: syntax check za `rendering/atlasAssets.js`, `rendering/renderer.js` i
  `rendering/pixelAssets.js`, puna regresija `node --test tests\*.test.mjs`
  sa `82/82` prolaza i browser smoke screenshot
  `ayla-v3-directional-runtime.png` u `PLAYING` modu sa WASD movement facing
  proverom.
- Segment ne menja player radius, brzinu, damage, cooldown-e, enemy art,
  collision, quest uslove ili item pickup logiku.

### Faza 8X

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: preneti Ayla v3 directional pipeline na neprijatelje i zameniti
  proceduralni enemy read pravim bitmap atlasom inspirisanim prihvacenim
  enemy concept sheetom.
- `assets/enemies/enemy-v1-concept-source.png` cuva prihvaceni 16-enemy
  concept board koji definise finalne siluete.
- Cetiri AI-generisana directional source sheet-a cuvaju grupe neprijatelja:
  Heartwood, Marsh/Ember, Ember/Frost/Blight i Scarroot/Rootlight.
- `assets/enemies/enemy-v1-directional-game-sheet.png` je normalizovani engine
  atlas: 16 enemy rows x 4 facings, fixed 128x128 cells, columns
  down/right/left/up.
- `assets/enemies/enemy-v1-directional-metadata.json` belezi source trim i
  destination podatke za svaku celiju, da sledeci recut ne bude slepo seckanje.
- `rendering/atlasAssets.js` sada ucitava `enemyV1`, gradi enemy frame bucket-e
  po tipu i facingu i izvlaci mali renderer-side bob/windup/stun pose offset.
- `rendering/renderer.js` prvo crta `drawEnemyAtlasSprite`, a proceduralni
  `getEnemySprite` ostaje fallback ako atlas nije spreman ili neki tip nije
  mapiran.
- QA: syntax check za `rendering/atlasAssets.js` i `rendering/renderer.js`,
  puna regresija `node --test tests\*.test.mjs` sa `82/82` prolaza, browser
  smoke u `Whispering Woods` bez console/page errora i runtime showcase svih
  16 enemy tipova sa `enemy-v1-runtime-showcase.png`.
- Segment ne menja enemy HP, AI, radius, collision, damage, spawn table, loot,
  projectile brzine, quest uslove, boss art ili combat brojeve.

### Faza 8Y

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: ukloniti los water collision overlay koji je prekrivao vec lepo
  nacrtane water tile-ove i nije se poklapao sa tile gridom.
- `rendering/renderer.js` vise ne crta `water` obstacle kao veliki providni
  isometric rectangle preko scene.
- Voda se u normalnom prikazu sada oslanja na `rendering/terrainAssets.js`:
  atlas floor texture, tile water details, liquid biome signature i shoreline
  transition po stvarnim water/ice tile-ovima.
- Collision i bridge ignore logika ostaju nepromenjeni; water obstacle ostaje
  gameplay/collision podatak, samo vise nije regularan visual layer.
- Debug collision i dalje moze da se koristi za audit solidnih zona kada treba
  proveriti zasto se nekom objektu ne moze prici.
- QA: syntax check za `rendering/renderer.js`, `rendering/terrainAssets.js` i
  `rendering/atlasAssets.js`, puna regresija `node --test tests\*.test.mjs`
  sa `82/82` prolaza i browser screenshots za `Mossy Ruins`,
  `Moonlit Marsh` i `Frostpine Tundra` bez velikog water overlay romba.
- Segment ne menja water tile placement, collision rects, bridge behavior,
  scene progression, quest placement, enemy spawnove ili combat.

### Faza 8Z

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: stilizovati donji HUD tako da bude blizi novom forest ARPG identitetu
  i zameniti ravne skill glyphove citljivim tematskim ikonicama.
- Dodat je `rendering/hudIconAssets.js`, mali runtime icon renderer za HUD
  skillove, ultimate varijante i quick-use consumable iteme.
- Skill bar sada ima rezbareni forest frame, mahovinski centralni rail,
  tematske key badge-eve, bolje cooldown/locked/spirit state layer-e i
  icon pass za `Staff Strike`, `Spirit Bolt`, `Quick Dash`, `Root Snare`,
  `Verdant Pulse`, `Heartwood Tempest`, `Verdant Nova` i `Awaken the Grove`.
- Action slotovi i quick counters sada crtaju potion/tonic/elixir ikonice
  umesto obicnih obojenih kvadrata; pokriveni su osnovni potion/tonic itemi,
  regional preparation eliksiri i buff phial-i.
- Health/Spirit orbovi, XP bar, silver chip i donji status chipovi su
  vizuelno ujednaceni sa novim HUD materijalom, bez promene layout dimenzija.
- Segment ne menja combat brojeve, input mapiranje, cooldown-e, inventory
  logiku, quick-slot podatke, talent unlock uslove ili velicinu HUD panela.

### Faza 8AA

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: pribliziti sve glavne prozore i prikaze istom carved forest UI jeziku
  koji je uveden na donjem HUD-u.
- Dodat je `ui/forestChrome.js` kao zajednicki canvas UI chrome modul za
  forest panel, subpanel, dugme, close button, pill i frame tretman.
- `ui/hud.js` sada koristi zajednicki forest chrome za Field Journal, Ayla
  character/inventory/talents/services overlay, World Map, dialogue box,
  tooltipove, interaction/exit promptove, Training Grove panel i postojece
  manje HUD backdrop-e.
- `ui/questPanel.js` je prebacen na isti outer frame, topic listu, content
  panel, status pill i action button stil, bez promene quest logike.
- `ui/startScreen.js` sada koristi isti forest chrome za title, options,
  pause i game-over frame, panel blokove, guide kartice, dugmad, option row
  elemente i state pill kontrole.
- Segment ne menja hotkeye, hover targete, quest acceptance/turn-in flow,
  save/load ponasanje, menu selekcije, input routing, world map node podatke
  ili gameplay brojeve.

### Faza 8AB

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: ukloniti vidljivu pravougaonu "hitbox" kocku koja se pojavljivala oko
  neprijatelja kada primi udarac.
- `rendering/atlasAssets.js` sada hit-flash tint crta preko alpha-maskiranog
  offscreen sprite canvasa, pa se prebojava samo telo sprite-a umesto celog
  frejma preko vec nacrtanog terena.
- `rendering/pixelAssets.js` dobija isti masked-tint fallback, da proceduralni
  sprite-evi i atlas sprite-evi imaju isto ponasanje.
- QA: syntax check za `rendering/atlasAssets.js` i `rendering/pixelAssets.js`,
  puna regresija `node --test tests\*.test.mjs` sa `82/82` prolaza i browser
  smoke screenshot `enemy-hitflash-mask-forced-enemy.png` u `Whispering Woods`.
- Segment ne menja enemy collision, radius, AI, combat brojeve, hit timing,
  health bar, damage text ili spawn table.

### Faza 8AC

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: nastaviti podove/vodu u modernijem atlas-inspirisanom smeru bez
  vracanja velikih overlay poligona.
- `rendering/terrainAssets.js` sada vodi i led crta sa lokalnim tile-aligned
  depth linijama, wave bandovima, shore glintovima i Stillwater reed detaljem
  koji ostaje unutar diamond clip-a svakog tile-a.
- Path, planks i ruinStone podovi dobijaju dodatni `drawFloorRelief` sloj:
  kratke seam/crack/nail/rune detalje po materijalu i biomu, da podovi citaju
  vise kao authored pixel material a manje kao ravna ispuna.
- Dodata je regresija da `planks` ostane poseban terrain family i ne sklizne u
  path/stone tretman.
- QA: syntax check za `rendering/terrainAssets.js`, targeted
  `terrain-assets/layout/heartwood-phase-one` testovi, puna regresija
  `node --test tests\*.test.mjs` sa `82/82` prolaza i browser screenshots za
  `mossroot_marsh`, `chapel_of_tides`, `frostveil_tundra` i `mossy_ruins`.
- Segment ne menja tile placement, collision, bridge ignore, water obstacle
  podatke, scene progression, prop asete, enemy spawnove ili HUD layout.

### Faza 8AD

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: podici prisustvo Ayle i NPC-jeva u sceni bez rizicnog recut-a
  postojeceg v3 bitmap sheet-a.
- `rendering/renderer.js` sada crta Ayla action overlay posle atlas/fallback
  sprite-a: movement leaf flecks, jasnije dash streaks, cast staff glint/motes
  i mali staff attack glint.
- NPC-jevi sada biraju facing prema Ayla-i kada je blizu ili kada su fokusirani,
  uz spori idle frame offset po NPC-u, pa vise ne deluju kao staticni cutout-i.
- Service/focused NPC-jevi dobijaju diskretan palette glint i focus line iznad
  glave, bez novog panela ili dodatnog quest state-a.
- `docs/PLAYER_ART_DIRECTION.md` belezi da su ovi efekti renderer-side dodatak
  preko v3 sheet-a, ne zamena sheet pipeline-a.
- QA: syntax check za `rendering/renderer.js`, targeted
  `layout/heartwood-phase-one/homestead` testovi, puna regresija
  `node --test tests\*.test.mjs` sa `82/82` prolaza i browser screenshots za
  Homestead NPC focus, Ayla cast i Ayla dash state.
- Segment ne menja player movement, collision, attack/cast timing, hitboxe,
  NPC pozicije, NPC interakcione radiuse, quest flow ili save format.

### Faza 8AE

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: uciniti neprijateljske napade citljivijim i prijatnijim za reakciju bez
  promene AI-ja ili combat brojeva.
- `rendering/renderer.js` sada posle enemy sprite-a crta `drawEnemyActionDetails`:
  windup charge tick duz pravca napada, role-colored motes za ranged/support i
  mali recover dust/release trag.
- `drawEnemyWindupMarker` sada koristi stvarni `stateTimer/config.windup`
  progress da ring i charge marker jace pulsiraju kako se release priblizava.
- `docs/ENEMY_ART_DIRECTION.md` belezi da su ovi efekti renderer-side
  readability sloj preko enemy v1 sheet-a, ne zamena sprite pipeline-a.
- QA: syntax check za `rendering/renderer.js`, targeted
  `combat-feedback/signature-ultimate/heartwood-phase-one` testovi, puna
  regresija `node --test tests\*.test.mjs` sa `82/82` prolaza i browser
  showcase `enemy-windup-recover-showcase-v2.png`.
- Segment ne menja enemy windup duration, recover duration, damage, AI odluke,
  projectile brzine, collision radius, spawn table, loot ili quest progression.

### Faza 8AF

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: podici quest presentation da igrac odmah vidi sta je sledeci korak,
  koliko je objektiva gotovo i gde treba da ide, bez menjanja quest uslova.
- `systems/story.js` sada uz svaki active/journal/NPC quest view vraca
  `objectiveProgress` (`completed`, `total`, `current`, `required`, `percent`,
  `activeIndex`) kao jedinstven UI ugovor.
- `ui/hud.js` quest tracker dobija mini progress rail i step pipove, a Field
  Journal detalj dobija objective card sa checkboxovima, current-step akcentom,
  per-objective trakom i stilizovanim `FIELD LEAD` route blokom.
- `ui/questPanel.js` sada prihvatanje/progress/turn-in quest prozore crta istim
  objective card jezikom kao Journal, da NPC razgovor i log ne deluju kao dva
  odvojena sistema.
- Dodata je regresija za `First Moonleaf` da quest entry izbacuje tacan
  multi-step progress kroz tutorial ritam.
- QA: syntax check za `systems/story.js`, `ui/hud.js` i `ui/questPanel.js`,
  targeted `heartwood-phase-one/quest-flow` testovi, puna regresija
  `node --test tests\*.test.mjs` i browser screenshots za Journal i NPC quest
  panel.
- Segment ne menja tekst questova, quest gating, counters, navigation targete,
  NPC pozicije, input hotkeye ili combat/progression brojeve.

### Faza 8AG

- Datum: 2026-07-29
- Status: zavrseno
- Cilj: zameniti genericki proceduralni boss izgled novim boss sprite sheetom
  koji pripada istom modernizovanom jeziku kao novi enemy sprite-evi.
- Dodat je `scripts/generate-boss-sprites.mjs`, deterministicki generator za
  128x128 down/right/left/up boss atlas.
- Dodat je `assets/bosses/boss-v1-directional-game-sheet.png` sa sedam boss
  redova: Rootwarden, Bog Matron, Cinder Warden, Veil Seraph, Elder Hollow,
  Rootbound Custodian i Starwoken Sentinel.
- Dodat je `assets/bosses/boss-v1-directional-metadata.json` da row/column
  ugovor ostane jasan za buduce recut/AI sprite passove.
- `rendering/atlasAssets.js` sada ucitava boss v1 sheet i eksportuje
  `drawBossAtlasSprite`, a `rendering/renderer.js` koristi bitmap boss sprite
  sa proceduralnim `getBossSprite` fallbackom.
- `docs/ENEMY_ART_DIRECTION.md` sada belezi boss roster art direction i atlas
  ugovor.
- Dodata je regresija `tests/boss-sprites.test.mjs` za PNG dimenzije i
  metadata row/facing kontrakt.
- QA: generator/syntax check za `scripts/generate-boss-sprites.mjs`,
  `rendering/atlasAssets.js` i `rendering/renderer.js`, targeted boss sprite
  test, puna regresija `node --test tests\*.test.mjs` sa `83/83` prolaza i
  browser screenshots svih sedam bossova u njihovim scenama.
- Segment ne menja boss AI, HP, damage, attack timing, faze, hitbox/collision
  radius, loot, quest progression ili boss arena layout.

## Van trenutnog scopea

- Durability i repair.
- Obavezni counter potioni.
- Potpuni reset ociscenih zona.
- Desetine cropova i recepata bez gameplay uloge.
- Beskonacni talent poeni.
- Sest novih hub mapa kada postojece scene mogu da nose pricu.
