
export class CommandHandler {
    handlers: Map<string, (id: number, x: string) => void>

    constructor() {
        this.handlers = new Map();
    }

    addCommand(
        cmd: string,
        fn: (id: number, rest: string) => void)
    {
        this.handlers.set(cmd.toLowerCase(), fn);
    }

    execCommand(
        cmd: string,
        id: number,
        rest: string)
    {
        this.handlers.get(cmd.toLowerCase())(id, rest);
    }
}
