import { describe, expect, it } from "vitest";
import { normalizeHiggsfieldOutput } from "./higgsfieldCodec";

describe("normalizeHiggsfieldOutput", () => {
  it("parses final --wait --json job arrays", () => {
    const output = JSON.stringify([
      {
        id: "job-1",
        status: "completed",
        output_url: "https://cdn.example.com/render.png",
      },
    ]);
    const normalized = normalizeHiggsfieldOutput(output, "", 0);
    expect(normalized.submitId).toBe("job-1");
    expect(normalized.genStatus).toBe("completed");
    expect(normalized.remoteUrls).toEqual(["https://cdn.example.com/render.png"]);
  });

  it("falls back to media URLs printed in text output", () => {
    const normalized = normalizeHiggsfieldOutput("Done: https://cdn.example.com/model.glb", "", 0);
    expect(normalized.genStatus).toBe("completed");
    expect(normalized.remoteUrls).toEqual(["https://cdn.example.com/model.glb"]);
  });
});
