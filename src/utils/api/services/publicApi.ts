import { axios$ } from "../..";

// User Profile Management API
export const UserProfileApi = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await axios$.get("/users/me");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    nationality?: string;
    language?: string;
    timezone?: string;
    photo?: string;
  }) => {
    try {
      const response = await axios$.put("/users/update", data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update profile photo
  updatePhoto: async (photo: string) => {
    try {
      const response = await axios$.put("/users/update", { photo });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add phone number
  addPhoneNumber: async (phone: string, type: string = "mobile") => {
    try {
      const response = await axios$.post("/users/phone", { phone, type });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update phone number
  updatePhoneNumber: async (phoneId: string, phone: string, type: string) => {
    try {
      const response = await axios$.put(`/users/phone/${phoneId}`, { phone, type });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete phone number
  deletePhoneNumber: async (phoneId: string) => {
    try {
      const response = await axios$.delete(`/users/phone/${phoneId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add email address
  addEmailAddress: async (email: string) => {
    try {
      const response = await axios$.post("/users/email", { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update email address
  updateEmailAddress: async (emailId: string, email: string) => {
    try {
      const response = await axios$.put(`/users/email/${emailId}`, { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add address
  addAddress: async (address: string, type: string = "primary") => {
    try {
      const response = await axios$.post("/users/address", { address, type });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update address
  updateAddress: async (addressId: string, address: string, type: string) => {
    try {
      const response = await axios$.put(`/users/address/${addressId}`, { address, type });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete address
  deleteAddress: async (addressId: string) => {
    try {
      const response = await axios$.delete(`/users/address/${addressId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete user account
  deleteAccount: async () => {
    try {
      const response = await axios$.delete("/users/account");
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export const LoginApi = {
  login: async (email: string, password: string): Promise<any> => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || "Login failed");
    }

    const data = await response.json();
    return data as any;
  },
};

// Password Reset API
export const PasswordResetApi = {
  setNewPassword: async (token: string, password: string): Promise<any> => {
    try {
      const response = await axios$.post("/auth/reset-password", { 
        token, 
        password 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// save property to favorite
export const SavePropertyToFavorite = async (propertyId: number) => {
  try {
    const response = await axios$.post(`/users/me/save`, { propertyId });
    return response;
  } catch (error) {
    throw error;
  }
};
// get all saved property 
export const GetAllSavedProperty = async () => {
  try {
    const response = await axios$.get(`/users/me/saved`);
    return response;
  } catch (error) {
    throw error;
  }
};


export const RemovePropertyFromFavorite = async (propertyId: number) => {
  try {
    const response = await axios$.delete(`/users/me/delete-saved?propertyId=${propertyId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const SearchProperty = async (filters?: {
  price?: number | string;
  type?: string;
  location?: string;
  bedrooms?: number | string;
  category?: string;
  square?: number | string;
  kitchen?: number | string;
  bathrooms?: number | string;
  query?: string;
}) => {
  try {
    // Build query params object - only include params with values
    const params: Record<string, any> = {};
    
    if (filters) {
      if (filters.price) params.price = filters.price;
      if (filters.type) params.type = filters.type;
      if (filters.location) params.location = filters.location;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      if (filters.category) params.category = filters.category;
      if (filters.square) params.square = filters.square;
      if (filters.kitchen) params.kitchen = filters.kitchen;
      if (filters.bathrooms) params.bathrooms = filters.bathrooms;
      if (filters.query) params.query = filters.query;
    }

    const response = await axios$.get(`/properties`, { params });
    return response;
  } catch (error) {
    throw error;
  }
};

export const RemoveAllSavedProperty = async () => {
  try {
    const response = await axios$.delete(`/users/me/delete-all`);
    return response;
  } catch (error) {
    throw error;
  }
};

/** Public parking ticket fee preview (no auth). */
export type TicketFeePreviewResponse = {
  already_paid: number;
  amount_due: number;
  currency: string;
  entry_time: string;
  preview_at: string;
  ticket_id: string;
  vehicle_type: string;
};

function unwrapTicketFeePreviewBody(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  const inner = o.data;
  if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
    return inner;
  }
  return raw;
}

export async function getTicketFeePreview(
  ticketId: string,
  signal?: AbortSignal,
): Promise<TicketFeePreviewResponse> {
  const id = ticketId.trim();
  if (!id) {
    throw new Error("Please enter a ticket ID.");
  }

  const raw = await axios$.get(
    `/tickets/${encodeURIComponent(id)}/fee-preview`,
    { signal },
  );
  return unwrapTicketFeePreviewBody(raw) as TicketFeePreviewResponse;
}
