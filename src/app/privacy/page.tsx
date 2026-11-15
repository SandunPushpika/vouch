import { PublicNav, PublicFooter } from "@/components/layout/marketing";
export const metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy/" },
};
export default function Page() {
  return (
    <div className="marketing">
      <PublicNav />
      <article className="legal">
        <h1>Privacy, by design.</h1>
        <p>Last updated: 15 November 2026</p>
        <h2>Your documents stay on your device</h2>
        <p>
          Vouch stores your business profile, clients, catalog, invoices,
          quotations, and settings in your browser’s IndexedDB database.
          Document editing and PDF generation happen locally. Vouch does not
          upload your documents or require an account.
        </p>
        <h2>Browser storage and backups</h2>
        <p>
          Browser storage is not a backup and is not encrypted by Vouch.
          Clearing site data, using private browsing, switching devices, or
          browser eviction may remove your data. Export backups regularly from
          Business Settings. Backups can contain sensitive bank and client
          details; keep them in a secure location.
        </p>
        <h2>Hosting and external links</h2>
        <p>
          Your hosting provider receives normal requests for the application
          files and may keep infrastructure access logs, including IP addresses.
          The application includes no analytics, advertising scripts, or
          external font requests. Any external links you choose to open follow
          their destination’s policies.
        </p>
        <h2>Control and deletion</h2>
        <p>
          You can export or permanently clear Vouch data in Business Settings,
          or remove it through your browser settings. Sharing or downloading a
          PDF is initiated by you; Vouch does not send emails automatically.
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
