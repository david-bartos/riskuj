import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoGame } from "../data/demoGame";
import AdminPage from "./AdminPage";

const uploadedAsset = {
  id: "audio-uploaded",
  src: "/uploads/uploaded.mp3",
  title: "Uploaded preview",
  originalName: "uploaded.mp3",
  displayName: "Uploaded preview",
  mimeType: "audio/mpeg"
};

describe("AdminPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === "/api/games" && !init) {
          return Response.json([
            {
              id: demoGame.id,
              title: demoGame.title,
              updatedAt: demoGame.updatedAt,
              roundCount: demoGame.rounds.length
            }
          ]);
        }

        if (url === "/api/games/demo-hudebni-riskuj" && !init) {
          return Response.json(demoGame);
        }

        if (url === "/api/audio-assets" && !init) {
          return Response.json([]);
        }

        if (url === "/api/uploads/audio" && init?.method === "POST") {
          return Response.json(uploadedAsset);
        }

        if (url === "/api/games/demo-hudebni-riskuj" && init?.method === "PUT") {
          return Response.json(JSON.parse(String(init.body)));
        }

        return new Response("not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("nahraje MP3, připojí ho k položce a uloží hru s neutrálním AudioAsset", async () => {
    render(<AdminPage />);

    expect(
      await screen.findByRole("heading", { name: "Editor hry" })
    ).toBeInTheDocument();

    const fileInput = (await screen.findAllByLabelText("Nahrát MP3 k položce"))[0];
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["fake"], "uploaded.mp3", { type: "audio/mpeg" })]
      }
    });

    await waitFor(() => {
      expect(
        screen
          .getAllByLabelText("Náhled audio ukázky")
          .some((audio) => audio.getAttribute("src") === "/uploads/uploaded.mp3")
      ).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "Uložit hru" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/games/demo-hudebni-riskuj",
        expect.objectContaining({
          method: "PUT",
          headers: { "content-type": "application/json" }
        })
      );
    });

    const saveCall = vi
      .mocked(fetch)
      .mock.calls.find(
        ([url, init]) =>
          url === "/api/games/demo-hudebni-riskuj" && init?.method === "PUT"
      );
    const savedGame = JSON.parse(String(saveCall?.[1]?.body));
    expect(JSON.stringify(savedGame)).toContain("/uploads/uploaded.mp3");
    expect(JSON.stringify(savedGame)).toContain("originalName");
  });
});
