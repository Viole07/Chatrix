import { create } from 'zustand'
import { axiosInstance } from '../lib/axios.js'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'


const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/"

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket:null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check")

            set({ authUser: res.data })
            get().connectSocket()
        } catch (error) {
            console.log("error in checkAuth:", error)
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true })
        try {
            const res = await axiosInstance.post("/auth/signup", data)
            set({ authUser: res.data })
            toast.success("Account created successfully!")
            get().connectSocket()
        } catch (error) {
            console.error("Signup error:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            set({ isSigningUp: false })
        }
    },


    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Login successful!");
            get().connectSocket()
        } catch (error) {
            console.error("Login error:", error); // Log the full error object
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to login. Please check your credentials and try again.");
            }
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout")
            set({ authUser: null })
            toast.success("Logged out successfully!")
            get().disconnectSocket()
        } catch (error) {
            console.error("Logout error:", error); // Log the full error object
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to logout. Please try again.");
            }
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
    
            // ✅ Merge new data with existing user data
            set((state) => ({
                authUser: { ...state.authUser, ...res.data }
            }));
    
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Update profile error:", error); // Log the full error object
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to update profile. Please try again.");
            }
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const {authUser} = get()
        if (!authUser || get().socket?.connected) return

        const socket = io(BASE_URL, {
            query: {
                userId : authUser._id
            }
        })
        socket.connect()

        set({ socket:socket})

        socket.on('getOnlineUsers', (userIds)=>{
            set({ onlineUsers: userIds })
        })
    },
    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect()
    }
    
}))