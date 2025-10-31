import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type NormalizedInput = { base64: string; mime: string };
type Input =
    | string
    | Buffer
    | { base64?: string; buffer?: Buffer; mime?: string };

@Injectable()
export class OcrService {
    private readonly logger = new Logger(OcrService.name);

    constructor(private cfg: ConfigService) { }

    /**
     * Processes the data from pictures or PDFs, returning extracted text content.
     * @param input raw buffer, base64 string, or { base64 | buffer, mime }
     * @param phoneNumber phone number string (required by your Lambda)
     */
    async processPictureBytes(input: Input, phoneNumber: string): Promise<string> {
        const lambdaUrl = this.cfg.get<string>('LAMBDA_URL');
        const apiKey = this.cfg.get<string>('LAMBDA_API_KEY');

        if (!lambdaUrl) throw new Error('no lambda url');
        if (!apiKey) throw new Error('no lambda api key');
        if (!phoneNumber) throw new Error('no phone number');

        const { base64, mime } = this.normalizeInput(input);

        const payload = {
            phone_number: phoneNumber,
            content_type: mime,
            file: base64,
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 50_000);

        let response: Response;
        try {
            response = await fetch(lambdaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        // Try to parse JSON first, fall back to text (same as your original)
        try {
            const jsonResp: any = await response.json();
            let parsed: any;
            try {
                parsed = JSON.parse(jsonResp.body);
            } catch {
                // If body isn’t a JSON string, just return the raw JSON
                return typeof jsonResp === 'string' ? jsonResp : JSON.stringify(jsonResp);
            }

            if (!response.ok) {
                // keep parity: return the whole JSON if not OK
                return typeof jsonResp === 'string' ? jsonResp : JSON.stringify(jsonResp);
            }
            return parsed.text || '';
        } catch {
            const text = await response.text();
            return text;
        }
    }

    /** [HELPER] Normalizes the input for the Lambda function */
    private normalizeInput(input: Input): NormalizedInput {
        let base64: string | undefined;
        let mime: string | undefined;

        if (typeof input === 'object' && !Buffer.isBuffer(input)) {
            if (input.base64) base64 = input.base64.trim();
            if (input.buffer) base64 = Buffer.from(input.buffer).toString('base64');
            if (input.mime) mime = input.mime;
        } else if (typeof input === 'string') {
            const s = input.trim();
            if (s.startsWith('data:')) {
                const [head, b64] = s.split(',', 2);
                const mt = head.match(/^data:([^;]+);base64$/i);
                if (mt) mime = mt[1];
                base64 = b64;
            } else {
                base64 = s;
            }
        } else if (Buffer.isBuffer(input)) {
            base64 = Buffer.from(input).toString('base64');
        }

        if (!base64) {
            throw new Error('no file provided');
        }

        if (!mime) {
            const head = base64.slice(0, 12);
            if (head.startsWith('JVBERi0')) mime = 'application/pdf';
            else if (head.startsWith('/9j/')) mime = 'image/jpeg';
            else if (head.startsWith('iVBORw0KGgo')) mime = 'image/png';
            else if (head.startsWith('SUkq') || head.startsWith('TU0A')) mime = 'image/tiff';
            else mime = 'application/octet-stream';
        }

        return { base64, mime };
    }
}