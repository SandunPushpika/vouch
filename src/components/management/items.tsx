"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { itemSchema, type CatalogItem } from "@/types/domain";
import { currencies } from "@/constants/brand";
import { money } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import {
  PageIntro,
  SearchBox,
  Field,
  Input,
  Modal,
  Empty,
  Transition,
} from "@/components/ui/shared";
import { useUI } from "@/stores/ui";
export default function Items() {
  const items = useLiveQuery(() => db.items.toArray()) ?? [];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const toast = useUI((s) => s.toast);
  const [error, setError] = useState("");
  const fresh = () => {
    setError("");
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: "0",
      currency: "LKR",
      unit: "service",
      tax: "0",
      sku: "",
    });
  };
  const filtered = items.filter((i) =>
    `${i.name} ${i.description} ${i.sku}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <Transition>
      <PageIntro
        title="Items & Services"
        description="Less typing. More time for the work you love."
        action={
          <Button onClick={fresh}>
            <Plus size={16} />
            Add item
          </Button>
        }
      />
      <div className="card">
        <div className="table-toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search your catalog…"
          />
          <span className="muted">{items.length} reusable items</span>
        </div>
        {!filtered.length ? (
          <Empty
            title={
              items.length ? "No matching items" : "Build your go-to catalog"
            }
            description="Save your services and prices. Your future self will thank you."
            action={
              <Button onClick={fresh}>
                <Plus size={16} />
                Add your first item
              </Button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / service</th>
                  <th>Unit price</th>
                  <th>Unit</th>
                  <th>Tax</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="document-link">
                        <span className="doc-icon">
                          <Package size={18} />
                        </span>
                        <span>
                          <strong>{i.name}</strong>
                          <small>{i.description || i.sku}</small>
                        </span>
                      </div>
                    </td>
                    <td className="numeric">{money(i.price, i.currency)}</td>
                    <td>{i.unit}</td>
                    <td>{i.tax}%</td>
                    <td>
                      <div className="table-actions">
                        <button
                          aria-label="Edit item"
                          onClick={() => {
                            setError("");
                            setEditing(i);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          aria-label="Delete item"
                          onClick={async () => {
                            if (
                              confirm(
                                `Delete ${i.name}? Existing documents will keep their item details.`
                              )
                            ) {
                              try {
                                await db.items.delete(i.id);
                                toast("Item deleted.");
                              } catch {
                                toast("Item could not be deleted.");
                              }
                            }
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        title={
          items.some((i) => i.id === editing?.id) ? "Edit item" : "New item"
        }
      >
        {editing && (
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const p = itemSchema.safeParse(editing);
              if (!p.success) {
                setError(
                  "Add an item name and valid positive prices and tax (0–100%)."
                );
                return;
              }
              try {
                await db.items.put(p.data);
                setEditing(null);
                toast("Item saved to catalog.");
              } catch {
                setError("Could not save item. Check browser storage.");
              }
            }}
          >
            <Field label="Item name">
              <Input
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Description">
              <textarea
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </Field>
            <div className="grid-2">
              {(["price", "unit", "tax", "sku"] as const).map((k) => (
                <Field
                  key={k}
                  label={
                    {
                      price: "Default price",
                      unit: "Unit",
                      tax: "Tax rate (%)",
                      sku: "SKU / reference",
                    }[k]
                  }
                >
                  <Input
                    value={editing[k]}
                    onChange={(e) =>
                      setEditing({ ...editing, [k]: e.target.value })
                    }
                  />
                </Field>
              ))}
              <Field label="Currency">
                <select
                  value={editing.currency}
                  onChange={(e) =>
                    setEditing({ ...editing, currency: e.target.value })
                  }
                >
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <Button type="submit">Save item</Button>
          </form>
        )}
      </Modal>
    </Transition>
  );
}
