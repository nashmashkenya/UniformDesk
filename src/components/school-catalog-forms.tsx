"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addSchoolItemSizeAction,
  createSchoolItemAction,
  createSchoolKitAction,
  publishProductsToSchoolAction,
  updateSchoolItemAction,
  updateSchoolKitAction,
  type SchoolCatalogState,
} from "@/app/actions/school-catalog";

const initial: SchoolCatalogState = {};
const categories = [
  "shirt",
  "blouse",
  "trouser",
  "skirt",
  "sweater",
  "tunic",
  "dress",
  "shoes",
  "socks",
  "tie",
  "other",
] as const;

export type PublishableProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  sizes: string[];
};

export function SchoolCatalogItemForm({
  schoolId,
  products,
}: {
  schoolId: string;
  products: PublishableProduct[];
}) {
  const [publishState, publishAction, publishPending] = useActionState(
    publishProductsToSchoolAction,
    initial,
  );
  const [customState, customAction, customPending] = useActionState(
    createSchoolItemAction,
    initial,
  );
  const publishFormRef = useRef<HTMLFormElement>(null);
  const customFormRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (publishState.ok) {
      publishFormRef.current?.reset();
      setSelected([]);
    }
  }, [publishState]);

  useEffect(() => {
    if (customState.ok) customFormRef.current?.reset();
  }, [customState]);

  function toggleProduct(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectAll() {
    setSelected(products.map((p) => p.id));
  }

  return (
    <div className="form-stack form-flush">
      <form
        ref={publishFormRef}
        action={publishAction}
        className="form-stack form-flush"
      >
        <input type="hidden" name="schoolId" value={schoolId} />
        {selected.map((id) => (
          <input key={id} type="hidden" name="productIds" value={id} />
        ))}

        <div className="form-section">
          <div className="form-section-head">
            <h3 className="form-section-title">Add from your products</h3>
            <p className="form-section-sub">
              Select supplier products — SKU, name, and sizes copy exactly (no
              retyping)
            </p>
          </div>

          {!products.length ? (
            <p className="text-sm text-[var(--muted)]">
              All active products are already on this school, or you have no
              products yet.{" "}
              <Link href="/supplier/catalog" className="text-[var(--accent)]">
                Manage products
              </Link>
            </p>
          ) : (
            <>
              <div className="form-actions form-actions-inline mb-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={selectAll}
                >
                  Select all ({products.length})
                </button>
                {selected.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelected([])}
                  >
                    Clear
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {products.map((product) => {
                  const checked = selected.includes(product.id);
                  return (
                    <li key={product.id}>
                      <label className="field-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(product.id)}
                        />
                        <span>
                          <span className="field-check-title">
                            {product.name}{" "}
                            <span className="text-[var(--muted)]">
                              ({product.sku})
                            </span>
                          </span>
                          <span className="field-check-sub">
                            {product.category}
                            {product.sizes.length
                              ? ` · ${product.sizes.join(", ")}`
                              : " · no sizes"}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {publishState.error && (
          <p className="field-error" role="alert">
            {publishState.error}
          </p>
        )}
        {publishState.ok && (
          <p className="field-ok">
            {publishState.message ?? "Products added to this school."}
          </p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={publishPending || !selected.length}
            className="btn btn-primary"
          >
            {publishPending
              ? "Adding…"
              : selected.length
                ? `Add ${selected.length} to school`
                : "Select products to add"}
          </button>
        </div>
      </form>

      <details className="mt-4 rounded-[var(--radius)] border border-[var(--line)] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
          Add a custom item (rare)
        </summary>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Prefer selecting from Products above. Use this only for a school-only
          SKU that is not on your master list.
        </p>
        <form
          ref={customFormRef}
          action={customAction}
          className="form-stack mt-3"
        >
          <input type="hidden" name="schoolId" value={schoolId} />
          <div className="form-grid cols-2">
            <div className="field-group">
              <label className="field-label" htmlFor="school-item-sku">
                SKU
              </label>
              <input
                id="school-item-sku"
                name="sku"
                required
                placeholder="e.g. SKIRT-NVY"
                className="field"
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="school-item-name">
                Name
              </label>
              <input
                id="school-item-name"
                name="name"
                required
                placeholder="Navy Skirt"
                className="field"
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="school-item-category">
                Category
              </label>
              <select
                id="school-item-category"
                name="category"
                className="field"
                defaultValue="other"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="school-item-sizes">
                Sizes
              </label>
              <input
                id="school-item-sizes"
                name="sizes"
                required
                placeholder="S, M, L"
                className="field"
              />
            </div>
          </div>
          {customState.error && (
            <p className="field-error" role="alert">
              {customState.error}
            </p>
          )}
          {customState.ok && (
            <p className="field-ok">Custom item added to this school.</p>
          )}
          <div className="form-actions">
            <button
              type="submit"
              disabled={customPending}
              className="btn btn-secondary"
            >
              {customPending ? "Saving…" : "Add custom item"}
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}

export function SchoolAddSizeForm({
  schoolId,
  itemId,
}: {
  schoolId: string;
  itemId: string;
}) {
  const [state, action, pending] = useActionState(
    addSchoolItemSizeAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-inline">
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="itemId" value={itemId} />
      <div className="field-group">
        <label className="field-label" htmlFor={`add-size-${itemId}`}>
          Add size
        </label>
        <input
          id={`add-size-${itemId}`}
          name="sizeLabel"
          required
          placeholder="XL"
          className="field"
        />
      </div>
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "…" : "Add"}
      </button>
      {state.error && (
        <p className="field-error form-inline-msg" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function SchoolEditItemForm({
  schoolId,
  item,
}: {
  schoolId: string;
  item: {
    id: string;
    sku: string;
    name: string;
    category: string;
  };
}) {
  const [state, action, pending] = useActionState(
    updateSchoolItemAction,
    initial,
  );

  return (
    <details className="mt-3 border-t border-[var(--line)] pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
        Edit item
      </summary>
      <form action={action} className="form-stack mt-3">
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="itemId" value={item.id} />
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor={`edit-sku-${item.id}`}>
              SKU
            </label>
            <input
              id={`edit-sku-${item.id}`}
              name="sku"
              required
              defaultValue={item.sku}
              className="field"
            />
            <p className="field-hint">
              Keep aligned with Products for stock post
            </p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor={`edit-name-${item.id}`}>
              Name
            </label>
            <input
              id={`edit-name-${item.id}`}
              name="name"
              required
              defaultValue={item.name}
              className="field"
            />
          </div>
          <div className="field-group">
            <label
              className="field-label"
              htmlFor={`edit-category-${item.id}`}
            >
              Category
            </label>
            <select
              id={`edit-category-${item.id}`}
              name="category"
              className="field"
              defaultValue={
                categories.includes(
                  item.category as (typeof categories)[number],
                )
                  ? item.category
                  : "other"
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        {state.error && (
          <p className="field-error" role="alert">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="field-ok">{state.message ?? "Item updated."}</p>
        )}
        <div className="form-actions">
          <button type="submit" disabled={pending} className="btn btn-secondary">
            {pending ? "Saving…" : "Save item"}
          </button>
        </div>
      </form>
    </details>
  );
}

type KitItem = {
  id: string;
  name: string;
  sku: string;
  active: boolean;
};

type KitLine = {
  itemId: string;
  qtyDefault: number;
};

export function SchoolKitForm({
  schoolId,
  items,
  kit,
}: {
  schoolId: string;
  items: KitItem[];
  kit?: {
    id: string;
    name: string;
    academicYear: string;
    lines: KitLine[];
  };
}) {
  const editing = Boolean(kit);
  const kitItemIds = new Set(kit?.lines.map((l) => l.itemId) ?? []);
  const activeItems = items.filter(
    (item) => item.active || kitItemIds.has(item.id),
  );
  const [state, action, pending] = useActionState(
    editing ? updateSchoolKitAction : createSchoolKitAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fieldPrefix = kit?.id ?? "new";
  const [lines, setLines] = useState<KitLine[]>(
    kit?.lines.length
      ? kit.lines
      : activeItems[0]
        ? [{ itemId: activeItems[0].id, qtyDefault: 1 }]
        : [],
  );

  useEffect(() => {
    if (!state.ok || editing) return;
    formRef.current?.reset();
    const firstId = activeItems[0]?.id;
    setLines(firstId ? [{ itemId: firstId, qtyDefault: 1 }] : []);
  }, [state.ok, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateLine(index: number, patch: Partial<KitLine>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  const formBody = (
    <form ref={formRef} action={action} className="form-stack form-flush">
      <input type="hidden" name="schoolId" value={schoolId} />
      {kit ? <input type="hidden" name="kitId" value={kit.id} /> : null}
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">
            {editing ? "Edit kit" : "Kit details"}
          </h3>
          <p className="form-section-sub">
            {editing
              ? "Update name, year, and lines for this admission set"
              : "Name the admission set for this campus and year"}
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label
              className="field-label"
              htmlFor={`school-kit-name-${fieldPrefix}`}
            >
              Kit name
            </label>
            <input
              id={`school-kit-name-${fieldPrefix}`}
              name="name"
              required
              placeholder="Form 1 Girls / Form 1 Boys"
              className="field"
              defaultValue={kit?.name}
            />
          </div>
          <div className="field-group">
            <label
              className="field-label"
              htmlFor={`school-kit-year-${fieldPrefix}`}
            >
              Academic year
            </label>
            <input
              id={`school-kit-year-${fieldPrefix}`}
              name="academicYear"
              required
              defaultValue={
                kit?.academicYear ?? String(new Date().getFullYear())
              }
              className="field"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Kit lines</h3>
          <p className="form-section-sub">
            Choose from items already on this school (added from Products)
          </p>
        </div>
        <div className="receive-lines">
          {lines.map((line, index) => (
            <div key={index} className="receive-line">
              <div className="receive-line-index" aria-hidden>
                {index + 1}
              </div>
              <div className="receive-line-fields">
                <div className="form-grid cols-2">
                  <div className="field-group">
                    <label
                      className="field-label"
                      htmlFor={`kit-item-${fieldPrefix}-${index}`}
                    >
                      Item
                    </label>
                    <select
                      id={`kit-item-${fieldPrefix}-${index}`}
                      value={line.itemId}
                      onChange={(e) =>
                        updateLine(index, { itemId: e.target.value })
                      }
                      className="field"
                    >
                      {activeItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label
                      className="field-label"
                      htmlFor={`kit-qty-${fieldPrefix}-${index}`}
                    >
                      Qty
                    </label>
                    <input
                      id={`kit-qty-${fieldPrefix}-${index}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={line.qtyDefault}
                      onChange={(e) =>
                        updateLine(index, {
                          qtyDefault: Number(e.target.value) || 1,
                        })
                      }
                      className="field"
                    />
                  </div>
                </div>
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost receive-line-remove"
                  onClick={() =>
                    setLines((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="form-actions form-actions-inline">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!activeItems.length}
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  itemId: activeItems[0]?.id ?? "",
                  qtyDefault: 1,
                },
              ])
            }
          >
            Add line
          </button>
        </div>
      </div>

      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="field-ok">
          {editing
            ? (state.message ?? "Kit updated.")
            : "Kit created for this school."}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={pending || !activeItems.length || !lines.length}
          className="btn btn-primary"
        >
          {pending ? "Saving…" : editing ? "Save kit" : "Create kit"}
        </button>
      </div>
    </form>
  );

  if (!editing) return formBody;

  return (
    <details className="mt-3 border-t border-[var(--line)] pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
        Edit kit
      </summary>
      <div className="mt-3">{formBody}</div>
    </details>
  );
}
