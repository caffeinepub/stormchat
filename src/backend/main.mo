import Int "mo:core/Int";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

// IMPORTANT: See migration.mo for upgrade migration
(with migration = Migration.run)
actor {
  // Core Types
  public type StoredMessage = {
    sender : Principal;
    recipient : Principal;
    timestamp : Time.Time;
    content : Text;
  };

  public type Message = {
    sender : Principal;
    recipient : Principal;
    timestamp : Time.Time;
    content : Text;
    isRead : Bool;
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

  public type UserStatus = {
    isOnline : Bool;
    lastSeen : Time.Time;
  };

  public type TypingStatus = {
    isTyping : Bool;
    updatedAt : Time.Time;
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
  include MixinStorage();

  let messages = List.empty<StoredMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  // readTimestamps["senderPrincipal_recipientPrincipal"] = last time recipient read msgs from sender
  let readTimestamps = Map.empty<Text, Time.Time>();

  // New state for online status and typing indicator
  let userStatus = Map.empty<Principal, UserStatus>();
  let typingStatus = Map.empty<Text, TypingStatus>();

  // Authorization State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Messaging Functions
  public shared ({ caller }) func sendMessage(recipient : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let newMessage : StoredMessage = {
      sender = caller;
      recipient;
      timestamp = Time.now();
      content;
    };

    messages.add(newMessage);
  };

  // Mark all messages from `sender` to caller as read
  public shared ({ caller }) func markAsRead(sender : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };
    let key = sender.toText() # "_" # caller.toText();
    readTimestamps.add(key, Time.now());
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

    let outgoingReadKey = caller.toText() # "_" # conversationWith.toText();
    let outgoingReadTime = readTimestamps.get(outgoingReadKey);

    let rawMessages = messages.filter(
      func(msg) {
        (msg.sender == caller and msg.recipient == conversationWith) or (msg.sender == conversationWith and msg.recipient == caller)
      }
    ).toArray();

    let enriched = rawMessages.map(
      func(msg : StoredMessage) : Message {
        let isRead = if (msg.sender == caller) {
          switch (outgoingReadTime) {
            case (?t) { msg.timestamp <= t };
            case (null) { false };
          };
        } else {
          true;
        };
        { sender = msg.sender; recipient = msg.recipient; timestamp = msg.timestamp; content = msg.content; isRead };
      },
    );

    enriched.sort();
  };

  // Secret Unlock
  public query ({ caller }) func verifySecret(secret : Text) : async Bool {
    secret == "loga";
  };

  // User Discovery
  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user list");
    };
    userProfiles.toArray();
  };

  // Core Profile Functions
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

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    userProfiles.add(caller, profile);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      accessControlState.userRoles.add(caller, #user);
    };
  };

  ////// NEW FUNCTIONALITY //////

  // Online Status + Last Seen
  public shared ({ caller }) func setOnlineStatus(isOnline : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set online status");
    };

    let currentTime = Time.now();
    let currentStatus = {
      isOnline;
      lastSeen = currentTime;
    };

    userStatus.add(caller, currentStatus);
  };

  public query ({ caller }) func getUserStatuses(users : [Principal]) : async [(Principal, UserStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get user statuses");
    };

    let now = Time.now();

    users.map(
      func(user) {
        switch (userStatus.get(user)) {
          case (?status) {
            let adjustedStatus = if (status.isOnline and now - status.lastSeen > 60000000000) {
              // Set isOnline to false if last update older than 1 min
              { status with isOnline = false };
            } else {
              status;
            };

            (user, adjustedStatus);
          };
          case (null) {
            // Default to offline status
            (user, { isOnline = false; lastSeen = now });
          };
        };
      }
    );
  };

  // Typing Status
  public shared ({ caller }) func setTyping(recipient : Principal, isTyping : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set typing status");
    };

    let currentTime = Time.now();
    let key = caller.toText() # "_" # recipient.toText();

    let typingInfo = {
      isTyping;
      updatedAt = currentTime;
    };

    typingStatus.add(key, typingInfo);
  };

  public query ({ caller }) func getTypingStatus(from : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get typing status");
    };

    let currentTime = Time.now();
    let key = from.toText() # "_" # caller.toText();

    switch (typingStatus.get(key)) {
      case (?typing) {
        if (typing.isTyping and currentTime - typing.updatedAt <= 5000000000) {
          // Only true if updated within last 5 seconds
          true;
        } else {
          false;
        };
      };
      case (null) { false };
    };
  };
};

