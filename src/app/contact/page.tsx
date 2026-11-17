import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/layout/marketing";
export const metadata = {
  title: "Contact & Help",
  description:
    "Get in touch with vouchs by email or phone. Based in Ambalangoda, Sri Lanka.",
  alternates: { canonical: "/contact/" },
};
export default function Page() {
  return (
    <div className="marketing">
      <PublicNav />
      <article className="legal">
        <h1>Contact us</h1>
        <p>
          Have a question, feedback, or need help with vouchs? Get in touch.
        </p>
        <address className="contact-details">
          <p>
            <strong>Email:</strong>{" "}
            <a className="text-button" href="mailto:javamaxdeveloper@gmail.com">
              javamaxdeveloper@gmail.com
            </a>
          </p>
          <p>
            <strong>Mobile:</strong>{" "}
            <a className="text-button" href="tel:+94763316479">
              +94 76 331 6479
            </a>
          </p>
          <p><strong>Address:</strong> Ambalangoda, Sri Lanka</p>
        </address>
        <h2>Help with vouchs</h2>
        <p>
          vouchs works entirely on your device. There is no account or remote
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
          Email us at{" "}
          <a className="text-button" href="mailto:javamaxdeveloper@gmail.com">
            javamaxdeveloper@gmail.com
          </a>
          . Include your
          browser version and a description of the issue; avoid sending private
          invoices or bank details.
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
