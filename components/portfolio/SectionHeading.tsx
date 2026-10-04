import type { ReactNode } from 'react';

export function SectionHeading({
  number,
  label,
  title,
  children,
}: {
  number: string;
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="folio-section-heading">
      <p className="folio-eyebrow">
        <span>{number}</span> / {label}
      </p>
      <div className="folio-heading-row">
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
    </header>
  );
}
