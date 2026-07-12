"use client";

import { useOs } from "@/components/os/OsContext";

export function ComingSoonStub() {
  const { soonTitle, soonBlurb, openWin } = useOs();

  return (
    <div className="space-y-4 font-sans text-[14px] leading-relaxed text-ink">
      <div className="font-heading text-[12px] tracking-wide text-ink-dim">
        ATTRACTION · NOT LIVE YET
      </div>
      <h2 className="font-heading text-base tracking-wide text-ink">
        {soonTitle || "COMING.SOON"}
      </h2>
      <p className="text-ink-dim">
        {soonBlurb ||
          "This booth is still being built. It will plug into the same treasury loop when it opens."}
      </p>
      <p className="bevel-inset p-3 text-[13px] text-ink-dim">
        Live now: <span className="text-ink">Colors</span> feeds the house cut into
        burn · believers · build. Open INFO.TXT for the full story.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bevel-btn bevel-btn-hot px-3 py-2 font-heading text-[11px]"
          onClick={() => openWin("info")}
        >
          READ INFO.TXT
        </button>
        <button
          type="button"
          className="bevel-btn px-3 py-2 font-heading text-[11px]"
          onClick={() => openWin("colors")}
        >
          PLAY COLORS
        </button>
      </div>
    </div>
  );
}
