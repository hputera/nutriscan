import { z } from "zod";
export const photoInput = z.string().max(550000).optional();
export function parsePhoto(value: string) {
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error("Format foto tidak valid.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 384 * 1024)
    throw new Error("Foto penyimpanan maksimal 384 KB.");
  const type = match[1];
  const valid =
    type === "jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : type === "png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new Error("Isi file bukan foto yang sesuai.");
  return {
    bytes,
    contentType: "image/" + type,
    extension: type === "jpeg" ? "jpg" : type,
  };
}
export function ownedPhotoKey(key: string, owner: string) {
  return new RegExp(
    "^" + owner + "/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|png|webp)$",
    "i",
  ).test(key);
}
