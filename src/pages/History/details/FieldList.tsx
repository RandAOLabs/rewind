import React, { useState, useEffect } from 'react';

export type FieldDescriptor<T> = {
  label: string;
  getter: (evt: T) => Promise<string | number>;
};

export default function FieldList<T>({
  evt,
  fields,
}: {
  evt: T;
  fields: FieldDescriptor<T>[];
}) {
  const [values, setValues] = useState<(string | number)[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(fields.map(f => f.getter(evt))).then(res => {
      if (!cancelled) setValues(res);
    });
    return () => {
      cancelled = true;
    };
  }, [evt, fields]);

  if (values === null) return <div className="loading">Loading details…</div>;

  return (
    <dl className="field-list">
      {fields.map((f, i) => (
        <React.Fragment key={f.label}>
          <dt className="field-label">{f.label}</dt>
          <dd className="field-value">{values[i]}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
