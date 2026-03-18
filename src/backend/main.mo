import Int "mo:core/Int";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Core Types
  public type Message = {
    sender : Principal;
    recipient : Principal;
    timestamp : Time.Time;
    content : Text;
  };

  public type Conversation = {
    otherParty : Principal;
    lastMessagePreview : Text;
    lastMessageTimestamp : Time.Time;
  };

  public type UserProfile = {
    displayName : Text;
    avatar : Text;
  };

  module Message {
    public func compare(a : Message, b : Message) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  module Conversation {
    public func compare(a : Conversation, b : Conversation) : Order.Order {
      Int.compare(b.lastMessageTimestamp, a.lastMessageTimestamp);
    };
  };

  // State
  let messages = List.empty<Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Authorization State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Messaging Functions
  public shared ({ caller }) func sendMessage(recipient : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let newMessage : Message = {
      sender = caller;
      recipient;
      timestamp = Time.now();
      content;
    };

    messages.add(newMessage);
  };

  public query ({ caller }) func getConversations() : async [Conversation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let conversationMap = Map.empty<Principal, Conversation>();

    for (message in messages.values()) {
      if (message.sender == caller or message.recipient == caller) {
        let otherParty = if (message.sender == caller) { message.recipient } else {
          message.sender;
        };

        switch (conversationMap.get(otherParty)) {
          case (null) {
            conversationMap.add(
              otherParty,
              {
                otherParty;
                lastMessagePreview = message.content;
                lastMessageTimestamp = message.timestamp;
              },
            );
          };
          case (?existingConversation) {
            if (message.timestamp > existingConversation.lastMessageTimestamp) {
              conversationMap.add(
                otherParty,
                {
                  otherParty;
                  lastMessagePreview = message.content;
                  lastMessageTimestamp = message.timestamp;
                },
              );
            };
          };
        };
      };
    };

    conversationMap.values().toArray().sort();
  };

  public query ({ caller }) func getMessages(conversationWith : Principal) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    messages.filter(
      func(msg) {
        (msg.sender == caller and msg.recipient == conversationWith) or (msg.sender == conversationWith and msg.recipient == caller)
      }
    ).toArray().sort();
  };

  // Secret Unlock
  public query ({ caller }) func verifySecret(secret : Text) : async Bool {
    secret == "stormwatch";
  };

  // User Discovery
  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user list");
    };
    userProfiles.toArray();
  };

  // Core Profile Functions
  // Allow any authenticated caller to check their own profile (needed before registration)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Allow any authenticated caller to save their profile (self-registration)
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    userProfiles.add(caller, profile);
    // Auto-register as user if not already registered
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      accessControlState.userRoles.add(caller, #user);
    };
  };
};
