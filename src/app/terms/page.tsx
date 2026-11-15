import { PublicNav, PublicFooter } from "@/components/layout/marketing";
export const metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms/" },
};
export default function Page() {
  return (
    <div className="marketing">
      <PublicNav />
      <article className="legal">
        <h1>A few clear terms.</h1>
        <p>Last updated: 15 November 2026</p>
        <h2>Using Vouch</h2>
        <p>
          Vouch is a free, browser-based tool for preparing invoices and
          quotations. You are responsible for reviewing your document details,
          tax rates, payment terms, and totals before using or sending them.
        </p>
        <h2>Your business requirements</h2>
        <p>
          Requirements for invoices and taxes vary by location and business.
          Vouch does not provide accounting, tax, or legal advice, and does not
          verify payments, client acceptance, or regulatory compliance. Statuses
          are managed manually.
        </p>
        <h2>Your data and backups</h2>
        <p>
          You retain ownership of your content. All working data is stored in
          your browser. Keep regular backups; Vouch cannot recover data removed
          from your device or browser.
        </p>
        <h2>Availability</h2>
        <p>
          The tool is provided as available, without a guarantee of
          uninterrupted operation or fitness for a particular purpose. To the
          extent permitted by applicable law, its operators are not responsible
          for losses from use of the tool or loss of locally stored data.
          Nothing here limits rights that cannot legally be excluded.
        </p>
        <h2>Free features</h2>
        <p>
          All currently implemented features are free. Pro features shown as
          coming soon are not currently offered and do not imply a subscription
          or payment obligation.
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
