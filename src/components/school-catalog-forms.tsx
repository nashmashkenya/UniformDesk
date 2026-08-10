"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addSchoolItemSizeAction,
  createSchoolItemAction,
  createSchoolKitAction,
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

export function SchoolCatalogItemForm({ schoolId }: { schoolId: string }) {
  const [state, action, pending] = useActionState(
    createSchoolItemAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="form-stack form-flush">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Catalogue item</h3>
          <p className="form-section-sub">
            SKU should match your supplier product for DN receive
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="school-item-sku">
              SKU
            </label>
            <input
              id="school-item-sku"
              name="sku"
              required
              placeholder="e.g. SKIRT-NVY or SHIRT-WHT"
              className="field"
            />
            <p className="field-hint">
              Must match supplier product SKU for DN receive
            </p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="school-item-name">
              Name
            </label>
            <input
              id="school-item-name"
              name="name"
              required
              placeholder="Navy Skirt / White Shirt"
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
              defaultValue="shirt"
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
              placeholder="S, M, L or 28, 30, 32"
              className="field"
            />
          </div>
        </div>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="field-ok">Item added to this school.</p>}
      <div className="form-actions">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Add item"}
        </button>
      </div>
    </form>
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
}: {
  schoolId: string;
  items: KitItem[];
}) {
  const activeItems = items.filter((item) => item.active);
  const [state, action, pending] = useActionState(
    createSchoolKitAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [lines, setLines] = useState<KitLine[]>(
    activeItems[0]
      ? [{ itemId: activeItems[0].id, qtyDefault: 1 }]
      : [],
  );

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    const firstId = activeItems[0]?.id;
    setLines(firstId ? [{ itemId: firstId, qtyDefault: 1 }] : []);
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateLine(index: number, patch: Partial<KitLine>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  return (
    <form ref={formRef} action={action} className="form-stack form-flush">
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Kit details</h3>
          <p className="form-section-sub">
            Name the admission set for this campus and year
          </p>
        </div>
        <div className="form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="school-kit-name">
              Kit name
            </label>
            <input
              id="school-kit-name"
              name="name"
              required
              placeholder="Form 1 Girls / Form 1 Boys"
              className="field"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="school-kit-year">
              Academic year
            </label>
            <input
              id="school-kit-year"
              name="academicYear"
              required
              defaultValue={String(new Date().getFullYear())}
              className="field"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-head">
          <h3 className="form-section-title">Kit lines</h3>
          <p className="form-section-sub">
            Items and quantities for this school’s admission set
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
                      htmlFor={`kit-item-${index}`}
                    >
                      Item
                    </label>
                    <select
                      id={`kit-item-${index}`}
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
                    <label className="field-label" htmlFor={`kit-qty-${index}`}>
                      Qty
                    </label>
                    <input
                      id={`kit-qty-${index}`}
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
      {state.ok && <p className="field-ok">Kit created for this school.</p>}

      <div className="form-actions">
        <button
          type="submit"
          disabled={pending || !activeItems.length || !lines.length}
          className="btn btn-primary"
        >
          {pending ? "Saving…" : "Create kit"}
        </button>
      </div>
    </form>
  );
}
