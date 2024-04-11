import { createHmac } from 'crypto';

export function generateSignature(secret: string, message: string, encode?: 'hex' | 'base64') {
    return createHmac('sha256', secret)
        .update(message)
        .digest(encode || 'hex');
}

export function generateQueryString(data: Record<string, any>, encodeValue?: boolean) {
    const getValue: (value: string) => string = encodeValue ? encodeURIComponent.bind(this) : value => value;

    return Object.keys(data)
        .map(key => key + '=' + getValue(data[key]))
        .join('&');
}
