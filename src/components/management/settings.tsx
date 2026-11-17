"use client";
import { useEffect, useState, useRef } from "react";
import {
  Building2,
  SlidersHorizontal,
  Palette,
  Landmark,
  Database,
  Upload,
  Download,
  Trash2,
  Save,
  ImagePlus,
  ShieldCheck,
} from "lucide-react";
import {
  db,
  getSettings,
  exportBackup,
  restoreBackup,
  backupSchema,
} from "@/lib/db";
import { settingsSchema, type Settings } from "@/types/domain";
import { currencies, templates } from "@/constants/brand";
import { download } from "@/lib/utils";
import { useUI } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import {
  PageIntro,
  Card,
  Field,
  Input,
  Transition,
} from "@/components/ui/shared";
export default function SettingsPage() {
  const [s, setS] = useState<Settings>();
  const [storage, setStorage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useUI((s) => s.toast);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    getSettings()
      .then(setS)
      .catch(() =>
        setError("Storage unavailable. Please enable browser storage.")
      );
    navigator.storage
      ?.estimate()
      .then((e) =>
        setStorage(
          `${((e.usage ?? 0) / 1024 / 1024).toFixed(2)} MB used on this origin`
        )
      );
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const navigate = (e: MouseEvent) => {
      if (!dirty || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const anchor = (e.target as Element).closest?.("a");
      if (anchor && !confirm("Leave without saving your business settings?"))
        e.preventDefault();
    };
    document.addEventListener("click", navigate, true);
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  const update = (next: Settings) => {
    setS(next);
    setDirty(true);
  };
  if (!s) return <p>{error || "Loading your preferences…"}</p>;
  const logo = async (file?: File) => {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast("Choose a PNG, JPEG, or WebP image under 5 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      update({
        ...s,
        business: { ...s.business, logo: canvas.toDataURL("image/png") },
      });
    } catch {
      toast("This image could not be read. Choose another file.");
    }
  };
  return (
    <Transition>
      <PageIntro
        title="Business Settings"
        description="Your business, down to the last detail."
        action={
          <span className="local-badge">
            <ShieldCheck size={14} />
            Only on this device
          </span>
        }
      />
      <form
        className="settings-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          const p = settingsSchema.safeParse(s);
          if (!p.success) {
            setError(
              "Check your email, tax rate, color, and default terms (0–365 days)."
            );
            return;
          }
          setBusy(true);
          try {
            await db.settings.put(p.data);
            setDirty(false);
            setError("");
            toast(
              "Settings saved. Existing documents keep their original details."
            );
          } catch {
            setError(
              "Settings could not be saved. Check your browser storage."
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="settings-main">
          <Card title="Business profile" icon={<Building2 size={18} />}>
            <div className="logo-upload">
              <div className="logo-box">
                {s.business.logo ? (
                  <img src={s.business.logo} alt="Business logo" />
                ) : (
                  <ImagePlus size={26} />
                )}
              </div>
              <div>
                <label className="button button-outline button-sm">
                  Upload logo
                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => logo(e.target.files?.[0])}
                  />
                </label>
                <p className="hint">PNG, JPEG or WebP. Up to 5 MB.</p>
                {s.business.logo && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      update({ ...s, business: { ...s.business, logo: "" } })
                    }
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
            <div className="grid-2">
              {(
                [
                  "name",
                  "company",
                  "email",
                  "phone",
                  "website",
                  "country",
                  "taxNumber",
                  "registration",
                ] as const
              ).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      name: "Your name",
                      company: "Business name",
                      email: "Email",
                      phone: "Phone",
                      website: "Website",
                      country: "Country",
                      taxNumber: "Tax registration number",
                      registration: "Business registration number",
                    }[k]
                  }
                >
                  <Input
                    value={s.business[k]}
                    onChange={(e) =>
                      update({
                        ...s,
                        business: { ...s.business, [k]: e.target.value },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Business address">
              <textarea
                value={s.business.address}
                onChange={(e) =>
                  update({
                    ...s,
                    business: { ...s.business, address: e.target.value },
                  })
                }
              />
            </Field>
          </Card>
          <Card
            title="Document preferences"
            icon={<SlidersHorizontal size={18} />}
          >
            <div className="grid-2">
              <Field label="Default currency">
                <select
                  value={s.currency}
                  onChange={(e) => update({ ...s, currency: e.target.value })}
                >
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              {(
                ["invoicePrefix", "quotationPrefix", "days", "tax"] as const
              ).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      invoicePrefix: "Invoice prefix",
                      quotationPrefix: "Quotation prefix",
                      days: "Default payment / validity days",
                      tax: "Default tax rate (%)",
                    }[k]
                  }
                >
                  <Input
                    value={s[k]}
                    onChange={(e) =>
                      update({
                        ...s,
                        [k]:
                          k === "days"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Default notes">
              <textarea
                value={s.notes}
                onChange={(e) => update({ ...s, notes: e.target.value })}
              />
            </Field>
            <Field
              label="Default terms & conditions"
              hint="Choose terms appropriate for your business and jurisdiction."
            >
              <textarea
                value={s.terms}
                onChange={(e) => update({ ...s, terms: e.target.value })}
              />
            </Field>
          </Card>
          <Card title="Document appearance" icon={<Palette size={18} />}>
            <div className="grid-2">
              <Field label="Default template">
                <select
                  value={s.appearance.template}
                  onChange={(e) =>
                    update({
                      ...s,
                      appearance: {
                        ...s.appearance,
                        template: e.target
                          .value as Settings["appearance"]["template"],
                      },
                    })
                  }
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Modern accent color">
                <Input
                  type="color"
                  value={s.appearance.accent}
                  onChange={(e) =>
                    update({
                      ...s,
                      appearance: { ...s.appearance, accent: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={s.appearance.showLogo}
                onChange={(e) =>
                  update({
                    ...s,
                    appearance: { ...s.appearance, showLogo: e.target.checked },
                  })
                }
              />
              Show logo on documents
            </label>
            <Field label="Footer text">
              <Input
                value={s.appearance.footer}
                onChange={(e) =>
                  update({
                    ...s,
                    appearance: { ...s.appearance, footer: e.target.value },
                  })
                }
              />
            </Field>
          </Card>
          <Card title="Payment settings" icon={<Landmark size={18} />}>
            <label className="check-label">
              <input
                type="checkbox"
                checked={s.payment.enabled}
                onChange={(e) =>
                  update({
                    ...s,
                    payment: { ...s.payment, enabled: e.target.checked },
                  })
                }
              />
              Include payment details by default
            </label>
            <p className="hint">
              Sensitive bank information is stored locally and included in
              backups and enabled invoice exports.
            </p>
            <div className="grid-2">
              {(
                [
                  "bank",
                  "holder",
                  "account",
                  "branch",
                  "swift",
                  "iban",
                ] as const
              ).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      bank: "Bank name",
                      holder: "Account holder",
                      account: "Account number",
                      branch: "Branch",
                      swift: "SWIFT / BIC",
                      iban: "IBAN",
                    }[k]
                  }
                >
                  <Input
                    value={s.payment[k]}
                    onChange={(e) =>
                      update({
                        ...s,
                        payment: { ...s.payment, [k]: e.target.value },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Payment instructions">
              <textarea
                value={s.payment.instructions}
                onChange={(e) =>
                  update({
                    ...s,
                    payment: { ...s.payment, instructions: e.target.value },
                  })
                }
              />
            </Field>
          </Card>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="settings-save">
            <span className="muted">
              {dirty
                ? "You have unsaved settings"
                : "All preferences saved locally"}
            </span>
            <Button type="submit" disabled={busy}>
              <Save size={16} />
              {busy ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </div>
        <aside className="settings-aside">
          <Card title="Your data, your control" icon={<Database size={18} />}>
            <p className="muted">
              Everything lives in your browser. Back up regularly to keep your
              work close.
            </p>
            <div className="storage-info">
              <Database size={19} />
              <span>{storage || "Local IndexedDB storage"}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  download(
                    new Blob([JSON.stringify(await exportBackup(), null, 2)], {
                      type: "application/json",
                    }),
                    `vouchs-backup-${new Date().toISOString().slice(0, 10)}.json`
                  );
                  toast("Backup downloaded. Keep it somewhere safe.");
                } catch {
                  toast("Backup could not be exported.");
                }
              }}
            >
              <Download size={16} />
              Export all data
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => importRef.current?.click()}
            >
              <Upload size={16} />
              Import backup
            </Button>
            <input
              hidden
              ref={importRef}
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 25 * 1024 * 1024) {
                  toast("Backup must be smaller than 25 MB.");
                  return;
                }
                try {
                  const data = backupSchema.parse(
                    JSON.parse(await file.text())
                  );
                  if (
                    !confirm(
                      `Replace all local data with this backup? It contains ${data.documents.length} documents, ${data.clients.length} clients, and ${data.items.length} items. Export a backup first if you want to keep current data.`
                    )
                  )
                    return;
                  await restoreBackup(data);
                  setS(await getSettings());
                  setDirty(false);
                  toast("Backup restored successfully.");
                } catch {
                  toast(
                    "Import failed. Use a valid vouchs schema version 1 backup. No data was changed."
                  );
                }
              }}
            />
            <div className="storage-warning">
              <ShieldCheck size={16} />
              <p>
                Browser settings, private browsing, and device changes can
                remove local data. Backups are unencrypted and may contain bank
                details. Store them securely.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                if (
                  !confirm(
                    "Clear ALL vouchs documents, clients, items and settings on this device? Export a backup before continuing."
                  )
                )
                  return;
                if (
                  prompt("Type DELETE to permanently clear local data.") !==
                  "DELETE"
                )
                  return;
                try {
                  await db.transaction("rw", db.tables, async () => {
                    for (const t of db.tables) await t.clear();
                  });
                  setS(await getSettings());
                  setDirty(false);
                  toast("All local application data cleared.");
                } catch {
                  toast("Data could not be cleared.");
                }
              }}
            >
              <Trash2 size={15} />
              Clear application data
            </Button>
          </Card>
          <div className="settings-tip">
            <Sparkle />
            <h3>Set it once. Make it yours.</h3>
            <p>
              Your saved details and preferences are used for new documents.
              Existing documents keep their original snapshots.
            </p>
          </div>
        </aside>
      </form>
    </Transition>
  );
}
function Sparkle() {
  return <span className="tip-star">✧</span>;
}
