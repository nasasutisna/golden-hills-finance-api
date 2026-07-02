import { ValidationOptions } from 'class-validator';
export declare function IsPhoneNumber(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare function IsStrongPassword(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare function IsFutureDate(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare function IsNotInFuture(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare function IsAdult(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare function IsValidEmail(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
