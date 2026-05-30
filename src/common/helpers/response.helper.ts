export class ResponseHelper {
  static success(data: any, message = 'success') {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 400) {
    return {
      success: false,
      statusCode,
      message,
    };
  }
}