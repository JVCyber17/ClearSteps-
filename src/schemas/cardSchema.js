const allowedCardIds = [
  "what_is_this",
  "what_matters_most",
  "what_do_i_need_to_do",
  "when_is_it_due",
  "what_could_happen",
  "helpful_note"
];

const allowedCardStatus = ["normal", "caution", "urgent", "good"];

const cardSchema = {
  id: allowedCardIds,
  title: "string",
  short_answer: "string",
  icon: "string",
  status: allowedCardStatus,
  steps: ["array", "undefined"],
  date: ["string", "null", "undefined"]
};

module.exports = { cardSchema, allowedCardIds, allowedCardStatus };
