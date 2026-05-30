# Zvukové efekty pro prezentaci

Sem patří krátké MP3 zvuky pro projektorový herní režim.

Aplikace očekává přesné názvy souborů:

- `open.mp3` - otevření otázky
- `correct.mp3` - správná odpověď
- `wrong.mp3` - špatná odpověď
- `timeout.mp3` - vypršení času, připraveno pro budoucí časovač

Soubory vložte do složky `public/sfx/`. Ve výsledné aplikaci budou dostupné jako `/sfx/open.mp3`, `/sfx/correct.mp3`, `/sfx/wrong.mp3` a `/sfx/timeout.mp3`.

Pokud soubor chybí nebo prohlížeč zablokuje přehrání zvuku, herní režim pokračuje bez pádu aplikace.
