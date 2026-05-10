import { axios$ } from "../..";

export const adminLogin = async (email: string, password: string) => {
  try {
    const response = await axios$.post("/admin/auth/login", {
      email,
      password,
    });
    return response;
  }
  catch (error) {
    throw error;
  }
};

export const adminChangePassword = async (
  currentPassword: string,
  newPassword: string,
) => {
  try {
    const response = await axios$.post("/admin/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/** Raw JSON from `GET /admin/auth/me` (shape may vary). Normalize in the UI/query layer. */
export const adminGetCurrentProfile = async (): Promise<unknown> => {
  const data = await axios$.get("/admin/auth/me");
  return data as unknown;
};


export const Logout = async () => {
  try {
    const response = await axios$.post(`/logout`);
    return response;
  } catch (error) {
    throw error;
  }
};
