import { describe, expect, it } from "vitest";
import {
  getAudioUploadError,
  INVALID_MP3_UPLOAD_ERROR,
  MAX_MP3_FILE_SIZE_BYTES,
  MP3_TOO_LARGE_ERROR
} from "./uploadPolicy";

describe("getAudioUploadError", () => {
  it("povolí MP3 o velikosti přesně 12 000 000 bajtů", () => {
    expect(
      getAudioUploadError({
        name: "finale.mp3",
        type: "audio/mpeg",
        size: MAX_MP3_FILE_SIZE_BYTES
      })
    ).toBeUndefined();
  });

  it("odmítne MP3 o jeden bajt nad limitem", () => {
    expect(
      getAudioUploadError({
        name: "finale.mp3",
        type: "audio/mpeg",
        size: MAX_MP3_FILE_SIZE_BYTES + 1
      })
    ).toBe(MP3_TOO_LARGE_ERROR);
  });

  it("odmítne WAV", () => {
    expect(
      getAudioUploadError({
        name: "finale.wav",
        type: "audio/wav",
        size: 100
      })
    ).toBe(INVALID_MP3_UPLOAD_ERROR);
  });

  it("povolí příponu MP3 s obecným MIME typem", () => {
    expect(
      getAudioUploadError({
        name: "finale.MP3",
        type: "application/octet-stream",
        size: 100
      })
    ).toBeUndefined();
  });
});
