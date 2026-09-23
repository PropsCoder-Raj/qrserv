import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const error = exception instanceof Error ? exception : undefined;
      this.logger.error(
        `${request.method} ${request.originalUrl || request.url} failed with ${status}: ${
          error?.message || message
        }`,
        error?.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl || request.url} failed with ${status}: ${
          typeof message === 'string'
            ? message
            : JSON.stringify((message as any).message || message)
        }`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || message,
      timestamp: new Date().toISOString(),
    });
  }
}
