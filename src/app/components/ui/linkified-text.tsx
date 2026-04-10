import { Fragment } from 'react';

interface LinkifiedTextProps {
  text?: string | null;
  className?: string;
  emptyText?: string;
  linkClassName?: string;
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function LinkifiedText({
  text,
  className,
  emptyText = 'N/A',
  linkClassName = 'text-blue-700 hover:underline',
}: LinkifiedTextProps) {
  const value = text?.trim();

  if (!value) {
    return <span className={className}>{emptyText}</span>;
  }

  const parts = value.split(URL_PATTERN);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) {
          return null;
        }

        if (isHttpUrl(part)) {
          return (
            <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className={linkClassName}>
              {part}
            </a>
          );
        }

        return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </span>
  );
}
