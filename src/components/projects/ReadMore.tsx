"use client";

import { useState } from "react";
import { typography } from "@/styles/typography";

/** Long project stories start collapsed, like GoFundMe's "Read more". */
export function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420;
  return (
    <div>
      <p className={`${typography.body} whitespace-pre-line text-foreground ${long && !open ? "line-clamp-5" : ""}`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className={`${typography.button} mt-2 text-foreground underline underline-offset-4`}>
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
