export function printLog(message: string): void {
    console.log(`[uplugin-inline-const-enum] ${message}`.replaceAll(process.cwd(), "."));
}
