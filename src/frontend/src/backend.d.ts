import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface Conversation {
    lastMessageTimestamp: Time;
    lastMessagePreview: string;
    otherParty: Principal;
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
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(recipient: Principal, content: string): Promise<void>;
    verifySecret(secret: string): Promise<boolean>;
}
