export declare const appConfig: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    appName: string;
    appUrl: string;
    logLevel: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    appName: string;
    appUrl: string;
    logLevel: string;
}>;
export declare const getAppConfig: () => (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    appName: string;
    appUrl: string;
    logLevel: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    appName: string;
    appUrl: string;
    logLevel: string;
}>;
