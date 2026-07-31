# Omezení nahrávání audia na MP3 do 12 MB

## Cíl

Riskuj bude přijímat nové audio soubory pouze ve formátu MP3 a nejvýše do
12 000 000 bajtů. WAV ani větší MP3 nepůjde nahrát z administrace ani přímým
požadavkem na server.

## Chování

- Výběr souboru v administraci nabídne pouze soubory `.mp3`.
- MP3 o velikosti nejvýše 12 000 000 bajtů bude povoleno.
- MP3 o velikosti 12 000 001 bajtů a větší bude odmítnuto.
- WAV a ostatní formáty budou odmítnuty.
- Při překročení velikosti uživatel uvidí zprávu
  „MP3 soubor může mít maximálně 12 MB.“
- Při nepodporovaném formátu uživatel uvidí zprávu
  „Nahrajte prosím soubor MP3.“
- Již uložené WAV soubory zůstanou dostupné pro přehrávání. Omezení platí jen
  pro nové uploady.

## Technické řešení

Kontrola poběží ve třech vrstvách:

1. Sdílený modul definuje limit, rozpoznání MP3 a chybové kódy, aby klient,
   lokální server a produkční Worker neměly tři mírně odlišná pravidla.
2. Komponenta pro výběr audia omezí `accept` na `.mp3` a před odesláním
   zkontroluje typ, příponu a velikost.
3. Lokální Express server povolí pouze MP3 a v upload middleware nastaví limit
   12 000 000 bajtů.
4. Produkční Worker použije stejný formátový a velikostní limit před uložením
   souboru do objektového úložiště.

Server zůstává autoritativní. Kontrola v prohlížeči slouží k rychlé zpětné
vazbě a zabrání zbytečnému odesílání příliš velkého souboru.

## Chybové odpovědi

API vrátí stav `400` s jednoznačným kódem zprávy:

- nepodporovaný formát: `Only MP3 audio uploads are supported.`
- překročená velikost: `MP3 file must not exceed 12 MB.`

Klient tyto zprávy přeloží do českých hlášek uvedených výše.

## Testy

Regresní testy pokryjí:

- přijetí platného MP3,
- přijetí MP3 o velikosti přesně 12 000 000 bajtů,
- odmítnutí MP3 o velikosti 12 000 001 bajtů,
- odmítnutí WAV,
- omezení dialogu pro výběr na `.mp3`,
- správnou českou zprávu pro nepovolený formát a překročenou velikost,
- shodné chování lokálního serveru a produkčního Workeru.

Po změně proběhne celý testovací balík, TypeScript kontrola a produkční build.
Schválená verze se následně znovu nasadí na stávající privátní web Riskuj.
