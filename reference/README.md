# Reference sources

The original design and pricing sources this app was built from. They are kept
here verbatim — do not "tidy" them. When a document or a price looks wrong in
the app, these files are the source of truth to compare against.

| File | What it is |
| --- | --- |
| `teeway-guia-de-marca.html` | Brand guide: palette, typography, logo rules, the legal footer line. Drives the app UI and the document templates. |
| `teeway-template-orcamento.html` | Approved visual/structural spec for the quote (orçamento) document. |
| `teeway-template-fatura.html` | Same, for the invoice (fatura) document. |
| `Orcamento_Carrinhos_Golfe_2.xlsx` | The spreadsheet the owner priced carts in by hand. Source of the pricing formula chain. |

## How these map into the code

- Brand palette and type → `src/app/globals.css` (`@theme inline`), `src/components/brand/logo.tsx`.
- Both templates → `src/components/documents/*` and `document.module.css`. The
  components mirror the templates' DOM closely so the rendered pages stay
  visually byte-close to the approved originals.
- Spreadsheet → `src/lib/pricing.ts`. Note the app does **not** reproduce the
  spreadsheet literally: its naive freight-split was corrected with the owner.
  The chain is landed cost → +duty% +clearance fee → ×(1+markup) → ×(1+VAT).

The quote template's own sample numbers double as pricing regression fixtures
(the `VY-A2` line must land on `10 107,16 €`) — see the pricing unit tests.

## Not in this repo

The company's *Certidão Permanente* and *RCBE* PDFs live alongside this project
on the owner's machine but are deliberately not committed: they are legal
registry documents containing personal data of the beneficial owner, and they
are not needed to build or run the app.
