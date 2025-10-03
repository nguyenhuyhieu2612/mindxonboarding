export const returnSuccess = (
  message = "Success",
  data: unknown,
  meta: Record<string, any> | null = null
) => ({
  status: "success",
  success: true,
  message,
  data,
  ...(meta && { meta }),
});

export const returnError = (
  message = "Error",
  meta: Record<string, any> | null = null
) => ({
  status: "error",
  success: false,
  message,
  ...(meta && { meta }),
});
