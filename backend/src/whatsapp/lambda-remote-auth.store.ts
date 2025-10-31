import { Readable } from "stream";
import { createReadStream, promises as fsp } from "fs";

export class ApiGatewayRemoteAuthStore {
    constructor(
        private apiUrl: string,
        private apiKey: string,
        private timeoutMs = 15000
    ) { }

    private async call<T = any>(action: StoreAction, payload: Record<string, any>): Promise<T> {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.timeoutMs);

        console.log(payload);

        const res = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
            },
            body: JSON.stringify({ action, ...payload }),
            signal: ctrl.signal,
        }).catch((err) => {
            throw new Error(`API call failed: ${err}`);
        });
        clearTimeout(t);

        const text = await res.text();
        if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}: ${text}`);

        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch {
            throw new Error(`Unexpected non-JSON response: ${text}`);
        }

        if (typeof parsed?.statusCode === "number" && parsed?.body != null) {
            try {
                parsed = JSON.parse(parsed.body);
            } catch {
                parsed = { rawBody: parsed.body };
            }
        }

        if (parsed?.error) throw new Error(parsed.error);
        return parsed as T;
    }

    // RemoteAuth -> sessionExists({ session })
    async sessionExists(options: { session: string }): Promise<boolean> {
        console.log(options);
        const session = sessionIdFrom(options);
        const { exists } = await this.call<{ exists: boolean }>("sessionExists", { session });
        return !!exists;
    }

    // RemoteAuth -> save({ session })  <-- read "<session>.zip" from CWD and upload
    async save(options: { session: string }): Promise<void> {
        console.log(options);

        const session = sessionIdFrom(options);

        // RemoteAuth writes the zip to CWD as "<session>.zip"
        const zipPath = `${session}.zip`;

        // Convert to base64 (stream-safe)
        const b64 = await toBase64Syncish(zipPath);
        if (!b64) throw new Error(`No data to save for session "${session}"`);

        await this.call("save", {
            session,
            dataBase64: b64,
            contentType: "application/zip",
        });
    }

    // RemoteAuth -> extract({ session, path })  <-- download and WRITE the file to options.path
    async extract(options: { session: string; path: string }): Promise<void> {
        const session = sessionIdFrom(options);
        const outPath = options?.path;
        if (!outPath) throw new Error("extract() requires { path }");

        const res = await this.call<{ dataBase64?: string }>("extract", { session });
        if (!res?.dataBase64) {
            // nothing stored yet, leave quietly (matches MongoStore behavior which resolves)
            return;
        }

        const buf = Buffer.from(res.dataBase64, "base64");
        await fsp.writeFile(outPath, buf);
    }

    // RemoteAuth -> delete({ session })
    async delete(options: { session: string }): Promise<void> {
        const session = sessionIdFrom(options);
        await this.call("delete", { session });
    }
}

type StoreAction = "save" | "extract" | "sessionExists" | "delete";

function sessionIdFrom(param: any): string {
    const s = typeof param === "string" ? param : param?.session;
    if (!s) throw new Error("missing session id");
    return s;
}

async function streamToBuffer(body: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Buffer>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

function toBase64Syncish(data: any): Promise<string> {
    if (!data) return Promise.resolve("");
    if (typeof data === "string") {
        // treat strings as file paths (like "./<session>.zip")
        return streamToBuffer(createReadStream(data)).then((b) => b.toString("base64"));
    }
    if (Buffer.isBuffer(data)) return Promise.resolve(data.toString("base64"));
    if (data instanceof Uint8Array) return Promise.resolve(Buffer.from(data).toString("base64"));
    if (data instanceof Readable) return streamToBuffer(data).then((b) => b.toString("base64"));
    return Promise.resolve(Buffer.from(JSON.stringify(data)).toString("base64"));
}
