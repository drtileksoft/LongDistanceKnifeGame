import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGS, STRINGS, detectLang, createT } from '../../src/i18n.js';

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('every language has the same keys and placeholders as English', () => {
  const en = STRINGS.en;
  for (const lang of LANGS) {
    const dict = STRINGS[lang];
    assert.ok(dict, `missing dictionary ${lang}`);
    assert.deepEqual(Object.keys(dict).sort(), Object.keys(en).sort(), `${lang}: keys differ from en`);
    for (const [key, value] of Object.entries(en)) {
      if (typeof value === 'string') {
        assert.deepEqual(placeholders(dict[key]), placeholders(value), `${lang}.${key}: placeholders differ`);
      } else if (Array.isArray(value)) {
        assert.equal(dict[key].length, value.length, `${lang}.${key}: item count differs`);
      }
    }
  }
});

test('plural entries cover the integer categories of each language', () => {
  for (const lang of LANGS) {
    const rules = new Intl.PluralRules(lang);
    for (const key of ['throws', 'sticks']) {
      for (let n = 0; n <= 25; n++) {
        const form = STRINGS[lang][key][rules.select(n)];
        assert.ok(form, `${lang}.${key}: no form for ${n} (${rules.select(n)})`);
      }
    }
  }
  const ru = createT('ru');
  assert.deepEqual([1, 2, 5, 21].map((n) => ru.plural('throws', n)), ['1 бросок', '2 броска', '5 бросков', '21 бросок']);
});

test('browser language detection', () => {
  assert.equal(detectLang(['sk-SK']), 'cs');
  assert.equal(detectLang(['de-AT', 'en']), 'de');
  assert.equal(detectLang(['fr-CA']), 'fr');
  assert.equal(detectLang(['it']), 'it');
  assert.equal(detectLang(['ru-RU']), 'ru');
  assert.equal(detectLang(['pl-PL', 'es']), 'en');
});

test('distances use the local decimal separator and unit', () => {
  assert.equal(createT('en').m(1160), '11.60 m');
  assert.equal(createT('de').m(1160), '11,60 m');
  assert.equal(createT('ru').m(1160), '11,60 м');
});
