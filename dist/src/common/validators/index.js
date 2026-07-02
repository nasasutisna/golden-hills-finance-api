"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsPhoneNumber = IsPhoneNumber;
exports.IsStrongPassword = IsStrongPassword;
exports.IsFutureDate = IsFutureDate;
exports.IsNotInFuture = IsNotInFuture;
exports.IsAdult = IsAdult;
exports.IsValidEmail = IsValidEmail;
const class_validator_1 = require("class-validator");
function IsPhoneNumber(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isPhoneNumber',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (!value)
                        return true;
                    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
                    return typeof value === 'string' && phoneRegex.test(value.replace(/[\s-]/g, ''));
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid phone number`;
                },
            },
        });
    };
}
function IsStrongPassword(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (!value)
                        return true;
                    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                    return typeof value === 'string' && strongPasswordRegex.test(value);
                },
                defaultMessage(args) {
                    return `${args.property} must contain at least 8 characters, including uppercase, lowercase, number, and special character`;
                },
            },
        });
    };
}
function IsFutureDate(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isFutureDate',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (!value)
                        return true;
                    return value instanceof Date && value > new Date();
                },
                defaultMessage(args) {
                    return `${args.property} must be a future date`;
                },
            },
        });
    };
}
function IsNotInFuture(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isNotInFuture',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (!value)
                        return true;
                    const date = value instanceof Date ? value : new Date(value);
                    return date <= new Date();
                },
                defaultMessage(args) {
                    return `${args.property} cannot be in the future`;
                },
            },
        });
    };
}
function IsAdult(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isAdult',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (!value)
                        return true;
                    const dob = value instanceof Date ? value : new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - dob.getFullYear();
                    const monthDiff = today.getMonth() - dob.getMonth();
                    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
                    return actualAge >= 18;
                },
                defaultMessage(args) {
                    return `${args.property} must indicate the person is at least 18 years old`;
                },
            },
        });
    };
}
function IsValidEmail(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isValidEmail',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (!value)
                        return true;
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    return typeof value === 'string' && emailRegex.test(value);
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid email address`;
                },
            },
        });
    };
}
//# sourceMappingURL=index.js.map