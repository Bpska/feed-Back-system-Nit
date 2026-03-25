import { toast } from "sonner";

const API_URL = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || "http://localhost:4000");

interface RequestOptions extends RequestInit {
    data?: any;
}

export const api = {
    get: async (endpoint: string, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: "GET" });
    },
    post: async (endpoint: string, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: "POST" });
    },
    put: async (endpoint: string, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: "PUT" });
    },
    delete: async (endpoint: string, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: "DELETE" });
    },
};

async function request(endpoint: string, options: RequestOptions = {}) {
    const { data, headers, ...customConfig } = options;

    const token = localStorage.getItem("token");

    const config: RequestInit = {
        ...customConfig,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        let responseData = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const text = await response.text();
            responseData = text ? JSON.parse(text) : null;
        }

        if (!response.ok) {
            throw new Error((responseData && responseData.message) || "Something went wrong");
        }

        return responseData;
    } catch (error: any) {
        console.error("API Error:", error);
        // toast.error(error.message); // Optional: global error handling
        throw error;
    }
}
