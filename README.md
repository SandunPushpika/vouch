# vouchs

A privacy-first invoice and quotation workspace built with Next.js App Router and strict TypeScript. Business data stays in IndexedDB on the user's device. No account, API routes, server actions, remote database, payment provider, or document upload service is used.

## Verification status

TypeScript checking, ESLint, and the production static export pass with the installed dependencies. PDF layout checks generated 12 PDFs across Modern, Minimal, and Corporate, both invoices and quotations, and 3- and 75-item documents (42 pages total). These checks verified nonoverlapping sections, bounded footers, repeated table headers, and embedded PNG logos. Draft logo backfill and preservation of issued document snapshots were also checked.

Essential decimal-calculation and domain-validation checks passed previously, including tax-inclusive/exclusive pricing, fixed discounts, JPY/KWD rounding, large amounts, and 200 total-reconciliation cases. Full browser workflows, responsive appearance, and IndexedDB persistence still need the browser release checklist below. No deployment has been performed.

## Local setup

Use Node.js 22.13+ and npm 10+.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` for the public website or `http://localhost:3000/app` for the workspace. Set `NEXT_PUBLIC_SITE_URL` to your real HTTPS production origin before building. This configures metadata, sitemap, and canonical URLs. The default `.example` origin is deliberately nonfunctional; replace it for launch.

A dependency lockfile is included. Use `npm ci` for reproducible subsequent installations. If npm reports `EACCES` or `EEXIST` in your default cache, use a fresh writable cache with `npm ci --cache "$HOME/.npm-cache-vouch"`.

## Check and build

```sh
npm run typecheck
npm run lint
npm run build
```

Next.js is configured with `output: "export"` and `trailingSlash: true`. A successful build writes the static website to `out/`. `next start` is not a static preview server. To preview the export, serve `out/` with a static HTTP server, for example `npx serve out`.

## Deploy

### Vercel

1. Push the source and the generated lockfile to a Git repository.
2. Import the repository into Vercel.
3. Use Node.js 22, install command `npm ci`, build command `npm run build`, and output directory `out` (also configured in `vercel.json`).
4. Set `NEXT_PUBLIC_SITE_URL` to your chosen origin and deploy.
5. Run the browser release checklist against the deployed origin. Browser data is scoped to each origin; changing domains does not move user data.

### Other static hosts

Upload `out/` after a successful build. Serve directory indexes so `/app/documents/` resolves to `app/documents/index.html`. Serve JavaScript, WOFF2, TTF, and SVG files with appropriate MIME types. Use HTTPS so browser-native sharing and secure browser APIs are available. No SPA catch-all, Node server, or serverless functions are required. Preserve the response headers from `vercel.json` where supported.

## Product flows

- `/`: public landing page, product preview, features, templates, FAQ, privacy explanation.
- `/app/`: draft editor with business/client snapshots, reusable catalog selection, discount/tax controls, notes, terms, payment details, autosave, and live paper preview.
- `/app/documents/`: search, filters, pagination, manual statuses, duplicate, PDF, print, delete, and quotation conversion.
- `/app/clients/`: client CRUD and related documents.
- `/app/items/`: reusable products/services with currency-specific prices.
- `/app/templates/`: Modern, Minimal, and Corporate previews and default selection.
- `/app/settings/`: business profile, optimized logo, document preferences, payment defaults, export/import, and local data deletion.
- `/privacy/`, `/terms/`, `/contact/`: public information. The contact page explains that no support mailbox is configured. Configure an actual operator contact before public launch.

All features are free. The modular sidebar Pro banner only describes planned features; it does not gate existing tools.

## Architecture

```text
src/app/                    Static route entry points and public content
src/components/documents/   Editor, line editor, party form, HTML/PDF previews
src/components/management/  Document/client/catalog/settings/template screens
src/components/layout/      Workspace shell, navigation, public layout
src/components/ui/          shadcn-style Button, Radix dialogs, shared controls
src/hooks/                  Serialized debounced draft persistence
src/types/domain.ts         Zod schemas and inferred domain types
src/lib/db/                 Dexie schema, numbering, transactions, backup validation
src/lib/calculations/       Shared pure decimal calculation and formatting
src/lib/pdf/                Lazy-loaded React PDF renderer and export operations
src/lib/document-style.ts   Shared template accent resolution
src/constants/brand.ts      Product name, brand metadata, currencies, templates
src/stores/                 Zustand UI state (no duplicated persistent documents)
public/fonts/               Locally hosted Geist fonts and OFL license
```

The form is managed by React Hook Form/Zod using the local `src/lib/validation/document-resolver.ts` adapter (no `@hookform/resolvers` package is required), persistent entities by Dexie, and transient theme/navigation/notification state by Zustand. The editor, HTML preview, dashboard, and PDF use the same calculation function. PDF code loads on demand; the larger preview uses the actual React PDF document for exact pagination. The fast HTML preview conveys document styling and content but does not simulate page boundaries.

Database schema version 1 defines documents, clients, catalog items, singleton settings, and separate invoice/quotation counters. Future migrations should add another `db.version(n).stores(...).upgrade(...)` without destroying existing tables. Number reservation and draft creation happen in one IndexedDB transaction, including a collision check. A type change creates a newly numbered copy. Editing a saved client or catalog item does not mutate saved document snapshots. Drafts can fill a missing logo from the saved profile when the business identity matches, or use the complete saved profile when their business details are empty. Issued documents retain their snapshots. Use **From (Your Business) → Use saved profile** to explicitly apply updated details and logo to an existing document, then download the PDF again. Logo visibility is controlled in the preview’s Document appearance options. Native statuses such as Paid and Accepted are manual; Overdue and Expired are derived from dates.

## Calculation contract

- Numeric sources are nonnegative decimal **strings**, never formatted money or binary floating point. Quantity and unit price allow 6 fractional digits and up to 12 integer digits.
- `decimal.js` uses precision 40 and round-half-up. Currency precision comes from `Intl.NumberFormat`: for example JPY 0, LKR/USD 2, KWD 3.
- Per line: multiply quantity by price, round to currency precision, apply a percentage or fixed discount (capped at line value), then calculate tax on the discounted amount. Line tax is rounded to currency precision.
- Tax-exclusive: add rounded tax to the discounted line base.
- Tax-inclusive: extract rounded tax from the discounted gross amount. Subtotal and discount in the summary are shown net of tax so subtotal − discount + tax reconciles to the gross line total.
- Group tax by normalized percentage. Additional charges are rounded and added after line taxes; additional charges do not have their own tax rate.
- Grand total is the sum of rounded lines plus rounded additional charges. Totals are recalculated from source data after reopening/importing.
- Currency display uses `BigInt` and `Intl.formatToParts` to preserve large integral amounts during formatting. Selecting a different currency changes denomination only; there is no exchange-rate conversion. Catalog items in a different currency cannot be inserted accidentally.

### Advance payments

Invoices have an optional **Summary → Record an advance payment** control. Enter the amount already received in the invoice currency. The invoice total and taxes remain unchanged; the summary, live preview, and PDF show the advance deduction and remaining balance due. A fully paid advance shows a zero balance. Negative amounts and advances greater than the invoice total are rejected. Zero or disabled advances leave the original total presentation unchanged, and quotations do not show advance payments.

The amount is stored as an optional decimal string on the document and included in JSON exports and backups. Existing documents and version 1 backups without the field continue to work as zero advance. A new duplicate or converted document clears the recorded advance, since payment received for one document must not automatically count as received for another. Statuses remain manually controlled.

## Local storage and privacy

IndexedDB database: `vouch-local`. Theme preference is the only localStorage entry (`vouch-theme`). Logos are validated PNG/JPEG/WebP images, limited to 5 MB, resized to at most 600 pixels on their longest edge, and stored as local data URLs in IndexedDB. Imported logos may not reference remote URLs or SVG. No document information is put in URLs; the editor's query parameter contains only the document ID.

Local data is not encrypted by vouchs. Browser data can be removed by site-data clearing, private browsing, browser eviction, device loss, or a domain change. vouchs has no remote copy or automatic recovery. The first visit needs internet to load the application; this version does not include a service worker or guarantee an offline cold start.

Draft saving is debounced by 650 ms. Writes are serialized and the success indicator appears only after persistence succeeds. Internal link navigation flushes valid work; invalid unsaved work requires confirmation to leave. Tab closing warns if current work differs from the saved snapshot. Concurrent writes use an expected timestamp inside the save transaction. If another tab changed or deleted the document, a stale save is rejected with a request to reopen the current version; edits are not automatically merged.

## Backup and restore

Business Settings → Export all data downloads an **unencrypted JSON** backup with schema version 1, timestamps, all documents, clients, catalog, settings (including bank details and logos), and numbering counters.

Import is **replace**, not merge. The app validates structure, schema compatibility, field values, unique entity IDs, and document numbers before asking for confirmation. Replacement is atomic in a Dexie transaction, so a transaction failure rolls back the operation. The file limit is 25 MB. Export the current data first when preserving it matters. Unsupported schema versions and invalid files are rejected without intentional mutation.

Clear application data requires confirmation and typing `DELETE`. Deleting a client or catalog item preserves historical document snapshots.

## Browser release checklist

After a clean `npm install`, pass TypeScript, lint, and the static build, then manually verify:

1. New browser profile: enter business and client, add decimal quantities, tax and discounts, preview, download PDF, reload and reopen.
2. Edit a document and immediately navigate away; reopen and verify the last edit persisted. Trigger an invalid amount and verify save failure and leave confirmation.
3. Create multiple invoices and quotations in two tabs and check generated numbers differ. Warn on manually duplicated numbers.
4. Save/accept a quotation, convert to invoice, and verify independent IDs, numbers, snapshots, and source preservation.
5. Add/edit/delete clients and catalog entries; verify older documents keep their snapshots.
6. Export backup, clear data after both confirmations, import, and compare documents and totals. Reject a malformed/unsupported backup.
7. Generate PDFs for all templates with a logo, long notes, 100 items, and different currencies. Check repeating headers, pagination, totals, footer spacing, and printed output.
8. On a mobile browser, create, edit, preview, download, and share; test the drawer, dialogs, keyboard, zoom, and dark mode. On browsers without an embedded PDF viewer, use Download PDF.
9. Disable IndexedDB or exhaust storage and confirm actionable errors without false saved indicators.

## Remaining launch limitations

The PDF font is locally hosted Geist with Latin coverage; Sinhala, Tamil, Arabic, and other scripts need a suitable locally bundled font and shaping verification before promising multilingual PDF support. Currency support includes LKR; PDF money uses ISO currency codes. PDF templates, repeated headers, logo embedding, footer bounds, and pagination have passed renderer layout checks; visual and browser print QA remain part of the release checklist. Exact PDF preview support varies on mobile. Browser print may require opening the downloaded PDF manually when popups are blocked. There is no account, cloud sync, automatic email, payment verification, exchange-rate conversion, or subscription billing.

Branding is centralized in `src/constants/brand.ts`; update the public wordmark, metadata, and favicon when rebranding. Review public policy text, configure operator contact and production origin, and complete the release checklist before launch.

Vercel Web Analytics is mounted in the root layout for all pages. Enable Web Analytics in the Vercel project dashboard and deploy to start collecting visits. Set `NEXT_PUBLIC_SITE_URL` to the full production URL for canonical links and metadata.
