import React from 'react';
import plantumlEncoder from 'plantuml-encoder';

export default function PlantUML({
  children,
  server = 'https://www.plantuml.com/plantuml',
  format = 'svg',
  className,
}) {
  const text =
    Array.isArray(children)
      ? children.join('')
      : typeof children === 'string'
      ? children
      : String(children);
  const encoded = plantumlEncoder.encode(text.trim());

  const src = `${server}/${format}/${encoded}`;
  return <img src={src} alt="PlantUML diagram" className={className} />;
}
