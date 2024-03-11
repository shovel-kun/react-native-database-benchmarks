export class ClassNotImplementedError extends Error {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, ClassNotImplementedError.prototype);
    }
}