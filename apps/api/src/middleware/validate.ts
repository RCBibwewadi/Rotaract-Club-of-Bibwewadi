import { fromZodError } from '@rcb-2.0/shared';
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse() throws if invalid, replaces req.body with the parsed + typed value
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(fromZodError(err));
      }
      next(err);
    }
  };
}