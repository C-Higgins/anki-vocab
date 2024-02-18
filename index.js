"use strict";
const url = "https://api.dictionaryapi.dev/api/v2/entries/en";
const fields = ["word", "pronunciation", "definition"];
const headers = {
    separator: ";",
    html: true,
    columns: fields.join(";"),
};
Promise.allSettled(process.argv.splice(2).map((arg) => {
    return fetch(`${url}/${arg}`)
        .then((res) => {
        if (res.ok) {
            return res.json().then(makeCard);
        }
        else {
            throw arg;
        }
    })
        .catch(() => {
        throw arg;
    });
})).then((fetches) => {
    const [succededWords, failedWords] = fetches.reduce(([success, fail], promise) => {
        if (promise.status === "rejected") {
            fail.push(promise.reason);
        }
        else {
            success.push(promise.value);
        }
        return [success, fail];
    }, [[], []]);
    if (succededWords.length) {
        console.log(Object.entries(headers)
            .map(([k, v]) => `# ${k}:${v}`)
            .join("\n"));
        console.log(succededWords.join("\n"));
    }
    else {
        console.error("Could not fetch anything!");
    }
    if (failedWords.length) {
        console.error(`Failed to fetch: ${failedWords.join(" ")}`);
    }
});
function makeCard([dict]) {
    // this is to make it typesafe with the headers
    const thisFields = {
        word: dict.word,
        pronunciation: dict.phonetic,
        definition: 'something "quoted" yea',
    };
    return Object.values(thisFields).map(escapeField).join(";");
}
function escapeField(field) {
    // replace " with "" to escape the double quotes. Then wrap whole thing in double quotes
    return `"${field.replaceAll('"', '""')}"`;
}
