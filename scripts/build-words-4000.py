#!/usr/bin/env python3
"""Build data/words-4000.json from CC-licensed German–Persian sources.

Sources (see data/ATTRIBUTION.md):
- farhang (CC BY-SA 3.0): core DE→FA glosses
- FreeDict deu-pes (CC BY-SA 4.0): extra glosses and noun gender
- FrequencyWords OpenSubtitles DE (CC BY-SA 3.0): frequency rank
- german-nouns / de.wiktionary (CC BY-SA 4.0): plurals and gender
"""

from __future__ import annotations

import csv
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / ".cache"
OUTPUT = ROOT / "data" / "words-4000.json"
TARGET = 4000

FARHANG_LETTERS = "abcdefghijklmnopqrstuvwxyz"
SOURCES = {
    "freq": (
        "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt",
        CACHE / "de_50k.txt",
    ),
    "tei": (
        "https://raw.githubusercontent.com/freedict/fd-dictionaries/2803d678025d0e88d298cb01b3518b63a52143a8/deu-pes/deu-pes.tei",
        CACHE / "deu-pes.tei",
    ),
    "nouns": (
        "https://raw.githubusercontent.com/gambolputty/german-nouns/main/german_nouns/nouns.csv",
        CACHE / "nouns.csv",
    ),
}

GERMAN_RE = re.compile(r"^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\-]*$")
HARAKAT_RE = re.compile(r"[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]")
ENTRY_RE = re.compile(r"<entry>(.*?)</entry>", re.S)
ORTH_RE = re.compile(r"<orth>([^<]+)</orth>")
GEN_RE = re.compile(r"<gen>([^<]+)</gen>")
QUOTE_RE = re.compile(r"<quote>([^<]+)</quote>")
VERB_RE = re.compile(r"(?:en|eln|ern)$", re.I)

# Lowercase lemmas that look like infinitives but are not verbs.
NOT_VERBS = {
    "eben",
    "eigen",
    "elfen",
    "esel",
    "fern",
    "gegen",
    "gern",
    "innen",
    "morgen",
    "neben",
    "offen",
    "osten",
    "regen",
    "riesen",
    "seen",
    "selten",
    "trocken",
    "unten",
    "uneben",
    "unzufrieden",
    "wegen",
    "westen",
    "zufrieden",
}

# Finite/inflected forms that must not steal a different lemma (habe→Habe).
INFLECTED_SKIP = {
    "bin",
    "bist",
    "ist",
    "sind",
    "seid",
    "war",
    "warst",
    "waren",
    "wart",
    "wäre",
    "wärst",
    "wären",
    "gewesen",
    "habe",
    "hast",
    "hat",
    "habt",
    "hatte",
    "hattest",
    "hatten",
    "hättest",
    "hätten",
    "gehabt",
    "hab",
    "werde",
    "wirst",
    "wird",
    "werdet",
    "wurde",
    "wurdest",
    "wurden",
    "geworden",
    "würde",
    "würdest",
    "würden",
    "kann",
    "kannst",
    "könnt",
    "konnte",
    "gekonnt",
    "könnte",
    "könnten",
    "muss",
    "muß",
    "musst",
    "müßt",
    "müsst",
    "musste",
    "gemusst",
    "müsste",
    "soll",
    "sollst",
    "sollt",
    "sollte",
    "sollten",
    "will",
    "willst",
    "wollt",
    "wollte",
    "wollten",
    "gewollt",
    "darf",
    "darfst",
    "dürft",
    "durfte",
    "gedurft",
    "dürfte",
    "mag",
    "magst",
    "mochte",
    "möchte",
    "möchten",
    "gemocht",
    "weiß",
    "weisst",
    "weißt",
    "wisst",
    "wusste",
    "gewusst",
    "geht",
    "ging",
    "gegangen",
    "komme",
    "kommst",
    "kommt",
    "kam",
    "gekommen",
    "sieht",
    "sah",
    "gesehen",
    "gibt",
    "gab",
    "gegeben",
    "sagt",
    "gesagt",
    "macht",
    "gemacht",
    "nimmt",
    "nahm",
    "genommen",
    "tut",
    "getan",
    "lässt",
    "läßt",
    "ließ",
    "gelassen",
    "steht",
    "stand",
    "gestanden",
    "bleibt",
    "blieb",
    "geblieben",
    "liegt",
    "lag",
    "gelegen",
    "hält",
    "hielt",
    "gehalten",
    "findet",
    "fand",
    "gefunden",
    "denkt",
    "dachte",
    "gedacht",
    "den",
    "dem",
    "des",
    "einem",
    "einen",
    "einer",
    "eines",
    "keinen",
    "keinem",
    "keiner",
    "meinen",
    "meinem",
    "meiner",
    "deinen",
    "deinem",
    "deiner",
    "seine",
    "seinen",
    "seinem",
    "ihrer",
    "ihren",
    "ihrem",
}

FUNCTION_POS: dict[str, str] = {
    "ich": "pron",
    "du": "pron",
    "er": "pron",
    "sie": "pron",
    "es": "pron",
    "wir": "pron",
    "ihr": "pron",
    "mich": "pron",
    "mir": "pron",
    "dich": "pron",
    "dir": "pron",
    "ihn": "pron",
    "ihm": "pron",
    "uns": "pron",
    "euch": "pron",
    "ihnen": "pron",
    "man": "pron",
    "mein": "pron",
    "dein": "pron",
    "sein": "verb",
    "unser": "pron",
    "euer": "pron",
    "der": "article",
    "die": "article",
    "das": "article",
    "den": "article",
    "dem": "article",
    "des": "article",
    "ein": "article",
    "eine": "article",
    "einer": "article",
    "einem": "article",
    "einen": "article",
    "eines": "article",
    "kein": "article",
    "und": "conj",
    "oder": "conj",
    "aber": "conj",
    "denn": "conj",
    "weil": "conj",
    "wenn": "conj",
    "dass": "conj",
    "daß": "conj",
    "ob": "conj",
    "als": "conj",
    "wie": "adv",
    "sowie": "conj",
    "sondern": "conj",
    "obwohl": "conj",
    "damit": "conj",
    "nachdem": "conj",
    "bevor": "conj",
    "während": "conj",
    "in": "prep",
    "an": "prep",
    "auf": "prep",
    "aus": "prep",
    "bei": "prep",
    "mit": "prep",
    "nach": "prep",
    "von": "prep",
    "zu": "prep",
    "für": "prep",
    "über": "prep",
    "unter": "prep",
    "vor": "prep",
    "hinter": "prep",
    "neben": "prep",
    "zwischen": "prep",
    "durch": "prep",
    "um": "prep",
    "gegen": "prep",
    "ohne": "prep",
    "bis": "prep",
    "seit": "prep",
    "ab": "prep",
    "am": "prep",
    "im": "prep",
    "zum": "prep",
    "zur": "prep",
    "vom": "prep",
    "beim": "prep",
    "nicht": "adv",
    "nein": "adv",
    "ja": "adv",
    "auch": "adv",
    "nur": "adv",
    "noch": "adv",
    "schon": "adv",
    "so": "adv",
    "hier": "adv",
    "da": "adv",
    "dort": "adv",
    "jetzt": "adv",
    "dann": "adv",
    "heute": "adv",
    "morgen": "adv",
    "gestern": "adv",
    "immer": "adv",
    "nie": "adv",
    "sehr": "adv",
    "mehr": "adv",
    "mal": "adv",
    "wieder": "adv",
    "vielleicht": "adv",
    "wirklich": "adv",
    "eigentlich": "adv",
    "endlich": "adv",
    "plötzlich": "adv",
    "jetzt": "adv",
    "was": "pron",
    "wer": "pron",
    "wo": "adv",
    "wann": "adv",
    "warum": "adv",
    "welche": "pron",
    "welcher": "pron",
    "welches": "pron",
    "dieser": "pron",
    "diese": "pron",
    "dieses": "pron",
    "alle": "pron",
    "alles": "pron",
    "etwas": "pron",
    "nichts": "pron",
    "jemand": "pron",
    "niemand": "pron",
    "sich": "pron",
    "dich": "pron",
    "dir": "pron",
    "doch": "adv",
    "also": "adv",
    "danke": "adv",
    "bitte": "adv",
    "leider": "adv",
    "mal": "adv",
    "viel": "adj",
    "wenig": "adj",
    "zwei": "num",
    "drei": "num",
    "vier": "num",
    "fünf": "num",
    "sechs": "num",
    "sieben": "num",
    "acht": "num",
    "neun": "num",
    "zehn": "num",
    "eins": "num",
    "überall": "adv",
    "bereits": "adv",
    "trotzdem": "adv",
    "hierher": "adv",
    "nächste": "adj",
    "jede": "adj",
    "jeder": "adj",
    "jedes": "adj",
}

# High-quality learner glosses for words the raw dictionaries mishandle.
OVERRIDES: dict[str, dict[str, object]] = {
    "ich": {
        "pos": "pron",
        "article": None,
        "glossFa": "من",
        "descriptionFa": "ضمیر فاعلی اول‌شخص مفرد.",
    },
    "du": {
        "pos": "pron",
        "article": None,
        "glossFa": "تو",
        "descriptionFa": "ضمیر غیررسمی دوم‌شخص.",
    },
    "er": {
        "pos": "pron",
        "article": None,
        "glossFa": "او (مذکر)",
        "descriptionFa": "ضمیر سوم‌شخص مذکر.",
    },
    "sie": {
        "pos": "pron",
        "article": None,
        "glossFa": "او (مؤنث)؛ آنها؛ شما (مؤدبانه)",
        "descriptionFa": "بسته به بافت: she / they / formal you.",
    },
    "es": {
        "pos": "pron",
        "article": None,
        "glossFa": "آن",
        "descriptionFa": "ضمیر خنثی.",
    },
    "wir": {
        "pos": "pron",
        "article": None,
        "glossFa": "ما",
        "descriptionFa": "ضمیر اول‌شخص جمع.",
    },
    "ihr": {
        "pos": "pron",
        "article": None,
        "glossFa": "شما (جمع/غیررسمی)؛ مال شما",
        "descriptionFa": "ضمیر دوم‌شخص جمع یا ضمیر ملکی.",
    },
    "der": {
        "pos": "article",
        "article": "der",
        "glossFa": "حرف تعریف مذکر؛ که",
        "descriptionFa": "der/die/das و نیز ضمیر موصولی.",
    },
    "die": {
        "pos": "article",
        "article": "die",
        "glossFa": "حرف تعریف مؤنث یا جمع",
        "descriptionFa": "برای مؤنث مفرد و همهٔ جمع‌ها.",
    },
    "das": {
        "pos": "article",
        "article": "das",
        "glossFa": "حرف تعریف خنثی؛ این/آن",
        "descriptionFa": "حرف تعریف یا ضمیر اشاره.",
    },
    "ein": {
        "pos": "article",
        "article": None,
        "glossFa": "یک (مذکر/خنثی)",
        "descriptionFa": "حرف تعریف نکره.",
    },
    "eine": {
        "pos": "article",
        "article": None,
        "glossFa": "یک (مؤنث)",
        "descriptionFa": "شکل مؤنث ein.",
    },
    "und": {
        "pos": "conj",
        "article": None,
        "glossFa": "و",
        "descriptionFa": "حرف ربط همپایگی.",
    },
    "oder": {
        "pos": "conj",
        "article": None,
        "glossFa": "یا",
        "descriptionFa": "حرف ربط.",
    },
    "aber": {
        "pos": "conj",
        "article": None,
        "glossFa": "اما؛ ولی",
        "descriptionFa": "حرف ربط تضاد.",
    },
    "nicht": {
        "pos": "adv",
        "article": None,
        "glossFa": "نه؛ نمی‌-",
        "descriptionFa": "قید نفی.",
    },
    "ja": {
        "pos": "adv",
        "article": None,
        "glossFa": "بله",
        "descriptionFa": "پاسخ مثبت.",
    },
    "nein": {
        "pos": "adv",
        "article": None,
        "glossFa": "نه",
        "descriptionFa": "پاسخ منفی.",
    },
    "sein": {
        "pos": "verb",
        "article": None,
        "glossFa": "بودن",
        "descriptionFa": "فعل کمکی بی‌قاعده: bin, ist, war, gewesen.",
    },
    "haben": {
        "pos": "verb",
        "article": None,
        "glossFa": "داشتن",
        "descriptionFa": "فعل کمکی: hat, hatte, gehabt.",
    },
    "werden": {
        "pos": "verb",
        "article": None,
        "glossFa": "شدن؛ فعل آینده/مجهول",
        "descriptionFa": "wird, wurde, geworden.",
    },
    "können": {
        "pos": "verb",
        "article": None,
        "glossFa": "توانستن",
        "descriptionFa": "فعل وجهی.",
    },
    "müssen": {
        "pos": "verb",
        "article": None,
        "glossFa": "بایستن؛ مجبور بودن",
        "descriptionFa": "فعل وجهی.",
    },
    "sollen": {
        "pos": "verb",
        "article": None,
        "glossFa": "باید (بایدِ توصیه‌ای)",
        "descriptionFa": "فعل وجهی.",
    },
    "wollen": {
        "pos": "verb",
        "article": None,
        "glossFa": "خواستن",
        "descriptionFa": "فعل وجهی.",
    },
    "dürfen": {
        "pos": "verb",
        "article": None,
        "glossFa": "اجازه داشتن",
        "descriptionFa": "فعل وجهی.",
    },
    "mögen": {
        "pos": "verb",
        "article": None,
        "glossFa": "دوست داشتن؛ ممکن بودن",
        "descriptionFa": "möchte برای درخواست مؤدبانه.",
    },
    "machen": {
        "pos": "verb",
        "article": None,
        "glossFa": "کردن؛ انجام دادن؛ ساختن",
        "descriptionFa": "فعل بسیار پرکاربرد.",
    },
    "gehen": {
        "pos": "verb",
        "article": None,
        "glossFa": "رفتن",
        "descriptionFa": "فعل حرکتی؛ geht, ging, gegangen.",
    },
    "kommen": {
        "pos": "verb",
        "article": None,
        "glossFa": "آمدن",
        "descriptionFa": "kommt, kam, gekommen.",
    },
    "sehen": {
        "pos": "verb",
        "article": None,
        "glossFa": "دیدن",
        "descriptionFa": "sieht, sah, gesehen.",
    },
    "geben": {
        "pos": "verb",
        "article": None,
        "glossFa": "دادن",
        "descriptionFa": "gibt, gab, gegeben.",
    },
    "sagen": {
        "pos": "verb",
        "article": None,
        "glossFa": "گفتن",
        "descriptionFa": "فعل ضعیف پرکاربرد.",
    },
    "wissen": {
        "pos": "verb",
        "article": None,
        "glossFa": "دانستن",
        "descriptionFa": "weiß, wusste, gewusst.",
    },
    "gut": {
        "pos": "adj",
        "article": None,
        "glossFa": "خوب",
        "descriptionFa": "صفت پایه؛ قید هم gut است.",
    },
    "Haus": {
        "pos": "noun",
        "article": "das",
        "plural": "Häuser",
        "glossFa": "خانه",
        "descriptionFa": "اسم خنثی؛ جمع نامنظم.",
    },
    "Frau": {
        "pos": "noun",
        "article": "die",
        "plural": "Frauen",
        "glossFa": "زن؛ خانم",
        "descriptionFa": "برای خطاب مؤدبانه هم به کار می‌رود.",
    },
    "Mann": {
        "pos": "noun",
        "article": "der",
        "plural": "Männer",
        "glossFa": "مرد",
        "descriptionFa": "جمع نامنظم: Männer.",
    },
    "Kind": {
        "pos": "noun",
        "article": "das",
        "plural": "Kinder",
        "glossFa": "کودک؛ بچه",
        "descriptionFa": "اسم خنثی پرکاربرد.",
    },
    "Zeit": {
        "pos": "noun",
        "article": "die",
        "plural": "Zeiten",
        "glossFa": "زمان",
        "descriptionFa": "اسم مؤنث انتزاعی.",
    },
    "Jahr": {
        "pos": "noun",
        "article": "das",
        "plural": "Jahre",
        "glossFa": "سال",
        "descriptionFa": "برای سن و زمان.",
    },
    "Tag": {
        "pos": "noun",
        "article": "der",
        "plural": "Tage",
        "glossFa": "روز",
        "descriptionFa": "در عباراتی مثل Guten Tag.",
    },
    "Freund": {
        "pos": "noun",
        "article": "der",
        "plural": "Freunde",
        "glossFa": "دوست (مذکر)",
        "descriptionFa": "شکل مؤنث: die Freundin.",
    },
    "zu": {
        "pos": "prep",
        "article": None,
        "glossFa": "به؛ برای",
        "descriptionFa": "حرف اضافه؛ با مصدر: zu machen.",
    },
    "in": {
        "pos": "prep",
        "article": None,
        "glossFa": "در؛ داخل",
        "descriptionFa": "حرف اضافه مکان/زمان.",
    },
    "auf": {
        "pos": "prep",
        "article": None,
        "glossFa": "روی؛ بر",
        "descriptionFa": "حرف اضافه؛ auf dem Tisch.",
    },
    "mit": {
        "pos": "prep",
        "article": None,
        "glossFa": "با",
        "descriptionFa": "حرف اضافه همراهی.",
    },
    "so": {
        "pos": "adv",
        "article": None,
        "glossFa": "این‌طور؛ اینقدر؛ پس",
        "descriptionFa": "قید اشاره یا نتیجه.",
    },
    "wie": {
        "pos": "adv",
        "article": None,
        "glossFa": "چگونه؛ چطور؛ مانند",
        "descriptionFa": "قید پرسشی یا تشبیه.",
    },
    "was": {
        "pos": "pron",
        "article": None,
        "glossFa": "چه؛ چیست",
        "descriptionFa": "ضمیر پرسشی.",
    },
    "mir": {
        "pos": "pron",
        "article": None,
        "glossFa": "به من",
        "descriptionFa": "حالت مفعولی غیرمستقیم ich.",
    },
    "mich": {
        "pos": "pron",
        "article": None,
        "glossFa": "مرا",
        "descriptionFa": "حالت مفعولی مستقیم ich.",
    },
    "dich": {
        "pos": "pron",
        "article": None,
        "glossFa": "تو را",
        "descriptionFa": "حالت مفعولی مستقیم du.",
    },
    "dir": {
        "pos": "pron",
        "article": None,
        "glossFa": "به تو",
        "descriptionFa": "حالت مفعولی غیرمستقیم du.",
    },
    "für": {
        "pos": "prep",
        "article": None,
        "glossFa": "برای",
        "descriptionFa": "حرف اضافه با آکوزاتیو.",
    },
    "von": {
        "pos": "prep",
        "article": None,
        "glossFa": "از؛ مالِ",
        "descriptionFa": "حرف اضافه با داتیو.",
    },
    "an": {
        "pos": "prep",
        "article": None,
        "glossFa": "در؛ کنار؛ به",
        "descriptionFa": "حرف اضافه؛ an der Wand.",
    },
    "aus": {
        "pos": "prep",
        "article": None,
        "glossFa": "از؛ بیرون از",
        "descriptionFa": "حرف اضافه مبدأ.",
    },
    "um": {
        "pos": "prep",
        "article": None,
        "glossFa": "دور؛ ساعتِ؛ برایِ",
        "descriptionFa": "um 8 Uhr؛ um den Park.",
    },
    "nach": {
        "pos": "prep",
        "article": None,
        "glossFa": "بعد از؛ به (شهر/کشور)",
        "descriptionFa": "nach Berlin؛ nach dem Essen.",
    },
    "bei": {
        "pos": "prep",
        "article": None,
        "glossFa": "نزد؛ هنگام",
        "descriptionFa": "حرف اضافه با داتیو.",
    },
    "vor": {
        "pos": "prep",
        "article": None,
        "glossFa": "جلو؛ قبل از",
        "descriptionFa": "vor dem Haus؛ vor einer Stunde.",
    },
    "über": {
        "pos": "prep",
        "article": None,
        "glossFa": "بالای؛ درباره",
        "descriptionFa": "حرف اضافه.",
    },
    "unter": {
        "pos": "prep",
        "article": None,
        "glossFa": "زیر؛ میان",
        "descriptionFa": "حرف اضافه.",
    },
    "durch": {
        "pos": "prep",
        "article": None,
        "glossFa": "از میان؛ به‌وسیله",
        "descriptionFa": "حرف اضافه با آکوزاتیو.",
    },
    "gegen": {
        "pos": "prep",
        "article": None,
        "glossFa": "ضد؛ حدودِ",
        "descriptionFa": "gegen den Wind؛ gegen 5 Uhr.",
    },
    "ohne": {
        "pos": "prep",
        "article": None,
        "glossFa": "بدون",
        "descriptionFa": "حرف اضافه با آکوزاتیو.",
    },
    "als": {
        "pos": "conj",
        "article": None,
        "glossFa": "هنگامی که؛ به‌عنوان؛ از (مقایسه)",
        "descriptionFa": "حرف ربط یا مقایسه.",
    },
    "wenn": {
        "pos": "conj",
        "article": None,
        "glossFa": "اگر؛ وقتی که",
        "descriptionFa": "حرف ربط شرط/زمان.",
    },
    "sich": {
        "pos": "pron",
        "article": None,
        "glossFa": "خود (بازتابی)",
        "descriptionFa": "ضمیر انعکاسی سوم‌شخص.",
    },
    "uns": {
        "pos": "pron",
        "article": None,
        "glossFa": "ما را؛ به ما",
        "descriptionFa": "حالت مفعولی wir.",
    },
    "ihn": {
        "pos": "pron",
        "article": None,
        "glossFa": "او را (مذکر)",
        "descriptionFa": "آکوزاتیو er.",
    },
    "ihm": {
        "pos": "pron",
        "article": None,
        "glossFa": "به او (مذکر/خنثی)",
        "descriptionFa": "داتیو er/es.",
    },
    "ihnen": {
        "pos": "pron",
        "article": None,
        "glossFa": "به آنها؛ به شما (مؤدبانه)",
        "descriptionFa": "داتیو sie/Sie.",
    },
    "mein": {
        "pos": "pron",
        "article": None,
        "glossFa": "مال من؛ منِ",
        "descriptionFa": "ضمیر ملکی.",
    },
    "mal": {
        "pos": "adv",
        "article": None,
        "glossFa": "یک‌بار؛ - دیگه (عامیانه)",
        "descriptionFa": "قید؛ Komm mal her.",
    },
    "doch": {
        "pos": "adv",
        "article": None,
        "glossFa": "اما؛ چرا (خلاف انتظار)",
        "descriptionFa": "حرف تأکید یا تضاد.",
    },
    "also": {
        "pos": "adv",
        "article": None,
        "glossFa": "پس؛ بنابراین",
        "descriptionFa": "قید نتیجه.",
    },
    "bitte": {
        "pos": "adv",
        "article": None,
        "glossFa": "لطفاً؛ بفرمایید",
        "descriptionFa": "ادب روزمره.",
    },
    "danke": {
        "pos": "adv",
        "article": None,
        "glossFa": "متشکرم",
        "descriptionFa": "پاسخ مؤدبانه.",
    },
    "leider": {
        "pos": "adv",
        "article": None,
        "glossFa": "متأسفانه",
        "descriptionFa": "قید.",
    },
    "viel": {
        "pos": "adj",
        "article": None,
        "glossFa": "زیاد؛ خیلی",
        "descriptionFa": "صفت/ضمیر مقدار.",
    },
    "zwei": {
        "pos": "num",
        "article": None,
        "glossFa": "دو",
        "descriptionFa": "عدد.",
    },
    "drei": {
        "pos": "num",
        "article": None,
        "glossFa": "سه",
        "descriptionFa": "عدد.",
    },
    "lieben": {
        "pos": "verb",
        "article": None,
        "glossFa": "دوست داشتن؛ عشق ورزیدن",
        "descriptionFa": "فعل.",
    },
    "geben": {
        "pos": "verb",
        "article": None,
        "glossFa": "دادن",
        "descriptionFa": "gibt, gab, gegeben.",
    },
    "sehr": {
        "pos": "adv",
        "article": None,
        "glossFa": "خیلی؛ بسیار",
        "descriptionFa": "قید شدت.",
    },
    "alle": {
        "pos": "pron",
        "article": None,
        "glossFa": "همه؛ تمام",
        "descriptionFa": "ضمیر/صفت نامعین.",
    },
    "nie": {
        "pos": "adv",
        "article": None,
        "glossFa": "هرگز",
        "descriptionFa": "قید نفی زمانی.",
    },
    "los": {
        "pos": "adj",
        "article": None,
        "glossFa": "آزاد؛ راه بیفت",
        "descriptionFa": "Los geht’s؛ etwas los sein.",
    },
    "tun": {
        "pos": "verb",
        "article": None,
        "glossFa": "کردن؛ انجام دادن",
        "descriptionFa": "tut, tat, getan.",
    },
}


def download(url: str, dest: Path) -> None:
    """Download url to dest when the file is missing."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    print(f"Downloading {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "german-word-builder/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response:
        dest.write_bytes(response.read())


def download_farhang() -> Path:
    """Download farhang letter files into the cache."""
    folder = CACHE / "farhang"
    folder.mkdir(parents=True, exist_ok=True)
    for letter in FARHANG_LETTERS:
        dest = folder / f"{letter}.txt"
        if dest.exists() and dest.stat().st_size > 0:
            continue
        url = f"https://raw.githubusercontent.com/ckh/farhang/master/{letter}.txt"
        download(url, dest)
    return folder


def strip_diacritics(text: str) -> str:
    """Remove Arabic diacritics and tatweel from Persian text."""
    return HARAKAT_RE.sub("", text)


def normalize_fa(text: str) -> str:
    """Normalize Persian orthography for learner-facing glosses."""
    text = strip_diacritics(text)
    table = str.maketrans(
        {
            "ي": "ی",
            "ى": "ی",
            "ك": "ک",
            "ۀ": "ه",
            "ة": "ه",
            "أ": "ا",
            "إ": "ا",
            "ؤ": "و",
            "ئ": "ی",
            "‌": "‌",
        }
    )
    text = text.translate(table)
    text = re.sub(r"\s+", " ", text).strip(" ;،,؛.-")
    return text


def split_glosses(raw: str) -> list[str]:
    """Split a bilingual gloss string into short unique meanings."""
    if not raw:
        return []
    parts = re.split(r"[؛;،,/|]|•", raw)
    out: list[str] = []
    seen: set[str] = set()
    for part in parts:
        item = normalize_fa(part)
        item = re.sub(r"\([^)]*\)", "", item)
        item = re.sub(r"[()]", "", item).strip(" ;،,؛")
        if not item or len(item) > 42:
            continue
        if not re.search(r"[\u0600-\u06FF]", item):
            continue
        key = item.replace("‌", "").replace(" ", "")
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
        if len(out) >= 3:
            break
    return out


def score_gloss(item: str) -> tuple[int, int]:
    """Prefer short, general Persian glosses over idiom lists."""
    return (item.count(" "), len(item))


def verb_like(item: str) -> bool:
    """Return whether a Persian gloss looks like a verb."""
    compact = item.replace(" ", "").replace("‌", "")
    return bool(re.search(r"(ن|کردن|شدن|دادن|بودن|داشتن|زدن|گرفتن|آمدن|رفتن)$", compact))


def pick_gloss(*groups: list[str], pos: str = "") -> str:
    """Choose up to three glosses. Earlier sources win; do not mix in junk."""
    preferred_groups = list(groups)
    if pos == "verb":
        verb_groups = [[item for item in group if verb_like(item)] for group in groups]
        if any(verb_groups):
            preferred_groups = verb_groups + preferred_groups
    for group in preferred_groups:
        cleaned: list[str] = []
        seen: set[str] = set()
        ranked = sorted(group, key=score_gloss)
        for item in ranked:
            key = item.replace("‌", "").replace(" ", "")
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(item)
            if len(cleaned) >= 3:
                break
        if cleaned:
            return "؛ ".join(cleaned)
    return ""


def parse_farhang(folder: Path) -> dict[str, dict[str, object]]:
    """Parse farhang headwords into lowercase lemma lookups."""
    by_lower: dict[str, dict[str, object]] = {}
    for path in sorted(folder.glob("*.txt")):
        for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("-") or ";" not in line:
                continue
            head, rest = line.split(";", 1)
            lemma = head.split("(")[0].strip()
            if not GERMAN_RE.match(lemma) or " " in lemma:
                continue
            gender = None
            marker = re.search(r"\(([mnf])\)", head, flags=re.I)
            if marker:
                gender = marker.group(1).lower()
            glosses = split_glosses(rest)
            if not glosses:
                continue
            key = lemma.lower()
            row = {
                "lemma": lemma,
                "glosses": glosses,
                "gender": gender,
            }
            current = by_lower.get(key)
            if current is None:
                by_lower[key] = row
                continue
            # Prefer a lowercase headword (verb/adj/prep) over a noun homograph.
            if lemma[:1].islower() and str(current["lemma"])[:1].isupper():
                by_lower[key] = row
    return by_lower


def parse_tei(path: Path) -> dict[str, dict[str, object]]:
    """Parse FreeDict TEI entries into lowercase lemma lookups."""
    text = path.read_text(encoding="utf-8")
    by_lower: dict[str, dict[str, object]] = {}
    for block in ENTRY_RE.findall(text):
        orth_match = ORTH_RE.search(block)
        if not orth_match:
            continue
        lemma = orth_match.group(1).strip()
        if not GERMAN_RE.match(lemma) or " " in lemma or "(" in lemma:
            continue
        gen_match = GEN_RE.search(block)
        article = gen_match.group(1).strip() if gen_match else None
        if article not in {"der", "die", "das"}:
            article = None
        glosses = split_glosses("؛ ".join(QUOTE_RE.findall(block)))
        key = lemma.lower()
        row = {"lemma": lemma, "article": article, "glosses": glosses}
        current = by_lower.get(key)
        if current is None:
            by_lower[key] = row
            continue
        if lemma[:1].islower() and str(current["lemma"])[:1].isupper():
            by_lower[key] = row
            continue
        if article and not current.get("article"):
            current["article"] = article
        existing = current["glosses"]
        assert isinstance(existing, list)
        current["glosses"] = existing + [g for g in glosses if g not in existing]
    return by_lower


def parse_freq(path: Path) -> list[str]:
    """Return German word forms ordered by descending frequency."""
    words: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        words.append(line.split()[0])
    return words


def parse_nouns(path: Path) -> dict[str, dict[str, str]]:
    """Load nominative plural and gender keyed by lowercase lemma."""
    lookup: dict[str, dict[str, str]] = {}
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            lemma = (row.get("lemma") or "").strip()
            if not lemma or not GERMAN_RE.match(lemma):
                continue
            genus = (row.get("genus") or row.get("genus 1") or "").strip().lower()
            plural = (row.get("nominativ plural") or row.get("nominativ plural 1") or "").strip()
            if plural in {"", "-", "—"}:
                plural = ""
            article = {"m": "der", "f": "die", "n": "das"}.get(genus)
            key = lemma.lower()
            if key not in lookup:
                lookup[key] = {"lemma": lemma, "article": article or "", "plural": plural}
            else:
                if not lookup[key]["plural"] and plural:
                    lookup[key]["plural"] = plural
                if not lookup[key]["article"] and article:
                    lookup[key]["article"] = article
    return lookup


def infer_pos(lemma: str, article: str | None) -> str:
    """Infer a coarse part of speech for flashcards."""
    lower = lemma.lower()
    if lower in FUNCTION_POS:
        return FUNCTION_POS[lower]
    if lower in OVERRIDES and isinstance(OVERRIDES[lower].get("pos"), str):
        return str(OVERRIDES[lower]["pos"])
    if lemma[:1].isupper() and article:
        return "noun"
    if lemma[:1].isupper():
        return "noun"
    if VERB_RE.search(lower) and lower not in NOT_VERBS:
        return "verb"
    if article and lemma[:1].isupper():
        return "noun"
    return "adj"


def describe(pos: str, article: str | None, _plural: str | None) -> str:
    """Build a short Persian learner note without embedding German text."""
    if pos == "noun":
        gender = {"der": "مذکر", "die": "مؤنث", "das": "خنثی"}.get(article or "", "")
        return f"اسم {gender}".strip() if gender else "اسم"
    mapping = {
        "verb": "فعل",
        "adj": "صفت",
        "adv": "قید",
        "prep": "حرف اضافه",
        "pron": "ضمیر",
        "conj": "حرف ربط",
        "article": "حرف تعریف",
        "num": "عدد",
        "particle": "جزء کلام",
    }
    return mapping.get(pos, "واژهٔ پرکاربرد")


def canonical_lemma(
    key: str,
    pos: str,
    farhang: dict[str, dict[str, object]],
    tei: dict[str, dict[str, object]],
    nouns: dict[str, dict[str, str]],
) -> str:
    """Pick dictionary casing from part of speech."""
    far = farhang.get(key)
    tei_row = tei.get(key)
    noun = nouns.get(key)
    if pos == "noun":
        for candidate in (
            str(far["lemma"]) if far else "",
            str(tei_row["lemma"]) if tei_row else "",
            noun["lemma"] if noun else "",
        ):
            if candidate[:1].isupper():
                return candidate
        return key[:1].upper() + key[1:]
    for candidate in (
        str(far["lemma"]) if far else "",
        str(tei_row["lemma"]) if tei_row else "",
    ):
        if candidate[:1].islower():
            return candidate
    return key


def build() -> list[dict[str, object]]:
    """Assemble the ranked 4000-word learner catalog."""
    CACHE.mkdir(parents=True, exist_ok=True)
    download(*SOURCES["freq"])
    download(*SOURCES["tei"])
    download(*SOURCES["nouns"])
    farhang_dir = download_farhang()

    farhang = parse_farhang(farhang_dir)
    tei = parse_tei(SOURCES["tei"][1])
    freq = parse_freq(SOURCES["freq"][1])
    nouns = parse_nouns(SOURCES["nouns"][1])

    selected: list[dict[str, object]] = []
    seen: set[str] = set()

    known = set(farhang) | set(tei) | set(OVERRIDES)
    for form in freq:
        key = form.lower()
        if key in seen or key not in known:
            continue
        if key in INFLECTED_SKIP:
            continue
        if len(key) < 2 or not GERMAN_RE.match(form):
            continue

        override = OVERRIDES.get(key, {})
        far = farhang.get(key)
        tei_row = tei.get(key)
        noun = nouns.get(key)

        pos = str(override.get("pos") or FUNCTION_POS.get(key) or "")
        if not pos:
            lower_head = False
            if far and str(far["lemma"])[:1].islower():
                lower_head = True
            if tei_row and str(tei_row["lemma"])[:1].islower():
                lower_head = True
            if lower_head:
                pos = infer_pos(key, None)
            elif noun or (tei_row and tei_row.get("article")):
                pos = "noun"
            else:
                pos = infer_pos(key, None)

        lemma = str(override.get("lemma") or canonical_lemma(key, pos, farhang, tei, nouns))
        article: str | None = None
        if pos == "noun":
            article = override.get("article") or None  # type: ignore[assignment]
            if not article and tei_row and tei_row.get("article") and str(tei_row["lemma"])[:1].isupper():
                article = str(tei_row["article"])
            if not article and noun and noun.get("article"):
                article = noun["article"]
            if not article and far:
                article = {"m": "der", "f": "die", "n": "das"}.get(str(far.get("gender") or "")) or None
            lemma = lemma[:1].upper() + lemma[1:]
        else:
            lemma = lemma[:1].lower() + lemma[1:]

        plural = override.get("plural") if pos == "noun" else None
        if pos == "noun" and not plural and noun and noun.get("plural"):
            plural = noun["plural"]
        if pos != "noun":
            plural = None
            article = None

        far_glosses = list(far["glosses"]) if far else []
        tei_glosses = list(tei_row["glosses"]) if tei_row else []
        gloss = str(override.get("glossFa") or pick_gloss(far_glosses, tei_glosses, pos=pos))
        if not gloss:
            continue

        description = str(
            override.get("descriptionFa")
            or describe(pos, article, plural if isinstance(plural, str) else None)
        )
        selected.append(
            {
                "lemma": lemma,
                "pos": pos,
                "article": article,
                "singular": lemma,
                "plural": plural or None,
                "glossFa": gloss,
                "descriptionFa": description,
                "rank": len(selected) + 1,
            }
        )
        seen.add(key)
        if len(selected) >= TARGET:
            break

    if len(selected) < TARGET:
        raise SystemExit(f"Only assembled {len(selected)} words; need {TARGET}")
    return selected


def main() -> None:
    """Write the catalog JSON and a short quality report."""
    words = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    pos_counts: dict[str, int] = {}
    for word in words:
        pos_counts[str(word["pos"])] = pos_counts.get(str(word["pos"]), 0) + 1
    print(f"Wrote {len(words)} words to {OUTPUT}")
    print("POS", dict(sorted(pos_counts.items(), key=lambda item: -item[1])))
    print("First 25:")
    for word in words[:25]:
        print(
            f"  {word['rank']:4} {word['article'] or '-':>3} {word['lemma']:<14} {word['pos']:<8} {word['glossFa']}"
        )


if __name__ == "__main__":
    main()
