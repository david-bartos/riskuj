import { useEffect } from "react";

const interactiveSelector = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='tab']",
  "[role='switch']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function quote(value: string) {
  return `„${value}“`;
}

function labelTextFor(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const labels = "labels" in control && control.labels ? Array.from(control.labels) : [];

  for (const label of labels) {
    const directLabel = Array.from(label.children).find(
      (child) => child.tagName.toLowerCase() === "span"
    );
    const text = cleanText(directLabel?.textContent ?? label.textContent);
    if (text) {
      return text;
    }
  }

  return "";
}

function baseTextFor(element: Element) {
  const ariaLabel = cleanText(element.getAttribute("aria-label"));
  if (ariaLabel) {
    return ariaLabel;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return (
      labelTextFor(element) ||
      cleanText(element.getAttribute("placeholder")) ||
      cleanText(element.getAttribute("name"))
    );
  }

  return cleanText(element.textContent);
}

function buttonTooltip(element: HTMLElement, label: string) {
  if (element.classList.contains("tile-button")) {
    return `Kliknutím vyberete dlaždici ${quote(label)}. Dalším kliknutím ji otevřete v otázkovém dialogu.`;
  }

  if (element.classList.contains("team-award-button")) {
    return `Kliknutím přidělíte aktuální body týmu ${quote(label)}. Dialog se zavře a skóre se přepočítá.`;
  }

  if (label.startsWith("Přičíst ")) {
    return `Kliknutím přičtete body vybranému týmu. Změna se projeví hned ve skóre.`;
  }

  if (label.startsWith("Odečíst ")) {
    return `Kliknutím odečtete body vybranému týmu. Změna se projeví hned ve skóre.`;
  }

  const knownActions: Record<string, string> = {
    "Nová hra": "Kliknutím založíte novou prázdnou hru v editoru. Uloží se až tlačítkem Uložit hru.",
    "Vrátit se do hry": "Kliknutím se vrátíte do rozehrané hry. Aktuální průběh hry zůstane zachovaný.",
    "Spustit novou hru": "Kliknutím otevřete vybranou hru v herním režimu. Pokud už běží jiná hra, potvrzení „Ano“ ukončí stávající průběh a začne novou hru; „Návrat“ vás nechá v adminu.",
    "Přidat kolo": "Kliknutím přidáte další podporované kolo do hry. Nové kolo se uloží až při uložení hry.",
    "Exportovat JSON": "Kliknutím stáhnete aktuální hru jako JSON soubor. Hodí se jako záloha nebo pro přenos zadání.",
    "Uložit hru": "Kliknutím uložíte aktuální úpravy hry na server. Po uložení ji můžete spustit v herním režimu.",
    "Konec": "Kliknutím otevřete závěrečné vyhodnocení hry. Umístění se potom odkrývají postupně.",
    "Admin": "Kliknutím přejdete z herního režimu do adminu. Rozehraná hra zůstane dostupná pro návrat.",
    "Zobrazit odpověď": "Kliknutím odkryjete odpověď k aktuální otázce. Potom můžete přidělit body týmu nebo otázku označit jako neuhodnutou.",
    "Nikdo neuhodl": "Kliknutím označíte otázku jako neuhodnutou. Skóre týmů se nezmění.",
    "Zapsat poslechové body": "Kliknutím zapíšete vybrané body v poslechovém kole. Skóre týmů se aktualizuje podle zvolených hodnot.",
    "Odkrýt další umístění": "Kliknutím odhalíte další místo ve výsledkovém dialogu. Pořadí se odkrývá od posledního k prvnímu.",
    "Zpět na tabuli": "Kliknutím zavřete dialog a vrátíte se na herní tabuli.",
    "Odebrat audio": "Kliknutím odeberete připojené audio z této položky. Soubor z knihovny tím nemažete.",
    "Smazat položku": "Kliknutím odstraníte tuto položku z kola. Změna se uloží až při uložení hry.",
    "Smazat indicii": "Kliknutím odstraníte tuto indicii z položky. Změna se uloží až při uložení hry.",
    "Přidat indicii": "Kliknutím přidáte další indicii. Text indicie pak upravíte přímo v editoru."
  };

  if (knownActions[label]) {
    return knownActions[label];
  }

  if (label.startsWith("Odebrat kolo")) {
    return "Kliknutím odeberete toto kolo ze hry. Změna se uloží až při uložení hry.";
  }

  if (label === "Odebrat" || label.startsWith("Smazat ")) {
    return `Kliknutím spustíte akci ${quote(label)}. Změna se uloží až při uložení hry.`;
  }

  return `Kliknutím spustíte akci ${quote(label)}.`;
}

function tooltipTextFor(element: Element) {
  const label = baseTextFor(element);
  if (!label) {
    return "";
  }

  const role = element.getAttribute("role");
  if (role === "tab") {
    return `Kliknutím otevřete záložku ${quote(label)}. Obsah editoru nebo hry se přepne bez automatického uložení.`;
  }

  if (role === "checkbox" || (element instanceof HTMLInputElement && element.type === "checkbox")) {
    return `Kliknutím zapnete nebo vypnete volbu ${quote(label)}. Změna se uloží až při uložení hry.`;
  }

  if (element instanceof HTMLSelectElement) {
    return `Výběrem změníte hodnotu pole ${quote(label)}. Změna se projeví v aktuálně otevřené hře nebo editoru.`;
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === "file") {
      if (label.toLowerCase().includes("json")) {
        return `Kliknutím vyberete JSON soubor pro import hry. Import nahradí aktuálně otevřenou hru.`;
      }

      return `Kliknutím vyberete MP3 nebo WAV soubor. Po nahrání se audio připojí k této položce.`;
    }

    return `Do pole ${quote(label)} napište hodnotu. Změna se uloží až při uložení hry.`;
  }

  if (element instanceof HTMLTextAreaElement) {
    return `Do pole ${quote(label)} napište delší text. Změna se uloží až při uložení hry.`;
  }

  if (element instanceof HTMLAnchorElement) {
    return `Kliknutím přejdete na ${quote(label)}.`;
  }

  if (element instanceof HTMLButtonElement || role === "button" || role === "menuitem") {
    return buttonTooltip(element as HTMLElement, label);
  }

  return `Prvek ${quote(label)} je interaktivní. Použijte ho k úpravě nebo ovládání aktuální obrazovky.`;
}

function applyTooltips(root: ParentNode = document) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(interactiveSelector));

  for (const element of elements) {
    const hasManualTitle =
      element.hasAttribute("title") && element.getAttribute("data-auto-tooltip") !== "true";
    if (hasManualTitle) {
      continue;
    }

    const tooltip = tooltipTextFor(element);
    if (!tooltip) {
      continue;
    }

    element.setAttribute("title", tooltip);
    element.setAttribute("data-auto-tooltip", "true");
  }
}

export default function InteractiveTooltips() {
  useEffect(() => {
    applyTooltips();

    const observer = new MutationObserver(() => applyTooltips());
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
