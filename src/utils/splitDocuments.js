function splitDocuments(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return { isMultiLetterInput: false, documents: [] };
  }

  const separators = /\n-{3,}\n|\n={3,}\n|\n\s*page break\s*\n/i;
  const chunks = text
    .split(separators)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const hasMultipleGreetings = (text.match(/\bdear\s+\w+/gi) || []).length > 1;
  const isMultiLetterInput = chunks.length > 1 || hasMultipleGreetings;

  return {
    isMultiLetterInput,
    documents: chunks.length ? chunks : [text]
  };
}

module.exports = { splitDocuments };
