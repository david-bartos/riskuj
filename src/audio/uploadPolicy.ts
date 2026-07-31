export const MAX_MP3_FILE_SIZE_BYTES = 12_000_000;
export const INVALID_MP3_UPLOAD_ERROR = "Only MP3 audio uploads are supported.";
export const MP3_TOO_LARGE_ERROR = "MP3 file must not exceed 12 MB.";

export type AudioFileDescriptor = {
  name: string;
  type: string;
  size: number;
};

export function getAudioUploadError(file: AudioFileDescriptor) {
  const lowerName = file.name.toLowerCase();
  const isMp3 =
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    lowerName.endsWith(".mp3");

  if (!isMp3) {
    return INVALID_MP3_UPLOAD_ERROR;
  }

  if (file.size > MAX_MP3_FILE_SIZE_BYTES) {
    return MP3_TOO_LARGE_ERROR;
  }

  return undefined;
}
