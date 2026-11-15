"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { Plus, Pencil, Trash2, UserRound, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { emptyParty, type Client } from "@/types/domain";
import {
  PageIntro,
  SearchBox,
  Modal,
  Empty,
  Transition,
} from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { PartyForm } from "@/components/documents/party-form";
import { useUI } from "@/stores/ui";
export default function Clients() {
  const clients = useLiveQuery(() => db.clients.toArray()) ?? [];
  const documents = useLiveQuery(() => db.documents.toArray()) ?? [];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | null>();
  const [detail, setDetail] = useState<Client | null>(null);
  const toast = useUI((s) => s.toast);
  const filtered = clients.filter((c) =>
    `${c.name} ${c.company} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <Transition>
      <PageIntro
        title="Clients"
        description="Great relationships start with the little details."
        action={
          <Button onClick={() => setEditing(null)}>
            <Plus size={16} />
            Add client
          </Button>
        }
      />
      <div className="card">
        <div className="table-toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search clients…"
          />
          <span className="muted">
            {clients.length} clients in your address book
          </span>
        </div>
        {!filtered.length ? (
          <Empty
            title={
              clients.length
                ? "No matching clients"
                : "People behind the projects"
            }
            description="Save client details once. Add them to your next invoice in a click."
            action={
              <Button onClick={() => setEditing(null)}>
                <Plus size={16} />
                Add your first client
              </Button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="document-link"
                        onClick={() => setDetail(c)}
                      >
                        <span className="client-avatar">
                          <UserRound size={18} />
                        </span>
                        <span>
                          <strong>{c.company || c.name}</strong>
                          <small>{c.company ? c.name : c.taxNumber}</small>
                        </span>
                      </button>
                    </td>
                    <td>{c.email || "—"}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.country || "—"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          aria-label="View client details"
                          onClick={() => setDetail(c)}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                        <button
                          aria-label="Edit client"
                          onClick={() => setEditing(c)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          aria-label="Delete client"
                          onClick={async () => {
                            if (
                              confirm(
                                `Delete ${
                                  c.company || c.name
                                }? Saved documents will keep their client details.`
                              )
                            ) {
                              try {
                                await db.clients.delete(c.id);
                                toast("Client deleted.");
                              } catch {
                                toast("Client could not be deleted.");
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
        open={editing !== undefined}
        onOpenChange={(v) => {
          if (!v) setEditing(undefined);
        }}
        title={editing ? "Edit client" : "New client"}
      >
        {editing !== undefined && (
          <PartyForm
            key={editing?.id ?? "new"}
            initial={editing ?? structuredClone(emptyParty)}
            label="Save client"
            onSave={async (p) => {
              if (!p.name && !p.company) {
                toast("Enter a client or company name.");
                return;
              }
              await db.clients.put({
                ...p,
                id: editing?.id ?? crypto.randomUUID(),
                createdAt: editing?.createdAt ?? new Date().toISOString(),
              });
              setEditing(undefined);
              toast("Client saved.");
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) setDetail(null);
        }}
        title={detail?.company || detail?.name || "Client details"}
      >
        {detail && (
          <div className="form-stack">
            <div className="detail-grid">
              {Object.entries(detail)
                .filter(([k, v]) => !["logo", "id"].includes(k) && v)
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="muted">{k}</span>
                    <p>{v}</p>
                  </div>
                ))}
            </div>
            <h3>Related documents</h3>
            {documents
              .filter(
                (d) =>
                  (detail.email && d.client.email === detail.email) ||
                  (d.client.name === detail.name &&
                    d.client.company === detail.company)
              )
              .map((d) => (
                <Link
                  className="related-link"
                  key={d.id}
                  href={`/app?id=${d.id}`}
                >
                  {d.number}
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            <Button
              variant="outline"
              onClick={() => {
                setEditing(detail);
                setDetail(null);
              }}
            >
              Edit client
            </Button>
          </div>
        )}
      </Modal>
    </Transition>
  );
}
