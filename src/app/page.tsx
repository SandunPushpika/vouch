import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  FileText,
  UserRound,
  Calculator,
  HardDrive,
  PanelsTopLeft,
  Files,
  Users,
  Package,
  Settings2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import {
  PublicNav,
  PublicFooter,
  PublicBrand,
} from "@/components/layout/marketing";
import { DocumentPreview } from "@/components/documents/preview";
import { sampleDocument } from "@/lib/sample-document";
import { templates } from "@/constants/brand";
export const metadata = {
  title: "Vouch — Free Invoice & Quotation Generator",
  alternates: { canonical: "/" },
};
const features = [
  {
    Icon: FileText,
    title: "Professional, down to the PDF",
    description:
      "Clean, beautiful A4 documents that look as good as the work behind them.",
  },
  {
    Icon: PanelsTopLeft,
    title: "A template for your style",
    description:
      "Modern, Minimal, or Corporate. Make every document feel like your business.",
  },
  {
    Icon: UserRound,
    title: "Start without the signup",
    description:
      "No accounts, passwords, or hoops to jump through. Just open and create.",
  },
  {
    Icon: Calculator,
    title: "Leave the math to us",
    description:
      "Quantities, discounts, and taxes, calculated accurately as you go.",
  },
  {
    Icon: HardDrive,
    title: "Pick up where you left off",
    description:
      "Your documents, clients, and services are saved locally in your browser.",
  },
  {
    Icon: ShieldCheck,
    title: "Your business stays yours",
    description:
      "Your data never leaves your device. No servers. No tracking. No surprises.",
  },
];
export default function Home() {
  const sample = sampleDocument();
  return (
    <div className="marketing">
      <PublicNav />
      <section
        className="hero"
        itemScope
        itemType="https://schema.org/SoftwareApplication"
      >
        <meta itemProp="name" content="Vouch" />
        <meta itemProp="applicationCategory" content="BusinessApplication" />
        <meta itemProp="operatingSystem" content="Web browser" />
        <div className="hero-label">
          <Sparkles size={12} />A little less admin. A lot more possibility.
        </div>
        <h1>
          Create professional invoices
          <br />& quotations. <em>In seconds.</em>
        </h1>
        <p>
          Beautiful invoices and quotations, made simple.
          <br />
          No signup, no subscriptions, no hassle.
        </p>
        <div className="hero-actions">
          <Link href="/app" className="button button-primary">
            Create free invoice
            <ArrowRight size={16} />
          </Link>
          <Link href="#templates" className="button button-outline">
            Explore templates
            <PanelsTopLeft size={15} />
          </Link>
        </div>
        <div className="hero-proof">
          <span>
            <Check size={12} />
            100% free. Always yours.
          </span>
          <span>
            <Check size={12} />
            No registration
          </span>
          <span>
            <Check size={12} />
            Private by design
          </span>
        </div>
        <div className="product-window">
          <div className="window-chrome">
            <div>
              <i />
              <i />
              <i />
            </div>
            <span>
              <LockKeyhole
                size={7}
                style={{ display: "inline", marginRight: 4 }}
              />
              your private workspace
            </span>
            <span>↗</span>
          </div>
          <div className="product-demo">
            <aside className="demo-nav">
              <PublicBrand />
              {[
                [FileText, "Create Document"],
                [Files, "Documents"],
                [Users, "Clients"],
                [Package, "Items & Services"],
                [PanelsTopLeft, "Templates"],
                [Settings2, "Business Settings"],
              ].map(([Icon, name], i) => {
                const I = Icon as typeof FileText;
                return (
                  <span
                    key={name as string}
                    className={i === 0 ? "demo-active" : ""}
                  >
                    <I size={13} />
                    {name as string}
                  </span>
                );
              })}
            </aside>
            <div className="demo-main">
              <div>
                <h3>Create Document</h3>
                <p>Good work deserves a great invoice. Let’s make yours.</p>
              </div>
              <div className="demo-editor">
                <div className="demo-fields">
                  <div className="type-tabs">
                    <span className="selected">
                      <FileText size={12} />
                      Invoice
                    </span>
                    <span>
                      <Files size={12} />
                      Quotation
                    </span>
                  </div>
                  <div className="card">
                    <div className="card-heading">
                      <h2>
                        <FileText size={13} />
                        Document details
                      </h2>
                    </div>
                    <div className="card-body grid-2">
                      {[
                        ["Document number", "INV-0001"],
                        ["Currency", "USD — US Dollar"],
                        ["Issue date", "15 Nov 2026"],
                        ["Due date", "29 Nov 2026"],
                      ].map(([k, v]) => (
                        <div className="field" key={k}>
                          <span>{k}</span>
                          <div className="input">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-heading">
                      <h2>
                        <Users size={13} />
                        Business & client
                      </h2>
                    </div>
                    <div className="card-body grid-2">
                      <div className="field">
                        <span>From</span>
                        <div className="input">Studio North</div>
                      </div>
                      <div className="field">
                        <span>Bill to</span>
                        <div className="input">Acme & Co.</div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-heading">
                      <h2>
                        <Package size={13} />
                        Items & services
                      </h2>
                    </div>
                    <div className="card-body">
                      {sample.lines.map((l) => (
                        <div
                          key={l.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 9,
                            padding: "9px 0",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <span>{l.name}</span>
                          <strong>${l.price}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="demo-summary">
                    <span>Total amount</span>
                    <strong>USD 5,400.00</strong>
                  </div>
                </div>
                <DocumentPreview doc={sample} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section" id="features">
        <div className="section-heading">
          <span>LESS ADMIN. MORE LIVING.</span>
          <h2>
            Everything you need.
            <br />
            Nothing in your way.
          </h2>
          <p>
            Thoughtfully simple tools for independent people doing great work.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((f) => (
            <article className="feature" key={f.title}>
              <span>
                <f.Icon size={18} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="how-section">
        <div className="marketing-section">
          <div className="section-heading">
            <span>FROM DONE TO DOWNLOADED</span>
            <h2>Three steps. One great impression.</h2>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Enter your details",
                "Add your business, client, and the work you’ve done.",
              ],
              [
                "02",
                "Make it yours",
                "Choose a template and fine-tune the details.",
              ],
              [
                "03",
                "Download. You’re done.",
                "Get a beautiful PDF, ready to send your way.",
              ],
            ].map(([n, t, p]) => (
              <article key={n}>
                <strong>{n}</strong>
                <h3>{t}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="marketing-section" id="templates">
        <div className="section-heading">
          <span>YOUR WORK, WELL PRESENTED</span>
          <h2>Find your signature style.</h2>
          <p>Three professional templates. All included. All yours.</p>
        </div>
        <div className="public-templates">
          {templates.map((t) => (
            <article className="public-template" key={t.id}>
              <DocumentPreview doc={sampleDocument(t.id)} mini />
              <div>
                <span>{t.name}</span>
                <Link href="/app/templates">Explore template ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="privacy-block">
        <ShieldCheck strokeWidth={1} />
        <div>
          <h2>Private isn’t a feature. It’s the foundation.</h2>
          <p>
            Your business details, clients, and documents stay right on your
            device. Vouch processes everything in your browser, with no accounts
            and no data uploads. Export a backup whenever you like — you’re
            always in control.
          </p>
        </div>
      </section>
      <section className="marketing-section faq" id="faq">
        <div className="section-heading">
          <span>A FEW THINGS YOU MIGHT WONDER</span>
          <h2>Simple answers. No fine print.</h2>
        </div>
        {[
          [
            "Is Vouch really free?",
            "Yes. Every current feature is free, including templates, PDF downloads, client management, and backups. Optional Pro tools are planned for the future.",
          ],
          [
            "Do I need to create an account?",
            "No. Open the workspace and start creating immediately. Business setup is optional.",
          ],
          [
            "Where are my documents stored?",
            "In IndexedDB in your browser on this device. They are not uploaded. Clearing browser data or changing devices can remove access, so export backups regularly.",
          ],
          [
            "Can I edit an invoice later?",
            "Yes. Find it in Documents and open it to edit, duplicate, change its status, or download a new PDF.",
          ],
          [
            "How do I back up my data?",
            "In Business Settings, choose Export all data to download a JSON backup. Import backup restores your documents, clients, items, and preferences after your confirmation.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section className="final-cta">
        <h2>
          You do great work.
          <br />
          Let’s put your name on it.
        </h2>
        <p>Your next invoice is just a few details away.</p>
        <Link className="button" href="/app">
          Create your free invoice
          <ArrowRight size={16} />
        </Link>
      </section>
      <PublicFooter />
    </div>
  );
}
