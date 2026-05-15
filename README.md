# ClearSteps Backend Engine

ClearSteps is a neurodiversity-first document simplifier.

This repository now includes a modular backend engine that powers six cue cards from one endpoint:

- `POST /api/simplify`

## Engine Structure

- `src/prompts/trustEvaluatorPrompt.js`
- `src/prompts/extractorPrompt.js`
- `src/prompts/rendererPrompt.js`
- `src/schemas/trustSchema.js`
- `src/schemas/extractorSchema.js`
- `src/schemas/cardSchema.js`
- `src/services/textExtraction.js`
- `src/services/clearStepsEngine.js`
- `src/routes/simplifyRoute.js`
- `src/utils/validateOutput.js`
- `src/utils/splitDocuments.js`

## Run

```bash
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

The test suite covers:

1. HMRC-style payment letter
2. NHS appointment letter
3. Work warning letter
4. Template with missing fields
5. Possible scam payment letter

## Security and Privacy Notes

- Uploaded files are stored in `private_storage/uploads`.
- Structured output is stored in `private_storage/results`.
- Raw document text is not logged in normal logs.
- File retention is short by default (deletes uploaded files after processing unless retention is enabled).
