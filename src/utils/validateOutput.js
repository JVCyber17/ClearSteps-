function validateBySchema(data, schema, contextLabel) {
  const errors = [];

  for (const [key, expected] of Object.entries(schema)) {
    const value = data[key];
    const passed = validateValue(value, expected);
    if (!passed) {
      errors.push(`${contextLabel}.${key} is invalid`);
    }
  }

  return errors;
}

function validateCards(cards, cardSchema, allowedCardIds) {
  if (!Array.isArray(cards)) return ["cards must be an array"];
  if (cards.length !== 6) return ["cards must have six items"];

  const seenIds = new Set();
  const errors = [];

  cards.forEach((card, index) => {
    errors.push(...validateBySchema(card, cardSchema, `cards[${index}]`));
    if (allowedCardIds.includes(card.id)) seenIds.add(card.id);
  });

  allowedCardIds.forEach((id) => {
    if (!seenIds.has(id)) errors.push(`cards missing ${id}`);
  });

  return errors;
}

function validateValue(value, expected) {
  if (typeof expected === "string") {
    return validatePrimitive(value, expected);
  }

  if (Array.isArray(expected)) {
    const primitiveLabels = new Set([
      "string",
      "number",
      "boolean",
      "object",
      "function",
      "undefined",
      "array",
      "null"
    ]);

    // If all entries are plain string labels that are not type keywords,
    // treat the array as an enum list.
    if (
      expected.length > 0 &&
      expected.every((entry) => typeof entry === "string" && !primitiveLabels.has(entry))
    ) {
      return expected.includes(value);
    }

    return expected.some((entry) => validateValue(value, entry));
  }

  return false;
}

function validatePrimitive(value, expected) {
  if (expected === "array") return Array.isArray(value);
  if (expected === "null") return value === null;
  if (expected === "undefined") return value === undefined;
  return typeof value === expected;
}

module.exports = { validateBySchema, validateCards };
