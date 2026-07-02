export declare const fileUploadConfig: (() => {
    uploadPath: string;
    maxFileSize: number;
    allowedFileTypes: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    uploadPath: string;
    maxFileSize: number;
    allowedFileTypes: string[];
}>;
export declare const getFileUploadConfig: () => (() => {
    uploadPath: string;
    maxFileSize: number;
    allowedFileTypes: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    uploadPath: string;
    maxFileSize: number;
    allowedFileTypes: string[];
}>;
