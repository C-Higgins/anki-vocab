const fields = [
  "word",
  "partOfSpeech",
  "pronunciation1",
  "audio1",
  "pronunciation2",
  "audio2",
  "pronunciation3",
  "audio3",
  "definition1",
  "example1",
  "definition2",
  "example2",
  "definition3",
  "example3",
  "definition4",
  "example4",
  "definition5",
  "example5",
  "definition6",
  "example6",
  "definition7",
  "example7",
  "definition8",
  "example8",
  "definition9",
  "example9",
  "definition10",
  "example10",
  "synonyms",
  "antonyms",
] as const;
const headers = {
  separator: ";",
  html: true,
  columns: fields.join(";"),
};

Promise.allSettled(
  process.argv.splice(2).map((arg) => {
    return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${arg}`)
      .then((res): Promise<string[]> => {
        if (!res.ok) throw arg;
        return (res.json() as Promise<DictionaryResponse>).then(makeNotes);
      })
      .catch(() => {
        throw arg;
      });
  }),
).then((fetches) => {
  const [succededWords, failedWords] = fetches.reduce<
    [succededWords: string[], failedWords: string[]]
  >(
    ([success, fail], promise) => {
      if (promise.status === "rejected") {
        fail.push(promise.reason);
      } else {
        success.push(...promise.value);
      }
      return [success, fail];
    },
    [[], []],
  );

  if (succededWords.length) {
    console.log(
      Object.entries(headers)
        .map(([k, v]) => `# ${k}:${v}`)
        .join("\n"),
    );
    console.log(succededWords.join("\n"));
  } else {
    console.error("Could not fetch anything!");
  }

  if (failedWords.length) {
    console.error(`Failed to fetch: ${failedWords.join(" ")}`);
  }
});

function makeNotes(entries: DictionaryResponse): string[] {
  return entries.flatMap((dict) => {
    // remove non-us audio and phonetics with no audio (they're usually non-us)
    dict.phonetics = dict.phonetics?.filter((p) => p.audio?.includes("-us."));
    return dict.meanings.map((meaning) => {
      // this is to make it typesafe with the headers.
      const thisFields: Record<(typeof fields)[number], string | undefined> = {
        [fields[0]]: dict.word,
        [fields[1]]: meaning.partOfSpeech,
        [fields[2]]: dict.phonetics?.[0]?.text || dict.phonetic,
        [fields[3]]: dict.phonetics?.[0]?.audio,
        [fields[4]]: dict.phonetics?.[1]?.text,
        [fields[5]]: dict.phonetics?.[1]?.audio,
        [fields[6]]: dict.phonetics?.[2]?.text,
        [fields[7]]: dict.phonetics?.[2]?.audio,
        [fields[8]]: meaning.definitions[0]?.definition,
        [fields[9]]: meaning.definitions[0]?.example,
        [fields[10]]: meaning.definitions[1]?.definition,
        [fields[11]]: meaning.definitions[1]?.example,
        [fields[12]]: meaning.definitions[2]?.definition,
        [fields[13]]: meaning.definitions[2]?.example,
        [fields[14]]: meaning.definitions[3]?.definition,
        [fields[15]]: meaning.definitions[3]?.example,
        [fields[16]]: meaning.definitions[4]?.definition,
        [fields[17]]: meaning.definitions[4]?.example,
        [fields[18]]: meaning.definitions[5]?.definition,
        [fields[19]]: meaning.definitions[5]?.example,
        [fields[20]]: meaning.definitions[6]?.definition,
        [fields[21]]: meaning.definitions[6]?.example,
        [fields[22]]: meaning.definitions[7]?.definition,
        [fields[23]]: meaning.definitions[7]?.example,
        [fields[24]]: meaning.definitions[8]?.definition,
        [fields[25]]: meaning.definitions[8]?.example,
        [fields[26]]: meaning.definitions[9]?.definition,
        [fields[27]]: meaning.definitions[9]?.example,
        [fields[28]]: meaning.synonyms.join(", "),
        [fields[29]]: meaning.antonyms.join(", "),
      };

      return Object.values(thisFields).map(escapeField).join(headers.separator);
    });
  });
}

function escapeField(field: string | undefined): `"${string}"` {
  // replace " with "" to escape the double quotes. Then wrap whole thing in double quotes
  return `"${(field || "").replaceAll('"', '""')}"`;
}

type DictionaryResponse = {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    audio?: string;
    sourceUrl?: string;
    license?: {
      name: string;
      url: string;
    };
    text?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      synonyms: Array<string>;
      antonyms: Array<string>;
      example?: string;
    }>;
    synonyms: Array<string>;
    antonyms: Array<string>;
  }>;
  license: {
    name: string;
    url: string;
  };
  sourceUrls: Array<string>;
}[];
