import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/layout/marketing";
export const metadata = {
  title: "Contact & Help",
  alternates: { canonical: "/contact/" },
};
export default function Page() {
  return (
    <div className="marketing">
      <PublicNav />
      <article className="legal">
        <h1>A little help with Vouch.</h1>
        <p>
          Vouch works entirely on your device. There is no account or remote
          document recovery service.
        </p>
        <h2>Protect your work</h2>
        <p>
          Before troubleshooting or clearing your browser data, download a
          complete backup in{" "}
          <Link className="text-button" href="/app/settings">
            Business Settings
          </Link>
          .
        </p>
        <h2>PDF and printing help</h2>
        <p>
          Use Download PDF to save your document. You can open the downloaded
          file in your device’s PDF viewer to print or share it. Allow popups if
          you want to use the direct Print action.
        </p>
        <h2>Report a problem</h2>
        <p>
          No support mailbox has been configured for this installation. Contact
          the operator of the website where you opened Vouch. Include your
          browser version and a description of the issue; avoid sending private
          invoices or bank details.
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
