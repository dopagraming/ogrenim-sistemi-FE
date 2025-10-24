// utils/parseRIS.js

export function parseRIS(text) {
    const lines = text.split(/\r?\n/);

    const data = {
        name: "",        // TI
        abstract: "",    // AB (optional)
        author: "",      // AU (could be multiple)
        year: null,      // PY
        journal: "",     // JO
        volume: "",      // VO
        number: "",      // IS
        address: "",     // UR
    };

    const authors = [];

    for (let line of lines) {
        const match = line.match(/^([A-Z0-9]{2})\s{0,}-\s(.*)$/);
        if (!match) continue;

        const [, tag, value] = match;

        switch (tag) {
            case "TI":
                data.name = value.trim();
                break;
            case "AB":
                data.abstract = value.trim();
                break;
            case "AU":
                authors.push(value.trim());
                break;
            case "PY":
                data.year = parseInt(value.trim());
                break;
            case "JO":
                data.journal = value.trim();
                break;
            case "VO":
                data.volume = value.trim();
                break;
            case "IS":
                data.number = value.trim();
                break;
            case "UR":
                data.address = value.trim();
                break;
        }
    }

    data.author = authors.join(", "); // Concatenate authors

    return data;
}
