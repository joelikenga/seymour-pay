import { axios$ } from "../..";

export const adminGetUsers = async () => {
    try {
        const response = await axios$.get("/admin/users");
        return response;
    } catch (error) {
        throw error;
    }
};

export const adminGetUserById = async (id: string) => {
    try {
        const response = await axios$.get(`/admin/users/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

interface User {
    email: string;
    firstName: string;
    lastName: string;
}

export const adminCreateUser = async (user: User) => {
    try {
        const response = await axios$.post("/admin/users", user);
        return response;
    } catch (error) {
        throw error;
    }
};