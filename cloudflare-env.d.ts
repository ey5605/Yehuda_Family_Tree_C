declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    VIEW_PASSWORD_HASH?: string;
    EDIT_PASSWORD_HASH?: string;
    SESSION_SECRET?: string;
  }
}
