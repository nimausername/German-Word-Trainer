# Word catalog attribution

`data/words-4000.json` is compiled for this trainer from the following sources:

| Source | What we use | License |
| --- | --- | --- |
| [farhang](https://github.com/ckh/farhang) | Core German→Persian headword glosses | CC BY-SA 3.0 |
| [FreeDict deu-pes](https://github.com/freedict/fd-dictionaries/pull/80) | Extra glosses and grammatical gender | CC BY-SA 4.0 |
| [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles) | Frequency ranking | CC BY-SA 3.0 |
| [german-nouns](https://github.com/gambolputty/german-nouns) (from German Wiktionary) | Noun plurals and gender | CC BY-SA 4.0 |

The compiled list is therefore shared under **CC BY-SA 4.0** ([legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode)). Application source code is MIT; see [NOTICE](../NOTICE).

Rebuild with:

```bash
pnpm db:build-words
pnpm db:seed:full
```
