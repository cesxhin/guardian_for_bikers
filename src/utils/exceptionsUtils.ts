//group
export class GroupNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GroupNotFound";
    }
}
export class GroupErrorGeneric extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GroupErrorGeneric";
    }
}
export class GroupConflict extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GroupConflict";
    }
}

//user
export class UserNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserNotFound";
    }
}
export class UserErrorGeneric extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserErrorGeneric";
    }
}
export class UserConflict extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserConflict";
    }
}

//poll
export class PollNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PollNotFound";
    }
}
export class PollErrorGeneric extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PollErrorGeneric";
    }
}
export class PollConflict extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PollConflict";
    }
}
export class PollIsClosed extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PollIsClosed";
    }
}
export class PollIsExpired extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PollIsExpired";
    }
}

//track
export class TrackNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TrackNotFound";
    }
}
export class TrackErrorGeneric extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TrackErrorGeneric";
    }
}
export class TrackConflict extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TrackConflict";
    }
}