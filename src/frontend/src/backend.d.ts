import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Conversation {
    lastMessageTimestamp: Time;
    lastMessagePreview: string;
    otherParty: Principal;
}
export type Time = bigint;
export interface Message {
    content: string;
    recipient: Principal;
    isRead: boolean;
    sender: Principal;
    timestamp: Time;
}
export interface UserStatus {
    isOnline: boolean;
    lastSeen: Time;
}
export interface UserProfile {
    displayName: string;
    avatar: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversations(): Promise<Array<Conversation>>;
    getMessages(conversationWith: Principal): Promise<Array<Message>>;
    getTypingStatus(from: Principal): Promise<boolean>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStatuses(users: Array<Principal>): Promise<Array<[Principal, UserStatus]>>;
    isCallerAdmin(): Promise<boolean>;
    markAsRead(sender: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(recipient: Principal, content: string): Promise<void>;
    setOnlineStatus(isOnline: boolean): Promise<void>;
    setTyping(recipient: Principal, isTyping: boolean): Promise<void>;
    verifySecret(secret: string): Promise<boolean>;
}
