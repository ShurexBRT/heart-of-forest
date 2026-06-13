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
- Rootcaller: root, sustain, alchemy utility i Ancient Accord.

Kampanja daje najvise osam poena. Waystone nudi respec ili gear attunement, ne
beskonacnu kupovinu talent poena.

## Faze

| Faza | Sadrzaj | Status |
| --- | --- | --- |
| 0 | Campaign/save temelj, combat citljivost, loot zastita, zivi dokument | Zavrseno |
| 1 | Heartwood prica, Training Grove, Journal, prvi loadout | Sledece |
| 2 | Stillwater, Bestiary i regionalna navigacija | Planirano |
| 3 | Ember prica i drugi loadout | Planirano |
| 4 | Frost prica i treci loadout | Planirano |
| 5 | Scarroot prica i Signature ultimate izbor | Planirano |
| 6 | Rootlight finale i zavrsna sekvenca | Planirano |
| 7 | Second Spring postgame i optional challenge loop | Planirano |

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

### Sledeca faza - Faza 1

1. Prosiriti Heartwood dijalog i quest ritam tako da prica jasno reaguje na
   Wake the Hearthroot, Moonleaf, Barkskin i Rootwarden dogadjaje.
2. Uvesti Journal kao jedinstvenu povrsinu za main/side questove i prvi
   regionalni pregled.
3. Napraviti Training Grove u okviru postojece Homestead scene.
4. Uvesti prvi loadout slot i bezbedno cuvanje equipment/action slot postavke.
5. Dodati prve Bestiary tragove za Thorn i Rootwarden napade, bez punog
   Stillwater Bestiary sistema koji pripada Fazi 2.

## Van trenutnog scopea

- Durability i repair.
- Obavezni counter potioni.
- Potpuni reset ociscenih zona.
- Desetine cropova i recepata bez gameplay uloge.
- Beskonacni talent poeni.
- Sest novih hub mapa kada postojece scene mogu da nose pricu.
