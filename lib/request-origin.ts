// Vercel terminates HTTPS before forwarding to the Node function. Trust its
// single-valued protocol header only in that runtime, not on arbitrary hosts.
export function requestOrigin(
  request: Request,
  trustProxy = process.env.VERCEL === "1",
) {
  const url = new URL(request.url);
  const forwarded = trustProxy
    ? request.headers.get("x-forwarded-proto")
    : null;
  const protocol =
    forwarded === "https" || forwarded === "http"
      ? forwarded + ":"
      : url.protocol;
  return new URL(protocol + "//" + (request.headers.get("host") || url.host));
}
