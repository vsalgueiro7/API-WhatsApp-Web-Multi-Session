import { RequestHandler } from "express";
import { SchemaOf, ValidationError } from "yup";

type TProperty = 'body' | 'header' | 'params' | 'query';

type TGetSchema = <T>(schema: SchemaOf<T>) => SchemaOf<T>;

type TALLSchemas = Record<TProperty, SchemaOf<any>>;

type TGetAllSchemas = (getSchema: TGetSchema) => Partial<TALLSchemas>;

type TValidation = (getAllSchemas: TGetAllSchemas) => RequestHandler

export const validation: TValidation = (getAllSchemas) => async (req, res, next) => {
    const schemas = getAllSchemas(schema => schema);

    const errorsResult: Record<string, Record<string, string>> = {};

    Object.entries(schemas).forEach(([key, schema]) => {
        try {
            schema.validateSync(req[key as TProperty], { abortEarly: false });
        } catch (err) {
            const yupError = err as ValidationError;
            const errors: Record<string, string> = {};
            yupError.inner.forEach(error => {
                if (!error.path) return;
                errors[error.path] = error.message;
            })
            errorsResult[key] = errors;
        }



    })

    if(Object.entries(errorsResult).length === 0){
        return next();
    }

    return res.status(400).json({errors: errorsResult});

};


