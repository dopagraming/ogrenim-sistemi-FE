export function parseBIB(text) {
    const match = text.match(/@.+?{(.+?),/);
    if (!match) throw new Error("Invalid BIB file");

    const name = text.match(/title\s*=\s*[{"](.+?)[}"]/i)?.[1];
    const author = text.match(/author\s*=\s*[{"](.+?)[}"]/i)?.[1];
    const year = parseInt(text.match(/year\s*=\s*[{"](.+?)[}"]/i)?.[1]);
    const journal = text.match(/journal\s*=\s*[{"](.+?)[}"]/i)?.[1];
    const volume = text.match(/volume\s*=\s*[{"](.+?)[}"]/i)?.[1];
    const number = text.match(/number\s*=\s*[{"](.+?)[}"]/i)?.[1];
    const address = text.match(/address\s*=\s*[{"](.+?)[}"]/i)?.[1];
    const abstract = text.match(/abstract\s*=\s*[{"](.+?)[}"]/i)?.[1];

    return {
        name,
        author,
        year,
        journal,
        volume,
        number,
        address,
        abstract,
    };
}
