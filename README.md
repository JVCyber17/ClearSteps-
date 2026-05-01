# ClearSteps

ClearSteps is a simple MVP web app that turns a formal letter upload into clear next steps.

It is designed for neurodiverse users:

- large readable text
- clear spacing
- short labels
- one idea per line
- calm wording
- no chatbot

## Run

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Privacy Notes

Uploaded files are saved in `private_storage/uploads`, outside the public web folder.

Raw letter text is not written to normal logs.

Only structured output is saved in `private_storage/results`.

Short retention deletion should be added before production.
