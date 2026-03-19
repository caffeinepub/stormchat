import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  // Types from old system
  type StoredMessage = {
    sender : Principal.Principal;
    recipient : Principal.Principal;
    timestamp : Time.Time;
    content : Text;
  };

  type UserProfile = {
    displayName : Text;
    avatar : Text;
  };

  type OldActor = {
    messages : List.List<StoredMessage>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    readTimestamps : Map.Map<Text, Time.Time>;
    accessControlState : AccessControl.AccessControlState;
  };

  // Types for new system (should reuse original)
  type UserStatus = {
    isOnline : Bool;
    lastSeen : Time.Time;
  };

  type TypingStatus = {
    isTyping : Bool;
    updatedAt : Time.Time;
  };

  type NewActor = {
    messages : List.List<StoredMessage>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    readTimestamps : Map.Map<Text, Time.Time>;
    userStatus : Map.Map<Principal.Principal, UserStatus>;
    typingStatus : Map.Map<Text, TypingStatus>;
    accessControlState : AccessControl.AccessControlState;
  };

  // Data migration function called on upgrade
  public func run(old : OldActor) : NewActor {
    let userStatus = Map.empty<Principal.Principal, UserStatus>();
    let typingStatus = Map.empty<Text, TypingStatus>();

    {
      old with userStatus;
      typingStatus;
    };
  };
};

